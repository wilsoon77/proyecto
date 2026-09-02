import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, '..');

async function generateFavicons() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const svgPath = path.join(webRoot, 'public', 'images', 'icon-panaderia.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // 1. Favicon 64x64 transparent
  await page.setViewportSize({ width: 64, height: 64 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: transparent; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        svg { width: 60px; height: 60px; }
      </style>
    </head>
    <body>
      ${svgContent}
    </body>
    </html>
  `);

  const faviconBuffer = await page.screenshot({ type: 'png', omitBackground: true });
  fs.writeFileSync(path.join(webRoot, 'src', 'app', 'icon.png'), faviconBuffer);
  fs.writeFileSync(path.join(webRoot, 'public', 'icon.png'), faviconBuffer);
  fs.writeFileSync(path.join(webRoot, 'src', 'app', 'favicon.ico'), faviconBuffer);
  fs.writeFileSync(path.join(webRoot, 'public', 'favicon.ico'), faviconBuffer);

  // 2. Apple Touch Icon 180x180 with warm background
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #FAF5EE; width: 180px; height: 180px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 36px; }
        svg { width: 140px; height: 140px; }
      </style>
    </head>
    <body>
      ${svgContent}
    </body>
    </html>
  `);

  const appleBuffer = await page.screenshot({ type: 'png' });
  fs.writeFileSync(path.join(webRoot, 'src', 'app', 'apple-icon.png'), appleBuffer);
  fs.writeFileSync(path.join(webRoot, 'public', 'apple-icon.png'), appleBuffer);
  fs.writeFileSync(path.join(webRoot, 'public', 'apple-touch-icon.png'), appleBuffer);

  // 3. OpenGraph 1200x630 banner
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
        body {
          width: 1200px;
          height: 630px;
          background: linear-gradient(135deg, #2B170F 0%, #1A0E09 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 80px 100px;
          color: #FAF5EE;
          overflow: hidden;
          position: relative;
        }
        .glow {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(217, 119, 6, 0.25) 0%, rgba(217, 119, 6, 0) 70%);
          top: -100px;
          right: 200px;
          pointer-events: none;
        }
        .content {
          max-width: 620px;
          z-index: 10;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(217, 119, 6, 0.2);
          border: 1px solid rgba(245, 158, 11, 0.5);
          color: #FBBF24;
          padding: 8px 18px;
          border-radius: 9999px;
          font-size: 16px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 24px;
        }
        h1 {
          font-size: 54px;
          font-weight: 800;
          line-height: 1.1;
          color: #FFFFFF;
          margin-bottom: 20px;
        }
        h1 span {
          color: #F59E0B;
        }
        p {
          font-size: 22px;
          line-height: 1.5;
          color: #D2C3B4;
          margin-bottom: 30px;
        }
        .features {
          display: flex;
          gap: 20px;
          font-size: 15px;
          font-weight: 600;
          color: #FBBF24;
        }
        .icon-box {
          width: 320px;
          height: 320px;
          background: #FAF5EE;
          border-radius: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 30px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
          z-index: 10;
        }
        .icon-box svg {
          width: 250px;
          height: 250px;
        }
      </style>
    </head>
    <body>
      <div class="glow"></div>
      <div class="content">
        <div class="badge">🥖 Panadería Artesanal · Chimaltenango</div>
        <h1>Panadería <span>Svetlana</span></h1>
        <p>Pan dulce tradicional, pan francés y productos recién horneados a diario en Guatemala.</p>
        <div class="features">
          <span>✓ 2 Horneadas Diarias</span>
          <span>✓ Retiro en Sucursal</span>
          <span>✓ Recetas Tradicionales</span>
        </div>
      </div>
      <div class="icon-box">
        ${svgContent}
      </div>
    </body>
    </html>
  `);

  const ogBuffer = await page.screenshot({ type: 'jpeg', quality: 95 });
  fs.writeFileSync(path.join(webRoot, 'public', 'images', 'og-banner.jpg'), ogBuffer);
  fs.writeFileSync(path.join(webRoot, 'src', 'app', 'opengraph-image.jpg'), ogBuffer);

  await browser.close();
  console.log('✅ Generated favicon.ico, icon.png, apple-icon.png, and og-banner.jpg successfully!');
}

generateFavicons().catch(console.error);
