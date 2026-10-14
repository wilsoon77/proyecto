import { test, expect } from 'playwright/test';
import fs from 'fs';
import path from 'path';

const CAPTURES_DIR = path.resolve(process.cwd(), '../documentation/pruebas_roles/capturas');

test.describe('Monitoreo de Alertas de Stock Mínimo y Caducidades', () => {

  test('03.1 - Verificación de tabla de inventario y umbrales de stock mínimo', async ({ page }) => {
    // 1. Iniciar sesión como ADMIN
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@panaderia.com');
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(500);
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 15000 });

    // 2. Navegar a Inventario
    await page.goto('/admin/inventario');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(page.url()).toContain('/admin/inventario');
    await page.screenshot({ path: path.join(CAPTURES_DIR, '03_inventario_stock_minimo.png') });

    const pageText = await page.textContent('body');
    expect(pageText?.toLowerCase()).toContain('inventario');
  });

  test('03.2 - Verificación de monitoreo preventivo de caducidades', async ({ page }) => {
    // Navegar directamente a caducidades (usando la sesión existente o iniciando)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@panaderia.com');
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(500);
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 15000 });

    await page.goto('/admin/inventario/caducidades');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(page.url()).toContain('/admin/inventario/caducidades');
    await page.screenshot({ path: path.join(CAPTURES_DIR, '03_caducidades_lotes.png') });

    const pageContent = await page.textContent('body');
    expect(pageContent?.toLowerCase()).toContain('caducidad');
  });

});
