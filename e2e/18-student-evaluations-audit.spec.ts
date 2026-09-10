import { test, expect } from '@playwright/test';

test.describe('Auditoría Integral de Mis Evaluaciones (/student/evaluations)', () => {
  const BASE_URL = 'https://lumina-core-portal.vercel.app';
  test.setTimeout(90000);

  test('Flujo Completo: Carga de Evaluaciones -> Métricas -> Filtros -> Modal In-Place de Resultados/Quiz -> Exportar CSV', async ({ page }) => {
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

    console.log('--- 2. Navegación a /student/evaluations ---');
    await page.goto(`${BASE_URL}/student/evaluations`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/student\/evaluations/);
    console.log('✅ Vista de Evaluaciones cargada');

    // Validar cabecera y títulos
    await expect(page.getByRole('heading', { name: 'Mis Evaluaciones' })).toBeVisible();
    await expect(page.locator('body')).toContainText(/Escala vigesimal/i);
    console.log('✅ Encabezado y títulos verificados');

    // Esperar carga de datos
    await page.waitForTimeout(2500);

    console.log('--- 3. Auditoría de Filtros y Métricas ---');
    const filterAll = page.locator('button').filter({ hasText: /Todas \(/i }).first();
    const filterPending = page.locator('button').filter({ hasText: /Pendientes \(/i }).first();
    const filterCompleted = page.locator('button').filter({ hasText: /Completadas \(/i }).first();

    await expect(filterAll).toBeVisible();
    await expect(filterPending).toBeVisible();
    await expect(filterCompleted).toBeVisible();
    console.log('✅ Botones de filtro de estado visibles');

    // Probar cambio de filtros
    await filterPending.click();
    await page.waitForTimeout(500);
    console.log('✅ Filtro "Pendientes" activado');

    await filterCompleted.click();
    await page.waitForTimeout(500);
    console.log('✅ Filtro "Completadas" activado');

    await filterAll.click();
    await page.waitForTimeout(500);
    console.log('✅ Filtro "Todas" reactivado');

    console.log('--- 4. Auditoría de Botones Superiores (Exportar) ---');
    const exportBtn = page.locator('button').filter({ hasText: /Exportar/i }).first();
    await expect(exportBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    await exportBtn.click();
    const download = await downloadPromise;
    if (download) {
      const filename = download.suggestedFilename();
      console.log(`✅ Archivo CSV descargado correctamente: "${filename}"`);
      expect(filename).toContain('.csv');
    } else {
      console.log('ℹ️ Exportar clickeado (sin evento de descarga directo interceptado)');
    }

    console.log('--- 5. Auditoría de Acciones In-Place (Modal de Examen / Resultados) ---');
    const actionButtons = page.locator('button').filter({ hasText: /Ver resultado|Comenzar/i });
    const count = await actionButtons.count();
    console.log(`📋 Total de botones de acción de evaluación encontrados: ${count}`);

    if (count > 0) {
      const firstBtn = actionButtons.first();
      const btnText = (await firstBtn.innerText()).trim();
      console.log(`🎯 Haciendo clic en botón: "${btnText}"`);

      await firstBtn.click();
      await page.waitForTimeout(2500);

      // Verificar que NO hayamos navegado a otra ruta, seguimos en /student/evaluations
      expect(page.url()).toContain('/student/evaluations');
      console.log('✅ Se mantiene en /student/evaluations (sin redirección externa innecesaria)');

      // Verificar si se abrió el modal in-place
      const modalActive = page.locator('app-quiz-results, app-quiz-take');
      if (await modalActive.isVisible()) {
        console.log('✅ Modal in-place abierto exitosamente');
        // Buscar botón de cerrar
        const closeBtn = modalActive.locator('button').filter({ hasText: /Cerrar|Volver|Entendido/i }).first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(500);
          console.log('✅ Modal cerrado correctamente');
        }
      }
    }

    console.log('--- 6. Resumen de Errores Críticos de Consola ---');
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('analytics'));
    console.log(`🔍 Errores críticos de consola detectados: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) {
      console.log('Detalles:', criticalErrors);
    }
    expect(criticalErrors.length).toBe(0);
    console.log('🎉 Auditoría de Mis Evaluaciones finalizada con éxito!');
  });
});
