# Discord Bot — cho-log

## Project Overview

cho-log 조직의 Discord 봇. 초록 교육 운영을 지원한다.
GitHub PR 머지 알림과 슬래시 커맨드를 제공한다.

> **마이그레이션 진행 중 (v1)**: Java/Spring Boot → TypeScript/Node.js. 
> 본 파일은 새 스택 기준으로 갱신되었으며, 봇 기능 코드는 #5~#8에서 포팅 후 이식된다.
> 포팅 완료 시 `src/main/java/**`는 자연 제거된다.

## Tech Stack

| 항목 | 버전/도구 |
|------|-----------|
| Language | TypeScript 5.9 |
| Runtime | Node.js 22+ (ESM, `module=Node16`) |
| Discord | discord.js (예정, #5에서 도입) |
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
└── index.ts             # 엔트리포인트 (placeholder)
src/index.test.ts        # smoke test

# 마이그레이션 진행 중에는 Java 소스가 보존됨 (#5~#8에서 자연 제거):
# src/main/java/cholog/    — 기존 Spring Boot 봇 코드
# src/main/resources/      — application.yml, logback-spring.xml
```

신규 봇 기능은 후속 이슈에서 다음 구조로 추가 예정:

```
src/
├── index.ts             # 엔트리포인트
├── discord/             # discord.js 클라이언트, 커맨드, 이벤트
├── github/              # GitHub API 클라이언트
└── config/              # 환경변수 로딩, 설정 스키마
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

- **CI** (`.github/workflows/ci.yml`): main push 및 PR — `npm ci → lint → typecheck → build → test`
- **Deploy** (`.github/workflows/deploy.yml`): `v[1-9]*` 태그 push만 트리거 (v0.x placeholder 보호 게이트)
  - `secrets.DOTENV` 빈 값이면 첫 단계에서 `exit 1`
  - 첫 v1.0.0 배포는 #5~#8 마이그레이션 완료 후

## Milestones

- **v0 — 환경 셋팅**: 프로젝트 보드, 이슈 템플릿, CLAUDE.md, CI/CD, TypeScript 초기화 (#3)
- **v1 — TypeScript 마이그레이션**: 기존 봇 기능 포팅 (#5~#9)
