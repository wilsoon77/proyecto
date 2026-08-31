const fs = require('fs');
const path = require('path');

const dir = path.resolve('c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/diagramas');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Strip SVG filters
  content = content.replace(/<filter[\s\S]*?<\/filter>/gi, '');
  content = content.replace(/\s*filter="url\([^)]+\)"/gi, '');
  content = content.replace(/\s*filter='url\([^)]+\)'/gi, '');

  // Standardize fonts
  content = content.replace(/font-family="system-ui,\s*sans-serif"/gi, 'font-family="Segoe UI, Arial, sans-serif"');
  content = content.replace(/font-family='system-ui,\s*sans-serif'/gi, 'font-family="Segoe UI, Arial, sans-serif"');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[HTML SANITIZED] ${file}`);
}
