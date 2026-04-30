import { GatewayIntentBits } from 'discord.js';
import { expect, test } from 'vitest';
import { DISCORD_INTENTS } from './intents.js';

test('contains 9 intents (Java JDA 8 + Guilds for discord.js)', () => {
  expect(DISCORD_INTENTS).toHaveLength(9);
});

test('includes core intents required by the bot', () => {
  expect(DISCORD_INTENTS).toContain(GatewayIntentBits.Guilds);
  expect(DISCORD_INTENTS).toContain(GatewayIntentBits.MessageContent);
  expect(DISCORD_INTENTS).toContain(GatewayIntentBits.GuildExpressions);
});

test('does not contain duplicates', () => {
  expect(new Set(DISCORD_INTENTS).size).toBe(DISCORD_INTENTS.length);
});
