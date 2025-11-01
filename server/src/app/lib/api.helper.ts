import { envConf } from "./envConf";
import logger, { loggerMetadata } from "./logger";
import { TRPCError } from "@trpc/server";
import { AuthedContext, Context } from "../trpc";

/**
 * This a function handle Try and Catch for all express route function b default and sned them to global error handler for processing
 * @param fn it is the controller to be called on certain endpoint call
 * @returns Promise<void> to satisfy express v5 conditions
 */
export const AsyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    const currTime = Date.now();
    let statusCode = 200;
    let isError = false;

    // it exists here to capture statusCode and validate if it was a success or not
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      if (data && data.statusCode) {
        statusCode = data.statusCode;
      }
      if (data && data.success === false) {
        isError = true;
      }
      return originalJson(data);
    };

    // Promise resolves the passed fn here and finally logs the extracted status code with time taken to approve this request
    Promise.resolve(fn(req, res, next))
      .catch((e) => {
        isError = true;
        if (e && e.statusCode) {
          statusCode = e.statusCode;
        } else if (e instanceof ErrorResponse) {
          statusCode = e.statusCode;
        } else {
          statusCode = 500;
        }
        next(e);
      })
      .finally(() => {
        logger.api(
          req.originalUrl,
          loggerMetadata.user({
            statusCode: statusCode,
            timeTaken: Date.now() - currTime,
          })
        );
      });
  };
};

type TRPCHandlerFunction<
  TInput = any,
  TOutput = any,
  TContext extends Context = Context
> = (input: TInput, ctx: TContext) => Promise<TOutput> | TOutput;

export const TRPCAsyncHandler = <
  TInput = any,
  TOutput = any,
  TContext extends Context = Context
>(
  fn: TRPCHandlerFunction<TInput, TOutput, TContext>
) => {
  return async (opts: { input: TInput; ctx: TContext }) => {
    const currTime = Date.now();
    let statusCode = 200;
    let error: any = null;

    try {
      const result = await Promise.resolve(fn(opts.input, opts.ctx));

      // Extract status code from ApiResponse if present
      if (result && typeof result === "object" && "statusCode" in result) {
        statusCode = (result as any).statusCode;
      }

      return result;
    } catch (e: any) {
      error = e;

      // Extract status code from error
      if (e && e.statusCode) {
        statusCode = e.statusCode;
      } else if (e instanceof TRPCError) {
        // Map TRPC error codes to HTTP status codes
        const errorCodeMap: Record<string, number> = {
          BAD_REQUEST: 400,
          UNAUTHORIZED: 401,
          FORBIDDEN: 403,
          NOT_FOUND: 404,
          METHOD_NOT_SUPPORTED: 405,
          TIMEOUT: 408,
          CONFLICT: 409,
          PRECONDITION_FAILED: 412,
          PAYLOAD_TOO_LARGE: 413,
          UNPROCESSABLE_CONTENT: 422,
          TOO_MANY_REQUESTS: 429,
          CLIENT_CLOSED_REQUEST: 499,
          INTERNAL_SERVER_ERROR: 500,
        };
        statusCode = errorCodeMap[e.code] || 500;
      } else {
        statusCode = 500;
      }

      console.log(e)

      logger.error(
        e.message,
        loggerMetadata.system({
          filePath: __filename,
          description: JSON.stringify(e),
        })
      );

      throw e;
    } finally {
      logger.api(
        opts.ctx.req.originalUrl || "trpc",
        loggerMetadata.user({
          statusCode: statusCode,
          timeTaken: Date.now() - currTime,
        })
      );
    }
  };
};

/**
 * It is class to standardize every ApiResponse going out from this server
 */
export class ApiResponse<T = any> {
  statusCode: number;
  success: string;
  message: string;
  data?: T;

  constructor({
    statusCode,
    message,
    data,
  }: {
    statusCode: number;
    message: string;
    data?: T;
  }) {
    this.statusCode = statusCode;
    this.success =
      statusCode < 300 ? "OK" : statusCode < 400 ? "WARNING" : "ERROR";
    this.message = message;
    if (data) {
      this.data = data;
    }
  }
}

/**
 * It is class to standardize every error
 * This class is extended from Error itself
 */
export class ErrorResponse extends Error {
  statusCode: number;
  success: boolean;
  message: string;
  details?: any;

  constructor({
    statusCode,
    message,
    success,
    details,
  }: {
    statusCode: number;
    success: boolean;
    message: string;
    details?: any;
  }) {
    super(message);
    this.statusCode = statusCode;
    this.success = success;
    this.message = message;
    if (envConf.NODE_ENV === "development") {
      this.details = details;
    }
  }
}
