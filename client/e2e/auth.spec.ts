import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright'

test('Test clicking Resumes link signed in', async ({ page }) => {
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

test('Test visiting resumes page logged out', async ({ page }) => {
  await page.goto('/categories');
  // A signed out user should not be able to see the resumes page, rather they should see an alert to sign in
  await expect(page.getByRole('alert')).toContainText('Please log in to view this page.');
});