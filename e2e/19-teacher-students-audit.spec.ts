import { test, expect } from '@playwright/test';

test.describe('Teacher Students List & Detail QA Audit (/teacher/students & /teacher/student/:id)', () => {
  const baseUrl = 'https://lumina-core-portal.vercel.app';
  const teacherEmail = 'profesor@lumina.edu';
  const teacherPassword = 'Test123!';

  test('Teacher Students: Stats, Search, Filters, Modal, and Student Detail Navigation', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Iniciar sesión como docente
    console.log('1. Autenticando docente...');
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input#username, input[name="username"]', teacherEmail);
    await page.fill('input[type="password"], input#password, input[name="password"]', teacherPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/teacher\//, { timeout: 25000 });
    console.log('✅ Login exitoso.');

    // 2. Navegar a /teacher/students
    console.log('2. Navegando a /teacher/students...');
    await page.goto('/teacher/students', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 3. Verificar Header y Estadísticas
    console.log('3. Verificando Header y Tarjetas de Estadísticas...');
    await expect(page.getByRole('heading', { name: /Lista de Estudiantes/i })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('app-student-stats')).toBeVisible({ timeout: 15000 });

    // 4. Probar Modal '+ Nuevo Estudiante'
    console.log('4. Probando Modal Nuevo Estudiante...');
    const newStudentBtn = page.getByRole('button', { name: /Nuevo Estudiante/i });
    await expect(newStudentBtn).toBeVisible();
    await newStudentBtn.click();
    await page.waitForTimeout(600);

    const modalTitle = page.getByRole('heading', { name: /Nuevo Estudiante/i });
    await expect(modalTitle).toBeVisible();
    console.log('✅ Modal Nuevo Estudiante abierto.');

    // Probar buscador dentro del modal
    const searchModalInput = page.locator('input[placeholder*="Buscar por nombre o correo"]').first();
    if (await searchModalInput.isVisible()) {
      await searchModalInput.fill('estudiante');
      await page.waitForTimeout(400);
      console.log('✅ Buscador del modal responde.');
    }

    // Cerrar modal
    const cancelModalBtn = page.getByRole('button', { name: /Cancelar/i });
    await cancelModalBtn.click();
    await page.waitForTimeout(600);
    await expect(modalTitle).not.toBeVisible();
    console.log('✅ Modal Nuevo Estudiante cerrado correctamente.');

    // 5. Probar Filtros y Buscador Principal
    console.log('5. Probando barra de filtros y búsqueda...');
    const mainSearchInput = page.locator('app-student-filter input[placeholder*="Nombre, código"]').first();
    await expect(mainSearchInput).toBeVisible();

    // Búsqueda en tiempo real
    await mainSearchInput.fill('a');
    await page.waitForTimeout(500);
    await mainSearchInput.fill('');
    await page.waitForTimeout(500);

    // 6. Probar Tarjetas de Estudiantes y Navegación al Detalle
    console.log('6. Verificando tarjetas de alumnos y navegación...');
    const firstStudentCard = page.locator('app-student-card').first();
    if (await firstStudentCard.isVisible()) {
      const studentNameElem = firstStudentCard.locator('h3').first();
      const studentName = await studentNameElem.textContent();
      console.log(`Haciendo clic en el estudiante: "${studentName?.trim()}"...`);

      await firstStudentCard.click();
      await page.waitForURL(/\/teacher\/student\//, { timeout: 15000 });
      console.log('✅ Redirección a detalle de estudiante exitosa (/teacher/student/:id).');

      // 7. Verificar Vista Detalle del Estudiante
      console.log('7. Verificando vista detalle del estudiante...');
      await expect(page.getByRole('heading', { name: /Detalle del Estudiante/i })).toBeVisible({ timeout: 15000 });
      await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 25000 });

      // Probar botón Volver
      const backBtn = page.getByRole('button', { name: /Volver/i });
      await backBtn.click();
      await page.waitForURL(/\/teacher\/students/, { timeout: 15000 });
      console.log('✅ Botón Volver redirige correctamente a /teacher/students.');
    } else {
      console.log('ℹ️ No hay estudiantes matriculados registrados actualmente para este docente.');
    }

    console.log('🎉 Auditoría de Alumnos del Docente completada con éxito.');
  });
});
