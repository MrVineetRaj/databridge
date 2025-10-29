import z from "zod";
import { ApiResponse, TRPCAsyncHandler } from "../../lib/api.helper";
import { baseProcedure, protectedProcedure, router } from "../../trpc";
import { Actions } from "./actions";

export function registerRoutes() {
  const actions = new Actions();
  const discordIntegrationRoutes = router({
    addNewIntegration: protectedProcedure
      .input(
        z.object({
          channelId: z.string(),
        })
      )
      .mutation(TRPCAsyncHandler(actions.newIntegration.bind(actions))),
    getDiscordIntegration: protectedProcedure.query(
      TRPCAsyncHandler(actions.getDiscordIntegration.bind(actions))
    ),
  });

  return discordIntegrationRoutes;
}

export const discordIntegrationRoutes = registerRoutes();
