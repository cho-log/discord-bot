import { type Config, configSchema } from './schema.js';

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = configSchema.safeParse({
    DISCORD_BOT_TOKEN: env['DISCORD_BOT_TOKEN'],
    DISCORD_GUILD_ID: env['DISCORD_GUILD_ID'],
    LOG_LEVEL: env['LOG_LEVEL'],
    NODE_ENV: env['NODE_ENV'],
  });

  if (!result.success) {
    const summary = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid config: ${summary}`);
  }

  return result.data;
}
