import "dotenv/config";
import { z } from "zod";

/**
 * Thi schema validates all the required env variables
 */
const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  BASE_URL: z.string().min(1, "BASE_URL is required"),
  VALID_ORIGINS: z.string().min(1, "VALID_ORIGINS is required"),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required"),
  ENCRYPTION_KEY: z.string().min(1, "ENCRYPTION_KEY is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
  REDIS_HOST: z.string().min(1, "REDIS_HOST is required"),
  REDIS_PORT: z.string().min(1, "REDIS_PORT is required"),
  DATABASE_ADMIN_USER: z.string().min(1, "DATABASE_ADMIN_USER is required"),
  DATABASE_ADMIN_PASSWORD: z
    .string()
    .min(1, "DATABASE_ADMIN_PASSWORD is required"),
  DATABASE_HOST: z.string().min(1, "DATABASE_HOST is required"),
  DATABASE_PORT: z.string().min(1, "DATABASE_PORT is required"),
  DISCORD_BOT_LOGIN_TOKEN: z.string().min(1, "DATABASE_PORT is required"),
  MAIL_TRAP_HOST: z.string().min(1, "MAIL_TRAP_HOST is required"),
  MAIL_TRAP_PORT: z.string().min(1, "MAIL_TRAP_PORT is required"),
  MAIL_TRAP_USERNAME: z.string().min(1, "MAIL_TRAP_USERNAME is required"),
  MAIL_TRAP_PASSWORD: z.string().min(1, "MAIL_TRAP_PASSWORD is required"),
});

/**
 * this function to get env variables
 * - validate them
 * - if validated then return an object containing all env variables
 * - if fails crashes the whole system
 * @param env
 * @returns
 */
function createEnvConf(env: NodeJS.ProcessEnv) {
  const validateEnv = envSchema.safeParse(env);

  if (!validateEnv.success) {
    console.error("❌ Invalid environment variables:\n", {
      ...validateEnv.error.flatten().fieldErrors,
    });
    throw new Error(validateEnv.error.message);
  }
  return validateEnv.data;
}

export const envConf = createEnvConf(process.env);
