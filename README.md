# cho-log Discord Bot

cho-log 조직의 Discord 봇. GitHub PR 머지 알림과 슬래시 커맨드를 제공한다.

## 마이그레이션 진행 중 (v1)

이 저장소는 **Java/Spring Boot → TypeScript/Node.js** 마이그레이션 중이다.

- 현재 상태: TypeScript 환경 셋업 완료 (#3), 봇 기능 코드는 placeholder
- `src/main/java/**`, `src/main/resources/**`: 기존 Java 봇 코드 (#5~#8 포팅 후 자연 제거)
- 첫 노드 배포는 #5~#8 완료 후 `v1.0.0` 태그부터 (`v0.x.x`는 deploy 트리거되지 않음)

봇은 EC2에서 PM2로 운영 중이며, 마이그레이션 기간 동안 기존 Java 프로세스로 계속 동작한다.

## Quick Start

```bash
# 의존성 설치
npm install

# 환경변수 셋업 (실제 토큰 채워넣기)
cp .env.example .env

# 개발 실행 (tsx)
npm run dev

# 빌드
npm run build

# 테스트
npm test
```

요구사항: **Node.js 22+**.

## Stack

| 항목      | 도구                                       |
| --------- | ------------------------------------------ |
| Language  | TypeScript 5.9 (ESM, `module=Node16`)      |
| Runtime   | Node.js 22+                                |
| Discord   | discord.js (예정, #5에서 도입)             |
| Test      | Vitest 4                                   |
| Lint      | ESLint 9 (flat) + typescript-eslint 8      |
| Format    | Prettier 3                                 |
| Build/Dev | npm + tsx                                  |
| Deploy    | GitHub Actions → S3 → AWS CodeDeploy → PM2 |

자세한 내용은 [`CLAUDE.md`](./CLAUDE.md) 참고.

## Scripts

```bash
npm run build         # tsc — dist/ 생성
npm start             # node dist/index.js
npm run dev           # tsx src/index.ts
npm test              # vitest run
npm run test:watch    # vitest (watch)
npm run lint          # eslint src/
npm run typecheck     # tsc --noEmit
npm run format        # prettier --write 'src/**/*.ts'
```

## CI/CD

- **CI** (`.github/workflows/ci.yml`): main push 및 PR 시 `lint → typecheck → build → test`
- **Deploy** (`.github/workflows/deploy.yml`): `v[1-9]*` 태그 푸시 시 (`v0.x.x` 제외)

배포 운영 인계 사항은 [`CLAUDE.md`](./CLAUDE.md#operations) 참고.

## Contributing

- 브랜치: `feat/{issue-number}-{slug}`, `fix/{issue-number}-{slug}`
- 커밋: Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `ci:`)
- 이슈 라벨: `feature`, `bug`, `infra`, `migration`, `refactor`, `claude-action`

## License

MIT
