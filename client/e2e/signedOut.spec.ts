import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('/categories');
  // A signed out user should not be able to see the resumes page, rather they should see an alert to sign in
  await expect(page.getByRole('alert')).toContainText('Please log in to view this page.');
});