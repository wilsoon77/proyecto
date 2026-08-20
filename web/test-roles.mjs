import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const url = 'https://proyecto-wilsoon77.vercel.app';
const outputDir = 'c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const ROLES = {
  admin: { email: 'admin@panaderia.com', pass: 'admin123', label: 'ADMIN' },
  manager: { email: 'gerente@panaderia.com', pass: 'manager123', label: 'MANAGER' },
  baker: { email: 'panadero@panaderia.com', pass: 'panadero123', label: 'BAKER' },
  customer: { email: 'cliente@panaderia.com', pass: 'cliente123', label: 'CUSTOMER' }
};

async function testRole(roleName, creds) {
  console.log(`\n==================================================`);
  console.log(`PROBANDO ROL: ${creds.label} (${creds.email})`);
  console.log(`==================================================`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  
  try {
    // 1. Ir a la Landing Page
    console.log(`[${creds.label}] Navegando a la Landing Page...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outputDir, `${roleName}_1_landing.png`) });
    
    // 2. Ir a Login
    console.log(`[${creds.label}] Navegando a Login...`);
    await page.goto(`${url}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outputDir, `${roleName}_2_login_page.png`) });
    
    // Rellenar formulario
    console.log(`[${creds.label}] Llenando credenciales...`);
    await page.fill('input[type="email"]', creds.email);
    // Disparar blur para comprobar captcha
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(1000); // Esperar validación de captcha
    
    // Llenar contraseña
    await page.fill('input[type="password"]', creds.pass);
    
    // Tomar captura antes de enviar
    await page.screenshot({ path: path.join(outputDir, `${roleName}_3_before_login.png`) });
    
    // Click submit
    console.log(`[${creds.label}] Enviando formulario de Login...`);
    await page.click('button[type="submit"]');
    
    // Esperar redirección
    console.log(`[${creds.label}] Esperando redirección...`);
    await page.waitForTimeout(5000); // Esperar un momento
    
    const currentUrl = page.url();
    console.log(`[${creds.label}] URL actual después del login: ${currentUrl}`);
    await page.screenshot({ path: path.join(outputDir, `${roleName}_4_after_login.png`) });
    
    if (currentUrl.includes('/login')) {
      console.log(`❌ ERROR: No se pudo iniciar sesión. Quedó en /login.`);
      // Ver si hay un mensaje de error en la página
      const errorText = await page.locator('.bg-red-50').textContent().catch(() => null);
      if (errorText) {
        console.log(`   Detalle del error visible: "${errorText.trim()}"`);
      }
      await browser.close();
      return;
    }
    
    console.log(`✔ Login exitoso para ${creds.label}`);
    
    // 3. Probar accesos
    if (creds.label === 'CUSTOMER') {
      // Cliente debe poder ver /pedidos y /perfil
      console.log(`[${creds.label}] Navegando a /pedidos...`);
      await page.goto(`${url}/pedidos`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(outputDir, `${roleName}_5_pedidos.png`) });
      
      console.log(`[${creds.label}] Intentando entrar a /admin (debería denegarse)...`);
      await page.goto(`${url}/admin`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(2000);
      console.log(`[${creds.label}] URL al intentar /admin: ${page.url()}`);
      await page.screenshot({ path: path.join(outputDir, `${roleName}_6_admin_attempt.png`) });
      
    } else {
      // Roles operativos (ADMIN, MANAGER, BAKER)
      console.log(`[${creds.label}] Navegando al Panel Admin / Panel de Trabajo (/admin)...`);
      await page.goto(`${url}/admin`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(outputDir, `${roleName}_5_operacion.png`) });
      
      // Probar rutas específicas de su rol
      if (creds.label === 'ADMIN') {
        // Acceso total
        console.log(`[${creds.label}] Probando acceso a Usuarios (/admin/usuarios)...`);
        await page.goto(`${url}/admin/usuarios`, { waitUntil: 'networkidle' }).catch(() => {});
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(outputDir, `${roleName}_6_usuarios.png`) });
        
        console.log(`[${creds.label}] Probando acceso a Configuración (/admin/configuracion)...`);
        await page.goto(`${url}/admin/configuracion`, { waitUntil: 'networkidle' }).catch(() => {});
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(outputDir, `${roleName}_7_configuracion.png`) });
      }
      
      if (creds.label === 'MANAGER') {
        // Productos e Inventario
        console.log(`[${creds.label}] Probando acceso a Productos (/admin/productos)...`);
        await page.goto(`${url}/admin/productos`, { waitUntil: 'networkidle' }).catch(() => {});
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(outputDir, `${roleName}_6_productos.png`) });
        
        console.log(`[${creds.label}] Probando acceso a Inventario (/admin/inventario)...`);
        await page.goto(`${url}/admin/inventario`, { waitUntil: 'networkidle' }).catch(() => {});
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(outputDir, `${roleName}_7_inventario.png`) });
      }
      
      if (creds.label === 'BAKER') {
        // Producción
        console.log(`[${creds.label}] Probando acceso a Producción (/admin/produccion)...`);
        await page.goto(`${url}/admin/produccion`, { waitUntil: 'networkidle' }).catch(() => {});
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(outputDir, `${roleName}_6_produccion.png`) });
        
        // Debería tener bloqueado Usuarios
        console.log(`[${creds.label}] Intentando entrar a Usuarios (debería denegarse)...`);
        await page.goto(`${url}/admin/usuarios`, { waitUntil: 'networkidle' }).catch(() => {});
        await page.waitForTimeout(2000);
        console.log(`[${creds.label}] URL al intentar entrar a Usuarios: ${page.url()}`);
        await page.screenshot({ path: path.join(outputDir, `${roleName}_7_usuarios_attempt.png`) });
      }
      
    }
    
    // Log out
    console.log(`[${creds.label}] Finalizando sesión (limpiando contexto)...`);
    
  } catch (err) {
    console.error(`❌ ERROR inesperado probando el rol ${creds.label}:`, err);
    await page.screenshot({ path: path.join(outputDir, `${roleName}_error.png`) });
  } finally {
    await browser.close();
  }
}

async function run() {
  console.log('Iniciando suite de pruebas de roles...');
  for (const [roleName, creds] of Object.entries(ROLES)) {
    await testRole(roleName, creds);
  }
  console.log('\nPruebas completadas.');
}

run();
