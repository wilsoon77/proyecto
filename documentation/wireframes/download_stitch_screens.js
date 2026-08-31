const fs = require('fs');
const path = require('path');
const https = require('https');

// Load screen lists
const hifiScreensData = JSON.parse(fs.readFileSync('C:/Users/wilso/.gemini/antigravity/brain/135ea1e3-f97c-4a27-a4a1-a6ad418eae90/.system_generated/steps/2771/output.txt', 'utf8'));
const wireframeScreensData = JSON.parse(fs.readFileSync('C:/Users/wilso/.gemini/antigravity/brain/135ea1e3-f97c-4a27-a4a1-a6ad418eae90/.system_generated/steps/2775/output.txt', 'utf8'));

const outDir = path.join(__dirname, 'stitch_renders');
const hifiDir = path.join(outDir, 'alta_fidelidad');
const wfDir = path.join(outDir, 'baja_fidelidad');

[outDir, hifiDir, wfDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // handle redirect
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(destPath));
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function main() {
  console.log('Downloading High-Fidelity screens from Stitch...');
  for (let i = 0; i < hifiScreensData.screens.length; i++) {
    const screen = hifiScreensData.screens[i];
    if (screen.screenshot && screen.screenshot.downloadUrl) {
      const devType = (screen.deviceType || 'general').toLowerCase();
      const filename = `HIFI_${String(i + 1).padStart(2, '0')}_${sanitizeFilename(screen.title)}_${devType}.png`;
      const destPath = path.join(hifiDir, filename);
      console.log(`[HIFI] Downloading ${screen.title} -> ${filename}`);
      try {
        await downloadFile(screen.screenshot.downloadUrl, destPath);
      } catch (e) {
        console.error(`Error downloading ${filename}:`, e.message);
      }
    }
  }

  console.log('\nDownloading Wireframe screens from Stitch...');
  for (let i = 0; i < wireframeScreensData.screens.length; i++) {
    const screen = wireframeScreensData.screens[i];
    if (screen.screenshot && screen.screenshot.downloadUrl) {
      const devType = (screen.deviceType || 'general').toLowerCase();
      const filename = `WF_${String(i + 1).padStart(2, '0')}_${sanitizeFilename(screen.title)}_${devType}.png`;
      const destPath = path.join(wfDir, filename);
      console.log(`[WF] Downloading ${screen.title} -> ${filename}`);
      try {
        await downloadFile(screen.screenshot.downloadUrl, destPath);
      } catch (e) {
        console.error(`Error downloading ${filename}:`, e.message);
      }
    }
  }

  console.log('\nAll Stitch screens downloaded successfully!');
}

main();
