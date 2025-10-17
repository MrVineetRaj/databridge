import { NextFunction, Router, type Request, type Response } from "express";

import passport from "../../lib/passport";
import { ApiResponse, AsyncHandler } from "../../lib/api.helper";
import { isAuthenticated } from "../../middlewares/is-authenticated";
import Controller from "./controller";

export function createRouter(): Router {
  const router = Router();
  const controller = new Controller();

  // GitHub OAuth authentication route
  router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"], session: false })
  );

  // GitHub OAuth callback route
  router.get(
    "/callback/github",
    passport.authenticate("github", {
      failureRedirect: "/login", // On failure, go here
    }),
    AsyncHandler(controller.githubCallback.bind(controller))
  );
  // Discord OAuth2 callback route
  router.get(
    "/callback/discord",
    AsyncHandler(controller.discordCallback.bind(controller))
  );

  // req.user is populated by deserializeUser
  router.get(
    "/profile",
    isAuthenticated,
    AsyncHandler(controller.getProfile.bind(controller))
  );

  router.get(
    "/logout",
    isAuthenticated,
    AsyncHandler(controller.logout.bind(controller))
  );

  return router;
}

const authRoutes = createRouter();
export { authRoutes };
