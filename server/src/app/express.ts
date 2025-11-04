import { envConf } from "./lib/envConf";
import express, { Application, Request, Response } from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import responseTime from "response-time";
import client from "prom-client";
import { healthRoutes } from "./routes/health";
import cookieParser from "cookie-parser";
import session from "express-session";
import { redisServices } from "./services/redis";
import passport from "passport";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { authRoutes } from "./routes/auth";
import { appRouter } from "./trpc-routes";
import { createTRPCContext } from "./trpc";
import { dbInstanceJobQueue, notificationJobQueue } from "../server";
import { adminPool, PostgresServices } from "./services/pg";
import { ApiResponse, AsyncHandler } from "./lib/api.helper";
import axios, { AxiosError } from "axios";
import { cloudinaryServices } from "./services/cloudinary";
import { db } from "./lib/db";
import { email } from "zod";
import { encryptionServices } from "./services/encryption";
import { env } from "process";
import { UserRole } from "../generated/prisma";

/**
 * Creates and configures an Express application instance.
 * Initializes all essential middleware, sets up API routes,
 * and configures session management with Passport.
 * @returns {Application} The configured Express application.
 */
export function createExpressApp(): Application {
  const app: Application = express();

  /**
   * Used to allow multiple valid frontend routes to access this backend
   * valid methods wll be GET, POST, PUT, DELETE
   */
  app.use(
    cors({
      origin: envConf.VALID_ORIGINS.split(";"), // your client URL
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      exposedHeaders: [
        "RateLimit-Remaining",
        "RateLimit-Reset",
        "RateLimit-Limit",
      ],
    })
  );

  const reqResTime = new client.Histogram({
    name: "http_express_req_res_time",
    help: "This tells how much time is taken by req and res",
    labelNames: ["method", "route", "status_code"],
    buckets: [1, 50, 100, 200, 400, 500, 800, 1000, 2000],
  });

  const totalReqCounter = new client.Counter({
    name: "total_req",
    help: "Tells total number of request",
  });

  app.use(
    responseTime((req: Request, res: Response, time) => {
      if (req.originalUrl != "/api/v1/health/metrics") {
        totalReqCounter.inc();
      }
      const route = req.originalUrl.split("?")[0] as string;
      reqResTime
        .labels({
          method: req.method,
          route,
          status_code: res.statusCode,
        })
        .observe(time);
    })
  );

  /**
   * Some express middlewares setup to make sure that it can parse
   * - json body
   * - cookies
   */
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser());
  /**
   * This middleware is used to manage user authenticated session on backend
   * - For session store it uses redis
   * - And it makes sure that user stays logged in for 4hors after logging in
   */
  app.use(
    session({
      store: redisServices.createRedisStore({ prefix: "databridge:session" }),
      secret: envConf.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: envConf.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  /**
   * After creating a session
   * - initializing passport for authentication
   */
  app.use(passport.initialize());
  app.use(passport.session());

  /**
   * Rate limiting based on if user is authenticated or not
   */
  const conditionalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute

    // Dynamically set the maximum number of requests
    max: (req: Request, res: Response) => (req.isAuthenticated() ? 200 : 100),
    keyGenerator: (req: Request, res: Response) =>
      req.user
        ? (req.user as { id: string }).id
        : ipKeyGenerator(req.ip as string),

    message: "You have exceeded your request limit for this window.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(conditionalLimiter);

  /**
   * Now using multiple routes
   */
  app.use("/api/v1/auth", authRoutes); // for checking health of system
  app.use("/api/v1/health", healthRoutes); // for checking health of system

  /**
   * Attaching TRPC
   */

  app.use(
    "/api/v1/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: createTRPCContext,
    })
  );

  
  // app.get("/test", async (req: Request, res: Response) => {
  //   const admin = await db.user.upsert({
  //     where: {
  //       email: "vineetrajrj26@gmail.com",
  //     },
  //     update: {},
  //     create: {
  //       email: "vineetrajrj26@gmail.com",
  //       name: "Vineet Raj",
  //       role: UserRole.ADMIN,
  //     },
  //   });

  //   const project = await db.project.create({
  //     data: {
  //       dbUser: envConf.DATABASE_ADMIN_USER,
  //       dbPassword: encryptionServices.encrypt(envConf.DATABASE_ADMIN_PASSWORD),
  //       projectTitle: "DataBridge",
  //       projectDescription: "DBaaS Platform",
  //       userId: admin.id,
  //       dbDomain: envConf.DATABASE_HOST,
  //       dbName: "databridge",
  //     },
  //   });

  //   const pgService = new PostgresServices(adminPool);

  //   pgService.adminInitialization({ dbName: "databridge" });

  //   res.json(
  //     new ApiResponse({
  //       message: "Success",
  //       statusCode: 200,
  //     })
  //   );
  // });

  return app;
}
