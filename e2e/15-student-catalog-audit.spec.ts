import { test, expect } from '@playwright/test';

test.describe('Auditoría Integral del Catálogo de Cursos (/student/catalog)', () => {
  const BASE_URL = 'https://lumina-core-portal.vercel.app';
  test.setTimeout(90000);

  test('Flujo Completo: Catálogo -> Búsqueda -> Filtros de Categoría -> Detalle de Curso', async ({ page }) => {
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

    console.log('--- 2. Navegación a /student/catalog ---');
    await page.goto(`${BASE_URL}/student/catalog`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/student\/catalog/);
    console.log('✅ Vista Catálogo de Cursos cargada');

    // Validar cabecera y título
    await expect(page.getByRole('heading', { name: 'Explorar Cursos' })).toBeVisible();
    console.log('✅ Título "Explorar Cursos" visible');

    // Esperar a que los cursos terminen de cargar (skeletons desaparecen)
    const courseCards = page.locator('main .cursor-pointer');
    await courseCards.first().waitFor({ state: 'visible', timeout: 30000 });

    const initialCount = await courseCards.count();
    console.log(`ℹ️ Cursos iniciales en catálogo: ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);

    // Validar datos del primer curso
    const firstCard = courseCards.first();
    const firstTitle = await firstCard.locator('h3').innerText();
    console.log(`📚 Primer curso en catálogo: "${firstTitle.trim()}"`);

    console.log('--- 3. Prueba de Búsqueda Interactiva ---');
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await expect(searchInput).toBeVisible();

    // Buscar una palabra específica
    const queryWord = firstTitle.trim().split(' ')[0];
    await searchInput.fill(queryWord);
    await page.waitForTimeout(600);
    const filteredSearchCount = await courseCards.count();
    console.log(`ℹ️ Cursos filtrados por búsqueda "${queryWord}": ${filteredSearchCount}`);
    expect(filteredSearchCount).toBeGreaterThan(0);

    // Buscar término inexistente para probar empty state
    await searchInput.fill('XYZ_TERMINO_INEXISTENTE_999');
    await page.waitForTimeout(600);
    await expect(page.locator('body')).toContainText(/No se encontraron cursos/i);
    console.log('✅ Empty state "No se encontraron cursos" validado con éxito');

    // Limpiar búsqueda
    await searchInput.clear();
    await page.waitForTimeout(600);
    expect(await courseCards.count()).toBe(initialCount);
    console.log('✅ Búsqueda limpiada y catálogo restaurado');

    console.log('--- 4. Prueba de Filtros por Categoría ---');
    const categoryButtons = page.locator('main button').filter({ hasText: /Todos|Desarrollo|Arquitectura|Base de Datos|Diseño|General|Backend|Frontend/i });
    const catCount = await categoryButtons.count();
    console.log(`ℹ️ Botones de categorías encontrados: ${catCount}`);

    if (catCount > 1) {
      // Clic en la segunda categoría
      const secondCat = categoryButtons.nth(1);
      const catName = await secondCat.innerText();
      console.log(`🏷️ Probando filtro de categoría: "${catName}"`);
      await secondCat.click();
      await page.waitForTimeout(600);

      const catFilteredCount = await courseCards.count();
      console.log(`ℹ️ Cursos en categoría "${catName}": ${catFilteredCount}`);

      // Volver a 'Todos'
      const todosBtn = categoryButtons.first();
      await todosBtn.click();
      await page.waitForTimeout(600);
      expect(await courseCards.count()).toBe(initialCount);
      console.log('✅ Filtro "Todos" reactivado correctamente');
    }

    console.log('--- 5. Navegación al Detalle del Curso Seleccionado ---');
    await firstCard.click();
    await page.waitForURL(/\/student\/course\//, { timeout: 25000 });
    console.log('✅ Navegación al detalle del curso exitosa:', page.url());

    // Validar carga del detalle
    await expect(page.locator('body')).toContainText(/Descripción|Contenido|Evaluaciones/i);
    console.log('✅ Vista de detalle cargada con pestañas');

    console.log('--- 6. Verificación de Consola ---');
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('NG81') && !e.includes('hydration'));
    if (criticalErrors.length > 0) {
      console.log('⚠️ Errores no críticos de consola:', criticalErrors);
    } else {
      console.log('✅ Consola limpia sin errores');
    }
  });
});
