import { test, expect } from '@playwright/test';

test.describe('Verificación de Notificaciones y Errores en Matrícula (Lumina.Web)', () => {
  const WEB_URL = 'https://lumina-web-seven-beta.vercel.app';
  const COURSE_ID = 'b297e9d9-9205-4616-b044-6462cc211beb';

  test('1. Credenciales inválidas en Matrícula: No redirige a Home y muestra alerta clara', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- Iniciando prueba de login con credenciales erróneas en Matrícula ---');

    // 1. Ir a la página de matrícula
    await page.goto(`${WEB_URL}/cursos/matricula/${COURSE_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Asegurarse de que esté visible el formulario de login
    const emailInput = page.locator('#loginEmail, input[formcontrolname="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 15000 });

    // 2. Ingresar credenciales incorrectas
    await emailInput.fill('usuario.invalido@lumina.edu');
    const passwordInput = page.locator('#loginPassword, input[formcontrolname="password"]').first();
    await passwordInput.fill('ContraseñaEquivocada999!');

    // 3. Enviar formulario
    const submitBtn = page.locator('button[type="submit"]:has-text("Iniciar Sesión")').first();
    await submitBtn.click();

    // 4. Esperar respuesta
    await page.waitForTimeout(2500);

    // 5. VALIDACIÓN CRÍTICA:
    // a) La URL NO debe ser /home ni cambiar a la raíz
    const currentUrl = page.url();
    console.log('URL actual tras login fallido:', currentUrl);
    expect(currentUrl).toContain('/cursos/matricula');
    expect(currentUrl).not.toContain('/home');

    // b) El mensaje de alerta debe estar visible en pantalla
    const alertBox = page.getByRole('alert').or(page.locator('.bg-red-50, .error-snackbar')).first();
    await expect(alertBox).toBeVisible({ timeout: 10000 });
    const alertText = await alertBox.textContent();
    console.log('✅ Alerta visible en pantalla:', alertText?.trim());
  });

  test('2. Validación de campos incompletos en Registro de Matrícula: Muestra advertencia', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- Iniciando prueba de validación de campos en Registro de Matrícula ---');

    await page.goto(`${WEB_URL}/cursos/matricula/${COURSE_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Cambiar a pestaña Crear Cuenta
    const registerTab = page.locator('#tab-register, button:has-text("Crear Cuenta")').first();
    await registerTab.click();
    await page.waitForTimeout(500);

    // Intentar enviar sin llenar
    const submitBtn = page.locator('#panel-register button[type="submit"]').first();
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // Debe permanecer en la misma página de matrícula
    expect(page.url()).toContain('/cursos/matricula');

    // Validar advertencias de campos requeridos (tanto en banner como en campos individuales)
    const errorMsg = page.locator('[role="alert"], p:has-text("Por favor"), p:has-text("requerido")').first();
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
    const text = await errorMsg.textContent();
    console.log('✅ Validación de campos requeridos notificada correctamente:', text?.trim());
  });
});
