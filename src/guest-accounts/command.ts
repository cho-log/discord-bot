import { ApplicationCommandOptionType, type ApplicationCommandDataResolvable } from 'discord.js';
import { lookupByName, parseAccountsCsv } from './csv.js';

export const myAccountCommandData: ApplicationCommandDataResolvable = {
  name: '내계정',
  description: '배정된 게스트 네트워크 계정을 확인합니다',
  options: [
    {
      name: '이름',
      description: '본인 이름',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};

export function buildAccountReply(csvText: string | null, name: string): string {
  if (csvText === null) {
    return '계정 정보가 아직 준비되지 않았어요. 운영자에게 문의하세요.';
  }

  const result = lookupByName(parseAccountsCsv(csvText), name);
  switch (result.kind) {
    case 'not-found':
      return `'${name.trim()}'으로 등록된 계정을 찾지 못했어요. 이름을 확인해 주세요.`;
    case 'ambiguous':
      return '동명이인이 있어 확인이 어렵습니다. 운영자에게 문의하세요.';
    case 'found':
      return `**username**: \`${result.account.username}\`\n**password**: \`${result.account.password}\``;
  }
}
