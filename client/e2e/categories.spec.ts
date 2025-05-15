import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright'

test('Categories loads', async ({ page }) => {
  await page.goto('http://localhost:5173/categories');
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    })
  await expect(page.getByRole('button', { name: 'Categories' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Categories');
  await expect(page.getByText('All0 resumesView Resumes')).toBeVisible();
  await expect(page.locator('#root')).toContainText('All');
});