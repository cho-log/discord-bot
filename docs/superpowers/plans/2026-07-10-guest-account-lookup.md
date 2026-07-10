# 게스트/네트워크 계정 조회 슬래시 커맨드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 참가자가 `/내계정 이름:조부용` 슬래시 커맨드로 배정된 네트워크 계정의 id/password를 본인만 보이는(ephemeral) 메시지로 확인한다.

**Architecture:** 슬래시 커맨드 프레임워크 없이 최소 구현. 순수 데이터 계층(`csv.ts`: 파싱·조회)과 표현/배선 계층(`command.ts`: 응답 문구 생성 + fs 읽기 + Discord 핸들러)을 분리한다. CSV는 EC2 디스크 파일로 두고 커맨드 실행 때마다 읽어, 행사 후 파일 삭제 시 조회가 자동 차단(fail-closed)된다.

**Tech Stack:** TypeScript 5.9 (ESM, Node16), discord.js ^14.26, Zod ^4.4, Vitest 4, Node 22+ `node:fs/promises`.

## Global Constraints

- ESM: 모든 상대 import는 `.js` 확장자 사용 (예: `./csv.js`).
- `tsconfig`에 `noUncheckedIndexedAccess` 활성 — 배열 인덱싱/구조분해 결과는 `T | undefined`. 비-널 단언(`!`) 대신 명시적 분기로 처리.
- `noPropertyAccessFromIndexSignature` 활성 — `process.env`는 반드시 `env['KEY']` 대괄호 접근.
- 타입은 `type` 별칭 사용 (ESLint가 `interface` 금지).
- ephemeral 응답은 `interaction.reply({ content, flags: MessageFlags.Ephemeral })` (deprecated `ephemeral: true` 금지).
- 커맨드명 `내계정`, 옵션명 `이름`(필수 문자열).
- CSV 평문 비밀번호는 **절대 git 커밋 금지**. 테스트/예시 데이터는 전부 가짜 값.
- 커밋 메시지는 Conventional Commits. 각 커밋 끝에 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

### Task 1: config에 `GUEST_ACCOUNTS_CSV_PATH` 추가

**Files:**
- Modify: `src/config/schema.ts`
- Modify: `src/config/index.ts`
- Test: `src/config/index.test.ts`

**Interfaces:**
- Consumes: 기존 `configSchema`, `loadConfig`.
- Produces: `Config['GUEST_ACCOUNTS_CSV_PATH']: string` (기본값 `'data/accounts.csv'`). Task 5가 소비.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/config/index.test.ts` 하단에 추가:

```ts
test('applies default guest accounts csv path', () => {
  const config = loadConfig(validEnv);
  expect(config.GUEST_ACCOUNTS_CSV_PATH).toBe('data/accounts.csv');
});

