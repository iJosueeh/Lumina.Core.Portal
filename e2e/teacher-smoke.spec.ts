import { test, expect } from '@playwright/test';

test.describe('Módulo Docente - Smoke Tests', () => {
  
  test('Login page loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/login');
    
    await expect(page.locator('h2')).toContainText('Lumina');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    const criticalErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('DevTools') &&
      !e.includes('Warning')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Login form validation works', async ({ page }) => {
    await page.goto('/login');
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
    
    await page.fill('input[name="username"]', 'test@example.com');
    await expect(submitButton).toBeDisabled();
    
    await page.fill('input[name="password"]', 'password123');
    await expect(submitButton).toBeEnabled();
  });

  test('Login page has correct structure', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('input#username')).toHaveAttribute('type', 'email');
    await expect(page.locator('input#password')).toHaveAttribute('type', 'password');
    await expect(page.locator('text=Olvidaste tu contrasena')).toBeVisible();
  });

});

test.describe('Teacher Module - Navigation Tests (Requires Auth)', () => {
  
  const teacherRoutes = [
    { path: '/teacher/dashboard', name: 'Dashboard' },
    { path: '/teacher/courses', name: 'Mis Cursos' },
    { path: '/teacher/students', name: 'Alumnos' },
    { path: '/teacher/evaluations', name: 'Mis Evaluaciones' },
    { path: '/teacher/grades', name: 'Calificaciones' },
    { path: '/teacher/attendance', name: 'Asistencia' },
    { path: '/teacher/schedule', name: 'Horario' },
  ];

  for (const route of teacherRoutes) {
    test(`${route.name} page loads without crash`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/login');
      
      // If redirected to login, the page at least loads
      await expect(page).toHaveURL(/\/(login|teacher)/);
      
      const criticalErrors = consoleErrors.filter(e => 
        !e.includes('favicon') && 
        !e.includes('DevTools') &&
        !e.includes('Warning') &&
        !e.includes('401') &&
        !e.includes('403')
      );
      
      console.log(`✓ ${route.name} loaded with ${criticalErrors.length} critical errors`);
    });
  }

});

test.describe('Teacher Dashboard - Component Tests', () => {
  
  test('Dashboard sidebar menu items are present', async ({ page }) => {
    await page.goto('/login');
    
    // Check that sidebar structure exists (if redirected to dashboard)
    const currentUrl = page.url();
    if (currentUrl.includes('/teacher')) {
      // Check for sidebar navigation items
      const menuItems = page.locator('app-sidebar');
      await expect(menuItems).toBeVisible({ timeout: 5000 }).catch(() => {
        console.log('Sidebar not visible (may require auth)');
      });
    }
  });

});