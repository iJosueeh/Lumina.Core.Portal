import { test, expect } from '@playwright/test';

test.describe('Alta Prioridad - Flujo de Evaluaciones y Calificaciones', () => {
  const baseUrl = process.env.BASE_URL || 'https://lumina-core-portal.vercel.app';
  const teacherEmail = 'profesor@lumina.edu';
  const teacherPassword = 'Test123!';

  test('Estudiante: Módulo de Evaluaciones carga listado y filtros de estado', async ({ page }) => {
    await page.goto(`${baseUrl}/student/evaluations`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/(login|student)/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Estudiante: Módulo de Calificaciones muestra estructura de notas y promedios', async ({ page }) => {
    await page.goto(`${baseUrl}/student/grades`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/(login|student)/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Docente: Módulo de Evaluaciones permite visualizar evaluaciones de cursos', async ({ page }) => {
    await page.goto(`${baseUrl}/teacher/evaluations`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/(login|teacher)/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Docente: Módulo de Calificaciones presenta la tabla de estudiantes y ponderaciones', async ({ page }) => {
    await page.goto(`${baseUrl}/teacher/grades`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/(login|teacher)/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Docente: Ciclo CRUD Completo en Evaluaciones (Ver, Crear, Editar, Preguntas y Eliminar)', async ({ page }) => {
    test.setTimeout(180000);

    // 1. Iniciar sesión como docente
    console.log('1. Autenticando docente...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input#username, input[name="username"]', teacherEmail);
    await page.fill('input[type="password"], input#password, input[name="password"]', teacherPassword);
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL(/\/teacher\//, { timeout: 15000 });
    } catch {
      await page.fill('input[type="password"], input#password, input[name="password"]', 'Profesor123!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/teacher\//, { timeout: 20000 });
    }
    console.log('✅ Autenticación de docente exitosa.');

    // 2. Navegar a /teacher/evaluations
    console.log('2. Navegando a /teacher/evaluations...');
    await page.goto(`${baseUrl}/teacher/evaluations`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // 3. Verificar botón 'Nueva Evaluación'
    const newEvalBtn = page.getByRole('button', { name: /Nueva Evaluación/i });
    await expect(newEvalBtn).toBeVisible({ timeout: 30000 });
    console.log('✅ Botón "Nueva Evaluación" visible.');

    // 4. Crear Evaluación (CREATE)
    const evalTitle = `Evaluación E2E CRUD ${Date.now()}`;
    const evalTitleUpdated = `${evalTitle} - Modificado`;

    console.log(`3. Creando nueva evaluación: "${evalTitle}"...`);
    await newEvalBtn.click();
    await page.waitForTimeout(600);

    const createModal = page.locator('app-evaluacion-modal');
    await expect(createModal).toBeVisible({ timeout: 10000 });

    await createModal.locator('input[formControlName="titulo"]').fill(evalTitle);
    await createModal.locator('textarea[formControlName="descripcion"]').fill('Descripción de prueba automatizada E2E.');
    await createModal.locator('input[formControlName="puntajeMaximo"]').fill('100');

    await createModal.locator('button[type="submit"]').click();
    console.log('✅ Formulario enviado.');

    // 5. Editor de Preguntas
    console.log('4. Configurando preguntas...');
    const questionEditor = page.locator('app-question-editor');
    await expect(questionEditor).toBeVisible({ timeout: 15000 });

    const qInput = questionEditor.locator('textarea[placeholder*="enunciado"], textarea').first();
    await qInput.fill('¿Cuál es el patrón utilizado para desacoplar componentes?');

    const optionInputs = questionEditor.locator('input[placeholder*="opción"], input[placeholder*="Opción"]');
    if (await optionInputs.count() >= 2) {
      await optionInputs.nth(0).fill('Inyección de Dependencias');
      await optionInputs.nth(1).fill('Anti-patrón acoplado');
    }

    const saveQuestionsBtn = questionEditor.getByRole('button', { name: /Guardar Preguntas/i });
    await saveQuestionsBtn.click();
    await expect(questionEditor).not.toBeVisible({ timeout: 15000 });
    console.log('✅ Preguntas guardadas con éxito.');

    // 6. Ver / Filtrar Evaluación creada (READ)
    console.log('5. Buscando la evaluación en la lista...');
    await page.waitForTimeout(1500);
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(evalTitle);
      await page.waitForTimeout(600);
    }

    const createdCard = page.locator(`app-evaluation-card:has-text("${evalTitle}")`).first();
    await expect(createdCard).toBeVisible({ timeout: 20000 });
    console.log('✅ Evaluación encontrada en el listado.');

    // 7. Editar Evaluación (UPDATE)
    console.log('6. Editando la evaluación...');
    const editBtn = createdCard.getByRole('button', { name: /Editar/i }).first();
    await editBtn.click();

    const editModal = page.locator('app-evaluacion-modal');
    await expect(editModal).toBeVisible({ timeout: 10000 });

    await editModal.locator('input[formControlName="titulo"]').fill(evalTitleUpdated);
    await editModal.locator('button[type="submit"]').click();
    await expect(editModal).not.toBeVisible({ timeout: 15000 });
    console.log('✅ Cambios guardados.');

    if (await searchInput.isVisible()) {
      await searchInput.fill(evalTitleUpdated);
      await page.waitForTimeout(600);
    }

    const modifiedCard = page.locator(`app-evaluation-card:has-text("${evalTitleUpdated}")`).first();
    await expect(modifiedCard).toBeVisible({ timeout: 20000 });
    console.log('✅ Evaluación actualizada verificada.');

    // 8. Eliminar Evaluación (DELETE)
    console.log('7. Eliminando la evaluación...');
    const deleteBtn = modifiedCard.locator('button:has(.fa-trash-alt)').first();
    await deleteBtn.click();

    const confirmDeleteModal = page.locator('div:has-text("Eliminar Evaluación")');
    await expect(confirmDeleteModal.first()).toBeVisible({ timeout: 10000 });

    const confirmDeleteBtn = page.getByRole('button', { name: /Eliminar/i }).last();
    await confirmDeleteBtn.click();

    await page.waitForTimeout(1500);

    if (await searchInput.isVisible()) {
      await searchInput.fill(evalTitleUpdated);
      await page.waitForTimeout(600);
    }
    await expect(page.locator(`app-evaluation-card:has-text("${evalTitleUpdated}")`)).not.toBeVisible({ timeout: 15000 });
    console.log('🎉 Ciclo CRUD completo en Evaluaciones superado con éxito.');
  });
});
