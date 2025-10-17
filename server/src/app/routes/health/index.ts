import { Application, Router } from "express";
import { AsyncHandler } from "../../lib/api.helper";
import { Controller } from "./controller";

function registerRoutes(): Router {
  const router = Router();
  const controller = new Controller();

  router.get("/express", AsyncHandler(controller.healthCheck.bind(controller)));

  return router;
}

export const healthRoutes = registerRoutes();
