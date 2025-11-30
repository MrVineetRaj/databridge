import { DiscordIntegration } from "../../../generated/prisma";
import { db } from "../../lib/db";

export class Repository {
  /**
   * Adds a new Discord integration for a user.
   * @param params - Object containing channelId and userId.
   * @returns The newly created DiscordIntegration object.
   */
  public async addNewDiscordIntegration({
    channelId,
    userId,
  }: {
    channelId: string;
    userId: string;
  }): Promise<DiscordIntegration> {
    const newIntegration = await db.discordIntegration.create({
      data: {
        channelId,
        userId,
      },
    });
    return newIntegration;
  }

  /**
   * Retrieves the Discord integration for a given user.
   * @param params - Object containing userId.
   * @returns The DiscordIntegration object if found, otherwise null.
   */
  public async getDiscordIntegration({
    userId,
  }: {
    userId: string;
  }): Promise<DiscordIntegration | null> {
    const integration = await db.discordIntegration.findUnique({
      where: {
        userId,
      },
    });

    return integration;
  }
}
