import { z } from 'zod';

const SNOWFLAKE_PATTERN = /^\d{17,20}$/;

export const configSchema = z.object({
  DISCORD_BOT_TOKEN: z.string().min(1),
  DISCORD_GUILD_ID: z.string().regex(SNOWFLAKE_PATTERN),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error'])
    .default('info'),
  NODE_ENV: z.enum(['development', 'production']).default('production'),
});

export type Config = z.infer<typeof configSchema>;
