import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  // `dictionaries.ts` keeps its real `import 'server-only'` guard for the shipped
  // build; under Vitest that package resolves its react-server export and throws,
  // so alias it to an empty module for the test run only.
  resolve: {
    alias: { 'server-only': new URL('./tests/stubs/server-only.ts', import.meta.url).pathname },
  },
  test: {
    environment: 'node',
    setupFiles: ['tests/setup-env.ts'],
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: { provider: 'v8', include: ['src/lib/**'] },
  },
})
