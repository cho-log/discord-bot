# 게스트/네트워크 계정 조회 슬래시 커맨드 — 설계

- 날짜: 2026-07-10
- 상태: 승인됨 (구현 대기)
- 브랜치: `feat/guest-account-lookup`

## 목적

초록 교육 **하루짜리 행사**에서, 참가자가 Discord 슬래시 커맨드로 **본인 이름을 입력하면
배정된 네트워크(게스트) 계정의 id/password를 즉시 확인**할 수 있게 한다.

행사 당일에만 쓰이는 **휘발성 데이터**이며, 종료 후 계정 정보는 폐기된다.

## 범위

- **포함**: `/내계정` 슬래시 커맨드 하나. CSV에서 이름으로 계정 조회, 본인만 보이는(ephemeral) 응답.
- **불포함**: 슬래시 커맨드 프레임워크(#6의 SlashCommand 인터페이스/Registry/Router).
  커맨드가 이 하나뿐이므로 프레임워크 없이 **최소 구현**한다. 커맨드가 늘어나면 그때 #6을 도입한다.
- **불포함**: Discord 유저 ↔ 계정 매핑, 인증/권한 체크.

## 결정 사항 (brainstorming 결과)

| 항목 | 결정 | 이유 |
|------|------|------|
| 조회 키 | 사용자가 입력한 **이름**(완전일치, 앞뒤 trim) | 운영자가 가진 데이터가 `이름 → 계정`뿐. Discord 매핑은 번거로워 제외 |
| 응답 방식 | **Ephemeral**(본인만 보임) | 비밀번호가 채널·DM 어디에도 안 남음. 노출 최소화 |
| 데이터 위치 | **EC2 디스크 파일**, 경로는 env `GUEST_ACCOUNTS_CSV_PATH` | git·secret·재배포 없이 운영자가 파일만 교체/삭제. 평문 비번이 저장소·S3에 안 남음 |
| 로딩 시점 | **요청 시마다 파일 읽기** (startup 1회 로드 아님) | 파일 교체·삭제가 재시작 없이 즉시 반영. 행사 후 `rm` 하면 조회 자동 차단(fail-closed) |
| 커맨드 등록 | **guild scope** (`guild.commands.set`) | Java 레거시와 동일. 즉시 반영 |
| 동명이인 | 운영자가 CSV에서 사전 정리(유일성 보장). 코드엔 방어 가드만 | 엉뚱한 사람 비번 노출 방지 |

## 아키텍처

### 파일 구조

```
src/
├── guest-accounts/
│   ├── csv.ts            # CSV 파싱 + 이름 조회 (순수 함수, 테스트 대상)
│   ├── csv.test.ts
│   ├── command.ts        # 커맨드 정의 + 실행 핸들러
│   └── command.test.ts
├── config/
│   └── schema.ts         # (수정) GUEST_ACCOUNTS_CSV_PATH 추가
└── index.ts              # (수정) ready 후 커맨드 등록 + interactionCreate 핸들러 연결
```

### 컴포넌트

**`csv.ts` — 데이터 계층 (순수, I/O 없음)**
- `type GuestAccount = { name: string; id: string; password: string }`
- `parseAccountsCsv(text: string): GuestAccount[]`
  - 첫 줄은 헤더(`name,id,password`). 이후 각 줄을 레코드로.
  - 빈 줄 무시. 각 필드 trim.
  - **전제**: 필드 안에 쉼표 없음 → 단순 `split(',')` (제로 의존성).
    비번에 쉼표가 필요해지면 그때 `csv-parse` 도입 (YAGNI).
- `lookupByName(accounts: GuestAccount[], name: string): LookupResult`
  - 입력 이름 trim 후 완전일치.
  - 반환: `{ kind: 'found', account }` | `{ kind: 'not-found' }` | `{ kind: 'ambiguous' }`(동명이인 방어).

**`command.ts` — 커맨드 계층 (I/O + Discord)**
- 커맨드 정의: name `내계정`, 필수 string 옵션 `이름`.
- 실행 핸들러 `handleMyAccount(interaction)`:
  1. `이름` 옵션 값 획득.
  2. `GUEST_ACCOUNTS_CSV_PATH` 파일 읽기. 없거나 읽기 실패 → 준비안됨 응답.
  3. `parseAccountsCsv` → `lookupByName`.
  4. 결과별 ephemeral 응답.
- 응답은 항상 `{ ephemeral: true }` (deferReply 없이 3초 내 즉시 reply; 파일 작음).

**`index.ts` — 배선**
- 기존: `registerEventHandlers(client, [])` → `loginAndAwaitReady`.
- 추가:
  - `interactionCreate` 핸들러를 핸들러 배열에 포함(`isChatInputCommand()` && `commandName==='내계정'` 가드 후 `handleMyAccount` 호출).
  - `loginAndAwaitReady` resolve 후 `client.guilds.fetch(config.DISCORD_GUILD_ID)` → `guild.commands.set([커맨드 정의])`.

### 데이터 흐름

```
/내계정 이름:조부용
  → interactionCreate 이벤트
  → isChatInputCommand & name==='내계정' 가드
  → handleMyAccount
      → readFile(GUEST_ACCOUNTS_CSV_PATH)
      → parseAccountsCsv → lookupByName('조부용')
      → interaction.reply({ ephemeral: true, content: ... })
```

## 에러 / 엣지 케이스 (모두 ephemeral)

| 상황 | 응답 문구(예시) |
|------|-----------------|
| 파일 없음 / 읽기 실패 | "계정 정보가 아직 준비되지 않았어요. 운영자에게 문의하세요." |
| 이름 못 찾음 (`not-found`) | "'{이름}'으로 등록된 계정을 찾지 못했어요. 이름을 확인해 주세요." |
| 동명이인 (`ambiguous`) | "동명이인이 있어 확인이 어렵습니다. 운영자에게 문의하세요." |
| 정상 (`found`) | "**id**: `{id}`\n**password**: `{password}`" (코드블록으로 복사 편의) |
| 핸들러 예외 | catch 후 ephemeral 일반 오류 메시지, 콘솔 error 로그 |

## 설정 변경

`src/config/schema.ts`에 추가:
```ts
GUEST_ACCOUNTS_CSV_PATH: z.string().trim().min(1).default('data/accounts.csv'),
```
`loadConfig`의 파싱 객체에도 `GUEST_ACCOUNTS_CSV_PATH: env['GUEST_ACCOUNTS_CSV_PATH']` 추가.

## 보안 / 운영

- CSV는 **절대 git 커밋 금지**. `.gitignore`에 `data/accounts.csv`(또는 `data/*.csv`) 추가.
- 운영 수칙(README/CLAUDE.md 운영 섹션에 1줄):
  - 행사 전: CSV를 EC2 경로에 업로드 후 `chmod 600`.
  - 행사 후: `rm` 으로 즉시 삭제 → 조회 자동 차단.
- 테스트 픽스처의 계정/비번은 전부 **가짜 값**만 사용.

## 테스트 전략 (vitest)

- `csv.test.ts`:
  - 정상 파싱(헤더 스킵, 여러 행, 공백 trim, 빈 줄 무시).
  - `lookupByName`: found / not-found / ambiguous(동명이인) / 앞뒤공백 입력.
- `command.test.ts`:
  - 핸들러 로직을 `csv.ts` 함수로 최대한 분리하고, Discord `interaction`은 최소 목(mock)으로
    각 분기(파일없음/found/not-found/ambiguous)에서 올바른 ephemeral 응답을 호출하는지 검증.

## 완료 기준

- `npm run lint`, `npm run typecheck`, `npm test` 통과.
- 로컬에서 가짜 CSV로 `/내계정` 실행 시 found/not-found/파일없음 응답이 의도대로 동작.
