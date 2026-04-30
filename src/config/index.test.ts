import { expect, test } from 'vitest';
import { loadConfig } from './index.js';

const validEnv: NodeJS.ProcessEnv = {
  DISCORD_BOT_TOKEN: 'fake-token',
  DISCORD_GUILD_ID: '123456789012345678',
};

test('throws when required env is missing', () => {
  expect(() => loadConfig({})).toThrow(/Invalid config/);
});

test('returns typed config with defaults applied', () => {
  const config = loadConfig(validEnv);
  expect(config.DISCORD_BOT_TOKEN).toBe('fake-token');
  expect(config.DISCORD_GUILD_ID).toBe('123456789012345678');
  expect(config.LOG_LEVEL).toBe('info');
  expect(config.NODE_ENV).toBe('production');
});

test('rejects malformed snowflake guild id', () => {
  expect(() =>
    loadConfig({ ...validEnv, DISCORD_GUILD_ID: 'not-a-snowflake' }),
  ).toThrow(/DISCORD_GUILD_ID/);
});
