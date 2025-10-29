import {
  Client,
  Events,
  GatewayIntentBits,
  Guild,
  TextChannel,
} from "discord.js";
import { envConf } from "../lib/envConf";

class DiscordService {
  private client: Client;
  private isReady: boolean;

  constructor() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });
    this.isReady = false;
  }

  public getClient(): Client {
    if (!this.isReady) {
      this.client.once(Events.ClientReady, (readyClient) => {
        console.log(
          `Discord Client Ready! Logged in as ${readyClient.user.tag}`
        );
        this.isReady = true;
      });
      this.client.login(envConf.DISCORD_BOT_LOGIN_TOKEN);
    }
    return this.client;
  }

  public getIsReady(): boolean {
    return this.isReady;
  }

  public async sendEmbedToChannel({
    channelId,
    title,
    description,
    notificationType,
    resourceDetails,
  }: {
    channelId: string;
    title: string;
    description: string;
    notificationType: string;
    resourceDetails: { label: string; url: string }[];
  }) {
    if (!this.isReady) {
      return { message: "Discord client not ready", success: false };
    }
    const embed = {
      title: title,
      description: description,
      color:
        notificationType === "error"
          ? 0xff0000
          : notificationType === "warning"
          ? 0xffff00
          : 0x00ff00,
      fields: [
        {
          name: "Quick Links",
          value: `${resourceDetails.length > 0 ? "\n" : ""} ${resourceDetails
            .map((res) => `- [${res.label}](${res.url})`)
            .join("\n")}`,
          inline: false,
        },
      ],
      footer: {
        text: "DataBridge • All rights reserved",
      },
      timestamp: new Date().toISOString(),
    };
    try {
      const channel = await this.client.channels.fetch(channelId);

      if (channel && channel.isTextBased()) {
        await (channel as TextChannel).send({ embeds: [embed] });
        return {
          message: "Notification sent successfully",
          success: true,
        };
      } else {
        console.error("Channel not found or not a text channel");
        return {
          message: "Channel not found or not a text channel",
          success: false,
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          message: "Error sending notification:" + error.message,
          success: false,
        };
      }
      return { message: "Error sending notification", success: false };
    }
  }
}

export const discordService = new DiscordService();
