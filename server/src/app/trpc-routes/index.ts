import { router } from "../trpc";
import { healthRoutes } from "./health";

/**
 * Here every routes should be added
 */
export const appRouter = router({
  healthRoutes,
});

export type AppRouter = typeof appRouter;
