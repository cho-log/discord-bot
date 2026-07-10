import { describe, expect, test } from 'vitest';
import { buildAccountsCsv } from './build-accounts.mjs';

const PARTICIPANTS = `타임스탬프,"개인정보 수집, 이용에 동의합니다.",이름,소속,직업,기대,참가비 입금 확인
2026-07-01,동의,조부용,SCG,개발자,네트워킹,네
2026-07-01,동의,김초록,우테코,대학생,강연,네`;

const ACCOUNTS = `번호,role_id,role_name,password,username,id
1,7,방문객,pw0000000001,guest0000001,10001
2,7,방문객,pw0000000002,guest0000002,10002
3,7,방문객,pw0000000003,guest0000003,10003`;

describe('buildAccountsCsv', () => {
  test('pairs participants and names leftover accounts 임시1..임시K', () => {
    const out = buildAccountsCsv(PARTICIPANTS, ACCOUNTS);
    expect(out).toBe(
      'name,username,password\n' +
        '조부용,guest0000001,pw0000000001\n' +
        '김초록,guest0000002,pw0000000002\n' +
        '임시1,guest0000003,pw0000000003',
    );
  });

  test('produces no 임시 rows when counts match exactly', () => {
    const twoAccounts = `번호,role_id,role_name,password,username,id
1,7,방문객,pw0000000001,guest0000001,10001
2,7,방문객,pw0000000002,guest0000002,10002`;
    const out = buildAccountsCsv(PARTICIPANTS, twoAccounts);
    expect(out).not.toContain('임시');
    expect(out.split('\n')).toHaveLength(3); // header + 2 participants
  });

  test('throws when there are more participants than accounts', () => {
    const tooFew = `번호,role_id,role_name,password,username,id
1,7,방문객,pw0000000001,guest0000001,10001`;
    expect(() => buildAccountsCsv(PARTICIPANTS, tooFew)).toThrow(/참가자.*계정/);
  });
});
