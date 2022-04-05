import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

// See https://playwright.dev/docs/test-configuration.
const config: PlaywrightTestConfig = {
  testDir: './test/playwright',
  timeout: 10000,
  expect: {
    timeout: 1000,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    // Somehow, Safari appears not to execute our module script. Omit for now.
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //   },
    // },
  ],
  webServer: {
    command: 'npm run test-server',
    port: 3000,
    reuseExistingServer: true,
  },
};

export default config;
