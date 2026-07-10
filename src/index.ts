import { loadConfig } from './config/index.js';
import { createClient, loginAndAwaitReady } from './discord/client.js';
import { registerEventHandlers } from './discord/event-handler.js';
import { DISCORD_INTENTS } from './discord/intents.js';
import { createMyAccountHandler, myAccountCommandData } from './guest-accounts/command.js';

(async (): Promise<void> => {
  const config = loadConfig();
  const client = createClient(DISCORD_INTENTS);
  registerEventHandlers(client, [createMyAccountHandler(config.GUEST_ACCOUNTS_CSV_PATH)]);
  await loginAndAwaitReady(client, config.DISCORD_BOT_TOKEN);

  // 커맨드는 ready 이후 guild scope로 등록해야 즉시 반영된다 (Java 레거시와 동일 스코프).
  const guild = await client.guilds.fetch(config.DISCORD_GUILD_ID);
  await guild.commands.set([myAccountCommandData]);

  console.log('[cho-log discord bot] running');
})().catch((err: unknown) => {
  console.error('[cho-log discord bot] bootstrap failed', err);
  process.exit(1);
});
