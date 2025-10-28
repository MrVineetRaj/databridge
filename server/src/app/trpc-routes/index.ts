import { router } from "../trpc";
import { dbInstanceRoutes } from "./db-instance";
import { healthRoutes } from "./health";
import { projectRoutes } from "./projects";

/**
 * Here every routes should be added
 */
export const appRouter = router({
  healthRoutes,
  projectRoutes,
  dbInstanceRoutes,
});

export type AppRouter = typeof appRouter;
