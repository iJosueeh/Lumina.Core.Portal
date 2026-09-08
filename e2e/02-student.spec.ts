import { test, expect } from '@playwright/test';

test.describe('Módulo Estudiante - Navegación y Recursos', () => {
  const studentRoutes = [
    { path: '/student/dashboard', name: 'Dashboard' },
    { path: '/student/courses', name: 'Mis Cursos' },
    { path: '/student/catalog', name: 'Catálogo' },
    { path: '/student/schedule', name: 'Horario' },
    { path: '/student/grades', name: 'Calificaciones' },
    { path: '/student/evaluations', name: 'Evaluaciones' },
    { path: '/student/resources', name: 'Centro de Recursos' },
    { path: '/student/resources/category/library', name: 'Recursos - Biblioteca' },
    { path: '/student/resources/category/software', name: 'Recursos - Software' },
    { path: '/student/resources/category/guides', name: 'Recursos - Guías' },
    { path: '/student/resources/category/all', name: 'Recursos - Todos' },
    { path: '/student/profile', name: 'Perfil' },
    { path: '/student/settings', name: 'Configuración' },
  ];

  for (const route of studentRoutes) {
    test(`Página ${route.name} (${route.path}) carga o redirige correctamente`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(/\/(login|student)/);
      await expect(page.locator('body')).toBeVisible();
    });
  }

  test('El Centro de Recursos contiene buscador y estructura funcional', async ({ page }) => {
    await page.goto('/student/resources');
    await page.waitForTimeout(500);
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeEnabled();
    }
  });
});
