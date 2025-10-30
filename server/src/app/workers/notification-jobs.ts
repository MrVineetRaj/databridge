import { discordClient } from "../../server";
import { db } from "../lib/db";
import { envConf } from "../lib/envConf";
import logger, { loggerMetadata } from "../lib/logger";
import { discordService } from "../services/discord";
import { emailServices } from "../services/email";
import { adminPool, PostgresServices } from "../services/pg";
import { RedisQueueAndWorker } from "../services/redis";

let initiateNotificationJobInstance: RedisQueueAndWorker | null = null;

/**
 * This function initializes the notification job queue and worker,
 * and sets up recommended event listeners for monitoring job status.
 * @param redisConnection - A Redis connection on which the queue will work
 * @returns RedisQueueAndWorker
 */
function initiateNotificationJobs({
  redisConnection,
}: {
  redisConnection: { host: string; port: number };
}): RedisQueueAndWorker {
  if (initiateNotificationJobInstance) {
    return initiateNotificationJobInstance;
  }

  const notificationJobInstance = new RedisQueueAndWorker({
    queueName: "notification-job-queue",
    connection: redisConnection,
  });

  const queueEvents = notificationJobInstance.getQueueEvents();

  const worker = notificationJobInstance.getWorker(async (job) => {
    const { channelId, platforms } = job.data;
    // throw new Error("Test error");
    logger.info(`New Job arrived ${job.name}`, {
      ...loggerMetadata.system({
        filePath: __filename,
      }),
      ...job.data,
    });

    const job_name = job.name;

    if (job_name === "new_discord_integration") {
      discordService.sendEmbedToChannel({
        channelId: channelId as string,
        description: "You will get further notifications from DataBridge here.",
        title: "Successfully Integrated",
        notificationType: "success",
        resourceDetails: [
          { label: "DataBridge", url: `${envConf.FRONTEND_URL}` },
        ],
      });
    }

    if (job_name === "password_rotated") {
      console.log("here");
      const { projectId } = job.data;
      const project = await db.project.findUnique({
        where: {
          id: projectId,
        },
      });

      discordService.sendEmbedToChannel({
        channelId: channelId as string,
        description: `Update about the connection string for ${project?.projectTitle}`,
        title: "Rotated DB Password",
        notificationType: "success",
        resourceDetails: [
          {
            label: project?.projectTitle as string,
            url: `${envConf.FRONTEND_URL}/console/${project?.id}`,
          },
          { label: "DataBridge", url: `${envConf.FRONTEND_URL}` },
        ],
      });
    }

    if (platforms.includes("discord")) {
      if (job_name === "pause_database") {
        const { discordChannelId, projectTitle, inactiveDatabases, projectId } =
          job.data;
        // { channelId, title, description, notificationType, resourceDetails, }
        if (discordChannelId) {
          await discordService.sendEmbedToChannel({
            channelId: discordChannelId,
            title: "Paused database connection",
            notificationType: "warning",
            description: `Hey looks like you don't had any activity for project ${projectTitle} to be more specific for databases \n- ${inactiveDatabases.join(
              `\n- `
            )}\nYou can enable it from Project dashboard`,
            resourceDetails: [
              {
                label: projectTitle,
                url: `${envConf.FRONTEND_URL}/console/${projectId}`,
              },
              { label: "DataBridge", url: `${envConf.FRONTEND_URL}` },
            ],
          });
        }
      }

      if (job_name === "deleted_databases") {
        const { discordChannelId, projectTitle, inactiveDatabases, projectId } =
          job.data;
        // { channelId, title, description, notificationType, resourceDetails, }
        if (discordChannelId) {
          await discordService.sendEmbedToChannel({
            channelId: discordChannelId,
            title: "Deleted database connection",
            notificationType: "error",
            description: `No actions from you so deleted databases \n- ${inactiveDatabases.join(
              `\n- `
            )}\nYou can enable it from Project dashboard`,
            resourceDetails: [
              {
                label: projectTitle,
                url: `${envConf.FRONTEND_URL}/console/${projectId}`,
              },
              { label: "DataBridge", url: `${envConf.FRONTEND_URL}` },
            ],
          });
        }
      }
    }
    if (platforms.includes("mail")) {
      if (job_name === "pause_database") {
        const {
          userName,
          userEmail,
          projectTitle,
          inactiveDatabases,
          projectId,
        } = job.data;
        emailServices.sendPausedWarningMail({
          to: userEmail,
          username: userName,
          projectTitle,
          inactiveDatabases,
          projectId,
        });
      }
      if (job_name === "deleted_databases") {
        const {
          userName,
          userEmail,
          projectTitle,
          inactiveDatabases,
          projectId,
        } = job.data;
        emailServices.sendDatabasesDeletedWarningMail({
          to: userEmail,
          username: userName,
          projectTitle,
          inactiveDatabases,
          projectId,
        });
      }
    }
    if (job_name === "welcome_mail") {
      const { username, email } = job.data;
      emailServices.sendWelcomeEmail({
        to: email,
        username,
      });
    }
  });

  worker.on("failed", (job, err) => {
    /**
     * Todo: update retry count and if it exceeds max retries, mark step as failed
     * Also, add this to deadLetterLLmJobs queue
     */
    logger.error(`New Job arrived ${job?.name}`, {
      ...loggerMetadata.system({
        filePath: __filename,
      }),
      ...job?.data,
      error: JSON.stringify(err),
    });
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  queueEvents.on("waiting", ({ jobId }) => {
    console.log("New job", jobId);
  });

  initiateNotificationJobInstance = notificationJobInstance;

  return notificationJobInstance;
}

export { initiateNotificationJobs };
