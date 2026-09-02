import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, '..');
const imagesDir = path.join(webRoot, 'public', 'images');

async function optimizeImages() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const configs = [
    { file: 'hero-concha-pedestal.jpg', width: 640, height: 640, quality: 82 },
    { file: 'floating-wheat.jpg', width: 300, height: 300, quality: 80 },
    { file: 'floating-concha.jpg', width: 300, height: 300, quality: 80 },
  ];

  for (const { file, width, height, quality } of configs) {
    const filePath = path.join(imagesDir, file);
    const dataUrl = `data:image/jpeg;base64,${fs.readFileSync(filePath).toString('base64')}`;

    await page.setViewportSize({ width, height });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; }
          body { width: ${width}px; height: ${height}px; overflow: hidden; background: #FAF5EE; }
          img { width: 100%; height: 100%; object-fit: cover; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" />
      </body>
      </html>
    `);

    // Wait for image to load in DOM
    await page.waitForSelector('img');
    await page.evaluate(() => {
      const img = document.querySelector('img');
      if (!img.complete) return new Promise(r => img.onload = r);
    });

    const optimizedBuffer = await page.screenshot({ type: 'jpeg', quality });
    const oldSize = fs.statSync(filePath).size;
    fs.writeFileSync(filePath, optimizedBuffer);
    const newSize = optimizedBuffer.length;
    console.log(`Optimized ${file}: ${(oldSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB (-${Math.round((1 - newSize / oldSize) * 100)}%)`);
  }

  await browser.close();
}

optimizeImages().catch(console.error);
