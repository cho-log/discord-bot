import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// 따옴표/쉼표 포함 필드를 다루는 최소 RFC4180 파서.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function columnIndex(header, predicate) {
  const idx = header.findIndex(predicate);
  if (idx === -1) throw new Error(`필요한 컬럼을 찾지 못했습니다: ${header.join(',')}`);
  return idx;
}

export function buildAccountsCsv(participantsCsv, accountsCsv) {
  const pRows = parseCsv(participantsCsv);
  const aRows = parseCsv(accountsCsv);
  const pHeader = pRows[0];
  const aHeader = aRows[0];

  const nameIdx = columnIndex(pHeader, (h) => h.trim() === '이름');
  const userIdx = columnIndex(aHeader, (h) => h.trim() === 'username');
  const passIdx = columnIndex(aHeader, (h) => h.trim() === 'password');

  const names = pRows
    .slice(1)
    .map((r) => (r[nameIdx] ?? '').trim())
    .filter((n) => n.length > 0);
  const accounts = aRows.slice(1).map((r) => ({
    username: (r[userIdx] ?? '').trim(),
    password: (r[passIdx] ?? '').trim(),
  }));

  if (names.length > accounts.length) {
    throw new Error(`참가자(${names.length})가 계정(${accounts.length})보다 많습니다.`);
  }

  // 참가자에 계정을 순서대로 배정하고, 남는 계정은 임시1..임시K 예비로 채운다.
  const rowNames = accounts.map((_, i) => names[i] ?? `임시${i - names.length + 1}`);

  const lines = ['name,username,password'];
  accounts.forEach((acc, i) => {
    lines.push(`${rowNames[i]},${acc.username},${acc.password}`);
  });
  return lines.join('\n');
}

// CLI: node scripts/build-accounts.mjs <참가자.csv> <계정.csv> <출력.csv>
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const [, , participantsPath, accountsPath, outPath] = process.argv;
  if (!participantsPath || !accountsPath || !outPath) {
    console.error('usage: node scripts/build-accounts.mjs <참가자.csv> <계정.csv> <출력.csv>');
    process.exit(1);
  }
  const [p, a] = await Promise.all([
    readFile(participantsPath, 'utf8'),
    readFile(accountsPath, 'utf8'),
  ]);
  const out = buildAccountsCsv(p, a);
  await writeFile(outPath, out, 'utf8');
  console.log(`wrote ${out.split('\n').length - 1} rows to ${outPath}`);
}
