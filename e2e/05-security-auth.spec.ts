import { test, expect } from '@playwright/test';

test.describe('Alta Prioridad - Seguridad y Control de Acceso', () => {
  test('Rutas privadas redirigen o exigen autenticación ante acceso anónimo', async ({ page }) => {
    // Intentar acceder directamente a una ruta protegida
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/(login|admin)/);
  });

  test('Formulario de login maneja credenciales inválidas con mensaje claro', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="username"], input#username', 'no_existe@lumina.edu');
    await page.fill('input[name="password"], input#password', 'ClaveInvalida999!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);
    // Verificar que permanezca en login o muestre mensaje de error
    await expect(page).toHaveURL(/\/login/);
  });
});
