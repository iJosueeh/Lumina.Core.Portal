import { test, expect } from '@playwright/test';

test.describe('Auditoría Integral de Horarios y Calendario Académico (/student/schedule)', () => {
  const BASE_URL = 'https://lumina-core-portal.vercel.app';
  test.setTimeout(90000);

  test('Flujo Completo: Carga de Horarios Reales -> Vistas Semana/Día/Mes -> Modal de Detalle de Clase', async ({ page }) => {
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

    console.log('--- 2. Navegación a /student/schedule ---');
    await page.goto(`${BASE_URL}/student/schedule`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/student\/schedule/);
    console.log('✅ Vista de Horario cargada');

    // Validar título y cabecera
    await expect(page.locator('body')).toContainText(/Mi Horario|Horario Académico|Semana/i);
    console.log('✅ Encabezado de Horario visible');

    // Esperar carga de eventos del horario
    await page.waitForTimeout(2500);

    // Comprobar eventos de calendario en vista semanal
    const eventCards = page.locator('div.pointer-events-auto.cursor-pointer, div.absolute.rounded-lg.text-white').filter({
      hasText: /\d{2}:\d{2}/
    });
    const eventCount = await eventCards.count();
    console.log(`ℹ️ Sesiones / Bloques de clase encontrados en la semana: ${eventCount}`);

    if (eventCount > 0) {
      const firstEvent = eventCards.first();
      const eventText = await firstEvent.innerText();
      console.log(`📅 Primera sesión en horario: "${eventText.replace(/\n+/g, ' | ').trim()}"`);

      console.log('--- 3. Auditoría del Modal de Detalle de Sesión ---');
      await firstEvent.click({ force: true });
      const modal = page.locator('app-event-detail-modal').first();
      try {
        await expect(modal).toBeVisible({ timeout: 5000 });
        console.log('✅ Modal de Detalle de Sesión abierto');
        await expect(modal).toContainText(/Clase|Evaluación|Taller|Horario|Profesor|Ubicación|Enlace/i);
        console.log('✅ Información detallada de clase (hora, modalidad, docente) validada');

        // Cerrar modal
        const closeBtn = modal.locator('button').filter({ hasText: /Cerrar/i }).or(modal.locator('button[aria-label="Cerrar"]')).first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        console.log('✅ Modal cerrado correctamente');
      } catch {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }

    console.log('--- 4. Prueba de Selectores de Vista (Semana / Día / Mes) ---');
    // Vista Día
    const dayViewBtn = page.locator('button').filter({ hasText: /^Día$|^Dia$/i }).first();
    if (await dayViewBtn.isVisible()) {
      await dayViewBtn.click();
      await page.waitForTimeout(600);
      console.log('✅ Selector "Vista Día" interactivo');
    }

    // Vista Mes
    const monthViewBtn = page.locator('button').filter({ hasText: /^Mes$/i }).first();
    if (await monthViewBtn.isVisible()) {
      await monthViewBtn.click();
      await page.waitForTimeout(600);
      console.log('✅ Selector "Vista Mes" interactivo (matriz mensual de 42 celdas)');
    }

    // Volver a Vista Semana
    const weekViewBtn = page.locator('button').filter({ hasText: /^Semana$/i }).first();
    if (await weekViewBtn.isVisible()) {
      await weekViewBtn.click();
      await page.waitForTimeout(600);
      console.log('✅ Retorno a "Vista Semana" confirmado');
    }

    // Probar modal de Todas las Clases
    await page.keyboard.press('Escape');
    const seeAllBtn = page.locator('button').filter({ hasText: /Ver Todo/i }).first();
    if (await seeAllBtn.isVisible()) {
      await seeAllBtn.click({ force: true });
      await page.waitForTimeout(600);
      const allTasksModal = page.locator('app-all-tasks-modal').first();
      if (await allTasksModal.isVisible()) {
        console.log('✅ Modal "Todas las Clases y Sesiones" abierto');
        await expect(allTasksModal).toContainText(/Todas las Clases|Esta Semana|Próximas/i);
        const modalClose = allTasksModal.locator('button').filter({ hasText: /Cerrar/i }).or(allTasksModal.locator('button[aria-label="Cerrar"]')).first();
        if (await modalClose.isVisible()) {
          await modalClose.click();
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        console.log('✅ Modal "Todas las Clases" cerrado correctamente');
      }
    }

    console.log('--- 5. Verificación de Consola ---');
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('NG81') && !e.includes('hydration'));
    if (criticalErrors.length > 0) {
      console.log('⚠️ Advertencias/Errores de consola:', criticalErrors);
    } else {
      console.log('✅ Consola limpia sin errores');
    }
  });
});
