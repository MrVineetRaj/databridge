import { discordClient, rotateDbPasswordJobQueue } from "../../server";
import { db } from "../lib/db";
import { envConf } from "../lib/envConf";
import { discordService } from "../services/discord";
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
    const { channelId } = job.data;
    console.log({
      payload: job.data,
      name: job.name,
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
            url: `${envConf.FRONTEND_URL}/${project?.id}`,
          },
          { label: "DataBridge", url: `${envConf.FRONTEND_URL}` },
        ],
      });
    }
  });

  queueEvents.on("completed", (job) => {
    // console.log({
    //   name:job.
    // })
    /*
    Todo : Mark step status to completed
    */
  });

  worker.on("failed", (job, err) => {
    /**
     * Todo: update retry count and if it exceeds max retries, mark step as failed
     * Also, add this to deadLetterLLmJobs queue
     */
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  queueEvents.on("waiting", ({ jobId }) => {
    console.log("New job", jobId);
  });

  initiateNotificationJobInstance = notificationJobInstance;

  return notificationJobInstance;
}

export { initiateNotificationJobs };
