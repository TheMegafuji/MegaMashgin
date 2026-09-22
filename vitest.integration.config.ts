import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
