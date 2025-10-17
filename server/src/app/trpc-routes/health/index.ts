import { ApiResponse, TRPCAsyncHandler } from "../../lib/api.helper";
import { baseProcedure, router } from "../../trpc";
import { Actions } from "./actions";

export function registerRoutes() {
  const actions = new Actions();
  const healthRoutes = router({
    trpcHealth: baseProcedure.query(TRPCAsyncHandler(actions.trpcHealth.bind(actions))),
  });

  return healthRoutes;
}

export const healthRoutes = registerRoutes();
