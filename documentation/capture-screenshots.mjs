import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const url = 'https://proyecto-wilsoon77.vercel.app';
const outputDir = path.join(process.cwd(), 'capturas');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

(async () => {
  console.log('Iniciando navegador...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1, // High resolution could be 2, but 1 is fine for standard
  });
  const page = await context.newPage();

  // Helper wait for network idle to ensure everything is rendered
  const gotoOptions = { waitUntil: 'networkidle' };

  console.log('1. Capturando: Inicio...');
  try {
    await page.goto(url, gotoOptions);
    await page.screenshot({ path: path.join(outputDir, 'inicio.png'), fullPage: false });
    console.log('✔ Inicio capturado');

    console.log('2. Capturando: Pie de página...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000); // Give it a sec to load any lazy images at the bottom
    await page.screenshot({ path: path.join(outputDir, 'pie_de_pagina.png'), fullPage: false });
    console.log('✔ Pie de página capturado');
  } catch(e) { console.error('Error en Inicio:', e); }

  console.log('3. Capturando: Productos...');
  try {
    await page.goto(`${url}/productos`, gotoOptions);
    await page.screenshot({ path: path.join(outputDir, 'productos.png'), fullPage: true });
    console.log('✔ Productos capturados');
  } catch(e) { console.error('Error en Productos:', e); }

  console.log('4. Capturando: Contacto...');
  try {
    await page.goto(`${url}/contacto`, gotoOptions);
    await page.screenshot({ path: path.join(outputDir, 'contacto.png'), fullPage: true });
    console.log('✔ Contacto capturado');
  } catch(e) { console.error('Error en Contacto:', e); }

  console.log('5. Capturando: Login...');
  try {
    await page.goto(`${url}/login`, gotoOptions);
    await page.screenshot({ path: path.join(outputDir, 'login.png') });
    console.log('✔ Login capturado');
  } catch(e) { console.error('Error en Login:', e); }

  console.log('6. Iniciando sesión y Capturando Dashboard...');
  try {
    // Fill the login form
    await page.fill('input[type="email"]', 'admin@panaderia.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for the URL to change to the dashboard
    await page.waitForURL('**/admin**', { timeout: 10000 }).catch(() => console.log('Timeout esperando redirección a admin, continuando igual...'));
    await page.waitForTimeout(4000); // extra wait for API loading spinners
    
    await page.screenshot({ path: path.join(outputDir, 'dashboard.png') });
    console.log('✔ Dashboard capturado');
  } catch(e) {
    console.error('Error en login o dashboard: ', e.message);
  }

  await browser.close();
  console.log('¡Proceso completado con éxito!');
})();
