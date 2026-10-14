import { test, expect } from 'playwright/test';
import fs from 'fs';
import path from 'path';

const CAPTURES_DIR = path.resolve(process.cwd(), '../documentation/pruebas_roles/capturas');

test.describe('Asistente de Inteligencia Artificial y Diagnóstico de Modelos', () => {

  test('05.1 - Modal de vinculación y estado del Asistente en Telegram', async ({ page }) => {
    // 1. Iniciar sesión como ADMIN
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@panaderia.com');
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(500);
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 15000 });

    // 2. Localizar y pulsar el botón del Asistente en el encabezado
    const assistantBtn = page.locator('button[aria-label*="Telegram"], button:has-text("Telegram")').first();
    await expect(assistantBtn).toBeVisible({ timeout: 10000 });
    await assistantBtn.click();
    await page.waitForTimeout(2000);

    // 3. Capturar el modal de vinculación e interacción con el bot
    await page.screenshot({ path: path.join(CAPTURES_DIR, '05_asistente_modal_telegram.png') });

    // 4. Verificar texto del modal
    const modalContent = await page.textContent('[role="dialog"]');
    expect(modalContent?.toLowerCase()).toContain('telegram');
  });

  test('05.2 - Diagnóstico técnico de proveedores LLM en Configuración', async ({ page }) => {
    // Iniciar sesión como ADMIN
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@panaderia.com');
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(500);
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 15000 });

    // Navegar directamente a la pestaña de configuración del asistente
    await page.goto('/admin/configuracion?tab=asistente');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(page.url()).toContain('tab=asistente');
    await page.screenshot({ path: path.join(CAPTURES_DIR, '05_asistente_diagnostico_llm.png') });

    const configContent = await page.textContent('body');
    expect(configContent?.toLowerCase()).toContain('asistente');
  });

});
