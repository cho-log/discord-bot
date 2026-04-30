# Discord Bot — cho-log

## Project Overview

cho-log 조직의 Discord 봇. 초록 교육 운영을 지원한다.
GitHub PR 머지 알림과 슬래시 커맨드를 제공한다.

> **마이그레이션 진행 중 (v1)**: Java/Spring Boot → TypeScript/Node.js. 
> #5에서 봇 부트스트랩 골격(client + intents + event-handler + config)이 이식되었으며,
> #6~#8에서 슬래시 커맨드와 GitHub PR 머지 알림이 추가된다.
> 포팅 완료 시 `src/main/java/**`는 자연 제거된다.

## Tech Stack

| 항목 | 버전/도구 |
|------|-----------|
| Language | TypeScript 5.9 |
| Runtime | Node.js 22+ (ESM, `module=Node16`) |
| Discord | discord.js ^14.26 |
| Validation | Zod ^4.4 (env config schema) |
| Test | Vitest 4 |
| Lint | ESLint 9 (flat config) + typescript-eslint 8 |
| Format | Prettier 3 |
| Dev | tsx |
| Build | npm |
| Deploy | GitHub Actions → S3 → AWS CodeDeploy → PM2 |

## Build & Test Commands

```bash
npm install              # 의존성 설치
npm run build            # TypeScript 컴파일 (dist/)
npm run dev              # tsx로 src/index.ts 실행
npm start                # dist/index.js 실행
npm test                 # Vitest 테스트
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm run format           # Prettier 적용
```

## Directory Structure

```
src/
├── index.ts                       # 엔트리포인트 (async IIFE 부트스트랩)
├── config/
│   ├── schema.ts                  # Zod 환경변수 스키마
│   ├── index.ts                   # loadConfig — process.env 검증·로드
│   └── index.test.ts
└── discord/
    ├── intents.ts                 # Gateway Intents (JDA EnumSet 매핑)
    ├── client.ts                  # createClient + loginAndAwaitReady
    ├── event-handler.ts           # EventHandler<E> + 등록 함수
    └── *.test.ts

# 마이그레이션 진행 중 Java 소스가 보존됨 (#6~#8 완료 시 제거 예정):
# src/main/java/cholog/    — 기존 Spring Boot 봇 코드
# src/main/resources/      — application.yml, logback-spring.xml
```

후속 이슈에서 추가될 디렉토리:

```
src/
├── discord/commands/    # 슬래시 커맨드 (#6)
└── github/              # GitHub API 클라이언트 (#7~#8)
```

## Configuration

환경변수는 `.env` 파일에서 로드된다. 배포 시 `secrets.DOTENV` GitHub secret이 `.env`로 풀려 zip에 포함되며, EC2에서 `pm2 start --node-args="--env-file=..."`로 Node 22 native 플래그를 사용해 로드한다.

로컬 개발: `.env.local` 또는 `.env` 사용 (`.gitignore`에 등록되어 있음).

## Coding Conventions

- 패키지: 기능 도메인 기준 (`discord/`, `github/`, `config/`)
- 파일: kebab-case 또는 camelCase (역할 명시: `slash-command-registry.ts`)
- 타입: PascalCase (`type SlashCommand = { ... }`)
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 불변성 우선 (객체 mutate 금지, 새 객체 반환)
- type alias 우선 (interface 대신, ESLint rule로 강제)

## Development Pipeline

이슈 기반 개발. GitHub Projects 보드에서 상태 관리.

| 라벨 | 용도 |
|------|------|
| `feature` | 새 기능 |
| `bug` | 버그 수정 |
| `infra` | CI/CD, 환경 설정 |
| `migration` | TypeScript 마이그레이션 |
| `refactor` | 리팩터링 |
| `claude-action` | Claude Code Action 자동화 대상 |

브랜치: `feat/{issue-number}-{slug}`, `fix/{issue-number}-{slug}`
커밋: Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `ci:`)

## CI/CD

- **CI** (`.github/workflows/ci.yml`): main push 및 PR — `npm ci → format:check → lint → typecheck → build → test`
- **Deploy** (`.github/workflows/deploy.yml`): `v[1-9]*` 태그 push만 트리거 (v0.x placeholder 보호 게이트)
  - `secrets.DOTENV` 빈 값/공백만이면 첫 단계에서 `exit 1`
  - `aws deploy wait deployment-successful`로 배포 결과를 workflow에 동기화
  - 첫 v1.0.0 배포는 #5~#8 마이그레이션 완료 후

## Operations

마이그레이션 #3 머지 후 운영자가 수행할 1회성 작업:

### 1. GitHub Secret 등록

저장소 Settings → Secrets and variables → Actions에서 `DOTENV` secret 추가.
값은 `.env.example` 형식의 multiline string. `APPLICATION_YML` secret은 #5~#8 완료 후 제거.

### 2. EC2 환경 갱신 (Node 22)

기존 EC2는 Node 20 + JDK 21. 첫 v1.x.x 배포 전 운영자가 직접 실행:

```bash
# Node 22 업그레이드 (기존 Node 20 위에 덮어씀)
bash /home/ubuntu/.../scripts/ubuntu/install-pm2.sh

# (선택) JDK 정리는 마이그레이션 완전 종료 후
# sudo apt-get remove --purge openjdk-21-* 등은 첫 v1.x.x 안정화 후 진행
```

### 3. 첫 v1.x.x 배포 시 운영 경로 정리

배포 destination이 `/home/ubuntu/discord-bot.jar`(파일) → `/home/ubuntu/discord-bot/`(디렉토리)로 변경됨:

- 첫 v1.x.x 배포 후 EC2의 잔존 파일 정리:
  ```bash
  sudo rm -f /home/ubuntu/discord-bot.jar
  ```
- pm2가 새 Node 프로세스로 자동 교체 (`pm2 delete discord-bot && pm2 start dist/index.js`)
- Discord Gateway 재연결에 약 3-6초 다운타임 발생

### 4. 배포 보안

- S3 업로드 시 `--sse AES256` (server-side encryption)
- `.env`는 zip 패키지에 포함되지만 GitHub Actions runner에서는 즉시 삭제
- EC2 배치 후 `chmod 600 /home/ubuntu/discord-bot/.env` (deploy.sh가 자동 처리)
- 추후 강화 옵션: AWS Secrets Manager 또는 SSM Parameter Store로 전환 (별 이슈)

## Milestones

- **v0 — 환경 셋팅**: 프로젝트 보드, 이슈 템플릿, CLAUDE.md, CI/CD, TypeScript 초기화 (#3)
- **v1 — TypeScript 마이그레이션**: 기존 봇 기능 포팅 (#5~#9)
