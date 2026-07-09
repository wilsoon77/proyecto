import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const url = process.env.TEST_BASE_URL || 'https://proyecto-wilsoon77.vercel.app';
const outputDir = 'c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const ROLES = {
  baker: { email: 'panadero@panaderia.com', pass: 'panadero123', label: 'BAKER' },
  cashier: { email: 'cajero@panaderia.com', pass: 'cajero123', label: 'CASHIER' },
  manager: { email: 'gerente@panaderia.com', pass: 'manager123', label: 'MANAGER' },
  admin: { email: 'admin@panaderia.com', pass: 'admin123', label: 'ADMIN' }
};

async function loginUser(page, creds) {
  console.log(`[${creds.label}] Iniciando sesión...`);
  await page.goto(`${url}/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('input[type="email"]', creds.email);
  await page.dispatchEvent('input[type="email"]', 'blur');
  await page.waitForTimeout(1000);
  await page.fill('input[type="password"]', creds.pass);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000); // Esperar redirección
  console.log(`[${creds.label}] Redirigido a: ${page.url()}`);
}

async function run() {
  console.log('Iniciando Pruebas de Integración y Módulos de Roles...');
  
  const browser = await chromium.launch({ headless: true });
  
  // =========================================================================
  // 1. PROBAR PANADERO (BAKER) - REGISTRAR PRODUCCIÓN DEL DÍA
  // =========================================================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    try {
      await loginUser(page, ROLES.baker);
      
      console.log('[BAKER] Navegando a la sección de Producción...');
      await page.goto(`${url}/admin/produccion`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(outputDir, 'baker_8_produccion_inicio.png') });
      
      // Intentar seleccionar la primera receta
      console.log('[BAKER] Seleccionando receta/amasijo...');
      const recipeBtn = page.locator('button:has-text("Amasijo Estándar")').first();
      if (await recipeBtn.count() > 0) {
        await recipeBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(outputDir, 'baker_9_receta_seleccionada.png') });
        
        // Escribir nota
        console.log('[BAKER] Escribiendo nota de horneado...');
        await page.fill('input[placeholder*="Nota opcional"]', 'Horneado diario automatizado - Prueba QA');
        await page.screenshot({ path: path.join(outputDir, 'baker_10_nota_ingresada.png') });
        
        // Registrar horneado
        console.log('[BAKER] Click en Registrar Horneado...');
        await page.click('button:has-text("Registrar Horneado")');
        await page.waitForTimeout(4000); // Esperar confirmación / recarga
        await page.screenshot({ path: path.join(outputDir, 'baker_11_produccion_registrada.png') });
        console.log('✔ [BAKER] Producción registrada con éxito');
      } else {
        console.log('⚠ [BAKER] No se encontraron recetas creadas para seleccionar en la producción.');
      }
    } catch (err) {
      console.error('❌ Error en el flujo del BAKER:', err);
      await page.screenshot({ path: path.join(outputDir, 'baker_error_integracion.png') });
    } finally {
      await context.close();
    }
  }

  // =========================================================================
  // 2. PROBAR CAJERO (CASHIER) - REGISTRAR VENTA EN PUNTO DE VENTA (POS)
  // =========================================================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    try {
      await loginUser(page, ROLES.cashier);
      
      console.log('[CASHIER] Navegando al POS...');
      await page.goto(`${url}/admin/pos`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.join(outputDir, 'cashier_8_pos_pantalla.png') });
      
      // Agregar un producto disponible al carrito
      console.log('[CASHIER] Agregando producto al carrito...');
      const productCard = page.locator('div.group:has-text("+ Agregar")').first();
      if (await productCard.count() > 0) {
        await productCard.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(outputDir, 'cashier_9_pos_carrito_con_item.png') });
        
        // Realizar cobro
        console.log('[CASHIER] Procesando cobro (Pago Exacto)...');
        const checkoutBtn = page.locator('button:has-text("Cobrar")');
        if (await checkoutBtn.count() > 0) {
          await checkoutBtn.click();
          await page.waitForTimeout(4000); // Esperar procesamiento de venta
          await page.screenshot({ path: path.join(outputDir, 'cashier_10_pos_venta_completada.png') });
          console.log('✔ [CASHIER] Venta en POS procesada con éxito');
        } else {
          console.log('⚠ [CASHIER] Botón "Cobrar" no disponible.');
        }
      } else {
        console.log('⚠ [CASHIER] No se encontraron productos disponibles para agregar en el POS.');
      }
    } catch (err) {
      console.error('❌ Error en el flujo del CASHIER:', err);
      await page.screenshot({ path: path.join(outputDir, 'cashier_error_integracion.png') });
    } finally {
      await context.close();
    }
  }

  // =========================================================================
  // 3. PROBAR ENCARGADO (MANAGER) - VER PRODUCTOS E INVENTARIO
  // =========================================================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    try {
      await loginUser(page, ROLES.manager);
      
      console.log('[MANAGER] Navegando a Inventario...');
      await page.goto(`${url}/admin/inventario`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(outputDir, 'manager_8_inventario_general.png') });
      
      console.log('[MANAGER] Navegando a Productos...');
      await page.goto(`${url}/admin/productos`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(outputDir, 'manager_9_productos_listado.png') });
      
      console.log('[MANAGER] Navegando a la bitácora de Movimiento de Inventario...');
      await page.goto(`${url}/admin/inventario/movimiento`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(outputDir, 'manager_10_movimientos_inventario.png') });

      // Verificación de sucursal deshabilitada
      console.log('[MANAGER] Verificando que la selección de sucursal esté deshabilitada...');
      const originBranchSelect = page.locator('select').first();
      const isBranchDisabled = await originBranchSelect.isDisabled();
      console.log(`[MANAGER] ¿El selector de sucursal de origen está deshabilitado? ${isBranchDisabled}`);
      if (!isBranchDisabled) {
        throw new Error('El selector de sucursal de origen no está deshabilitado para el MANAGER');
      }

      // Probar selección de producto con el nuevo Combobox
      console.log('[MANAGER] Buscando y seleccionando producto en el Combobox...');
      const productInput = page.locator('input[placeholder="Escribe para buscar un producto..."]');
      await productInput.focus();
      await productInput.click();
      await page.waitForTimeout(500);
      await productInput.fill('Pan');
      
      // Esperar a que las opciones del dropdown aparezcan
      const firstProductOption = page.locator('div.absolute button').first();
      await firstProductOption.waitFor({ state: 'visible', timeout: 5000 });
      
      // Capturar pantalla con el combobox desplegado
      await page.screenshot({ path: path.join(outputDir, 'manager_10a_combobox_desplegado.png') });
      
      const productName = await firstProductOption.innerText();
      console.log(`[MANAGER] Seleccionando producto: ${productName.trim()}`);
      await firstProductOption.click();
      await page.waitForTimeout(1000);

      // Ingresar cantidad
      console.log('[MANAGER] Ingresando cantidad...');
      await page.fill('input[type="number"]', '5');
      await page.waitForTimeout(500);

      // Clicar en "Registrar y agregar otro"
      console.log('[MANAGER] Haciendo clic en "Registrar y agregar otro"...');
      await page.click('button:has-text("Registrar y agregar otro")');
      await page.waitForTimeout(3000); // esperar que registre
      await page.screenshot({ path: path.join(outputDir, 'manager_10b_movimiento_agregado_otro.png') });

      // Verificar que los campos se hayan limpiado/restablecido
      const qtyValue = await page.inputValue('input[type="number"]');
      console.log(`[MANAGER] Después de registrar, la cantidad es: ${qtyValue}`);
      if (qtyValue !== '1') {
        throw new Error('La cantidad no se restableció a 1 después de "Registrar y agregar otro"');
      }
      const searchVal = await productInput.inputValue();
      console.log(`[MANAGER] Después de registrar, el texto del combobox es: "${searchVal}"`);
      if (searchVal !== '') {
        throw new Error('El buscador de productos no se limpió después de "Registrar y agregar otro"');
      }

      // Registrar un segundo movimiento para verificar redirección
      console.log('[MANAGER] Registrando un segundo movimiento para verificar redirección...');
      await productInput.focus();
      await productInput.click();
      await page.waitForTimeout(500);
      await productInput.fill('Pan');
      
      const secondProductOption = page.locator('div.absolute button').first();
      await secondProductOption.waitFor({ state: 'visible', timeout: 5000 });
      
      const secondProductName = await secondProductOption.innerText();
      console.log(`[MANAGER] Seleccionando segundo producto: ${secondProductName.trim()}`);
      await secondProductOption.click();
      await page.waitForTimeout(1000);

      await page.fill('input[type="number"]', '10');
      await page.waitForTimeout(500);

      console.log('[MANAGER] Clic en "Registrar Movimiento" para enviar y redirigir...');
      await page.click('button:has-text("Registrar Movimiento")');
      
      console.log('[MANAGER] Esperando redirección a /admin/inventario...');
      await page.waitForURL('**/admin/inventario', { timeout: 15000 });
      await page.screenshot({ path: path.join(outputDir, 'manager_10c_movimiento_final_redirigido.png') });

      const currentURL = page.url();
      console.log(`[MANAGER] URL final después de redirección: ${currentURL}`);
      if (!currentURL.includes('/admin/inventario') || currentURL.includes('/movimiento')) {
        throw new Error('No redirigió a /admin/inventario después de "Registrar Movimiento"');
      }

      console.log('✔ [MANAGER] Flujo completo de movimientos verificado con éxito.');
    } catch (err) {
      console.error('❌ Error en el flujo del MANAGER:', err);
      await page.screenshot({ path: path.join(outputDir, 'manager_error_integracion.png') });
    } finally {
      await context.close();
    }
  }

  // =========================================================================
  // 4. PROBAR ADMINISTRADOR (ADMIN) - PANELES DE CONTROL, USUARIOS Y CONFIG
  // =========================================================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    try {
      await loginUser(page, ROLES.admin);
      
      console.log('[ADMIN] Revisando Dashboard General...');
      await page.goto(`${url}/admin`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.join(outputDir, 'admin_8_dashboard_general.png') });
      
      console.log('[ADMIN] Navegando a Usuarios...');
      await page.goto(`${url}/admin/usuarios`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(outputDir, 'admin_9_usuarios_completo.png') });
      
      console.log('[ADMIN] Navegando a Sucursales...');
      await page.goto(`${url}/admin/sucursales`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(outputDir, 'admin_10_sucursales_completo.png') });
      
      console.log('[ADMIN] Navegando a Historial de Auditoría...');
      await page.goto(`${url}/admin/historial`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(outputDir, 'admin_11_historial_auditoria.png') });
      
      console.log('[ADMIN] Probando el POS como Admin...');
      await page.goto(`${url}/admin/pos`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(outputDir, 'admin_12_pos_as_admin.png') });
      
      console.log('✔ [ADMIN] Paneles revisados con éxito.');
    } catch (err) {
      console.error('❌ Error en el flujo del ADMIN:', err);
      await page.screenshot({ path: path.join(outputDir, 'admin_error_integracion.png') });
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('Pruebas de integración de roles completadas.');
}

run();
