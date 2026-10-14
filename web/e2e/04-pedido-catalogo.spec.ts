import { test, expect } from 'playwright/test';
import fs from 'fs';
import path from 'path';

const CAPTURES_DIR = path.resolve(process.cwd(), '../documentation/pruebas_roles/capturas');

test.describe('Flujo de Pedido en Línea y Gestión en Panel Administrativo', () => {

  test('04.1 - Catálogo público, selección de productos y carrito de compras', async ({ page }) => {
    // 1. Navegar al catálogo público
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(page.url()).toContain('/catalogo');
    await page.screenshot({ path: path.join(CAPTURES_DIR, '04_catalogo_publico.png') });

    // 2. Comprobar que existen productos visibles y moneda en Quetzales
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Q');

    // 3. Probar apertura o interacción con el carrito si existe botón
    const cartButton = page.locator('button[aria-label*="carrito"], button:has-text("Carrito"), a[href*="carrito"]').first();
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(CAPTURES_DIR, '04_carrito_desplegado.png') });
    }
  });

  test('04.2 - Recepción y visualización de pedidos en panel administrativo (/admin/ordenes)', async ({ page }) => {
    // Iniciar sesión como ADMIN
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@panaderia.com');
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(500);
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 15000 });

    // Navegar al módulo de órdenes de producción/pedidos
    await page.goto('/admin/ordenes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    expect(page.url()).toContain('/admin/ordenes');
    await page.screenshot({ path: path.join(CAPTURES_DIR, '04_admin_ordenes_tablero.png') });

    const ordersPageText = await page.textContent('body');
    expect(ordersPageText?.toLowerCase()).toContain('orden');
  });

});
