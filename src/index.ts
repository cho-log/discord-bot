import { loadConfig } from './config/index.js';
import { createClient, loginAndAwaitReady } from './discord/client.js';
import { registerEventHandlers } from './discord/event-handler.js';
import { DISCORD_INTENTS } from './discord/intents.js';

(async (): Promise<void> => {
  const config = loadConfig();
  const client = createClient(DISCORD_INTENTS);
  registerEventHandlers(client, []);
  await loginAndAwaitReady(client, config.DISCORD_BOT_TOKEN);
  console.log('[cho-log discord bot] running');
})().catch((err: unknown) => {
  console.error('[cho-log discord bot] bootstrap failed', err);
  process.exit(1);
});
