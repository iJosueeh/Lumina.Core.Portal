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
    await expect(page.locator('app-course-hero')).toBeVisible({ timeout: 20000 });
    const backBtn = page.getByRole('button', { name: /Volver/i });
    await expect(backBtn).toBeVisible();

    // 4. Verificar pestaña 'Contenido y Alumnos'
    console.log('4. Verificando pestaña Contenido y Alumnos...');
    await expect(page.locator('app-course-curriculum')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('app-course-students')).toBeVisible({ timeout: 15000 });

    // 5. Probar botón "Crear Nueva Sección / Módulo"
    console.log('5. Probando botón Crear Nueva Sección / Módulo...');
    const createModuleBtn = page.getByRole('button', { name: /Crear Nueva Sección/i });
    if (await createModuleBtn.isVisible()) {
      await createModuleBtn.click();
      await page.waitForTimeout(600);
      const moduleHeading = page.getByRole('heading', { name: /Nueva Sección|Configurar Sección/i });
      await expect(moduleHeading).toBeVisible();
      console.log('✅ Modal de Nuevo Módulo abierto.');
      
      // Cerrar modal
      const cancelBtn = page.getByRole('button', { name: /Cancelar/i });
      await cancelBtn.click();
      await page.waitForTimeout(600);
      await expect(moduleHeading).not.toBeVisible();
      console.log('✅ Modal de Nuevo Módulo cerrado correctamente.');
    }

    // 6. Probar botón "Asignar Estudiante"
    console.log('6. Probando botón Asignar Estudiante...');
    const assignBtn = page.locator('app-course-students').getByRole('button', { name: /Asignar/i });
    if (await assignBtn.isVisible()) {
      await assignBtn.click();
      await page.waitForTimeout(600);
      const assignHeader = page.getByRole('heading', { name: /Asignar Estudiante|Matricular/i });
      await expect(assignHeader).toBeVisible();
      console.log('✅ Modal Asignar Estudiante abierto.');
      
      // Cerrar modal
      const closeAssignBtn = page.locator('app-assign-student-modal').getByRole('button', { name: /Cancelar|Cerrar/i });
      await closeAssignBtn.click();
      await page.waitForTimeout(600);
      await expect(assignHeader).not.toBeVisible();
      console.log('✅ Modal Asignar Estudiante cerrado correctamente.');
    }

    // 7. Cambiar a pestaña 'Evaluaciones'
    console.log('7. Cambiando a pestaña Evaluaciones...');
    const evalTab = page.getByRole('tab', { name: /Evaluaciones/i });
    await evalTab.click();
    await page.waitForTimeout(1000);

    // 8. Probar botón "Crear Evaluación"
    console.log('8. Probando botón Crear Evaluación...');
    const createEvalBtn = page.getByRole('button', { name: /Crear Evaluación/i });
    await expect(createEvalBtn).toBeVisible();
    await createEvalBtn.click();
    await page.waitForTimeout(600);
    const evalHeader = page.getByRole('heading', { name: /Nueva Evaluación|Crear Evaluación/i });
    await expect(evalHeader).toBeVisible();
    console.log('✅ Modal Crear Evaluación abierto.');

    // Cerrar modal
    const closeEvalBtn = page.locator('app-evaluacion-modal').getByRole('button', { name: /Cancelar/i });
    await closeEvalBtn.click();
    await page.waitForTimeout(600);
    await expect(evalHeader).not.toBeVisible();
    console.log('✅ Modal Crear Evaluación cerrado correctamente.');

    // 9. Verificar botón 'Volver'
    console.log('9. Probando botón Volver...');
    await backBtn.click();
    await page.waitForURL(/\/teacher\/(courses|dashboard)/, { timeout: 10000 });
    console.log('✅ Botón Volver redirige exitosamente');

    console.log('🎉 Todas las pruebas del curso docente completadas con éxito.');
  });
});
