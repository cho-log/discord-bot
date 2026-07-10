import { describe, expect, test } from 'vitest';
import { buildAccountReply } from './command.js';

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
