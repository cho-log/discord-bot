import { z } from 'zod';

const SNOWFLAKE_PATTERN = /^\d{17,20}$/;
const DISCORD_BOT_TOKEN_MIN_LENGTH = 50;

export const configSchema = z.object({
  DISCORD_BOT_TOKEN: z
    .string()
    .trim()
    .min(DISCORD_BOT_TOKEN_MIN_LENGTH, 'Discord bot token is too short'),
  DISCORD_GUILD_ID: z.string().trim().regex(SNOWFLAKE_PATTERN, 'Invalid Discord Guild ID format'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  NODE_ENV: z.enum(['development', 'production']).default('production'),
});

export type Config = z.infer<typeof configSchema>;
