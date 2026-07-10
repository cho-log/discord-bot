export type GuestAccount = {
  name: string;
  username: string;
  password: string;
};

export type LookupResult =
  | { kind: 'found'; account: GuestAccount }
  | { kind: 'not-found' }
  | { kind: 'ambiguous' };

// 전제: 매핑 CSV는 build-accounts 스크립트가 생성하며 필드 안에 쉼표 없음. 첫 줄은 헤더.
export function parseAccountsCsv(text: string): GuestAccount[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    return [];
  }

  return lines.slice(1).map((line) => {
    const [name, username, password] = line.split(',').map((field) => field.trim());
    return { name: name ?? '', username: username ?? '', password: password ?? '' };
  });
}

export function lookupByName(accounts: GuestAccount[], name: string): LookupResult {
  const target = name.trim();
  const matches = accounts.filter((account) => account.name === target);
  const [first, ...rest] = matches;

  if (first === undefined) {
    return { kind: 'not-found' };
  }
  if (rest.length > 0) {
    return { kind: 'ambiguous' };
  }
  return { kind: 'found', account: first };
}
