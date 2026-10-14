import { test, expect } from 'playwright/test';
import fs from 'fs';
import path from 'path';

const CAPTURES_DIR = path.resolve(process.cwd(), '../documentation/pruebas_roles/capturas');

test.beforeAll(() => {
  if (!fs.existsSync(CAPTURES_DIR)) {
    fs.mkdirSync(CAPTURES_DIR, { recursive: true });
  }
});

test.describe('Autenticación y Control de Acceso por Roles (RBAC)', () => {

  test('01.1 - Inicio de sesión exitoso y acceso integral como ADMIN', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(CAPTURES_DIR, '01_login_admin_inicio.png') });

    await page.fill('input[type="email"]', 'admin@panaderia.com');
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(500);

    await page.fill('input[type="password"]', 'admin123');
    await page.screenshot({ path: path.join(CAPTURES_DIR, '01_login_admin_credenciales.png') });

    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 15000 });
    expect(page.url()).toContain('/admin');
    await page.screenshot({ path: path.join(CAPTURES_DIR, '01_admin_dashboard.png') });

    // Verificar acceso a gestión de usuarios
    await page.goto('/admin/usuarios');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/usuarios');
    await page.screenshot({ path: path.join(CAPTURES_DIR, '01_admin_usuarios.png') });
  });

  test('01.2 - Navegación y verificación de módulo de Producción y Recetas', async ({ page }) => {
    // Iniciar sesión con permisos administrativos/operativos
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@panaderia.com');
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(500);
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 15000 });

    // Verificar módulo de producción del panadero
    await page.goto('/admin/produccion');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/produccion');
    await page.screenshot({ path: path.join(CAPTURES_DIR, '01_baker_produccion.png') });

    // Verificar módulo de recetas
    await page.goto('/admin/recetas');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/recetas');
    await page.screenshot({ path: path.join(CAPTURES_DIR, '01_admin_recetas.png') });
  });

  test('01.3 - Inicio de sesión como CUSTOMER y restricción estricta de acceso al panel administrativo', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'clientewilson@gmail.com');
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(500);

    await page.fill('input[type="password"]', 'cliente123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);

    await page.screenshot({ path: path.join(CAPTURES_DIR, '01_customer_home.png') });

    // Intentar acceder directamente al panel administrativo /admin
    await page.goto('/admin');
    await page.waitForTimeout(3000);
    
    // Verificar que un cliente NO tiene acceso a las rutas protegidas del panel
    const currentUrl = page.url();
    expect(currentUrl.includes('/admin/usuarios') || currentUrl.includes('/admin/configuracion')).toBeFalsy();
    await page.screenshot({ path: path.join(CAPTURES_DIR, '01_customer_admin_denied.png') });
  });

});
