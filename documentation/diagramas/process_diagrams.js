const fs = require('fs');
const path = require('path');
const { chromium } = require('c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/web/node_modules/playwright');

async function main() {
  const dir = path.resolve('c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/diagramas');
  const svgOutDir = path.join(dir, 'svg');
  const renderOutDir = path.join(dir, 'renders');

  if (!fs.existsSync(svgOutDir)) fs.mkdirSync(svgOutDir, { recursive: true });
  if (!fs.existsSync(renderOutDir)) fs.mkdirSync(renderOutDir, { recursive: true });

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

  console.log(`Found ${files.length} diagram HTML files.`);

  // 1. Extract and sanitize standalone SVGs for 100% Microsoft Word Compatibility
  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      let svgStr = svgMatch[0];

      // Ensure xmlns is present
      if (!svgStr.includes('xmlns="http://www.w3.org/2000/svg"')) {
        svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      // REMOVE SVG FILTERS & SHADOWS (Microsoft Word's SVG engine drops elements with filters!)
      svgStr = svgStr.replace(/<filter[\s\S]*?<\/filter>/gi, '');
      svgStr = svgStr.replace(/\s*filter="url\([^)]+\)"/gi, '');
      svgStr = svgStr.replace(/\s*filter='url\([^)]+\)'/gi, '');

      // Standardize font family for Windows / Office (system-ui fails in Word SVG engine)
      svgStr = svgStr.replace(/font-family="system-ui,\s*sans-serif"/gi, 'font-family="Segoe UI, Arial, sans-serif"');
      svgStr = svgStr.replace(/font-family='system-ui,\s*sans-serif'/gi, 'font-family="Segoe UI, Arial, sans-serif"');

      // Inject solid white background rect
      // First clean any prior injected rects
      svgStr = svgStr.replace(/<rect width="100%" height="100%" fill="#ffffff"\/>/g, '');
      
      if (svgStr.includes('</defs>')) {
        svgStr = svgStr.replace('</defs>', '</defs>\n  <rect width="100%" height="100%" fill="#ffffff"/>');
      } else {
        svgStr = svgStr.replace(/(<svg[^>]*>)/i, '$1\n  <rect width="100%" height="100%" fill="#ffffff"/>');
      }

      const svgFileName = file.replace('.html', '.svg');
      const svgPath = path.join(svgOutDir, svgFileName);
      fs.writeFileSync(svgPath, svgStr, 'utf8');
      console.log(`[SVG SAVED & SANITIZED] ${svgFileName}`);
    }
  }

  // 2. Render High-Resolution PNGs (devicePixelRatio: 4 for crystal clear 300+ DPI)
  console.log('\nRendering PNGs with Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    deviceScaleFactor: 4, // 4x scale for print quality (300+ DPI)
    viewport: { width: 1400, height: 2000 }
  });
  const page = await context.newPage();

  for (const file of files) {
    const filePath = path.join(dir, file);
    const outName = file.replace('.html', '.png');
    const outPath = path.join(renderOutDir, outName);

    await page.goto('file:///' + filePath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });

    const container = await page.$('.container');
    if (container) {
      await container.screenshot({ path: outPath, type: 'png' });
    } else {
      const svg = await page.$('svg');
      if (svg) {
        await svg.screenshot({ path: outPath, type: 'png' });
      }
    }
    console.log(`[PNG RENDERED] ${outName}`);
  }

  await browser.close();
  console.log('\nAll SVGs and PNG renders processed successfully!');
}

main().catch(err => {
  console.error('Error processing diagrams:', err);
  process.exit(1);
});
