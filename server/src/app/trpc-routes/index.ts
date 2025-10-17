import { router } from "../trpc";
import { healthRoutes } from "./health";
import { projectRoutes } from "./projects";

/**
 * Here every routes should be added
 */
export const appRouter = router({
  healthRoutes,
  projectRoutes,
});

export type AppRouter = typeof appRouter;
