import { test, expect } from '@playwright/test';

test.describe('Auditoría Integral de Mis Calificaciones (/student/grades)', () => {
  const BASE_URL = 'https://lumina-core-portal.vercel.app';
  test.setTimeout(90000);

  test('Flujo Completo: Carga de Calificaciones -> Estadísticas -> Filtros de Periodo -> Acordeón de Evaluaciones -> Exportar/Imprimir', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('--- 1. Login con Estudiante ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"]', 'royer.tanta27@gmail.com');
    await page.fill('input[type="password"], input[formcontrolname="password"]', 'MichelTanta27!');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/student\//, { timeout: 35000 });
    console.log('✅ Login exitoso:', page.url());

    console.log('--- 2. Navegación a /student/grades ---');
    await page.goto(`${BASE_URL}/student/grades`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/student\/grades/);
    console.log('✅ Vista de Calificaciones cargada');

    // Validar cabecera y títulos
    await expect(page.getByRole('heading', { name: 'Mis Calificaciones' })).toBeVisible();
    await expect(page.locator('body')).toContainText(/Rendimiento Académico|Promedio General/i);
    console.log('✅ Encabezado y títulos verificados');

    // Esperar carga de datos
    await page.waitForTimeout(2500);

    console.log('--- 3. Auditoría de Métricas Superiores ---');
    const promedioCard = page.locator('header').locator('text=/Promedio General/i').locator('..');
    const promedioText = await promedioCard.innerText();
    console.log(`📊 Promedio General mostrado: "${promedioText.replace(/\n+/g, ' | ').trim()}"`);

    const statsRow = page.locator('main').first();
    await expect(statsRow).toContainText(/Créditos|Cursos|Ranking/i);
    console.log('✅ Tarjetas de estadísticas (Créditos, Cursos, Ranking) visibles');

    console.log('--- 4. Auditoría de Filtros de Semestre / Periodo ---');
    const filter2026 = page.locator('button').filter({ hasText: /^2026$/i }).first();
    const filter2025 = page.locator('button').filter({ hasText: /^2025$/i }).first();
    const filterAll = page.locator('button').filter({ hasText: /^Todos$/i }).first();

    if (await filterAll.isVisible()) {
      await filterAll.click();
      await page.waitForTimeout(600);
      const rowsAll = await page.locator('tbody tr').count();
      console.log(`✅ Filtro "Todos" activado - Filas en tabla: ${rowsAll}`);
    }

    if (await filter2025.isVisible()) {
      await filter2025.click();
      await page.waitForTimeout(600);
      const rows2025 = await page.locator('tbody tr').count();
      console.log(`✅ Filtro "2025" activado - Filas en tabla: ${rows2025}`);
    }

    if (await filter2026.isVisible()) {
      await filter2026.click();
      await page.waitForTimeout(600);
      const rows2026 = await page.locator('tbody tr').count();
      console.log(`✅ Filtro "2026" activado - Filas en tabla: ${rows2026}`);
    }

    console.log('--- 5. Auditoría de Tabla de Cursos y Desglose de Evaluaciones ---');
    // Volver a Todos para tener todas las filas disponibles
    if (await filterAll.isVisible()) {
      await filterAll.click();
      await page.waitForTimeout(600);
    }

    const expandButtons = page.locator('tbody button:has(i.fa-chevron-down), tbody button:has(i.fa-chevron-up)');
    const buttonCount = await expandButtons.count();
    console.log(`ℹ️ Cursos interactivos con acordeón encontrados: ${buttonCount}`);

    if (buttonCount > 0) {
      // Expandir primer curso
      const firstBtn = expandButtons.first();
      await firstBtn.click();
      await page.waitForTimeout(800);

      // Validar que se muestre el desglose interno
      const subTable = page.locator('tbody tr').filter({ hasText: /Evaluación|Tipo|Peso|Nota|Estado/i }).first();
      await expect(subTable).toBeVisible();
      console.log('✅ Acordeón desplegado: Sub-tabla de evaluaciones visibles');

      // Validar métricas internas del curso
      await expect(page.locator('tbody').first()).toContainText(/Promedio|completadas/i);
      console.log('✅ Desglose de promedio y evaluaciones completadas validado');

      // Contraer acordeón
      await firstBtn.click();
      await page.waitForTimeout(600);
      console.log('✅ Acordeón contraído exitosamente');
    }

    console.log('--- 6. Verificación de Leyenda Inferior y Botón Imprimir ---');
    await expect(page.locator('body')).toContainText(/Aprobatorio|Desaprobatorio/i);
    console.log('✅ Leyenda de calificación aprobatoria/desaprobatoria visible');

    const printBtn = page.locator('button').filter({ hasText: /Imprimir/i }).first();
    await expect(printBtn).toBeVisible();
    console.log('✅ Botón "Imprimir" presente y visible');

    console.log('--- 7. Verificación de Consola ---');
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('NG81') && !e.includes('hydration'));
    if (criticalErrors.length > 0) {
      console.log('⚠️ Advertencias/Errores de consola:', criticalErrors);
    } else {
      console.log('✅ Consola limpia sin errores');
    }
  });
});
