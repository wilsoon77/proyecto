import { chromium } from 'playwright';

const url = 'http://localhost:3000';
const credentials = { email: 'gerente@panaderia.com', pass: 'manager123' };

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Escuchar logs de consola del navegador
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.error('[BROWSER EXCEPTION]:', err);
  });

  try {
    console.log('1. Iniciando sesión...');
    await page.goto(`${url}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', credentials.email);
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(1000);
    await page.fill('input[type="password"]', credentials.pass);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('Login completado, URL actual:', page.url());

    console.log('2. Navegando a movimiento de inventario...');
    await page.goto(`${url}/admin/inventario/movimiento`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Selección de sucursal
    const originBranchSelect = page.locator('select').first();
    const isBranchDisabled = await originBranchSelect.isDisabled();
    console.log('¿El selector de sucursal de origen está deshabilitado?', isBranchDisabled);

    // Búsqueda de producto 1
    console.log('3. Buscando primer producto...');
    const productInput = page.locator('input[placeholder="Escribe para buscar un producto..."]');
    await productInput.focus();
    await productInput.click();
    await page.waitForTimeout(500);
    await productInput.fill('Pan');

    const firstProductOption = page.locator('div.absolute button').first();
    await firstProductOption.waitFor({ state: 'visible', timeout: 5000 });
    const productName = await firstProductOption.innerText();
    console.log('Seleccionando primer producto:', productName);
    await firstProductOption.click();
    await page.waitForTimeout(1000);

    // Cantidad 1
    console.log('4. Ingresando cantidad 5...');
    await page.fill('input[type="number"]', '5');
    await page.waitForTimeout(500);

    // Registrar y agregar otro
    console.log('5. Clic en "Registrar y agregar otro"...');
    await page.click('button:has-text("Registrar y agregar otro")');
    await page.waitForTimeout(3000);

    // Verificar campos
    const qtyValue = await page.inputValue('input[type="number"]');
    console.log('Cantidad después de primer submit:', qtyValue);
    const searchVal = await productInput.inputValue();
    console.log('Buscador después de primer submit:', searchVal);

    // Búsqueda de producto 2
    console.log('6. Buscando segundo producto...');
    await productInput.focus();
    await productInput.click();
    await page.waitForTimeout(500);
    await productInput.fill('Pan');

    const secondProductOption = page.locator('div.absolute button').first();
    await secondProductOption.waitFor({ state: 'visible', timeout: 5000 });
    const secondProductName = await secondProductOption.innerText();
    console.log('Seleccionando segundo producto:', secondProductName);
    await secondProductOption.click();
    await page.waitForTimeout(1000);

    // Cantidad 2
    console.log('7. Ingresando cantidad 10...');
    await page.fill('input[type="number"]', '10');
    await page.waitForTimeout(500);

    // Registrar Movimiento
    console.log('8. Clic en "Registrar Movimiento"...');
    await page.click('button:has-text("Registrar Movimiento")');
    await page.waitForTimeout(4000);

    console.log('URL final:', page.url());
    
    // Obtener errores en pantalla si los hay
    const errorText = await page.locator('div.bg-red-50').textContent().catch(() => null);
    if (errorText) {
      console.log('Texto de error en pantalla:', errorText.trim());
    }

  } catch (err) {
    console.error('Error en el script de debug:', err);
  } finally {
    await browser.close();
  }
}

run();
