import { test, expect } from '@playwright/test';

test.describe('Módulo de Autenticación', () => {
  test('La página de Login carga los campos y elementos principales', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h2')).toContainText('Lumina');
    await expect(page.locator('input[name="username"], input#username')).toBeVisible();
    await expect(page.locator('input[name="password"], input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Validación de formulario de login deshabilita botón si está incompleto', async ({ page }) => {
    await page.goto('/login');

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();

    await page.fill('input[name="username"], input#username', 'usuario@ejemplo.com');
    await expect(submitButton).toBeDisabled();

    await page.fill('input[name="password"], input#password', 'MiPassword123!');
    await expect(submitButton).toBeEnabled();
  });
});
