import { test, expect } from '@playwright/test';

test.describe('Teacher Course Management (/teacher/course/:id) Verification', () => {
  const baseUrl = 'https://lumina-core-portal.vercel.app';
  const targetCourseId = '035fc56e-2450-e046-b996-06c97747b6ea';
  const teacherEmail = 'profesor@lumina.edu';
  const teacherPassword = 'Test123!';

  test('Teacher Course Management: Tabs, Modals, Buttons, Modules verification', async ({ page }) => {
    test.setTimeout(90000);

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Login as Teacher
    console.log('1. Navegando a /login...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input#username, input[name="username"]', teacherEmail);
    await page.fill('input[type="password"], input#password, input[name="password"]', teacherPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/teacher\//, { timeout: 25000 });
    console.log('✅ Login exitoso');

    // 2. Navegar a la página del curso docente
    const courseUrl = `${baseUrl}/teacher/course/${targetCourseId}`;
    console.log(`2. Navegando a ${courseUrl}...`);
    await page.goto(courseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 3. Verificar Header / Hero
    console.log('3. Verificando Header Hero...');
    await expect(page.locator('app-course-hero')).toBeVisible();
    const backBtn = page.locator('app-course-hero button:has-text("Volver")');
    await expect(backBtn).toBeVisible();

    // 4. Verificar pestaña 'Contenido y Alumnos'
    console.log('4. Verificando pestaña Contenido y Alumnos...');
    await expect(page.locator('app-course-curriculum')).toBeVisible();
    await expect(page.locator('app-course-students')).toBeVisible();

    // 5. Probar botón "Crear Nueva Sección / Módulo"
    console.log('5. Probando botón Crear Nueva Sección / Módulo...');
    const createModuleBtn = page.locator('button:has-text("Crear Nueva Sección / Módulo")');
    if (await createModuleBtn.isVisible()) {
      await createModuleBtn.click();
      await page.waitForTimeout(600);
      const moduleTitle = page.locator('text=Nueva Sección, text=Configurar Sección');
      await expect(moduleTitle.first()).toBeVisible();
      console.log('✅ Modal de Nuevo Módulo abierto.');
      
      // Cerrar modal
      const cancelBtn = page.locator('button:has-text("Cancelar"), app-add-module-modal button i.fa-times');
      await cancelBtn.first().click();
      await page.waitForTimeout(600);
      console.log('✅ Modal de Nuevo Módulo cerrado correctamente.');
    }

    // 6. Probar botón "Asignar Estudiante"
    console.log('6. Probando botón Asignar Estudiante...');
    const assignBtn = page.locator('app-course-students button:has-text("Asignar")');
    if (await assignBtn.isVisible()) {
      await assignBtn.click();
      await page.waitForTimeout(600);
      const assignHeader = page.locator('text=Asignar Estudiante, text=Matricular');
      await expect(assignHeader.first()).toBeVisible();
      console.log('✅ Modal Asignar Estudiante abierto.');
      
      // Cerrar modal
      const closeAssignBtn = page.locator('app-assign-student-modal button:has-text("Cancelar"), app-assign-student-modal button i.fa-times');
      await closeAssignBtn.first().click();
      await page.waitForTimeout(600);
      console.log('✅ Modal Asignar Estudiante cerrado correctamente.');
    }

    // 7. Cambiar a pestaña 'Evaluaciones'
    console.log('7. Cambiando a pestaña Evaluaciones...');
    const evalTabBtn = page.locator('app-tab-nav button:has-text("Evaluaciones")');
    await evalTabBtn.click();
    await page.waitForTimeout(1000);

    // 8. Probar botón "Crear Evaluación"
    console.log('8. Probando botón Crear Evaluación...');
    const createEvalBtn = page.locator('button:has-text("Crear Evaluación")');
    await expect(createEvalBtn).toBeVisible();
    await createEvalBtn.click();
    await page.waitForTimeout(600);
    const evalHeader = page.locator('text=Nueva Evaluación, text=Crear Evaluación');
    await expect(evalHeader.first()).toBeVisible();
    console.log('✅ Modal Crear Evaluación abierto.');

    // Cerrar modal
    const closeEvalBtn = page.locator('app-evaluacion-modal button:has-text("Cancelar"), app-evaluacion-modal button i.fa-times');
    await closeEvalBtn.first().click();
    await page.waitForTimeout(600);
    console.log('✅ Modal Crear Evaluación cerrado correctamente.');

    // 9. Verificar botón 'Volver'
    console.log('9. Probando botón Volver...');
    await backBtn.click();
    await page.waitForURL(/\/teacher\/dashboard/, { timeout: 10000 });
    console.log('✅ Botón Volver redirige exitosamente a /teacher/dashboard');

    console.log('🎉 Todas las pruebas del curso docente completadas con éxito.');
  });
});
