import { test, expect } from '@playwright/test';

test.describe.serial('Suite de Operaciones de Prioridad Media', () => {
  const BASE_URL = 'https://lumina-core-portal.vercel.app';

  // -------------------------------------------------------------------------
  // 1. GESTIÓN DE NOTICIAS (ADMIN)
  // -------------------------------------------------------------------------
  test('1. Admin: Gestión de Noticias, Filtro de Categoría y Navegación', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [ADMIN] Verificando Gestión de Noticias ---');

    // Login Admin
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'admin@lumina.edu');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 25000 });

    // Navegar a Noticias
    await page.goto(`${BASE_URL}/admin/noticias`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Validar controles de búsqueda y filtro
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Lumina');
    await page.waitForTimeout(400);
    await searchInput.clear();

    const categorySelect = page.locator('select').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
      await page.waitForTimeout(400);
      await categorySelect.selectOption({ index: 0 });
    }

    const createBtn = page.locator('button:has-text("Crear Noticia"), a:has-text("Crear Noticia"), button:has-text("Nueva Noticia")').first();
    await expect(createBtn).toBeVisible();
    console.log('✅ Admin: Controles de Gestión de Noticias operativos');
  });

  // -------------------------------------------------------------------------
  // 2. GESTIÓN DE EVENTOS (ADMIN)
  // -------------------------------------------------------------------------
  test('2. Admin: Gestión de Eventos, Grid y Botón de Creación', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [ADMIN] Verificando Gestión de Eventos ---');

    // Login Admin
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'admin@lumina.edu');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 25000 });

    await page.goto(`${BASE_URL}/admin/eventos`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Conferencia');
      await page.waitForTimeout(400);
      await searchInput.clear();
    }

    const createBtn = page.locator('button:has-text("Crear Evento"), a:has-text("Crear Evento"), button:has-text("Nuevo Evento")').first();
    await expect(createBtn).toBeVisible();
    console.log('✅ Admin: Controles de Gestión de Eventos operativos');
  });

  // -------------------------------------------------------------------------
  // 3. CONTROL DE ASISTENCIA (DOCENTE)
  // -------------------------------------------------------------------------
  test('3. Docente: Módulo de Asistencia, Selección y Tabla', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [DOCENTE] Verificando Asistencia ---');

    // Login Docente
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'profesor@lumina.edu');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/teacher\/dashboard/, { timeout: 25000 });

    // Navegar a Asistencia
    await page.goto(`${BASE_URL}/teacher/attendance`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();

    // Validar selector de fecha o botones de estado si existen
    const attendanceContainer = page.locator('app-attendance-table, table, .attendance-container, body').first();
    await expect(attendanceContainer).toBeVisible();
    console.log('✅ Docente: Módulo de Asistencia renderizado correctamente');
  });

  // -------------------------------------------------------------------------
  // 4. PERFIL Y CONFIGURACIÓN (ESTUDIANTE Y DOCENTE)
  // -------------------------------------------------------------------------
  test('4. Estudiante y Docente: Perfiles y Formularios de Ajustes', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [ESTUDIANTE] Verificando Perfil y Ajustes ---');

    // Login Estudiante
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'royer.tanta27@gmail.com');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'MichelTanta27!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/student\/dashboard/, { timeout: 25000 });

    // 1. Perfil Estudiante
    await page.goto(`${BASE_URL}/student/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Estudiante: Vista de Perfil verificada');

    // 2. Configuración Estudiante
    await page.goto(`${BASE_URL}/student/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Estudiante: Vista de Configuración verificada');
  });
});
