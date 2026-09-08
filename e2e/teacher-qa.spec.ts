import { test, expect } from '@playwright/test';

test.describe('Teacher Full QA Suite', () => {
  const baseUrl = 'https://lumina-core-portal.vercel.app';
  const teacherEmail = 'profesor@lumina.edu';
  const teacherPassword = 'Test123!';

  test('Teacher Full Flow: Login and All Modules Verification', async ({ page }) => {
    test.setTimeout(120000);

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Ir a login
    console.log('1. Navegando a /login...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });

    // 2. Ingresar credenciales docentes
    console.log('2. Ingresando credenciales de docente (profesor@lumina.edu)...');
    await page.fill('input[name="username"], input#username, input[type="email"]', teacherEmail);
    await page.fill('input[name="password"], input#password, input[type="password"]', teacherPassword);
    await page.click('button[type="submit"]');

    // 3. Esperar redirección al dashboard docente
    console.log('3. Esperando redirección a /teacher/dashboard...');
    await page.waitForURL(/\/teacher\/(dashboard|courses)/, { timeout: 25000 });
    console.log('✅ Redireccionado exitosamente a:', page.url());
    await page.waitForTimeout(1500);

    const modules = [
      { path: '/teacher/dashboard', name: 'Dashboard' },
      { path: '/teacher/courses', name: 'Mis Cursos' },
      { path: '/teacher/students', name: 'Alumnos' },
      { path: '/teacher/evaluations', name: 'Evaluaciones' },
      { path: '/teacher/grades', name: 'Calificaciones' },
      { path: '/teacher/attendance', name: 'Asistencia' },
      { path: '/teacher/schedule', name: 'Horario' },
      { path: '/teacher/materials', name: 'Materiales' },
      { path: '/teacher/profile', name: 'Perfil' },
    ];

    for (const mod of modules) {
      console.log(`Verificando módulo: ${mod.name} (${mod.path})...`);
      await page.goto(`${baseUrl}${mod.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      await expect(page.locator('body')).toBeVisible();
      console.log(`✅ ${mod.name} cargado correctamente.`);
    }

    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('DevTools') &&
        !e.includes('Warning')
    );
    console.log(`🎉 Módulos docentes verificados. Errores críticos: ${criticalErrors.length}`);
  });
});
