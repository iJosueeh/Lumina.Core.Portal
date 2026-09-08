import { test, expect } from '@playwright/test';

test.describe('Módulo Docente - Navegación y Gestión', () => {
  const teacherRoutes = [
    { path: '/teacher/dashboard', name: 'Dashboard' },
    { path: '/teacher/courses', name: 'Mis Cursos' },
    { path: '/teacher/students', name: 'Alumnos' },
    { path: '/teacher/evaluations', name: 'Evaluaciones' },
    { path: '/teacher/grades', name: 'Calificaciones' },
    { path: '/teacher/attendance', name: 'Asistencia' },
    { path: '/teacher/schedule', name: 'Horario' },
  ];

  for (const route of teacherRoutes) {
    test(`Página ${route.name} (${route.path}) carga o redirige correctamente`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(/\/(login|teacher)/);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});
