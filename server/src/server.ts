import { createServer } from "http";
import { createExpressApp } from "./app/express";
import { envConf } from "./app/lib/envConf";
import logger, { loggerMetadata } from "./app/lib/logger";
import client from "prom-client";
import { appRouter } from "./app/trpc-routes";

const PORT = envConf.PORT;

const server = createServer(createExpressApp());

const { collectDefaultMetrics } = client;

collectDefaultMetrics({
  register: client.register,
});


server.listen(PORT, () => {
  logger.info(
    `Server is up on port ${PORT}`,
    loggerMetadata.system({ filePath: __filename })
  );
});
