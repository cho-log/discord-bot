import { GatewayIntentBits } from 'discord.js';

// JDA의 cholog/discord/JdaConfiguration.java EnumSet과 1:1 매핑한다.
// 차이점:
// - Guilds: Java JDA는 createDefault에서 자동 포함하지만 discord.js는 명시 필요
// - GuildExpressions: 구 GuildEmojisAndStickers의 정식 후속 이름 (값은 동일, 8)
// - GuildMembers / GuildPresences / MessageContent는 Discord Privileged Intent로
//   Developer Portal에서 활성화돼 있어야 login이 성공한다.
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
