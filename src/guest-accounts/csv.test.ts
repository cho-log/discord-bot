import { describe, expect, test } from 'vitest';
import { lookupByName, parseAccountsCsv } from './csv.js';

const CSV = `name,username,password
조부용,guest0000001,ab12cd34ef56
홍길동,guest0000002,gh78ij90kl12
홍길동,guest0000003,zz99zz99zz99`;

describe('parseAccountsCsv', () => {
  test('parses rows and skips the header', () => {
    const accounts = parseAccountsCsv('name,username,password\n조부용,guest0000001,ab12cd34ef56');
    expect(accounts).toEqual([{ name: '조부용', username: 'guest0000001', password: 'ab12cd34ef56' }]);
  });

  test('trims fields and ignores blank lines', () => {
    const accounts = parseAccountsCsv(
      'name,username,password\n\n  조부용 , guest0000001 , ab12cd34ef56 \n',
    );
    expect(accounts).toEqual([{ name: '조부용', username: 'guest0000001', password: 'ab12cd34ef56' }]);
  });

  test('returns empty array for header-only or empty input', () => {
    expect(parseAccountsCsv('name,username,password')).toEqual([]);
    expect(parseAccountsCsv('')).toEqual([]);
  });
});

describe('lookupByName', () => {
  const accounts = parseAccountsCsv(CSV);

  test('returns found for a unique name', () => {
    expect(lookupByName(accounts, '조부용')).toEqual({
      kind: 'found',
      account: { name: '조부용', username: 'guest0000001', password: 'ab12cd34ef56' },
    });
  });

  test('trims the query name before matching', () => {
    expect(lookupByName(accounts, '  조부용  ')).toEqual({
      kind: 'found',
      account: { name: '조부용', username: 'guest0000001', password: 'ab12cd34ef56' },
    });
  });

  test('returns not-found for an unknown name', () => {
    expect(lookupByName(accounts, '없는사람')).toEqual({ kind: 'not-found' });
  });

  test('returns ambiguous when the name is duplicated', () => {
    expect(lookupByName(accounts, '홍길동')).toEqual({ kind: 'ambiguous' });
  });
});
