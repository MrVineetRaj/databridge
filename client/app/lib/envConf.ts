import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string(),
  VITE_BASE_URL: z.string(),
  VITE_DISCORD_BOT_INSTALLATION_URL: z.string(),
});

const createEnvConf = () => {
  const env = {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
    VITE_DISCORD_BOT_INSTALLATION_URL: import.meta.env
      .VITE_DISCORD_BOT_INSTALLATION_URL,
  };

  const parsedEnv = envSchema.safeParse(env);

  if (!parsedEnv.success) {
    // console.log("Environment variables validation failed:", parsedEnv.error);
    throw new Error("Invalid environment configuration");
  }

  return parsedEnv.data;
};

export const envConf = createEnvConf();
