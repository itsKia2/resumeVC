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

test('Signing in and out', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  await expect(page.getByRole('navigation')).toContainText('Sign In');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Sign in to Resume VCWelcome back! Please sign in to continueorEmail')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Sign in to Resume VC');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(process.env.E2E_CLERK_USER_USERNAME!);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Password', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill(process.env.E2E_CLERK_USER_PASSWORD!);
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('button', { name: 'Open user button' })).toBeVisible();
  await page.getByRole('button', { name: 'Open user button' }).click();
  await expect(page.getByLabel('User button popover')).toContainText(process.env.E2E_CLERK_USER_USERNAME!);
  await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
  await expect(page.getByRole('menu')).toContainText('Sign out');
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  await expect(page.getByRole('navigation')).toContainText('Sign In');
});