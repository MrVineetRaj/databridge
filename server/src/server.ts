import { createServer } from "http";
import { createExpressApp } from "./app/express";
import { envConf } from "./app/lib/envConf";
import logger, { loggerMetadata } from "./app/lib/logger";
import client from "prom-client";
import { appRouter } from "./app/trpc-routes";
import { initiateDbInstanceJobs } from "./app/workers/db-instance-jobs";
import { discordService } from "./app/services/discord";
import { initiateNotificationJobs } from "./app/workers/notification-jobs";
import "./app/workers/cron-jobs";
const PORT = envConf.PORT;

const server = createServer(createExpressApp());

const { collectDefaultMetrics } = client;

collectDefaultMetrics({
  register: client.register,
});

export const dbInstanceJobs = initiateDbInstanceJobs({
  redisConnection: {
    host: envConf.REDIS_HOST,
    port: +envConf.REDIS_PORT,
  },
});
export const notificationJobs = initiateNotificationJobs({
  redisConnection: {
    host: envConf.REDIS_HOST,
    port: +envConf.REDIS_PORT,
  },
});

export const dbInstanceJobQueue = dbInstanceJobs.getQueue();
export const notificationJobQueue = notificationJobs.getQueue();

export const discordClient = discordService.getClient();

server.listen(PORT, () => {
  logger.info(
    `Server is up on port ${PORT}`,
    loggerMetadata.system({ filePath: __filename })
  );
});
