import { GatewayIntentBits } from 'discord.js';

export const DISCORD_INTENTS: readonly GatewayIntentBits[] = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.GuildExpressions,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.MessageContent,
] as const;
