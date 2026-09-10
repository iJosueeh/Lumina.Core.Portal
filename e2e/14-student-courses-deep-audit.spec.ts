import { test, expect } from '@playwright/test';

test.describe('Auditoría Integral de Mis Cursos, Aula Virtual y Evaluaciones', () => {
  const BASE_URL = 'https://lumina-core-portal.vercel.app';
  test.setTimeout(90000);

  test('Flujo Completo: Mis Cursos -> Detalle -> Aula Virtual -> Evaluaciones', async ({ page }) => {
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

    console.log('--- 2. Navegación a /student/courses ---');
    await page.goto(`${BASE_URL}/student/courses`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/student\/courses/);
    console.log('✅ Vista Mis Cursos cargada');

    // Comprobar tarjetas de cursos
    const courseCards = page.locator('main div.cursor-pointer');
    const count = await courseCards.count();
    console.log(`ℹ️ Cursos matriculados encontrados: ${count}`);
    expect(count).toBeGreaterThan(0);

    // Clic en el primer curso para ir al detalle
    const firstCourseCard = courseCards.first();
    const courseTitle = await firstCourseCard.locator('h3').innerText();
    console.log(`📚 Accediendo al curso: "${courseTitle.trim()}"`);
    
    await firstCourseCard.click();
    await page.waitForURL(/\/student\/course\//, { timeout: 25000 });
    console.log('✅ Vista Detalle de Curso cargada:', page.url());

    console.log('--- 3. Auditoría de Pestañas en Detalle del Curso ---');
    await page.waitForTimeout(2000);
    // Pestaña Descripción
    await expect(page.locator('body')).toContainText(/Descripción|Contenido|Evaluaciones/i);
    console.log('✅ Pestaña Descripción visible');

    // Cambiar a pestaña Contenido
    const contentTab = page.locator('button, [role="tab"]').filter({ hasText: /Contenido/i }).first();
    if (await contentTab.isVisible()) {
      await contentTab.click();
      await page.waitForTimeout(1500);
      console.log('✅ Pestaña Contenido seleccionada');
    }

    // Probar acordeón de módulos
    const moduleItems = page.locator('[class*="border"]').filter({ hasText: /Módulo|Unidad|Sección|Lección/i });
    const moduleCount = await moduleItems.count();
    console.log(`ℹ️ Módulos / Secciones encontrados: ${moduleCount}`);

    // Buscar una lección para entrar al Aula Virtual
    const lessonLink = page.locator('button, a, div.cursor-pointer').filter({
      hasText: /Lección|Video|Introducción|Patrón|Clase|Tema/i
    }).first();

    let enteredClassroom = false;
    if (await lessonLink.isVisible()) {
      console.log('▶️ Ingresando al Aula Virtual desde lección...');
      await lessonLink.click();
      try {
        await page.waitForURL(/\/learn\//, { timeout: 15000 });
        enteredClassroom = true;
        console.log('✅ Aula Virtual cargada exitosamente:', page.url());
      } catch {
        console.log('ℹ️ Probando con botón Hero...');
      }
    }

    // Si no entró por clic de lección, usar el botón principal del Hero
    if (!enteredClassroom) {
      const heroBtn = page.locator('button').filter({ hasText: /Comenzar|Continuar|Ver Aula|Aula/i }).first();
      if (await heroBtn.isVisible()) {
        await heroBtn.click();
        await page.waitForURL(/\/learn\//, { timeout: 15000 });
        enteredClassroom = true;
        console.log('✅ Aula Virtual cargada desde botón Hero:', page.url());
      }
    }

    if (enteredClassroom) {
      console.log('--- 4. Auditoría del Aula Virtual (Video Classroom) ---');
      await page.waitForTimeout(2000);

      // Verificar reproductor o contenedor de video
      const player = page.locator('video, app-classroom-player, iframe, [class*="video-js"], [class*="aspect-video"]').first();
      await expect(player).toBeVisible({ timeout: 15000 });
      console.log('✅ Reproductor de video presente y cargado');

      // Verificar playlist lateral
      const playlist = page.locator('app-classroom-playlist, [class*="playlist"], aside').first();
      if (await playlist.isVisible()) {
        console.log('✅ Playlist lateral de lecciones operativa');
      }

      // Probar botón de volver al curso
      const backBtn = page.locator('button, a').filter({ hasText: /Volver|Regresar/i }).first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForURL(/\/student\/course\//, { timeout: 15000 });
        console.log('✅ Retorno al detalle del curso exitoso');
      }
    }

    console.log('--- 5. Auditoría de la Pestaña Evaluaciones y Cuestionario ---');
    const evalTab = page.locator('button, [role="tab"]').filter({ hasText: /Evaluaciones/i }).first();
    if (await evalTab.isVisible()) {
      await evalTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Pestaña Evaluaciones seleccionada');

      const evalCards = page.locator('[class*="border"]').filter({ hasText: /Quiz|Examen|Evaluación|Puntos|Minutos|Intentos/i });
      const evalCount = await evalCards.count();
      console.log(`ℹ️ Evaluaciones encontradas en el curso: ${evalCount}`);

      if (evalCount > 0) {
        const startQuizBtn = page.locator('button').filter({ hasText: /Rendir|Iniciar|Comenzar|Resolver|Ver/i }).first();
        if (await startQuizBtn.isVisible() && await startQuizBtn.isEnabled()) {
          console.log('📝 Abriendo cuestionario / evaluación...');
          await startQuizBtn.click();
          await page.waitForTimeout(2000);

          const quizContainer = page.locator('app-quiz-take, [class*="quiz"], [role="dialog"]').first();
          if (await quizContainer.isVisible()) {
            console.log('✅ Interfaz de evaluación activa');

            const optionRadio = page.locator('input[type="radio"], [class*="cursor-pointer"]').filter({
              hasText: /A\)|B\)|C\)|Opción|Verdadero|Falso/i
            }).first();

            if (await optionRadio.isVisible()) {
              await optionRadio.click();
              console.log('✅ Pregunta respondida con éxito');
            }
          }
        }
      }
    }

    console.log('--- 6. Resumen de Estado de Consola ---');
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('NG81') && !e.includes('hydration'));
    if (criticalErrors.length > 0) {
      console.log('⚠️ Errores de consola detectados:', criticalErrors);
    } else {
      console.log('✅ Consola limpia de errores críticos');
    }
  });
});
