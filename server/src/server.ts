import { createServer } from "http";
import { createExpressApp } from "./app/express";
import { envConf } from "./app/lib/envConf";
import logger, { loggerMetadata } from "./app/lib/logger";
import client from "prom-client";
import { appRouter } from "./app/trpc-routes";
import { initiateRotateDbPasswordJobs } from "./app/workers/rotate-db-password";

const PORT = envConf.PORT;

const server = createServer(createExpressApp());

const { collectDefaultMetrics } = client;

collectDefaultMetrics({
  register: client.register,
});

export const rotateDbPasswordJobs = initiateRotateDbPasswordJobs({
  redisConnection: {
    host: envConf.REDIS_HOST,
    port: +envConf.REDIS_PORT,
  },
});

export const rotateDbPasswordJobQueue = rotateDbPasswordJobs.getQueue();

server.listen(PORT, () => {
  logger.info(
    `Server is up on port ${PORT}`,
    loggerMetadata.system({ filePath: __filename })
  );
});
