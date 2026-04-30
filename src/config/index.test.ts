import { expect, test } from 'vitest';
import { loadConfig } from './index.js';

const VALID_TOKEN = 'a'.repeat(60);

const validEnv: NodeJS.ProcessEnv = {
  DISCORD_BOT_TOKEN: VALID_TOKEN,
  DISCORD_GUILD_ID: '123456789012345678',
};

test('throws when required env is missing', () => {
  expect(() => loadConfig({})).toThrow(/Invalid config/);
});

test('returns typed config with defaults applied', () => {
  const config = loadConfig(validEnv);
  expect(config.DISCORD_BOT_TOKEN).toBe(VALID_TOKEN);
  expect(config.DISCORD_GUILD_ID).toBe('123456789012345678');
  expect(config.LOG_LEVEL).toBe('info');
  expect(config.NODE_ENV).toBe('production');
});

test('rejects malformed snowflake guild id', () => {
  expect(() => loadConfig({ ...validEnv, DISCORD_GUILD_ID: 'not-a-snowflake' })).toThrow(
    /DISCORD_GUILD_ID/,
  );
});

test('rejects empty bot token', () => {
  expect(() => loadConfig({ ...validEnv, DISCORD_BOT_TOKEN: '' })).toThrow(/DISCORD_BOT_TOKEN/);
});

test('rejects whitespace-only bot token', () => {
  expect(() => loadConfig({ ...validEnv, DISCORD_BOT_TOKEN: '     ' })).toThrow(
    /DISCORD_BOT_TOKEN/,
  );
});

test('rejects bot token shorter than 50 characters', () => {
  expect(() => loadConfig({ ...validEnv, DISCORD_BOT_TOKEN: 'a'.repeat(49) })).toThrow(
    /DISCORD_BOT_TOKEN/,
  );
});

test('rejects short token even when padded with surrounding whitespace', () => {
  const padded = `   ${'a'.repeat(49)}   `;
  expect(() => loadConfig({ ...validEnv, DISCORD_BOT_TOKEN: padded })).toThrow(/DISCORD_BOT_TOKEN/);
});

test('trims surrounding whitespace from a valid bot token', () => {
  const padded = `   ${VALID_TOKEN}   `;
  const config = loadConfig({ ...validEnv, DISCORD_BOT_TOKEN: padded });
  expect(config.DISCORD_BOT_TOKEN).toBe(VALID_TOKEN);
});

test('trims surrounding whitespace from a valid guild id', () => {
  const config = loadConfig({ ...validEnv, DISCORD_GUILD_ID: '   123456789012345678   ' });
  expect(config.DISCORD_GUILD_ID).toBe('123456789012345678');
});
