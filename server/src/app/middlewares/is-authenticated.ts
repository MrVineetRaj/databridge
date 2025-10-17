import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../lib/api.helper";
import logger, { loggerMetadata } from "../lib/logger";

/**
 * It is a middleware to allow only authenticated requests
 * @param req Request imported from express
 * @param res Response imported from express
 * @param next NextFunction imported from express
 */
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const currTime = Date.now();
  if (req.isAuthenticated()) {
    return next();
  }

  logger.api(
    req.originalUrl,
    loggerMetadata.user({
      statusCode: 401,
      timeTaken: Date.now() - currTime,
    })
  );
  res.status(401).json(
    new ApiResponse({
      statusCode: 401,
      message: "Authentication failed",
    })
  );
}

export { isAuthenticated };
