import { test, expect } from '@playwright/test';

test.describe.serial('Live Multi-Role Portal QA Verification', () => {
  const BASE_URL = 'https://lumina-core-portal.vercel.app';

  test('1. Rol Estudiante: Login, Módulos y Navegación Completa', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [ESTUDIANTE] Iniciando verificación ---');

    // 1. Ir a login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[type="email"], input[formcontrolname="email"], input[name="email"]').first()).toBeVisible();

    // 2. Login
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'royer.tanta27@gmail.com');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'MichelTanta27!');
    await page.click('button[type="submit"]');

    // 3. Validar redirección
    await page.waitForURL(/\/student\/dashboard/, { timeout: 15000 });
    console.log('✅ Estudiante: Login y redirección a /student/dashboard exitosa');

    // 4. Módulos
    const studentModules = [
      { name: 'Mis Cursos', path: '/student/courses' },
      { name: 'Catálogo de Cursos', path: '/student/catalog' },
      { name: 'Horario', path: '/student/schedule' },
      { name: 'Calificaciones', path: '/student/grades' },
      { name: 'Evaluaciones', path: '/student/evaluations' },
      { name: 'Recursos Académicos', path: '/student/resources' },
      { name: 'Perfil', path: '/student/profile' },
      { name: 'Configuración', path: '/student/settings' },
    ];

    for (const mod of studentModules) {
      await page.goto(`${BASE_URL}${mod.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).toContain(mod.path);
      console.log(`✅ Estudiante: Módulo "${mod.name}" (${mod.path}) cargado correctamente`);
    }

    // 5. Logout
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    console.log('✅ Estudiante: Sesión cerrada y reseteada.');
  });

  test('2. Rol Docente: Login, Módulos y Navegación Completa', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [DOCENTE] Iniciando verificación ---');

    // 1. Ir a login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[type="email"], input[formcontrolname="email"], input[name="email"]').first()).toBeVisible();

    // 2. Login
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'profesor@lumina.edu');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    // 3. Validar redirección
    await page.waitForURL(/\/teacher\/dashboard/, { timeout: 15000 });
    console.log('✅ Docente: Login y redirección a /teacher/dashboard exitosa');

    // 4. Módulos
    const teacherModules = [
      { name: 'Mis Cursos', path: '/teacher/courses' },
      { name: 'Alumnos', path: '/teacher/students' },
      { name: 'Evaluaciones', path: '/teacher/evaluations' },
      { name: 'Calificaciones', path: '/teacher/grades' },
      { name: 'Asistencia', path: '/teacher/attendance' },
      { name: 'Horario', path: '/teacher/schedule' },
      { name: 'Materiales', path: '/teacher/materials' },
      { name: 'Perfil', path: '/teacher/profile' },
    ];

    for (const mod of teacherModules) {
      await page.goto(`${BASE_URL}${mod.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).toContain(mod.path);
      console.log(`✅ Docente: Módulo "${mod.name}" (${mod.path}) cargado correctamente`);
    }

    // 5. Logout
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    console.log('✅ Docente: Sesión cerrada y reseteada.');
  });

  test('3. Rol Administrador: Login, Módulos y Navegación Completa', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [ADMINISTRADOR] Iniciando verificación ---');

    // 1. Ir a login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[type="email"], input[formcontrolname="email"], input[name="email"]').first()).toBeVisible();

    // 2. Login
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'admin@lumina.edu');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // 3. Validar redirección
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
    console.log('✅ Administrador: Login y redirección a /admin/dashboard exitosa');

    // 4. Módulos
    const adminModules = [
      { name: 'Gestión de Cursos', path: '/admin/courses' },
      { name: 'Gestión de Usuarios', path: '/admin/users' },
      { name: 'Gestión de Noticias', path: '/admin/noticias' },
      { name: 'Gestión de Eventos', path: '/admin/eventos' },
      { name: 'Ajustes / Configuración', path: '/admin/settings' },
    ];

    for (const mod of adminModules) {
      await page.goto(`${BASE_URL}${mod.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).toContain(mod.path);
      console.log(`✅ Administrador: Módulo "${mod.name}" (${mod.path}) cargado correctamente`);
    }

    // 5. Logout
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    console.log('✅ Administrador: Sesión cerrada y reseteada.');
  });
});
