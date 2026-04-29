# Discord Bot — cho-log

## Project Overview

cho-log 조직의 Discord 봇. 초록 교육 운영을 지원한다.
GitHub PR 머지 알림과 슬래시 커맨드를 제공한다.

## Tech Stack

| 항목 | 버전/도구 |
|------|-----------|
| Language | Java 21 (Corretto) |
| Framework | Spring Boot 3.3.1 |
| Discord | JDA 5.0.0-beta.24 |
| HTTP Client | Spring Cloud OpenFeign |
| Build | Gradle (Groovy DSL) |
| Deploy | GitHub Actions → S3 → AWS CodeDeploy → PM2 |

## Build & Test Commands

```bash
./gradlew build          # 빌드 + 테스트
./gradlew test           # 테스트만
./gradlew bootJar        # 실행 가능 JAR 생성
```

## Directory Structure

```
src/main/java/cholog/
├── Application.java                    # 엔트리포인트
├── discord/
│   ├── JdaConfiguration.java           # JDA 빈 설정 (intents, guild)
│   ├── JdaProperties.java              # Discord 토큰, guild-id
│   ├── command/
│   │   ├── SlashCommand.java           # 슬래시 커맨드 인터페이스
│   │   ├── SlashCommandRegistry.java   # 커맨드 등록
│   │   ├── SlashCommandListenerMapper.java   # 슬래시 커맨드 리스너 매핑
│   │   └── PingPongCommand.java        # /ping 커맨드
│   └── message/
│       ├── MessageSubscription.java    # 메시지 구독 인터페이스
│       ├── GithubPullRequestMergeMessage.java
│       ├── GithubPullRequestMergeSubscription.java
│       ├── MergeSubscriptionMapper.java
│       ├── MessagesConfiguration.java
│       └── MessagesProperties.java
└── github/
    ├── GithubApi.java                  # Feign 클라이언트
    ├── GithubApiConfiguration.java
    ├── GithubProperties.java
    ├── PullRequest.java
    ├── PullRequestUrl.java
    ├── PullRequestMergeRequest.java
    └── PullRequestMergeResult.java
```

## Key Patterns

- **SlashCommand 인터페이스**: 새 슬래시 커맨드는 `SlashCommand`를 구현하면 자동 등록된다.
- **MessageSubscription 인터페이스**: 메시지 기반 구독도 인터페이스 구현으로 확장한다.
- **Spring Configuration**: `@Configuration` + `@EnableConfigurationProperties`로 설정을 바인딩한다.
- **Feign Client**: GitHub API 호출은 `GithubApi` 인터페이스에 선언적으로 정의한다.

## Configuration

`application.yml`의 주요 설정:

```yaml
cholog:
  github:
    token:             # GitHub API 토큰
    api-version:       # GitHub API 버전
  jda:
    token:             # Discord 봇 토큰
    guild-id:          # 대상 서버 ID
    subscriptions:
      pr-merge:
        channel-id:    # PR 머지 알림 채널
        allow-organizations:   # 허용 조직 목록
        allow-repositories:    # 허용 레포 목록
        disallow-branches:     # 제외 브랜치 (main, master)
```

민감 정보(토큰 등)는 CI에서 `secrets.APPLICATION_YML`로 주입된다.

## Coding Conventions

- 패키지: 기능 도메인 기준 (`discord.command`, `discord.message`, `github`)
- 클래스: 역할을 명확히 드러내는 이름 (`GithubPullRequestMergeSubscription`)
- 설정: `*Properties` (값 바인딩) + `*Configuration` (빈 구성) 분리
- 접근 제한: 외부 노출 대상(`Application` 엔트리포인트, `*Properties`/`*Configuration` Spring binding, 도메인 record, 확장 인터페이스)만 `public`, 그 외 구현체는 `package-private`
- final 파라미터: 메서드 파라미터에 `final` 사용

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
커밋: Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`)

## Milestones

- **v0 — 환경 셋팅**: 프로젝트 보드, 이슈 템플릿, CLAUDE.md, CI/CD
- **v1 — TypeScript 마이그레이션**: Java → TypeScript 전환
