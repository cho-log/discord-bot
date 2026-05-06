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

| 트리거 | 동작 | environment |
|--------|------|-------------|
| PR → main | `ci.yml`: format:check → lint → typecheck → build → test | (없음) |
| main push | `ci.yml` + `deploy.yml` 독립 동시 실행 | `dev` (deploy) |
| `v[1-9]*` 태그 push | `deploy.yml` (v0.x는 placeholder 보호 게이트) | `prod` |

- **CI** (`.github/workflows/ci.yml`): main push 및 PR — `npm ci → format:check → lint → typecheck → build → test`
- **Deploy** (`.github/workflows/deploy.yml`):
  - main push → dev environment 자동 배포 (검증 게이트). prod 배포 전 실제 봇 동작 확인.
  - `v[1-9]*` 태그 push → prod environment 배포. **prod environment의 required reviewer 승인 후 진행**.
  - `environment` / `concurrency.group` / `env.ENV`를 ref 기반 동적 결정 (tags면 prod, 아니면 dev).
  - GitHub Environments(dev/prod)에 등록한 secret이 자동 우선 lookup되어 환경별 다른 값 사용.
  - S3 패키지 키는 `deployment-package-{env}.zip`으로 분리 (dev/prod race 방지).
  - `appspec.yml` destination은 dev 배포 시 workflow가 sed로 `/home/ubuntu/discord-bot-dev`로 치환 (grep fail-fast).
  - `aws deploy wait deployment-successful`로 배포 결과를 workflow에 동기화.
  - main push 시 ci.yml과 deploy.yml은 **독립 동시 실행**. deploy.yml이 자체 build를 수행하므로 CI 의존성은 없으나, 두 워크플로우 결과는 따로 평가된다.

### 합의 사항

- **dev 환경은 깨져도 OK** — main 머지마다 자동 재기동되므로 빠른 feedback의 대가로 dev 안정성은 보장하지 않는다.
- **dev/prod 봇 토큰 별도** — Discord Gateway 1세션 제약 (같은 토큰 두 곳에서 로그인 시 한쪽 강제 disconnect).

## Operations

운영자 1회성 작업. 아래 사전 준비(1~4)를 모두 완료한 후 첫 main push를 트리거한다. 사후 정리(5)는 첫 v1.x.x prod 배포 후에만 실행한다.

## 사전 준비 (첫 main push 전 필수)

### 1. Discord Developer Portal — dev 봇 앱 생성

prod 봇과 별도의 dev 봇 애플리케이션을 만든다 (Discord Gateway는 한 토큰을 두 곳에서 동시에 사용할 수 없음 — 양쪽이 켜져 있으면 한쪽이 강제 disconnect 된다).

- prod 봇 토큰: 기존 토큰 그대로
- dev 봇 토큰: 신규 발급 → 아래 GitHub Environments `dev`의 `DOTENV`에 사용

### 2. GitHub Environments 설정

저장소 Settings → Environments에서 `dev`, `prod` 두 environment를 생성한다.

**각 environment에 secret 등록** (동일 키, 환경별 다른 값). `DOTENV` 값은 [`.env.example`](.env.example) 형식의 multiline string으로, 모든 필수 키를 채워서 등록한다 (`create-dotenv` action 에러 메시지에 `.env.example` 참조 안내가 포함됨):

| Secret | dev 예시 | prod 예시 |
|--------|---------|----------|
| `DOTENV` | dev `.env` 전체 (dev 봇 토큰 포함) | prod `.env` 전체 (prod 봇 토큰) |
| `APPLICATION_NAME` | `discord-bot` (단일 CodeDeploy Application 아래 두 deployment group 운영 권장) | `discord-bot` |
| `DEPLOYMENT_GROUP_NAME` | `discord-bot-dev` (반드시 `-dev`로 끝나야 함) | `discord-bot` 또는 `discord-bot-prod` (절대 `-dev`로 끝나면 안 됨) |
| `S3_BUCKET_NAME` | dev 버킷 또는 동일 버킷 (키는 `deployment-package-dev.zip`으로 자동 분리됨) | prod 버킷 |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | dev IAM user 또는 prod와 동일 | prod IAM user |