test('uses provided guest accounts csv path', () => {
  const config = loadConfig({ ...validEnv, GUEST_ACCOUNTS_CSV_PATH: '/srv/accounts.csv' });
  expect(config.GUEST_ACCOUNTS_CSV_PATH).toBe('/srv/accounts.csv');
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- src/config/index.test.ts`
Expected: FAIL — `config.GUEST_ACCOUNTS_CSV_PATH`가 `undefined` (스키마에 없음).

- [ ] **Step 3: 스키마와 로더에 필드 추가**

`src/config/schema.ts`의 `configSchema` 객체에 필드 추가 (`NODE_ENV` 줄 다음):

```ts
  GUEST_ACCOUNTS_CSV_PATH: z.string().trim().min(1).default('data/accounts.csv'),
```

`src/config/index.ts`의 `safeParse` 인자 객체에 키 추가 (`NODE_ENV` 줄 다음):

```ts
    GUEST_ACCOUNTS_CSV_PATH: env['GUEST_ACCOUNTS_CSV_PATH'],
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/config/index.test.ts`
Expected: PASS (신규 2건 포함 전체 통과).

- [ ] **Step 5: 커밋**

```bash
git add src/config/schema.ts src/config/index.ts src/config/index.test.ts
git commit -m "feat(config): 게스트 계정 CSV 경로 환경변수 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `csv.ts` — CSV 파싱과 이름 조회 (순수 함수)

**Files:**
- Create: `src/guest-accounts/csv.ts`
- Test: `src/guest-accounts/csv.test.ts`

**Interfaces:**
- Consumes: 없음 (순수, I/O 없음).
- Produces:
  - `type GuestAccount = { name: string; id: string; password: string }`
  - `type LookupResult = { kind: 'found'; account: GuestAccount } | { kind: 'not-found' } | { kind: 'ambiguous' }`
  - `parseAccountsCsv(text: string): GuestAccount[]`
  - `lookupByName(accounts: GuestAccount[], name: string): LookupResult`
  - Task 3이 소비.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/guest-accounts/csv.test.ts` 생성:

```ts
import { describe, expect, test } from 'vitest';
import { lookupByName, parseAccountsCsv } from './csv.js';

const CSV = `name,id,password
조부용,guest-01,ab12cd34
홍길동,guest-02,ef56gh78
홍길동,guest-03,zz99zz99`;

describe('parseAccountsCsv', () => {
  test('parses rows and skips the header', () => {
    const accounts = parseAccountsCsv('name,id,password\n조부용,guest-01,ab12cd34');
    expect(accounts).toEqual([{ name: '조부용', id: 'guest-01', password: 'ab12cd34' }]);
  });

  test('trims fields and ignores blank lines', () => {
    const accounts = parseAccountsCsv('name,id,password\n\n  조부용 , guest-01 , ab12cd34 \n');
    expect(accounts).toEqual([{ name: '조부용', id: 'guest-01', password: 'ab12cd34' }]);
  });

  test('returns empty array for header-only or empty input', () => {
    expect(parseAccountsCsv('name,id,password')).toEqual([]);
    expect(parseAccountsCsv('')).toEqual([]);
  });
});

describe('lookupByName', () => {
  const accounts = parseAccountsCsv(CSV);

  test('returns found for a unique name', () => {
    expect(lookupByName(accounts, '조부용')).toEqual({
      kind: 'found',
      account: { name: '조부용', id: 'guest-01', password: 'ab12cd34' },
    });
  });

  test('trims the query name before matching', () => {
    expect(lookupByName(accounts, '  조부용  ')).toEqual({
      kind: 'found',
      account: { name: '조부용', id: 'guest-01', password: 'ab12cd34' },
    });
  });

  test('returns not-found for an unknown name', () => {
    expect(lookupByName(accounts, '없는사람')).toEqual({ kind: 'not-found' });
  });

  test('returns ambiguous when the name is duplicated', () => {
    expect(lookupByName(accounts, '홍길동')).toEqual({ kind: 'ambiguous' });
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- src/guest-accounts/csv.test.ts`
Expected: FAIL — `Cannot find module './csv.js'`.

- [ ] **Step 3: 최소 구현 작성**

`src/guest-accounts/csv.ts` 생성:

```ts
export type GuestAccount = {
  name: string;
  id: string;
  password: string;
};

export type LookupResult =
  | { kind: 'found'; account: GuestAccount }
  | { kind: 'not-found' }
  | { kind: 'ambiguous' };

// 전제: 필드 안에 쉼표 없음 (운영자가 관리하는 단순 CSV). 첫 줄은 헤더.
// 쉼표 포함 값이 필요해지면 그때 csv-parse 의존성 도입 (YAGNI).
export function parseAccountsCsv(text: string): GuestAccount[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    return [];
  }

  return lines.slice(1).map((line) => {
    const [name, id, password] = line.split(',').map((field) => field.trim());
    return { name: name ?? '', id: id ?? '', password: password ?? '' };
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/guest-accounts/csv.test.ts`
Expected: PASS (7건).

- [ ] **Step 5: 커밋**

```bash
git add src/guest-accounts/csv.ts src/guest-accounts/csv.test.ts
git commit -m "feat(guest-accounts): CSV 파싱과 이름 조회 로직 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `command.ts` — 응답 문구 생성 (순수) + 커맨드 정의

**Files:**
- Create: `src/guest-accounts/command.ts`
- Test: `src/guest-accounts/command.test.ts`

**Interfaces:**
- Consumes: `parseAccountsCsv`, `lookupByName` (Task 2).
- Produces:
  - `buildAccountReply(csvText: string | null, name: string): string`
  - `myAccountCommandData: ApplicationCommandDataResolvable` (name `내계정`, 옵션 `이름` 필수 문자열)
  - Task 4가 `buildAccountReply`를, Task 5가 `myAccountCommandData`를 소비.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/guest-accounts/command.test.ts` 생성:

```ts
import { describe, expect, test } from 'vitest';
import { buildAccountReply } from './command.js';

const CSV = `name,id,password
조부용,guest-01,ab12cd34
홍길동,guest-02,ef56gh78
홍길동,guest-03,zz99zz99`;

describe('buildAccountReply', () => {
  test('returns not-ready message when csv text is null', () => {
    expect(buildAccountReply(null, '조부용')).toContain('준비되지 않았');
  });

  test('returns id and password for a found account', () => {
    const reply = buildAccountReply(CSV, '조부용');
    expect(reply).toContain('guest-01');
    expect(reply).toContain('ab12cd34');
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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- src/guest-accounts/command.test.ts`
Expected: FAIL — `Cannot find module './command.js'`.

- [ ] **Step 3: 최소 구현 작성**

`src/guest-accounts/command.ts` 생성:

```ts
import { ApplicationCommandOptionType, type ApplicationCommandDataResolvable } from 'discord.js';
import { lookupByName, parseAccountsCsv } from './csv.js';

export const myAccountCommandData: ApplicationCommandDataResolvable = {
  name: '내계정',
  description: '배정된 네트워크 계정을 확인합니다',
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
      return `**id**: \`${result.account.id}\`\n**password**: \`${result.account.password}\``;
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/guest-accounts/command.test.ts`
Expected: PASS (4건).

- [ ] **Step 5: 커밋**

```bash
git add src/guest-accounts/command.ts src/guest-accounts/command.test.ts
git commit -m "feat(guest-accounts): 계정 조회 응답 문구와 커맨드 정의 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: `command.ts` — Discord 핸들러 팩토리 (fs 읽기 + ephemeral 응답)

**Files:**
- Modify: `src/guest-accounts/command.ts`
- Test: `src/guest-accounts/command.test.ts`

**Interfaces:**
- Consumes: `buildAccountReply` (Task 3), `EventHandler` (기존 `src/discord/event-handler.ts`).
- Produces: `createMyAccountHandler(csvPath: string): EventHandler<'interactionCreate'>` — Task 5가 소비.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/guest-accounts/command.test.ts` 상단 import 아래에 fs 목과 테스트 추가.

파일 최상단(첫 import 위)에 목 선언:

```ts
import { vi } from 'vitest';

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }));
```

기존 `import { buildAccountReply } from './command.js';` 를 다음으로 교체:

```ts
import { readFile } from 'node:fs/promises';
import type { ChatInputCommandInteraction, Interaction } from 'discord.js';
import { buildAccountReply, createMyAccountHandler } from './command.js';
```

파일 하단에 핸들러 테스트 추가:

```ts
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
    expect(arg.content).toContain('guest-01');
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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- src/guest-accounts/command.test.ts`
Expected: FAIL — `createMyAccountHandler`가 export되지 않음.

- [ ] **Step 3: 최소 구현 작성**

`src/guest-accounts/command.ts`의 import 블록을 교체:

```ts
import { readFile } from 'node:fs/promises';
import {
  ApplicationCommandOptionType,
  type ApplicationCommandDataResolvable,
  type Interaction,
  MessageFlags,
} from 'discord.js';
import type { EventHandler } from '../discord/event-handler.js';
import { lookupByName, parseAccountsCsv } from './csv.js';
```

파일 하단에 추가:

```ts
async function readCsv(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

export function createMyAccountHandler(csvPath: string): EventHandler<'interactionCreate'> {
  return {
    event: 'interactionCreate',
    handle: async (interaction: Interaction): Promise<void> => {
      if (!interaction.isChatInputCommand() || interaction.commandName !== '내계정') {
        return;
      }
      const name = interaction.options.getString('이름', true);
      const content = buildAccountReply(await readCsv(csvPath), name);
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    },
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/guest-accounts/command.test.ts`
Expected: PASS (7건: buildAccountReply 4 + createMyAccountHandler 3).

- [ ] **Step 5: 타입·린트 확인 후 커밋**

Run: `npm run typecheck && npm run lint`
Expected: 오류 없음.

```bash
git add src/guest-accounts/command.ts src/guest-accounts/command.test.ts
git commit -m "feat(guest-accounts): interactionCreate 핸들러 팩토리 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: `index.ts` 배선 + 커맨드 등록 + `.gitignore` + 예시 CSV

**Files:**
- Modify: `src/index.ts`
- Modify: `.gitignore`
- Create: `data/accounts.example.csv`
- Test: 없음 (부트스트랩 배선 — build/typecheck + 수동 스모크로 검증)

**Interfaces:**
- Consumes: `createMyAccountHandler`, `myAccountCommandData` (Task 3~4), `loadConfig` (Task 1), 기존 `registerEventHandlers`/`createClient`/`loginAndAwaitReady`.
- Produces: 없음 (엔트리포인트).

- [ ] **Step 1: 예시 CSV 생성 (가짜 값)**

`data/accounts.example.csv` 생성:

```csv
name,id,password
홍길동,guest-01,changeme01
김초록,guest-02,changeme02
```

- [ ] **Step 2: `.gitignore`에 실데이터 제외 규칙 추가**

`.gitignore`의 `.env.local` 줄 다음에 추가:

```gitignore

# 게스트 계정 CSV (평문 비밀번호 — 커밋 금지, 예시 파일만 허용)
data/*.csv
!data/*.example.csv
```

- [ ] **Step 3: `index.ts` 배선**

`src/index.ts` 전체를 다음으로 교체:

```ts
import { loadConfig } from './config/index.js';
import { createClient, loginAndAwaitReady } from './discord/client.js';
import { registerEventHandlers } from './discord/event-handler.js';
import { DISCORD_INTENTS } from './discord/intents.js';
import { createMyAccountHandler, myAccountCommandData } from './guest-accounts/command.js';

(async (): Promise<void> => {
  const config = loadConfig();
  const client = createClient(DISCORD_INTENTS);
  registerEventHandlers(client, [createMyAccountHandler(config.GUEST_ACCOUNTS_CSV_PATH)]);
  await loginAndAwaitReady(client, config.DISCORD_BOT_TOKEN);

  // 커맨드는 ready 이후 guild scope로 등록해야 즉시 반영된다 (Java 레거시와 동일 스코프).
  const guild = await client.guilds.fetch(config.DISCORD_GUILD_ID);
  await guild.commands.set([myAccountCommandData]);

  console.log('[cho-log discord bot] running');
})().catch((err: unknown) => {
  console.error('[cho-log discord bot] bootstrap failed', err);
  process.exit(1);
});
```

- [ ] **Step 4: 빌드·타입·린트·테스트 전체 확인**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: 전부 오류 없이 통과.

- [ ] **Step 5: 수동 스모크 테스트 (선택, 봇 토큰 필요)**

로컬 `.env`에 유효한 `DISCORD_BOT_TOKEN`/`DISCORD_GUILD_ID` 설정 후:

```bash
cp data/accounts.example.csv data/accounts.csv
npm run dev
```

Discord 서버에서 `/내계정 이름:홍길동` 실행 → 본인만 보이는 메시지로 `guest-01` / `changeme01` 응답 확인. `/내계정 이름:없는사람` → "찾지 못" 응답. `rm data/accounts.csv` 후 재실행 → "준비되지 않았" 응답.

- [ ] **Step 6: 커밋**

```bash
git add src/index.ts .gitignore data/accounts.example.csv
git commit -m "feat(guest-accounts): 봇에 /내계정 커맨드 배선 및 등록

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: 운영 문서 갱신

**Files:**
- Modify: `CLAUDE.md`
- Test: 없음 (문서)

**Interfaces:**
- Consumes: 없음.
- Produces: 없음.

- [ ] **Step 1: CLAUDE.md에 커맨드와 운영 수칙 기록**

`CLAUDE.md`의 `## Operations` 섹션 끝에 하위 절 추가:

```markdown
### 5. 게스트 계정 CSV 운영 (`/내계정` 커맨드)

행사 참가자가 `/내계정 이름:홍길동`으로 배정된 네트워크 계정(id/password)을
본인만 보이는(ephemeral) 메시지로 확인한다. 데이터는 하루 행사용 휘발성 값이다.

- CSV 경로는 env `GUEST_ACCOUNTS_CSV_PATH` (기본값 `data/accounts.csv`).
- 형식은 `data/accounts.example.csv` 참고 (`name,id,password` 헤더).
- **행사 전**: CSV를 경로에 업로드 후 `chmod 600`. 이름 중복(동명이인) 없는지 확인.
- **행사 후**: `rm <csv>` 으로 즉시 삭제 → 조회가 자동 차단된다(fail-closed).
- 실데이터 CSV는 `.gitignore`로 커밋이 차단되어 있다. 절대 커밋하지 말 것.
```

- [ ] **Step 2: 커밋**

```bash
git add CLAUDE.md
git commit -m "docs: /내계정 커맨드 운영 수칙 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- 이름 입력 조회 → Task 2 (`lookupByName`) + Task 4 (옵션 `이름` 획득). ✅
- Ephemeral 응답 → Task 4 (`MessageFlags.Ephemeral`). ✅
- EC2 파일 + env 경로 → Task 1 (`GUEST_ACCOUNTS_CSV_PATH`) + Task 5 (fetch/set). ✅
- 요청 시마다 읽기 (fail-closed) → Task 4 (`readCsv` 매 호출) + Task 5 스모크. ✅
- guild scope 등록 → Task 5. ✅
- 동명이인 방어 → Task 2 (`ambiguous`) + Task 3 (문구). ✅
- 엣지케이스(파일없음/못찾음/동명이인/정상/예외) → Task 3~4. 핸들러 예외는 `index.ts`의 IIFE catch가 부트스트랩 실패만 잡고, 커맨드 런타임 예외는 discord.js가 "응답 실패"로 처리 — 스펙의 "핸들러 예외" 행은 커맨드 내부에서 throw 가능 지점이 fs(이미 try/catch)와 `getString`(옵션 필수라 안전)뿐이라 추가 catch 불필요. ✅
- git 커밋 금지 + .gitignore → Task 5. ✅
- 테스트 전략 → Task 2~4 vitest. ✅

**Placeholder scan:** TBD/TODO/"적절히 처리" 없음. 모든 코드 스텝에 실제 코드 포함. ✅

**Type consistency:** `GuestAccount`/`LookupResult`/`parseAccountsCsv`/`lookupByName`(Task 2) ↔ `buildAccountReply`(Task 3) ↔ `createMyAccountHandler`(Task 4) ↔ `myAccountCommandData`/handler(Task 5) 시그니처 일치. `EventHandler<'interactionCreate'>`는 기존 `src/discord/event-handler.ts` 정의를 그대로 사용. ✅
