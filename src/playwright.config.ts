import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: '**/*.spec.ts',
  timeout: 60 * 1000,
  use: {
    launchOptions: {
      args: ['--window-size=426,600', '--window-position=0,0']
    },
    viewport: null,
  },
});
