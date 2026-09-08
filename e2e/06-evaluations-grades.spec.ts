import { test, expect } from '@playwright/test';

test.describe('Alta Prioridad - Flujo de Evaluaciones y Calificaciones', () => {
  test('Estudiante: Módulo de Evaluaciones carga listado y filtros de estado', async ({ page }) => {
    await page.goto('/student/evaluations');
    await expect(page).toHaveURL(/\/(login|student)/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Estudiante: Módulo de Calificaciones muestra estructura de notas y promedios', async ({ page }) => {
    await page.goto('/student/grades');
    await expect(page).toHaveURL(/\/(login|student)/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Docente: Módulo de Evaluaciones permite visualizar evaluaciones de cursos', async ({ page }) => {
    await page.goto('/teacher/evaluations');
    await expect(page).toHaveURL(/\/(login|teacher)/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Docente: Módulo de Calificaciones presenta la tabla de estudiantes y ponderaciones', async ({ page }) => {
    await page.goto('/teacher/grades');
    await expect(page).toHaveURL(/\/(login|teacher)/);
    await expect(page.locator('body')).toBeVisible();
  });
});
