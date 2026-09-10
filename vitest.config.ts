import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    setupFiles: ['tests/setup-env.ts'],
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: { provider: 'v8', include: ['src/lib/**'] },
  },
})
