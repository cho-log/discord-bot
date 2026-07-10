import { describe, expect, test, vi } from 'vitest';

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }));

import { readFile } from 'node:fs/promises';
import type { ChatInputCommandInteraction, Interaction } from 'discord.js';
import { buildAccountReply, createMyAccountHandler } from './command.js';

const CSV = `name,username,password
조부용,guest0000001,ab12cd34ef56
홍길동,guest0000002,gh78ij90kl12
홍길동,guest0000003,zz99zz99zz99`;

describe('buildAccountReply', () => {
  test('returns not-ready message when csv text is null', () => {
    expect(buildAccountReply(null, '조부용')).toContain('준비되지 않았');
  });

  test('returns username and password for a found account', () => {
    const reply = buildAccountReply(CSV, '조부용');
    expect(reply).toContain('guest0000001');
    expect(reply).toContain('ab12cd34ef56');
  });

  test('returns not-found message with the queried name', () => {
    const reply = buildAccountReply(CSV, '없는사람');
    expect(reply).toContain('없는사람');
    expect(reply).toContain('찾지 못');
  });

  test('returns ambiguous message for duplicated names', () => {
    expect(buildAccountReply(CSV, '홍길동')).toContain('동명이인');
  });
});

function mockChatInput(name: string): Interaction {
  const reply = vi.fn();
  return {
    isChatInputCommand: () => true,
    commandName: '내계정',
    options: { getString: () => name },
    reply,
  } as unknown as Interaction;
}

describe('createMyAccountHandler', () => {
  test('replies with the account as an ephemeral message', async () => {
    vi.mocked(readFile).mockResolvedValue(CSV);
    const handler = createMyAccountHandler('/tmp/accounts.csv');
    const interaction = mockChatInput('조부용');

    await handler.handle(interaction);

    const reply = (interaction as unknown as ChatInputCommandInteraction).reply as ReturnType<
      typeof vi.fn
    >;
    expect(reply).toHaveBeenCalledTimes(1);
    const arg = reply.mock.calls[0]?.[0] as { content: string; flags: number };
    expect(arg.content).toContain('guest0000001');
    expect(arg.flags).toBeDefined();
  });

  test('replies not-ready when the csv file cannot be read', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));
    const handler = createMyAccountHandler('/tmp/missing.csv');
    const interaction = mockChatInput('조부용');

    await handler.handle(interaction);

    const reply = (interaction as unknown as ChatInputCommandInteraction).reply as ReturnType<
      typeof vi.fn
    >;
    const arg = reply.mock.calls[0]?.[0] as { content: string };
    expect(arg.content).toContain('준비되지 않았');
  });

  test('ignores non-chat-input interactions', async () => {
    const reply = vi.fn();
    const interaction = { isChatInputCommand: () => false, reply } as unknown as Interaction;
    const handler = createMyAccountHandler('/tmp/accounts.csv');

    await handler.handle(interaction);

    expect(reply).not.toHaveBeenCalled();
  });
});
