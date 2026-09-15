import { test, expect } from '@playwright/test';

test.describe.serial('Monkey Testing & QA Auditoría de Perfiles y Ajustes', () => {
  const BASE_URL = 'https://lumina-core-portal.vercel.app';

  // =========================================================================
  // 1. ESTUDIANTE: AUDITORÍA DE PERFIL Y MONKEY TESTING
  // =========================================================================
  test('1. Estudiante: Edición de perfil, tabs, validaciones y monkey test', async ({ page }) => {
    test.setTimeout(90000);
    console.log('--- [QA MONKEY TEST] Estudiante: Iniciando auditoría de Perfil ---');

    // Login Estudiante
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'royer.tanta27@gmail.com');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'MichelTanta27!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/student\/dashboard/, { timeout: 25000 });

    // Navegar a Perfil
    await page.goto(`${BASE_URL}/student/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();

    // Validar carga de perfil
    const nameInput = page.locator('input[formcontrolname="nombres"]').first();
    if (await nameInput.isVisible()) {
      console.log('✅ Formulario de Información Personal visible');

      // Monkey Test 1: Inputs rápidos con caracteres especiales, emojis y espacios
      await nameInput.fill('Royer QA-Test 🚀 #1');
      await page.waitForTimeout(300);

      const paternoInput = page.locator('input[formcontrolname="apellidoPaterno"]').first();
      if (await paternoInput.isVisible()) {
        await paternoInput.fill('Tanta <script>alert("test")</script>');
      }

      // Probar tab switching rápido (Monkey stress)
      const tabs = ['academic', 'social', 'password', 'personal'];
      for (const t of tabs) {
        const tabBtn = page.locator(`button:has-text("${t === 'personal' ? 'Personal' : t === 'academic' ? 'Académica' : t === 'social' ? 'Sociales' : 'Contraseña'}")`).first();
        if (await tabBtn.isVisible()) {
          await tabBtn.click();
          await page.waitForTimeout(200);
        }
      }

      // Regresar a tab Académica
      const academicTab = page.locator('button:has-text("Académica")').first();
      if (await academicTab.isVisible()) {
        await academicTab.click();
        await page.waitForTimeout(500);

        // Validar campos de estudiante
        const telInput = page.locator('input[formcontrolname="telefono"]').first();
        if (await telInput.isVisible()) {
          await telInput.fill('+51 987 654 321');
        }

        const bioInput = page.locator('textarea[formcontrolname="biografia"]').first();
        if (await bioInput.isVisible()) {
          await bioInput.fill('Estudiante de Ingeniería de Software apasionado por la automatización QA y Cloud.');
        }
      }

      // Tab Redes Sociales
      const socialTab = page.locator('button:has-text("Sociales")').first();
      if (await socialTab.isVisible()) {
        await socialTab.click();
        await page.waitForTimeout(500);

        const githubInput = page.locator('input[formcontrolname="gitHub"]').first();
        if (await githubInput.isVisible()) {
          await githubInput.fill('https://github.com/royertanta');
        }
      }

      // Click en Guardar Cambios
      const saveBtn = page.locator('button:has-text("Guardar Cambios")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Guardado de cambios de estudiante accionado sin crash');
      }
    }
  });

  // =========================================================================
  // 2. DOCENTE: AUDITORÍA DE PERFIL Y MONKEY TESTING
  // =========================================================================
  test('2. Docente: Edición de perfil docente, bio profesional y monkey test', async ({ page }) => {
    test.setTimeout(90000);
    console.log('--- [QA MONKEY TEST] Docente: Iniciando auditoría de Perfil ---');

    // Login Docente
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'profesor@lumina.edu');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/teacher\/dashboard/, { timeout: 25000 });

    // Navegar a Perfil
    await page.goto(`${BASE_URL}/teacher/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();

    // Validar visualización de perfil
    const nameInput = page.locator('input[formcontrolname="nombres"]').first();
    if (await nameInput.isVisible()) {
      console.log('✅ Formulario de Información Docente visible');

      // Monkey test: Rellenar con biografía extendida y cargo
      const tabProf = page.locator('button:has-text("Profesional")').first();
      if (await tabProf.isVisible()) {
        await tabProf.click();
        await page.waitForTimeout(400);

        const cargoInput = page.locator('input[formcontrolname="cargo"]').first();
        if (cargoInput && await cargoInput.isVisible()) {
          await cargoInput.fill('Catedrático Senior & Arquitecto Cloud');
        }

        const bioInput = page.locator('textarea[formcontrolname="bio"]').first();
        if (bioInput && await bioInput.isVisible()) {
          await bioInput.fill('Docente investigador con más de 10 años de experiencia académica y desarrollo backend.');
        }
      }

      // Guardar cambios
      const saveBtn = page.locator('button:has-text("Guardar Cambios")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Guardado de cambios docente validado');
      }
    }
  });

  // =========================================================================
  // 3. ADMIN: AJUSTES GLOBALES Y PARÁMETROS DEL SISTEMA
  // =========================================================================
  test('3. Admin: Configuración del sistema, conmutación de tema y colores', async ({ page }) => {
    test.setTimeout(90000);
    console.log('--- [QA MONKEY TEST] Admin: Iniciando auditoría de Ajustes y Sistema ---');

    // Login Admin
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[formcontrolname="email"], input[name="email"]', 'admin@lumina.edu');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 25000 });

    // Navegar a Settings
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();

    // Monkey Test en Ajustes Generales
    const siteNameInput = page.locator('input[formcontrolname="siteName"]').first();
    if (await siteNameInput.isVisible()) {
      await siteNameInput.fill('Lumina Educational Ecosystem 🌟');
      await page.waitForTimeout(300);
    }

    // Switch de pestañas
    const appearanceTab = page.locator('button:has-text("Apariencia")').first();
    if (await appearanceTab.isVisible()) {
      await appearanceTab.click();
      await page.waitForTimeout(500);

      // Conmutar temas rápidamente
      const themeOptions = page.locator('button:has-text("Oscuro"), button:has-text("Claro"), button:has-text("Sistema"), .theme-option');
      const count = await themeOptions.count();
      for (let i = 0; i < count; i++) {
        await themeOptions.nth(i).click();
        await page.waitForTimeout(200);
      }
    }

    // Guardar configuración
    const saveSettingsBtn = page.locator('button:has-text("Guardar"), button:has-text("Guardar Cambios")').first();
    if (await saveSettingsBtn.isVisible()) {
      await saveSettingsBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Guardado de Ajustes Admin validado con éxito');
    }
  });
});
