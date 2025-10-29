import { router } from "../trpc";
import { dbInstanceRoutes } from "./db-instance";
import { healthRoutes } from "./health";
import { discordIntegrationRoutes } from "./integrations";
import { projectRoutes } from "./projects";

/**
 * Here every routes should be added
 */
export const appRouter = router({
  healthRoutes,
  projectRoutes,
  dbInstanceRoutes,
  discordIntegrationRoutes,
});

export type AppRouter = typeof appRouter;
