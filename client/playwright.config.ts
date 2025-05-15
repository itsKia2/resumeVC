import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import path from 'path';

// Read the .env file and set the environment variables
dotenv.config({ path: path.resolve(dirname(fileURLToPath(import.meta.url)), '.env') })

// Set the URL for the server
const baseURL = process.env.PLAYWRIGHT_TESTING_URL || "http://localhost:5173";

export default defineConfig({
  // Look for tests in the "e2e" directory
  testDir: 'e2e',
  // Set the number of retries for each, in case of failure
  retries: 1,
  // Run your local dev server before starting the tests.
  webServer: {
    command: 'cd ../ && bun run dev', // Start frontend and backend servers using the root package.json's dev script
    // Base URL to use in actions like `await page.goto('/')`
    url: baseURL,
    // Set the timeout for the server to start
    timeout: 120 * 1000,
    // Reuse the server between tests
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'global setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['global setup'],
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['global setup'],
    },
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['global setup'],
    },
  ],
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: baseURL,

    // Collect trace when retrying the failed test.
    // See https://playwright.dev/docs/trace-viewer
    trace: 'retry-with-trace',
  },
});