import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // coverage 옵션은 @vitest/coverage-v8를 devDeps에 추가한 후 활성화한다.
    // 본 마이그레이션 단계(#3)에서는 smoke test만 실행하므로 미설정.
  },
});