> **중요 ①**: `dev` environment는 생성과 동시에 `DOTENV`를 등록한다. `DOTENV`가 비어 있으면 `create-dotenv` action이 `exit 1`로 차단하므로, secret 미등록 상태에서는 매 main push마다 deploy가 실패한다.

> **중요 ② — DEPLOYMENT_GROUP_NAME 컨벤션**: `scripts/deploy.sh`는 `DEPLOYMENT_GROUP_NAME` suffix(`-dev`)로 dev/prod를 분기한다. **prod 그룹명에 `-dev`가 포함되면 prod 봇이 dev 디렉토리에 배포되어 운영 봇이 망가진다.** prod 그룹명은 절대 `-dev`로 끝나면 안 된다.

**prod manual approval** — prod environment에 `Required reviewers` 1명(운영자)을 설정한다. 잘못된 태그 push에 대한 안전망이다.

### 3. CodeDeploy — dev deployment group 추가

기존 prod deployment group과 별도로 `-dev` suffix를 가진 deployment group을 만든다 (예: `discord-bot-dev`).

- 단일 EC2 + PM2 인스턴스 2개 시나리오에서는 dev/prod 두 group을 같은 EC2 tag에 매칭
- 추후 EC2 2대 분리 시: deployment group의 EC2 tag만 교체하면 workflow / `scripts/deploy.sh` / `appspec.yml` 변경 없음
- 두 group이 같은 CodeDeploy Application 아래 있으면 IAM/배포 설정 일관성 유지가 쉬움

### 4. EC2 환경

**Node 22 업그레이드** (Java/Spring Boot에서 마이그레이션 중인 EC2 한정).

첫 main push 전이라 `/home/ubuntu/discord-bot/scripts/` 경로가 아직 없을 수 있으므로, 저장소에서 직접 스크립트를 받아 실행한다:

```bash
curl -fsSL https://raw.githubusercontent.com/cho-log/discord-bot/main/scripts/ubuntu/install-pm2.sh -o /tmp/install-pm2.sh
bash /tmp/install-pm2.sh
rm -f /tmp/install-pm2.sh
```

배포 후라면 EC2 내 경로 사용 가능: `bash /home/ubuntu/discord-bot/scripts/ubuntu/install-pm2.sh`.

**dev 디렉토리 생성** — 첫 main push 전 반드시 완료. CodeDeploy AfterInstall hook의 `cd "${DEPLOY_DIR}"`가 디렉토리 부재 시 실패한다.

```bash
sudo mkdir -p /home/ubuntu/discord-bot-dev
sudo chown ubuntu:ubuntu /home/ubuntu/discord-bot-dev
```

prod 디렉토리(`/home/ubuntu/discord-bot`)는 기존 그대로 유지.

## 첫 v1.x.x 배포 후 정리

### 5. 운영 경로 정리

배포 destination이 `/home/ubuntu/discord-bot.jar`(파일) → `/home/ubuntu/discord-bot/`(디렉토리)로 변경됨:

- 첫 v1.x.x 배포 후 EC2의 잔존 파일 정리:
  ```bash
  sudo rm -f /home/ubuntu/discord-bot.jar
  ```
- pm2가 새 Node 프로세스로 자동 교체 (`pm2 delete discord-bot && pm2 start dist/index.js`)
- Discord Gateway 재연결에 약 3-6초 다운타임 발생
- (선택) JDK 정리는 첫 v1.x.x 안정화 후: `sudo apt-get remove --purge openjdk-21-*`

## 배포 보안 (상시)

- S3 업로드 시 `--sse AES256` (server-side encryption)
- `.env`는 zip 패키지에 포함되지만 GitHub Actions runner에서는 즉시 삭제
- EC2 배치 후 `chmod 600 /home/ubuntu/{discord-bot,discord-bot-dev}/.env` (deploy.sh가 자동 처리)
- 추후 강화 옵션: AWS Secrets Manager 또는 SSM Parameter Store로 전환 (별 이슈)

## Milestones

- **v0 — 환경 셋팅**: 프로젝트 보드, 이슈 템플릿, CLAUDE.md, CI/CD, TypeScript 초기화 (#3)
- **v1 — TypeScript 마이그레이션**: 기존 봇 기능 포팅 (#5~#9)
