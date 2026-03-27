import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

function envURL(stack: string | undefined) {
  switch (stack) {
    case 'dev':
      return 'https://dev.himarley.com';
    case 'stg':
      return 'https://stg.himarley.com';
    case 'prod':
    default:
      return 'https://www.himarley.com';
  }
}

export default defineConfig({
  testDir: 'src/tests',
  timeout: 360_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.WORKER_COUNT ? Number(process.env.WORKER_COUNT) : 2,
  use: {
    baseURL: envURL(process.env.STACK),
    actionTimeout: 60_000,
    navigationTimeout: 60_000,
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'on',
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
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
    {
      name: 'pixel',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'iphone',
      use: {
        ...devices['iPhone 13'],
      },
    },
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'playwright-results/junit-report.xml' }],
  ],
});
