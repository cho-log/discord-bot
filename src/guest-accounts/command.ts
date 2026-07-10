import { readFile } from 'node:fs/promises';
import {
  ApplicationCommandOptionType,
  type ApplicationCommandDataResolvable,
  type Interaction,
  MessageFlags,
} from 'discord.js';
import type { EventHandler } from '../discord/event-handler.js';
import { lookupByName, parseAccountsCsv } from './csv.js';

const MY_ACCOUNT_COMMAND_NAME = '내계정';

export const myAccountCommandData: ApplicationCommandDataResolvable = {
  name: MY_ACCOUNT_COMMAND_NAME,
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

async function readCsv(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch (err) {
    // 파일 없음(ENOENT)은 행사 후 삭제된 정상 상태이므로 조용히 null.
    // 그 외(권한/디코드 등)는 운영자가 알아챌 수 있도록 로그를 남긴다.
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn('[guest-accounts] accounts CSV 읽기 실패', err);
    }
    return null;
  }
}

export function createMyAccountHandler(csvPath: string): EventHandler<'interactionCreate'> {
  return {
    event: 'interactionCreate',
    handle: async (interaction: Interaction): Promise<void> => {
      if (
        !interaction.isChatInputCommand() ||
        interaction.commandName !== MY_ACCOUNT_COMMAND_NAME
      ) {
        return;
      }
      const name = interaction.options.getString('이름', true);
      const content = buildAccountReply(await readCsv(csvPath), name);
      try {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      } catch (err) {
        // reply 실패(네트워크/토큰만료/이미 응답됨)는 unhandled rejection이 되지 않도록 삼킨다.
        console.error('[guest-accounts] /내계정 응답 실패', err);
      }
    },
  };
}
