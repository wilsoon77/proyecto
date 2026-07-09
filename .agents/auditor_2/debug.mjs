import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../web/node_modules/playwright');

const url = 'https://proyecto-wilsoon77.vercel.app';
const creds = { email: 'gerente@panaderia.com', pass: 'manager123', label: 'MANAGER' };

async function debug() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  try {
    console.log('Logging in...');
    await page.goto(`${url}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', creds.email);
    await page.dispatchEvent('input[type="email"]', 'blur');
    await page.waitForTimeout(1000);
    await page.fill('input[type="password"]', creds.pass);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log('Navigating to movimiento page...');
    await page.goto(`${url}/admin/inventario/movimiento`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Check page URL
    console.log('Current URL:', page.url());
    
    // Dump user role from localStorage or from page body if rendered
    const userRole = await page.evaluate(() => {
      try {
        const auth = localStorage.getItem('auth_token');
        if (!auth) return 'No auth token';
        // Let's inspect the layout role or try to fetch user state
        return document.body.innerText.includes('Gerente') || document.body.innerText.includes('MANAGER') ? 'Has manager text' : 'No manager text visible';
      } catch (e) {
        return 'Error: ' + e.message;
      }
    });
    console.log('User role text status:', userRole);
    
    // Get all select elements and their outerHTML / disabled status
    const selects = await page.evaluate(() => {
      const elList = Array.from(document.querySelectorAll('select'));
      return elList.map((el, i) => ({
        index: i,
        outerHTML: el.outerHTML,
        disabled: el.disabled,
        value: el.value,
        id: el.id,
        name: el.name,
        options: Array.from(el.options).map(o => o.text)
      }));
    });
    
    console.log('Found selects:', JSON.stringify(selects, null, 2));
    
  } catch (err) {
    console.error('Error during debug:', err);
  } finally {
    await browser.close();
  }
}

debug();
