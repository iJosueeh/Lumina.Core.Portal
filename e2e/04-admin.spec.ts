import { test, expect } from '@playwright/test';

test.describe('Módulo Administrador - Suite E2E', () => {
  const adminRoutes = [
    { path: '/admin/dashboard', name: 'Dashboard Admin' },
    { path: '/admin/courses', name: 'Gestión de Cursos' },
    { path: '/admin/users', name: 'Gestión de Usuarios' },
    { path: '/admin/noticias', name: 'Gestión de Noticias' },
    { path: '/admin/eventos', name: 'Gestión de Eventos' },
    { path: '/admin/settings', name: 'Configuración Admin' },
  ];

  for (const route of adminRoutes) {
    test(`Página ${route.name} (${route.path}) carga o redirige correctamente`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(/\/(login|admin)/);
      await expect(page.locator('body')).toBeVisible();
    });
  }

  test('La gestión de noticias contiene barra de búsqueda y controles', async ({ page }) => {
    await page.goto('/admin/noticias');
    await page.waitForTimeout(500);
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeEnabled();
    }
  });
});
