import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright'

test('Test clicking Resumes Link', async ({ page }) => {
  await page.goto('/');
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  })
  // User must be signed in to see the resumes link
  await page.getByRole('link', { name: 'Resumes' }).click();
});