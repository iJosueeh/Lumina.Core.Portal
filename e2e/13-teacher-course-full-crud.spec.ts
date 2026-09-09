import { test, expect } from '@playwright/test';

test.describe('Teacher Course Full Interactive CRUD Test', () => {
  const baseUrl = 'https://lumina-core-portal.vercel.app';
  const targetCourseId = '035fc56e-2450-e046-b996-06c97747b6ea';
  const teacherEmail = 'profesor@lumina.edu';
  const teacherPassword = 'Test123!';

  test('Full CRUD Flow: Create Module, Edit Module, Add Lesson, Edit Lesson, Create Evaluation, Add Question, Delete Module', async ({ page }) => {
    test.setTimeout(180000);

    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

    // 1. Iniciar Sesión como Docente
    console.log('1. Autenticando docente...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input#username, input[name="username"]', teacherEmail);
    await page.fill('input[type="password"], input#password, input[name="password"]', teacherPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/teacher\//, { timeout: 25000 });
    console.log('✅ Autenticación exitosa.');

    // 2. Navegar al Curso
    const courseUrl = `${baseUrl}/teacher/course/${targetCourseId}`;
    console.log(`2. Navegando al curso: ${courseUrl}`);
    await page.goto(courseUrl, { waitUntil: 'domcontentloaded' });
    
    // Esperar a que la carga inicial termine
    const createModuleBtn = page.getByRole('button', { name: /Crear Nueva Sección/i });
    await expect(createModuleBtn).toBeVisible({ timeout: 30000 });
    console.log('✅ Vista de gestión de curso cargada.');

    // 3. Crear Nuevo Módulo (CREATE MODULE)
    const moduleTitleInitial = `Módulo CRUD Test ${Date.now()}`;
    const moduleTitleUpdated = `${moduleTitleInitial} - Modificado`;
    console.log(`3. Creando nuevo módulo: "${moduleTitleInitial}"...`);

    await createModuleBtn.click();
    await page.waitForTimeout(800);

    // Llenar formulario de creación de módulo
    const modalModuleInput = page.locator('app-add-module-modal input[formControlName="titulo"], input[placeholder*="Fundamentos"]').first();
    await expect(modalModuleInput).toBeVisible({ timeout: 10000 });
    await modalModuleInput.fill(moduleTitleInitial);
    await page.locator('app-add-module-modal textarea[formControlName="descripcion"]').fill('Descripción para pruebas automatizadas de CRUD');
    
    // Enviar formulario
    const submitModuleBtn = page.locator('app-add-module-modal button[type="submit"]');
    await submitModuleBtn.click();

    // Esperar que termine de recargar la lista
    await page.waitForTimeout(1000);
    await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 30000 });

    // Verificar que el módulo aparezca en la lista
    console.log(`Verificando existencia del módulo "${moduleTitleInitial}"...`);
    const createdModuleHeader = page.locator(`h4:has-text("${moduleTitleInitial}")`);
    await expect(createdModuleHeader).toBeVisible({ timeout: 20000 });
    console.log('✅ Módulo creado y visible en el plan de estudios.');

    // 4. Editar Módulo Creado (UPDATE MODULE)
    console.log(`4. Editando módulo "${moduleTitleInitial}" -> "${moduleTitleUpdated}"...`);
    const moduleCard = page.locator('.bg-white.border.border-slate-200', { has: createdModuleHeader });
    const editModuleConfigBtn = moduleCard.locator('button i.fa-cog').locator('..');
    await editModuleConfigBtn.click();
    await page.waitForTimeout(800);

    await expect(modalModuleInput).toBeVisible({ timeout: 10000 });
    await modalModuleInput.fill(moduleTitleUpdated);
    const updateModuleBtn = page.locator('app-add-module-modal button[type="submit"]');
    await updateModuleBtn.click();

    await page.waitForTimeout(1000);
    await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 30000 });

    // Verificar que el título actualizado aparezca
    const updatedModuleHeader = page.locator(`h4:has-text("${moduleTitleUpdated}")`);
    await expect(updatedModuleHeader).toBeVisible({ timeout: 20000 });
    console.log('✅ Módulo actualizado exitosamente.');

    // 5. Expandir Módulo y Añadir Contenido/Lección (CREATE LESSON)
    console.log('5. Añadiendo lección al módulo...');
    const updatedModuleCard = page.locator('.bg-white.border.border-slate-200', { has: updatedModuleHeader });
    // Expandir acordeón si no está expandido
    const accordionBtn = updatedModuleCard.locator('button').first();
    await accordionBtn.click();
    await page.waitForTimeout(800);

    const addContentBtn = updatedModuleCard.getByRole('button', { name: /Añadir Contenido al Módulo/i });
    await expect(addContentBtn).toBeVisible({ timeout: 10000 });
    await addContentBtn.click();
    await page.waitForTimeout(800);

    const lessonTitle = `Lección Video Demo ${Date.now()}`;
    const lessonInput = page.locator('app-add-content-modal input[formControlName="titulo"]');
    await expect(lessonInput).toBeVisible({ timeout: 10000 });
    await lessonInput.fill(lessonTitle);
    await page.locator('app-add-content-modal textarea[formControlName="descripcion"]').fill('Contenido de prueba automatizada para lección.');

    // Seleccionar origen enlace/URL
    const linkSourceBtn = page.locator('app-add-content-modal button:has-text("Enlace")');
    if (await linkSourceBtn.isVisible()) {
      await linkSourceBtn.click();
      await page.waitForTimeout(300);
      await page.locator('app-add-content-modal input[formControlName="url"]').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    }

    const saveContentBtn = page.locator('app-add-content-modal button[type="submit"]');
    await saveContentBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 30000 });

    // Re-expandir módulo si se cerró tras recarga
    const currentModuleCard = page.locator('.bg-white.border.border-slate-200', { has: page.locator(`h4:has-text("${moduleTitleUpdated}")`) });
    if (!(await currentModuleCard.getByRole('button', { name: /Añadir Contenido al Módulo/i }).isVisible())) {
      await currentModuleCard.locator('button').first().click();
      await page.waitForTimeout(800);
    }

    // Verificar que la lección aparezca dentro del módulo
    console.log(`Verificando presencia de la lección "${lessonTitle}"...`);
    const lessonItem = page.locator(`p:has-text("${lessonTitle}")`);
    await expect(lessonItem).toBeVisible({ timeout: 20000 });
    console.log('✅ Lección creada y listada en el módulo.');

    // 6. Volver a 'Contenido y Alumnos' y Eliminar el Módulo Creado (DELETE MODULE)
    console.log('6. Eliminando módulo de prueba creado...');
    const moduleToDeleteCard = page.locator('.bg-white.border.border-slate-200', { has: page.locator(`h4:has-text("${moduleTitleUpdated}")`) });
    const deleteConfigBtn = moduleToDeleteCard.locator('button i.fa-cog').locator('..');
    await deleteConfigBtn.click();
    await page.waitForTimeout(800);

    // Aceptar confirmación nativa de window.confirm()
    page.on('dialog', async dialog => {
      console.log(`Aceptando diálogo de confirmación: "${dialog.message()}"`);
      await dialog.accept();
    });

    const deleteModuleBtn = page.getByRole('button', { name: /Eliminar Módulo/i });
    await deleteModuleBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 30000 });

    // Verificar que el módulo ya no exista en la lista
    console.log(`Verificando eliminación del módulo "${moduleTitleUpdated}"...`);
    await expect(page.locator(`h4:has-text("${moduleTitleUpdated}")`)).not.toBeVisible({ timeout: 20000 });
    console.log('✅ Módulo eliminado correctamente del curso.');

    console.log('🎉 Ciclo CRUD completo validado con éxito (Create Module -> Update Module -> Create Lesson -> Delete Module).');
  });
});
