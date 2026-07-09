import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const url = 'https://proyecto-wilsoon77.vercel.app';
const outputDir = 'c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const creds = { email: 'admin@panaderia.com', pass: 'admin123', label: 'ADMIN' };

async function testAdmin() {
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
    // Delete any old admin error file if it exists
    const errorFile = path.join(outputDir, 'admin_error.png');
    if (fs.existsSync(errorFile)) {
      fs.unlinkSync(errorFile);
    }

    console.log(`[${creds.label}] Navegando a la Landing Page...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.screenshot({ path: path.join(outputDir, `admin_1_landing.png`) });
    
    console.log(`[${creds.label}] Navegando a Login...`);
    await page.goto(`${url}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.screenshot({ path: path.join(outputDir, `admin_2_login_page.png`) });
    
    console.log(`[${creds.label}] Llenando credenciales...`);
    await page.fill('input[type="email"]', creds.email);
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="password"]', creds.pass);
    await page.screenshot({ path: path.join(outputDir, `admin_3_before_login.png`) });
    
    console.log(`[${creds.label}] Enviando formulario de Login...`);
    await page.click('button[type="submit"]');
    
    console.log(`[${creds.label}] Esperando redirección...`);
    await page.waitForTimeout(6000);
    
    const currentUrl = page.url();
    console.log(`[${creds.label}] URL actual después del login: ${currentUrl}`);
    await page.screenshot({ path: path.join(outputDir, `admin_4_after_login.png`) });
    
    if (currentUrl.includes('/login')) {
      console.log(`❌ ERROR: No se pudo iniciar sesión. Quedó en /login.`);
      const errorText = await page.locator('.bg-red-50').textContent().catch(() => null);
      if (errorText) {
        console.log(`   Detalle del error visible: "${errorText.trim()}"`);
      }
      return;
    }
    
    console.log(`✔ Login exitoso para ${creds.label}`);
    
    console.log(`[${creds.label}] Navegando al Panel Admin (/admin)...`);
    await page.goto(`${url}/admin`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(outputDir, `admin_5_admin_dashboard.png`) });
    
    console.log(`[${creds.label}] Probando acceso a Usuarios (/admin/usuarios)...`);
    await page.goto(`${url}/admin/usuarios`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outputDir, `admin_6_usuarios.png`) });
    
    console.log(`[${creds.label}] Probando acceso a Configuración (/admin/configuracion)...`);
    await page.goto(`${url}/admin/configuracion`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outputDir, `admin_7_configuracion.png`) });
    
    console.log(`[${creds.label}] Completado.`);
    
  } catch (err) {
    console.error(`❌ ERROR inesperado probando el rol ${creds.label}:`, err);
    await page.screenshot({ path: path.join(outputDir, `admin_error.png`) });
  } finally {
    await browser.close();
  }
}

testAdmin();
