import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright'
import type { Page } from '@playwright/test';

async function setupPage(page: Page): Promise<void> {
  await page.goto('/categories');
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });
}

test('Categories loads', async ({ page }) => {
  setupPage(page);
  await expect(page.getByRole('button', { name: 'Categories' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Categories');
  await expect(page.getByText('All0 resumesView Resumes')).toBeVisible();
  await expect(page.locator('#root')).toContainText('All');
});

test('Create category', async ({ page }) => {
  setupPage(page);
  await page.getByRole('button', { name: 'New Category' }).click();
  await expect(page.getByRole('dialog', { name: 'Create New Category' })).toBeVisible();
  await expect(page.getByRole('heading')).toContainText('Create New Category');
  await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Name' }).click();
  await page.getByRole('textbox', { name: 'Name' }).fill('FinanceTest');
  await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('FinanceTestActions0')).toBeVisible();
  await expect(page.locator('#root')).toContainText('FinanceTest');
  await expect(page.locator('#root')).toContainText('0 resumes');
});

test('Rename category', async ({ page }) => {
  setupPage(page);
  await page.getByRole('button', { name: 'Actions' }).click();
  await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
  await expect(page.getByLabel('Actions')).toContainText('Rename');
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  await expect(page.getByRole('dialog', { name: 'Rename Category' })).toBeVisible();
  await expect(page.getByRole('heading')).toContainText('Rename Category');
  await page.getByRole('textbox', { name: 'Name' }).click();
  await page.getByRole('textbox', { name: 'Name' }).fill('FinanceTest2');
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  await expect(page.locator('form')).toContainText('Save');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('FinanceTest2Actions0')).toBeVisible();
  await expect(page.locator('#root')).toContainText('FinanceTest2');
});

test('Delete category', async ({ page }) => {
  setupPage(page);
  await page.getByRole('button', { name: 'Actions' }).click();
  await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
  await expect(page.getByLabel('Actions')).toContainText('Delete');
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.getByRole('dialog', { name: 'Delete Category' })).toBeVisible();
  await expect(page.getByRole('heading')).toContainText('Delete Category');
  await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  await expect(page.locator('form')).toContainText('Delete');
  await page.getByRole('button', { name: 'Delete' }).click();
});