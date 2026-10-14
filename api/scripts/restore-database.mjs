import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '');
const SUPABASE_BACKUP_BUCKET_ID = (process.env.SUPABASE_BACKUP_BUCKET_ID || 'database-backups').trim().replace(/^["']|["']$/g, '');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Variables de entorno requeridas ausentes: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listBackups() {
  console.log(`Consultando respaldos en Supabase Storage [Bucket: ${SUPABASE_BACKUP_BUCKET_ID}]...`);
  const { data: fileList, error } = await supabase.storage
    .from(SUPABASE_BACKUP_BUCKET_ID)
    .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

  if (error) {
    throw new Error(`Error consultando Supabase Storage: ${error.message}`);
  }

  if (!fileList || fileList.length === 0) {
    console.log('No hay respaldos disponibles en este bucket.');
    return [];
  }

  console.log(`\nEncontrados ${fileList.length} respaldos:\n`);
  fileList.forEach((f, idx) => {
    const sizeKb = f.metadata?.size ? (f.metadata.size / 1024).toFixed(1) : 'desconocido';
    const date = f.created_at ? new Date(f.created_at).toLocaleString() : 'N/A';
    console.log(`[${idx + 1}] Archivo: ${f.name} | Tamano: ${sizeKb} KB | Fecha: ${date}`);
  });
  return fileList;
}

async function downloadBackup(fileName, targetDir) {
  console.log(`Descargando respaldo ${fileName} desde Supabase Storage...`);

  const { data: blob, error } = await supabase.storage
    .from(SUPABASE_BACKUP_BUCKET_ID)
    .download(fileName);

  if (error || !blob) {
    throw new Error(`Error descargando archivo de Supabase Storage: ${error ? error.message : 'Blob vacio'}`);
  }

  const arrayBuffer = await blob.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const outGzPath = path.join(targetDir, fileName);
  const outSqlPath = outGzPath.replace(/\.gz$/, '');

  writeFileSync(outGzPath, fileBuffer);
  console.log(`Archivo comprimido guardado en: ${outGzPath}`);

  // Descomprimir a SQL
  try {
    const uncompressed = gunzipSync(fileBuffer);
    writeFileSync(outSqlPath, uncompressed);
    console.log(`Archivo SQL/JSON descomprimido listo: ${outSqlPath}`);
  } catch {
    console.log('El archivo descargado se guardo directamente sin descompresion.');
  }

  console.log('\n====================================================');
  console.log('INSTRUCCIONES DE RESTAURACION:');
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

  let targetFileName = null;
  const fileNameArg = args.find((a) => a.startsWith('--file=') || a.startsWith('--fileId='));
  if (fileNameArg) {
    targetFileName = fileNameArg.split('=')[1];
  } else {
    // Descargar el mas reciente por defecto
    targetFileName = files[0].name;
    console.log(`\nSeleccionando el respaldo mas reciente: ${files[0].name}`);
  }

  await downloadBackup(targetFileName, targetDir);
}

main().catch(console.error);
