import { test, expect } from 'playwright/test';
import fs from 'fs';
import path from 'path';

const CAPTURES_DIR = path.resolve(process.cwd(), '../documentation/pruebas_roles/capturas');

test.describe('Módulo de Cierre Diario de Caja y Arqueo', () => {

  test('02.1 - Carga y verificación del módulo de Cierre Diario (/admin/cierre-dia)', async ({ page }) => {
    // 1. Iniciar sesión como ADMIN (con permisos de administración y cierre)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@panaderia.com');
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(500);
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 15000 });

    // 2. Navegar a Cierre Diario de Caja
    await page.goto('/admin/cierre-dia');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 3. Comprobar que la URL y la interfaz están cargadas
    expect(page.url()).toContain('/admin/cierre-dia');
    await page.screenshot({ path: path.join(CAPTURES_DIR, '02_cierre_diario_interfaz.png') });

    // 4. Verificar presencia de componentes clave (formulario o historial de arqueos)
    const pageContent = await page.textContent('body');
    expect(pageContent?.toLowerCase()).toContain('cierre');
  });

});
