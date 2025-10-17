import { createServer } from "http";
import { createExpressApp } from "./app/express";
import { envConf } from "./app/lib/envConf";
import logger, { loggerMetadata } from "./app/lib/logger";

const PORT = envConf.PORT;

const server = createServer(createExpressApp());

server.listen(PORT, () => {
  logger.info(
    `Server is up on port ${PORT}`,
    loggerMetadata.system({ filePath: __filename })
  );
});
