import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPWRITE_ENDPOINT = (process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1').replace(/\/$/, '');
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '692364a80019746432c8';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const APPWRITE_BACKUP_BUCKET_ID = process.env.APPWRITE_BACKUP_BUCKET_ID || '6aa0e21c00040aa875f1';

async function listBackups() {
  console.log(`📋 Consultando respaldos en Appwrite [Bucket: ${APPWRITE_BACKUP_BUCKET_ID}]...`);
  const listRes = await fetch(
    `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BACKUP_BUCKET_ID}/files`,
    {
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
      },
    },
  );

  if (!listRes.ok) {
    const errorText = await listRes.text();
    throw new Error(`Error consultando Appwrite (${listRes.status}): ${errorText}`);
  }

  const list = await listRes.json();
  if (list.total === 0) {
    console.log('No hay respaldos disponibles en este bucket.');
    return [];
  }

  console.log(`\nEncontrados ${list.total} respaldos:\n`);
  list.files.forEach((f, idx) => {
    const sizeKb = (f.sizeOriginal / 1024).toFixed(1);
    const date = new Date(f.$createdAt).toLocaleString();
    console.log(`[${idx + 1}] ID: ${f.$id} | Archivo: ${f.name} | Tamaño: ${sizeKb} KB | Fecha: ${date}`);
  });
  return list.files;
}

async function downloadBackup(fileId, targetDir) {
  // 1. Obtener metadata del archivo
  const metaRes = await fetch(
    `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BACKUP_BUCKET_ID}/files/${fileId}`,
    {
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
      },
    },
  );

  if (!metaRes.ok) {
    throw new Error(`Error obteniendo metadata del archivo (${metaRes.status})`);
  }

  const fileMeta = await metaRes.json();
  console.log(`⬇️  Descargando respaldo ${fileMeta.name}...`);

  // 2. Descargar contenido binario
  const downloadRes = await fetch(
    `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BACKUP_BUCKET_ID}/files/${fileId}/download`,
    {
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
      },
    },
  );

  if (!downloadRes.ok) {
    throw new Error(`Error descargando archivo de Appwrite (${downloadRes.status})`);
  }

  const arrayBuffer = await downloadRes.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const outGzPath = path.join(targetDir, fileMeta.name);
  const outSqlPath = outGzPath.replace(/\.gz$/, '');

  writeFileSync(outGzPath, fileBuffer);
  console.log(`💾 Archivo comprimido guardado en: ${outGzPath}`);

  // Descomprimir a SQL
  try {
    const uncompressed = gunzipSync(fileBuffer);
    writeFileSync(outSqlPath, uncompressed);
    console.log(`📄 Archivo SQL/JSON descomprimido listo: ${outSqlPath}`);
  } catch {
    console.log('ℹ️  El archivo descargado se guardó directamente sin descompresión.');
  }

  console.log('\n====================================================');
  console.log('💡 INSTRUCCIONES DE RESTAURACIÓN:');
  console.log('Para restaurar este respaldo en tu base de datos Supabase, ejecuta:');
  console.log(`\npsql "${process.env.DIRECT_URL || process.env.DATABASE_URL}" < "${outSqlPath}"\n`);
  console.log('====================================================');
}

async function main() {
  const args = process.argv.slice(2);
  const targetDir = path.resolve(__dirname, '../../backups');
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

  if (args.includes('--list')) {
    await listBackups();
    return;
  }

  const files = await listBackups();
  if (files.length === 0) return;

  let targetFileId = null;
  const fileIdArg = args.find(a => a.startsWith('--fileId='));
  if (fileIdArg) {
    targetFileId = fileIdArg.split('=')[1];
  } else {
    // Descargar el más reciente por defecto
    targetFileId = files[0].$id;
    console.log(`\nSeleccionando el respaldo más reciente: ${files[0].name}`);
  }

  await downloadBackup(targetFileId, targetDir);
}

main().catch(console.error);
