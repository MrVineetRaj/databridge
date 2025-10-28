import { rotateDbPasswordJobQueue } from "../../server";
import { db } from "../lib/db";
import { adminPool, PostgresServices } from "../services/pg";
import { RedisQueueAndWorker } from "../services/redis";

let rotateDbPasswordInstance: RedisQueueAndWorker | null = null;

/**
 * This function initializes the rotate db password job queue and worker,
 * and sets up recommended event listeners for monitoring job status.
 * @param redisConnection - A Redis connection on which the queue will work
 * @returns RedisQueueAndWorker
 */
function initiateRotateDbPasswordJobs({
  redisConnection,
}: {
  redisConnection: { host: string; port: number };
}): RedisQueueAndWorker {
  if (rotateDbPasswordInstance) {
    return rotateDbPasswordInstance;
  }

  const rotateDbPasswordJobs = new RedisQueueAndWorker({
    queueName: "rotate-db-password-job-queue",
    connection: redisConnection,
  });

  const queueEvents = rotateDbPasswordJobs.getQueueEvents();

  const worker = rotateDbPasswordJobs.getWorker(async (job) => {
    console.log(Date.now());
    console.log({ name: job.name, payload: job.data });
    const { projectId } = job.data;
    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const pgServices = new PostgresServices(adminPool);

    const pgResult = await pgServices.changeDbPassword({
      dbName: project.dbName as string,
      dbPassword: project.dbPassword as string,
      dbUserName: project.dbUser as string,
    });

    if (pgResult.success) {
      await db.project.update({
        where: {
          id: project.id,
        },
        data: {
          dbPassword: pgResult.data,
        },
      });

      rotateDbPasswordJobQueue.add(
        "rotate_password",
        {
          projectId: "cmguszdo70001i07qxjf06btr",
        },
        {
          delay: 1000 * 60 * 60 * 24 * 30,
        }
      );
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

  rotateDbPasswordInstance = rotateDbPasswordJobs;

  return rotateDbPasswordJobs;
}

export { initiateRotateDbPasswordJobs };
