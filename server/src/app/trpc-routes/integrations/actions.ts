import { Request, Response } from "express";
import { DiscordIntegration, User } from "../../../generated/prisma";
import { ApiResponse } from "../../lib/api.helper";
import { db } from "../../lib/db";
import { AuthedContext, Context } from "../../trpc";
import { adminPool, PostgresServices } from "../../services/pg";
import { envConf } from "../../lib/envConf";
import format from "pg-format";
import { notificationJobQueue, rotateDbPasswordJobs } from "../../../server";

export class Actions {
  async newIntegration(input: { channelId: string }, ctx: AuthedContext) {
    const { channelId } = input;
    const { user } = ctx;

    const newIntegration = await db.discordIntegration.create({
      data: {
        channelId,
        userId: user.id,
      },
    });

    notificationJobQueue.add("new_discord_integration", {
      channelId,
    });
    return new ApiResponse<DiscordIntegration>({
      message: "Integration created successfully",
      statusCode: 201, // 201 Created is more appropriate
      data: newIntegration,
    });
  }

  async getDiscordIntegration(input: undefined, ctx: AuthedContext) {
    const { user } = ctx;

    const integration = await db.discordIntegration.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!integration) {
      return new ApiResponse({
        message: "Project created successfully",
        statusCode: 201, // 201 Created is more appropriate
      });
    }
    const result = integration
    return new ApiResponse<typeof result>({
      message: "Project created successfully",
      statusCode: 201,
      data: result,
    });
  }
}
