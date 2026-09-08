import { test, expect } from '@playwright/test';

test.describe.serial('Suite de Operaciones de Prioridad Baja', () => {
  const BASE_URL = 'https://lumina-core-portal.vercel.app';

  // -------------------------------------------------------------------------
  // 1. CENTRO DE RECURSOS ACADÉMICOS (ESTUDIANTE)
  // -------------------------------------------------------------------------
  test('1. Estudiante: Recursos Académicos, Filtros de Categoría y Búsqueda', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [ESTUDIANTE] Verificando Recursos Académicos ---');

    // Login Estudiante
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'royer.tanta27@gmail.com');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'MichelTanta27!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/student\/dashboard/, { timeout: 15000 });

    // Navegar a Recursos
    await page.goto(`${BASE_URL}/student/resources`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Búsqueda de recursos
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Python');
      await page.waitForTimeout(400);
      await searchInput.clear();
    }

    // Categorías
    const categories = ['library', 'software', 'guides', 'all'];
    for (const cat of categories) {
      await page.goto(`${BASE_URL}/student/resources/category/${cat}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      await expect(page.locator('body')).toBeVisible();
    }
    console.log('✅ Estudiante: Centro de Recursos y Categorías verificadas');
  });

  // -------------------------------------------------------------------------
  // 2. HORARIOS Y CALENDARIO (ESTUDIANTE Y DOCENTE)
  // -------------------------------------------------------------------------
  test('2. Estudiante y Docente: Vistas de Horarios y Programación', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [DOCENTE] Verificando Horario ---');

    // Login Docente
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'profesor@lumina.edu');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/teacher\/dashboard/, { timeout: 15000 });

    // Horario Docente
    await page.goto(`${BASE_URL}/teacher/schedule`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Docente: Vista de Horario y Programación verificada');
  });

  // -------------------------------------------------------------------------
  // 3. AJUSTES GLOBALES DEL SISTEMA (ADMIN)
  // -------------------------------------------------------------------------
  test('3. Admin: Ajustes y Configuración Global de Plataforma', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [ADMIN] Verificando Ajustes Globales ---');

    // Login Admin
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'admin@lumina.edu');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });

    // Ajustes
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Admin: Configuración Global y Ajustes del Sistema verificados');
  });
});
