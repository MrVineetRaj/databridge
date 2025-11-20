import { Request, Response } from "express";
import { DiscordIntegration, User } from "../../../generated/prisma";
import { ApiResponse } from "../../lib/api.helper";
import { db } from "../../lib/db";
import { AuthedContext, Context } from "../../trpc";
import { adminPool, PostgresServices } from "../../services/pg";
import { envConf } from "../../lib/envConf";
import format from "pg-format";
import { notificationJobQueue } from "../../../server";
import { Repository } from "./repository";

export class Actions {
  repository: Repository;
  constructor() {
    this.repository = new Repository();
  }

  /**
   * Creates a new Discord integration for the authenticated user.
   * @param input - Object containing channelId.
   * @param ctx - Authenticated context.
   * @returns ApiResponse with the created DiscordIntegration.
   */
  async newIntegration(input: { channelId: string }, ctx: AuthedContext) {
    const { channelId } = input;
    const { user } = ctx;

    const newIntegration = await this.repository.addNewDiscordIntegration({
      channelId,
      userId: user.id,
    });

    notificationJobQueue.add("new_discord_integration", {
      channelId,
      platforms: ["discord"],
    });
    return new ApiResponse<DiscordIntegration>({
      message: "Integration created successfully",
      statusCode: 201, // 201 Created is more appropriate
      data: newIntegration,
    });
  }

  /**
   * Retrieves the Discord integration for the authenticated user.
   * @param input - Not used.
   * @param ctx - Authenticated context.
   * @returns ApiResponse with the DiscordIntegration if found.
   */
  async getDiscordIntegration(input: undefined, ctx: AuthedContext) {
    const { user } = ctx;

    const integration = await this.repository.getDiscordIntegration({
      userId: user.id,
    });

    if (!integration) {
      return new ApiResponse({
        message: "Project created successfully",
        statusCode: 201, // 201 Created is more appropriate
      });
    }
    const result = integration;
    return new ApiResponse<typeof result>({
      message: "Project created successfully",
      statusCode: 201,
      data: result,
    });
  }
}
