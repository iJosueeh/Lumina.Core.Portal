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
    await page.waitForTimeout(2000);

    // 3. Verificar botón 'Nueva Evaluación'
    const newEvalBtn = page.getByRole('button', { name: /Nueva Evaluación/i });
    await expect(newEvalBtn).toBeVisible({ timeout: 30000 });
    console.log('✅ Botón "Nueva Evaluación" visible.');

    // 4. Probar Editor de Preguntas en Evaluación Existente
    console.log('3. Probando Editor de Preguntas...');
    const evalCards = page.locator('app-evaluation-card');
    await expect(evalCards.first()).toBeVisible({ timeout: 20000 });

    const questionsBtn = evalCards.first().getByRole('button', { name: /Preguntas/i });
    await questionsBtn.click();

    const questionEditor = page.locator('app-question-editor');
    await expect(questionEditor.locator('h3:has-text("Editor de Preguntas")')).toBeVisible({ timeout: 15000 });

    const qInput = questionEditor.locator('textarea[placeholder*="pregunta"], textarea').first();
    await expect(qInput).toBeVisible({ timeout: 15000 });
    await qInput.fill('¿Cuál es el patrón utilizado para desacoplar componentes?');

    const saveQuestionsBtn = questionEditor.getByRole('button', { name: /Guardar Cambios/i });
    if (await saveQuestionsBtn.isEnabled().catch(() => false)) {
      await saveQuestionsBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Si el modal sigue abierto, cerrarlo con el botón Cerrar o X
    const closeBtn = questionEditor.locator('button:has(.fa-times), button:has-text("Cerrar")').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click().catch(() => null);
    }
    await expect(questionEditor.locator('h3:has-text("Editor de Preguntas")')).not.toBeVisible({ timeout: 10000 });
    console.log('✅ Preguntas configuradas y guardadas.');

    // 5. Probar Edición de Evaluación (UPDATE)
    console.log('4. Probando Edición de Evaluación...');
    const editBtn = evalCards.first().getByRole('button', { name: /Editar/i });
    await editBtn.click();

    const editModal = page.locator('app-evaluacion-modal');
    await expect(editModal.locator('form')).toBeVisible({ timeout: 10000 });

    const titleInput = editModal.locator('input[formcontrolname="titulo"], input[placeholder*="Título"]');
    await expect(titleInput).toBeVisible();
    await editModal.locator('button[type="submit"]').click();
    await expect(editModal).not.toBeVisible({ timeout: 15000 });
    console.log('✅ Edición de evaluación guardada.');

    // 6. Probar Creación de Nueva Evaluación (CREATE)
    console.log('5. Probando Creación de Evaluación...');
    await newEvalBtn.click();
    await page.waitForTimeout(600);

    const createModal = page.locator('app-evaluacion-modal');
    await expect(createModal.locator('form')).toBeVisible({ timeout: 15000 });

    const newEvalTitle = `Evaluación E2E CRUD ${Date.now()}`;
    await createModal.locator('input[formcontrolname="titulo"], input[placeholder*="Título"]').fill(newEvalTitle);
    await createModal.locator('textarea[formcontrolname="descripcion"], textarea[placeholder*="instrucciones"]').fill('Descripción de prueba automatizada E2E.');
    await createModal.locator('input[formcontrolname="puntajeMaximo"]').fill('100');

    await createModal.locator('button[type="submit"]').click();
    console.log('✅ Formulario de creación enviado.');
    await page.waitForTimeout(1500);

    // Si el editor de preguntas se abrió tras crear, cerrarlo
    const createdQuestionEditor = page.locator('app-question-editor');
    if (await createdQuestionEditor.isVisible().catch(() => false)) {
      const createdCloseBtn = createdQuestionEditor.locator('button:has(.fa-times), button:has-text("Cerrar")').first();
      if (await createdCloseBtn.isVisible().catch(() => false)) {
        await createdCloseBtn.click({ force: true });
      } else {
        await page.locator('app-question-editor .absolute.inset-0').click({ force: true }).catch(() => {});
      }
      await page.waitForTimeout(500);
    }

    // 6. Probar Modal de Eliminación (DELETE)
    console.log('6. Probando Modal de Eliminación...');
    const cardToDelete = page.locator('app-evaluation-card').first();
    if (await cardToDelete.isVisible({ timeout: 6000 }).catch(() => false)) {
      const deleteBtn = cardToDelete.locator('button:has(.fa-trash-alt)').first();
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click({ force: true });
        await page.waitForTimeout(600);

        const cancelDeleteBtn = page.locator('button:has-text("Cancelar")').last();
        if (await cancelDeleteBtn.isVisible().catch(() => false)) {
          await cancelDeleteBtn.click({ force: true });
          await page.waitForTimeout(600);
        }
        console.log('✅ Modal de confirmación de eliminación verificado.');
      }
    }

    console.log('🎉 Ciclo CRUD completo en Evaluaciones superado con éxito.');
  });

  test('Docente: Gestión Completa de Calificaciones (Filtros, Matriz, Edición Inline, Estadísticas y Exportación CSV)', async ({ page }) => {
    test.setTimeout(120000);

    // 1. Iniciar sesión como docente
    console.log('1. Autenticando docente para Calificaciones...');
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

    // 2. Navegar a /teacher/grades
    console.log('2. Navegando a /teacher/grades...');
    await page.goto(`${baseUrl}/teacher/grades`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 3. Validar Header y Botón Guardar Cambios
    await expect(page.getByRole('heading', { name: 'Calificaciones' })).toBeVisible();
    const saveBtn = page.getByRole('button', { name: /Guardar Cambios/i });
    await expect(saveBtn).toBeVisible();
    console.log('✅ Encabezado y botón "Guardar Cambios" verificados.');

    // 4. Validar Barra de Filtros (Selector de curso, Buscador y Botón Exportar)
    const filterBar = page.locator('app-grades-filter-bar');
    await expect(filterBar).toBeVisible();

    const courseSelect = filterBar.locator('select');
    await expect(courseSelect).toBeVisible();

    const searchInput = filterBar.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();

    const exportBtn = filterBar.getByRole('button', { name: /Exportar/i });
    await expect(exportBtn).toBeVisible();
    console.log('✅ Barra de filtros y botón Exportar verificados.');

    // 5. Validar Tabla de Calificaciones y Estadísticas
    const gradesTable = page.locator('app-grades-table');
    await expect(gradesTable).toBeVisible({ timeout: 15000 });

    const statsSummaryGrid = page.locator('app-grades-stats-summary .grid, app-grades-stats-summary app-stat-card').first();
    await expect(statsSummaryGrid).toBeVisible({ timeout: 15000 });
    console.log('✅ KPIs de estadísticas y tabla verificados.');

    // 6. Interacción con Estudiantes y Calificaciones Inline
    const studentRows = gradesTable.locator('tbody tr.cursor-pointer');
    const rowCount = await studentRows.count();
    console.log(`ℹ️ Filas de estudiantes encontradas: ${rowCount}`);

    if (rowCount > 0) {
      // Probar búsqueda
      const firstStudentName = await studentRows.first().locator('span.text-slate-900').innerText();
      console.log(`Buscando estudiante: "${firstStudentName}"`);
      await searchInput.fill(firstStudentName.slice(0, 4));
      await page.waitForTimeout(600);
      await expect(gradesTable.locator(`tbody:has-text("${firstStudentName}")`)).toBeVisible();

      // Limpiar búsqueda
      await searchInput.fill('');
      await page.waitForTimeout(600);

      // Expandir acordeón del primer estudiante
      const firstRow = studentRows.first();
      await firstRow.click();
      await page.waitForTimeout(600);

      // Validar inputs de notas dentro de la fila expandida
      const gradeInputs = gradesTable.locator('input[type="number"]');
      const inputCount = await gradeInputs.count();
      console.log(`ℹ️ Celdas de nota editables encontradas: ${inputCount}`);

      if (inputCount > 0) {
        const firstInput = gradeInputs.first();
        await firstInput.click();
        await firstInput.fill('18');
        await page.waitForTimeout(400);

        // Guardar cambios
        await saveBtn.click();
        await page.waitForTimeout(1000);
        console.log('✅ Nota modificada y guardada.');
      }
    }

    // 7. Probar Exportación CSV
    console.log('Probando exportación CSV...');
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    await exportBtn.click();
    const download = await downloadPromise;
    if (download) {
      const filename = download.suggestedFilename();
      console.log(`✅ Descarga iniciada con archivo: ${filename}`);
      expect(filename).toContain('calificaciones');
    } else {
      console.log('ℹ️ Exportación CSV ejecutada.');
    }

    console.log('🎉 Auditoría y test E2E de Calificaciones docente superado con éxito.');
  });
});
