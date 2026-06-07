import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/api/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Run tests sequentially — some create/delete data that others depend on
    sequence: { concurrent: false },
    // No DOM environment needed — these are HTTP requests
    environment: 'node',
  },
  resolve: {
    alias: {
      '~~': resolve(__dirname),
      '~': resolve(__dirname, 'app'),
    },
  },
})
