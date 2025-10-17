import winston, { LeveledLogMethod, Logger } from "winston";

/**
 * For this app i all services will be classified as these services
 */
export enum Service {
  SYSTEM = "SYSTEM_SERVICE",
  USER = "USER_SERVICE",
}

/**
 * Logger will have the following levels and colors associated with them
 */
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    api: 3,
    debug: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    api: "blue",
    debug: "orange",
  },
};
// adding colors to winston logger
winston.addColors(customLevels.colors);

/**
 * utility function to mark various services to the logger
 * @param {service}
 * @returns {winston.Logform.Format}
 */

const serviceFilter = (service: Service) => {
  return winston.format((info) => {
    return info.service === service ? info : false;
  })();
};

const logger = winston.createLogger({
  levels: customLevels.levels,
  level: "debug",
  // top-level format applies to all transports unless overridden
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),

  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/user-service.log",
      // The transport format only needs the filter. Timestamp and JSON are inherited.
      format: winston.format.combine(serviceFilter(Service.USER)),
    }),
    new winston.transports.File({
      filename: "logs/system-service.log",
      format: winston.format.combine(serviceFilter(Service.SYSTEM)),
    }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
}) as Logger & {
  api: LeveledLogMethod;
};

// Console logger for development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "DD/MM/YYYY HH:mm:ss" }),
        winston.format.printf((info) => {
          const service = info.service || "general";
          const timeTaken =
            info.timeTaken !== undefined ? `${info.timeTaken}ms` : "";
          const statusCode =
            info.statusCode !== undefined ? `[${info.statusCode}]` : "";
          const success = info.success ? `(${info.success})` : "";

          return `${info.timestamp} [${service}] ${info.level}: ${info.message} ${statusCode} ${success} ${timeTaken}`;
        })
      ),
    })
  );
}
interface SystemLogParams {
  filePath: string;
  description?: string;
}

interface UserLogParams {
  description?: string;
  statusCode: number;
  timeTaken?: number;
}

// factories to standardize output of various services
export const loggerMetadata = {
  system: ({ filePath, description = "" }: SystemLogParams) => {
    return {
      service: Service.SYSTEM,
      path: filePath,
      description: description,
    };
  },

  user: ({ description = "", statusCode, timeTaken }: UserLogParams) => {
    return {
      timeTaken,
      service: Service.USER,
      description: description,
      statusCode: statusCode,
      success: statusCode < 300 ? "OK" : statusCode < 400 ? "WARN" : "FAILED",
    };
  },
};

export default logger;
