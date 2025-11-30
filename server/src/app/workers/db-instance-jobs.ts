import { dbInstanceJobQueue, notificationJobQueue } from "../../server";
import { db } from "../lib/db";
import { envConf } from "../lib/envConf";
import logger, { loggerMetadata } from "../lib/logger";
import { discordService } from "../services/discord";
import { encryptionServices } from "../services/encryption";
import { adminPool, PostgresServices } from "../services/pg";
import { RedisQueueAndWorker } from "../services/redis";

let dbInstanceJobInstance: RedisQueueAndWorker | null = null;

/**
 * This function initializes the rotate db password job queue and worker,
 * and sets up recommended event listeners for monitoring job status.
 * @param redisConnection - A Redis connection on which the queue will work
 * @returns RedisQueueAndWorker
 */
function initiateDbInstanceJobs({
  redisConnection,
}: {
  redisConnection: { host: string; port: number };
}): RedisQueueAndWorker {
  if (dbInstanceJobInstance) {
    return dbInstanceJobInstance;
  }

  const dbInstanceJobs = new RedisQueueAndWorker({
    queueName: "rotate-db-password-job-queue",
    connection: redisConnection,
  });

  const queueEvents = dbInstanceJobs.getQueueEvents();

  const worker = dbInstanceJobs.getWorker(async (job) => {
    console.log(Date.now());
    console.log({ name: job.name, payload: job.data });
    const job_name = job.name;
    if (job_name == "rotate_password") {
      const { projectId, userId } = job.data;

      const project = await db.project.findUnique({
        where: {
          id: projectId,
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      const pgServices = new PostgresServices(adminPool);

      const decryptedRes = encryptionServices.decrypt(project?.dbPassword!);

      if (!decryptedRes.success) {
        logger.error(
          "Invalid encrypted data",
          loggerMetadata.system({
            filePath: __filename,
          })
        );
        throw new Error("Invalid encrypted data");
      }

      const pgResult = await pgServices.changeDbPassword({
        dbName: project.dbName as string,
        dbPassword: decryptedRes.result,
        dbUserName: project.dbUser as string,
      });

      if (pgResult.success) {
        await db.project.update({
          where: {
            id: project.id,
          },
          data: {
            dbPassword: encryptionServices.encrypt(pgResult.data),
          },
        });

        dbInstanceJobQueue.add(
          "rotate_password",
          {
            projectId: project.id,
            userId: userId,
          },
          {
            delay: 1000 * 60 * 60 * 24 * 30,
            attempts: 5,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          }
        );

        const integration = await db.discordIntegration.findUnique({
          where: {
            userId: userId as string,
          },
        });

        console.log("integration", integration);

        if (integration?.channelId) {
          notificationJobQueue.add(
            "password_rotated",
            {
              projectId,
              channelId: integration.channelId,
              platforms: ["discord"],
            },
            {
              attempts: 5,
              backoff: {
                type: "exponential",
                delay: 5000,
              },
              removeOnComplete: true,
              removeOnFail: false,
            }
          );
        }
      }
    }

    if (job_name == "pause_db_connection") {
      const {
        dbUser,
        title,
        projectId,
        userName,
        userEmail,
        discordChannelId,
        oldInactiveDatabases,
        newInactiveDatabases,
      } = job.data;

      if (
        !newInactiveDatabases ||
        (newInactiveDatabases && newInactiveDatabases.length == 0)
      ) {
        return;
      }

      const pgServices = new PostgresServices(adminPool);

      await pgServices.pauseUserAccessForDatabases({
        databaseNames: newInactiveDatabases,
      });

      await db.project.update({
        where: {
          id: projectId,
        },
        data: {
          isActionDone: false,
          inactiveDatabases: [...oldInactiveDatabases, ...newInactiveDatabases],
        },
      });

      await notificationJobQueue.add(
        "pause_database",
        {
          platforms: ["discord", "mail"],
          userName,
          userEmail,
          discordChannelId,
          projectTitle: title,
          inactiveDatabases: [...oldInactiveDatabases, ...newInactiveDatabases],
          projectId,
        },
        {
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      await dbInstanceJobQueue.add(
        "delete_database",
        {
          projectId,
        },
        {
          delay: 1000 * 60 * 60 * 24 * 7,
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
    }

    if (job_name === "delete_database") {
      const { projectId } = job.data;
      const projectDetails = await db.project.findUnique({
        where: { id: projectId },
        include: { user: { include: { discordIntegration: true } } },
      });

      const discordChannelId =
        projectDetails?.user.discordIntegration[0]?.channelId || null;
      const userEmail = projectDetails?.user?.email;
      const userName = projectDetails?.user?.name;
      const inactiveDatabaseNames = projectDetails?.inactiveDatabases || [];

      if (inactiveDatabaseNames?.length > 0) {
        const pgServices = new PostgresServices(adminPool);

        const result = await pgServices.deleteIdleDatabase({
          inactiveDatabaseNames,
        });

        if (result.success) {
          await db.project.update({
            where: {
              id: projectId,
            },
            data: {
              isActionDone: false,
              inactiveDatabases: [],
            },
          });
          await notificationJobQueue.add(
            "deleted_databases",
            {
              platforms: ["discord", "mail"],
              userName,
              userEmail,
              discordChannelId,
              projectTitle: projectDetails?.projectDescription,
              inactiveDatabases: inactiveDatabaseNames,
              projectId,
            },
            {
              attempts: 5,
              backoff: {
                type: "exponential",
                delay: 5000,
              },
              removeOnComplete: true,
              removeOnFail: false,
            }
          );
        }
      }
    }

    if (job_name == "database_backup") {
      const { dbName, projectId } = job.data;

      const pgService = new PostgresServices(adminPool);

      const result = await pgService.createDatabaseBackup({
        dbName: dbName,
      });

      await db.databaseBackups.create({
        data: {
          projectId: projectId,
          dbName: dbName,
          publicId: result.public_id,
        },
      });

      dbInstanceJobQueue.add(
        "database_backup",
        {
          dbName,
          projectId,
        },
        {
          delay: 1000 * 60 * 60 * 24 * 7,
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
    }
  });

  worker.on("failed", (job, err) => {
    /**
     * Todo: update retry count and if it exceeds max retries, mark step as failed
     * Also, add this to deadLetterLLmJobs queue
     */
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  queueEvents.on("failed", async ({ jobId, failedReason }) => {
    const job = await dbInstanceJobQueue.getJob(jobId);

    const payloadToSend = {
      jobId: jobId,
      jobName: job?.name,
      failedReason: failedReason,
    };
    logger.error(
      "DB  instance worker failed",
      loggerMetadata.system({
        filePath: __filename,
        ...payloadToSend,
      })
    );

    await discordService.sendEmbedToChannel({
      title: "Worker failed",
      channelId: envConf.ADMIN_DISCORD_CHANNEL_ID,
      description: `\`\`\`${JSON.stringify(payloadToSend)}\`\`\``,
      notificationType: "error",
      resourceDetails: [
        {
          label: "grafana",
          url: "https://monitoring.databridge.unknownbug.tech/",
        },
      ],
    });
  });

  dbInstanceJobInstance = dbInstanceJobs;

  return dbInstanceJobs;
}

export { initiateDbInstanceJobs };
