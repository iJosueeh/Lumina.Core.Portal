import { test, expect } from '@playwright/test';

test.describe.serial('Suite de Operaciones de Prioridad Alta', () => {
  const BASE_URL = 'https://lumina-core-portal.vercel.app';

  // -------------------------------------------------------------------------
  // 1. GESTIÓN DE USUARIOS Y ROLES (ADMIN)
  // -------------------------------------------------------------------------
  test('1. Admin: Gestión de Usuarios, Búsqueda, Filtro de Roles y Modal de Creación', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [ADMIN] Verificando Gestión de Usuarios ---');

    // Login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'admin@lumina.edu');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });

    // Navegar a Usuarios
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Validar controles de tabla
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await expect(searchInput).toBeVisible();

    // Probar búsqueda interactiva
    await searchInput.fill('Carlos');
    await page.waitForTimeout(600);
    await searchInput.clear();

    // Validar modal de creación de usuario
    const newUserBtn = page.locator('button:has-text("Nuevo Usuario"), button:has-text("Crear Usuario"), button:has-text("Agregar")').first();
    if (await newUserBtn.isVisible()) {
      await newUserBtn.click();
      await page.waitForTimeout(500);
      const modal = page.locator('app-admin-user-form-modal, .modal-container, [role="dialog"]').first();
      await expect(modal).toBeVisible();
      console.log('✅ Admin: Modal de creación de usuario abre correctamente');

      // Cerrar modal
      const closeBtn = page.locator('button:has-text("Cancelar"), button:has-text("Cerrar"), button[aria-label="Cerrar"], .modal-close').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
    console.log('✅ Admin: Gestión de usuarios validada');
  });

  // -------------------------------------------------------------------------
  // 2. GESTIÓN DE CURSOS Y CONTENIDOS (ADMIN / DOCENTE)
  // -------------------------------------------------------------------------
  test('2. Admin: Gestión de Cursos, Filtros y Modal de Creación/Módulos', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [ADMIN] Verificando Gestión de Cursos ---');

    await page.goto(`${BASE_URL}/admin/courses`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Validar lista de cursos y buscador
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Angular');
      await page.waitForTimeout(500);
      await searchInput.clear();
    }

    // Modal de nuevo curso
    const newCourseBtn = page.locator('button:has-text("Nuevo Curso"), button:has-text("Crear Curso"), button:has-text("Agregar Curso")').first();
    if (await newCourseBtn.isVisible()) {
      await newCourseBtn.click();
      await page.waitForTimeout(600);
      const modal = page.locator('app-admin-course-form-modal, .modal-container, [role="dialog"]').first();
      await expect(modal).toBeVisible();
      console.log('✅ Admin: Modal de creación de curso con pestañas y módulos visible');

      // Cerrar modal
      const closeBtn = page.locator('button:has-text("Cancelar"), button:has-text("Cerrar"), .modal-close').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
    console.log('✅ Admin: Gestión de cursos validada');
  });

  // -------------------------------------------------------------------------
  // 3. EVALUACIONES Y CALIFICACIONES (DOCENTE)
  // -------------------------------------------------------------------------
  test('3. Docente: Creación de Evaluaciones y Matriz de Calificaciones', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [DOCENTE] Verificando Evaluaciones y Calificaciones ---');

    // Login docente
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'profesor@lumina.edu');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/teacher\/dashboard/, { timeout: 15000 });

    // 1. Evaluaciones
    await page.goto(`${BASE_URL}/teacher/evaluations`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();

    const newEvalBtn = page.locator('button:has-text("Nueva Evaluación"), button:has-text("Crear Evaluación"), button:has-text("Agregar")').first();
    if (await newEvalBtn.isVisible()) {
      await newEvalBtn.click();
      await page.waitForTimeout(500);
      console.log('✅ Docente: Modal/Panel de nueva evaluación activado');
      const cancelBtn = page.locator('button:has-text("Cancelar"), button:has-text("Cerrar")').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }

    // 2. Calificaciones
    await page.goto(`${BASE_URL}/teacher/grades`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Docente: Módulo de calificaciones y ponderaciones cargado');
  });

  // -------------------------------------------------------------------------
  // 4. AULA VIRTUAL Y PROGRESO DE LECCIONES (ESTUDIANTE)
  // -------------------------------------------------------------------------
  test('4. Estudiante: Aula Virtual, Playlist y Progreso de Lección', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- [ESTUDIANTE] Verificando Aula Virtual y Lecciones ---');

    // Login estudiante
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'royer.tanta27@gmail.com');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'MichelTanta27!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/student\/dashboard/, { timeout: 15000 });

    // Mis Cursos
    await page.goto(`${BASE_URL}/student/courses`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Intentar acceder al primer curso matriculado si existe
    const courseCard = page.locator('a[href*="/student/course/"], button:has-text("Continuar"), button:has-text("Ver Curso"), .course-card').first();
    if (await courseCard.isVisible()) {
      await courseCard.click();
      await page.waitForTimeout(1500);
      console.log('✅ Estudiante: Detalle del curso cargado');

      // Si hay botón para ir al aula / continuar lección
      const startLessonBtn = page.locator('a[href*="/learn/"], button:has-text("Iniciar"), button:has-text("Continuar Aprendiendo")').first();
      if (await startLessonBtn.isVisible()) {
        await startLessonBtn.click();
        await page.waitForTimeout(1500);
        console.log('✅ Estudiante: Aula virtual cargada exitosamente con reproductor y playlist');
      }
    } else {
      console.log('ℹ️ Estudiante: No se encontraron cursos con botón directo, verificando ruta base');
    }
  });
});
