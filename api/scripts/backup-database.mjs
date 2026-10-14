import { spawn, execSync } from 'node:child_process';
import { createGzip } from 'node:zlib';
import { createWriteStream, existsSync, statSync, unlinkSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno si existen localmente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────
// CONFIGURACION
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '');
const SUPABASE_BACKUP_BUCKET_ID = (process.env.SUPABASE_BACKUP_BUCKET_ID || 'database-backups').trim().replace(/^["']|["']$/g, '');
const RETENTION_DAYS = Number.parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);

/**
 * Resuelve y sanea la URL de conexion para pg_dump.
 * - Prioridad: SUPABASE_BACKUP_URL > DIRECT_URL > DATABASE_URL.
 * - Si DATABASE_URL usa el puerto 6543 (transaction pooler), lo convierte al Session Pooler (puerto 5432).
 * - Elimina rigurosamente cualquier query parameter que no sea reconocido por libpq/pg_dump
 *   (como connection_limit, schema, pgbouncer, pool_timeout, etc.),
 *   evitando el error "invalid URI query parameter: connection_limit".
 */
function getBackupDatabaseUrl() {
  const rawUrl = (
    process.env.SUPABASE_BACKUP_URL ||
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    ''
  ).trim();

  if (!rawUrl) return '';

  try {
    const parsed = new URL(rawUrl);

    // Si viene en el Transaction Pooler (puerto 6543), cambiar al Session Pooler (puerto 5432)
    if (parsed.port === '6543') {
      console.log('Convirtiendo connection pooler (6543) a session pooler (5432) para pg_dump...');
      parsed.port = '5432';
    }

    // Parametros soportados nativamente por libpq en cadenas de conexion URI:
    const ALLOWED_LIBPQ_PARAMS = new Set([
      'sslmode',
      'sslrootcert',
      'sslcert',
      'sslkey',
      'sslcrl',
      'sslpassword',
      'connect_timeout',
      'application_name',
      'fallback_application_name',
      'keepalives',
      'keepalives_idle',
      'keepalives_interval',
      'keepalives_count',
      'tcp_user_timeout',
      'options',
      'gssencmode',
      'krbsrvname',
      'target_session_attrs',
    ]);

    // Eliminar cualquier parametro ajeno a libpq (como connection_limit, schema, pgbouncer, pool_timeout)
    for (const [key] of Array.from(parsed.searchParams.entries())) {
      if (!ALLOWED_LIBPQ_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }

    // Asegurar sslmode=require para conexiones seguras de Supabase
    if (!parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }

    return parsed.toString();
  } catch (err) {
    console.warn('No se pudo parsear como URL estandar. Aplicando saneamiento manual:', err.message);
    let sanitized = rawUrl.replace(':6543', ':5432');
    sanitized = sanitized.replace(/[?&](pgbouncer|connection_limit|pool_timeout|schema)=[^&]*/gi, '');
    if (!sanitized.includes('?')) {
      sanitized += '?sslmode=require';
    } else if (!sanitized.includes('sslmode=')) {
      sanitized += '&sslmode=require';
    }
    return sanitized.replace(/\?&/, '?').replace(/\?$/, '');
  }
}

/**
 * Verifica si pg_dump esta disponible en el entorno del sistema.
 */
function isPgDumpAvailable() {
  try {
    const isWindows = process.platform === 'win32';
    const checkCmd = isWindows ? 'where pg_dump' : 'which pg_dump';
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Genera el dump usando pg_dump comprimido con gzip.
 */
function dumpWithPgDump(dbUrl, outputPath) {
  return new Promise((resolve, reject) => {
    console.log('Ejecutando pg_dump nativo...');

    // Excluir esquemas internos de extensiones y gestion de Supabase para evitar conflictos
    const args = [
      '--dbname=' + dbUrl,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      '--exclude-schema=auth',
      '--exclude-schema=storage',
      '--exclude-schema=realtime',
      '--exclude-schema=pgbouncer',
      '--exclude-schema=extensions',
      '--exclude-schema=graphql',
      '--exclude-schema=graphql_public',
      '--exclude-schema=net',
      '--exclude-schema=vault',
      '--exclude-schema=pgsodium',
      '--exclude-schema=pgsodium_masks',
    ];

    const pgDumpProcess = spawn('pg_dump', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    const gzip = createGzip({ level: 9 });
    const outputStream = createWriteStream(outputPath);

    let stderrData = '';
    pgDumpProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    pgDumpProcess.stdout.pipe(gzip).pipe(outputStream);

    pgDumpProcess.on('error', (err) => {
      reject(new Error(`Fallo al iniciar pg_dump: ${err.message}`));
    });

    outputStream.on('finish', () => {
      resolve();
    });

    outputStream.on('error', (err) => {
      reject(err);
    });

    pgDumpProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`pg_dump finalizo con codigo de salida ${code}. Error: ${stderrData}`));
      }
    });
  });
}

/**
 * Fallback usando Prisma si pg_dump no esta instalado localmente.
 */
async function dumpWithPrismaFallback(outputPath) {
  console.log('pg_dump no detectado en el host. Utilizando fallback con Prisma Client...');
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const data = {
      metadata: {
        exportedAt: new Date().toISOString(),
        generator: 'Panaderia Fallback Backup Generator',
        version: '1.0',
      },
      users: await prisma.user.findMany(),
      branches: await prisma.branch.findMany(),
      categories: await prisma.category.findMany(),
      products: await prisma.product.findMany(),
      productPresentations: await prisma.productPresentation.findMany(),
      productImages: await prisma.productImage.findMany(),
      rawMaterials: await prisma.rawMaterial.findMany(),
      rawMaterialInventories: await prisma.rawMaterialInventory.findMany(),
      recipes: await prisma.recipe.findMany(),
      recipeIngredients: await prisma.recipeIngredient.findMany(),
      inventories: await prisma.inventory.findMany(),
      productionLogs: await prisma.productionLog.findMany(),
      stockMovements: await prisma.stockMovement.findMany(),
      inventoryLots: await prisma.inventoryLot.findMany(),
      inventoryLotConsumptions: await prisma.inventoryLotConsumption.findMany(),
      dailyCloses: await prisma.dailyClose.findMany(),
      dailyCloseItems: await prisma.dailyCloseItem.findMany(),
      orders: await prisma.order.findMany(),
      orderItems: await prisma.orderItem.findMany(),
      systemConfigs: await prisma.systemConfig.findMany(),
      notificationConfigs: await prisma.notificationConfig.findMany(),
      notifications: await prisma.notification.findMany(),
      assistantAccess: await prisma.assistantAccess.findMany(),
      telegramLinks: await prisma.telegramLink.findMany(),
      alertStates: await prisma.alertState.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
      refreshTokens: await prisma.refreshToken.findMany(),
      trustedDevices: await prisma.trustedDevice.findMany(),
    };

    const jsonString = JSON.stringify(data, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2);

    await new Promise((resolve, reject) => {
      const gzip = createGzip({ level: 9 });
      const outputStream = createWriteStream(outputPath);

      gzip.pipe(outputStream);
      gzip.write(jsonString, 'utf8');
      gzip.end();

      outputStream.on('finish', resolve);
      outputStream.on('error', reject);
    });

    console.log('Respaldo generado mediante Prisma.');
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Sube el archivo de backup a Supabase Storage y aplica la politica de rotacion.
 */
async function uploadAndRotate(filePath, fileName) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY ausentes.');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log(`Conectando a Supabase Storage (${SUPABASE_URL})...`);
  console.log(`Bucket de Backups: [${SUPABASE_BACKUP_BUCKET_ID}]`);

  // Asegurar que el bucket privado existe
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets && !buckets.find((b) => b.id === SUPABASE_BACKUP_BUCKET_ID)) {
    console.log(`Creando bucket privado [${SUPABASE_BACKUP_BUCKET_ID}] en Supabase...`);
    const { error: createErr } = await supabase.storage.createBucket(SUPABASE_BACKUP_BUCKET_ID, {
      public: false,
      fileSizeLimit: 52428800, // 50MB
    });
    if (createErr) {
      console.warn('Advertencia al crear bucket:', createErr.message);
    }
  }

  const buffer = readFileSync(filePath);

  console.log(`Subiendo archivo ${fileName} a Supabase Bucket [${SUPABASE_BACKUP_BUCKET_ID}]...`);
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from(SUPABASE_BACKUP_BUCKET_ID)
    .upload(fileName, buffer, {
      contentType: 'application/gzip',
      upsert: true,
    });

  if (uploadErr) {
    throw new Error(`Error al subir a Supabase Storage: ${uploadErr.message}`);
  }

  console.log(`Archivo respaldado con exito en Supabase Storage! (Path: ${uploadData.path})`);

  // Rotacion: eliminar backups mas antiguos que RETENTION_DAYS
  console.log(`Verificando politica de retencion (${RETENTION_DAYS} dias)...`);
  try {
    const { data: fileList, error: listErr } = await supabase.storage
      .from(SUPABASE_BACKUP_BUCKET_ID)
      .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    if (listErr) {
      console.warn('No fue posible listar archivos para rotacion:', listErr.message);
    } else if (fileList && fileList.length > 0) {
      const now = Date.now();
      const filesToDelete = [];

      for (const file of fileList) {
        if (file.name === fileName) continue; // No borrar el archivo recien subido

        const fileDate = new Date(file.created_at).getTime();
        const ageDays = (now - fileDate) / (1000 * 60 * 60 * 24);

        if (ageDays > RETENTION_DAYS) {
          console.log(`Eliminando respaldo antiguo: ${file.name} (antiguedad: ${ageDays.toFixed(1)} dias)...`);
          filesToDelete.push(file.name);
        }
      }

      if (filesToDelete.length > 0) {
        const { error: delErr } = await supabase.storage
          .from(SUPABASE_BACKUP_BUCKET_ID)
          .remove(filesToDelete);

        if (delErr) {
          console.warn('Advertencia al eliminar archivos antiguos:', delErr.message);
        } else {
          console.log(`Se eliminaron ${filesToDelete.length} respaldos antiguos por politica de retencion.`);
        }
      } else {
        console.log(`Todos los respaldos existentes estan dentro del periodo de ${RETENTION_DAYS} dias.`);
      }
    }
  } catch (rotError) {
    console.warn('No fue posible completar la rotacion de archivos antiguos:', rotError.message);
  }

  return { fileId: uploadData.path };
}

// ─────────────────────────────────────────────────────────────
// EJECUCION PRINCIPAL
// ─────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('INICIANDO SISTEMA DE BACKUP AUTOMATICO (SUPABASE)');
  console.log(`Fecha/Hora: ${new Date().toISOString()}`);
  console.log(`Retencion configurada: ${RETENTION_DAYS} dias`);
  console.log('====================================================');

  const dbUrl = getBackupDatabaseUrl();
  if (!dbUrl) {
    throw new Error('No se encontro URL de base de datos (SUPABASE_BACKUP_URL o DATABASE_URL).');
  }

  const tmpDir = path.resolve(__dirname, '../temp_backups');
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup-panaderia-${timestamp}.sql.gz`;
  const outputPath = path.join(tmpDir, fileName);

  try {
    let dumpSuccess = false;
    if (isPgDumpAvailable()) {
      try {
        await dumpWithPgDump(dbUrl, outputPath);
        dumpSuccess = true;
      } catch (dumpErr) {
        console.warn(`pg_dump nativo reporto un problema (${dumpErr.message}).`);
        console.warn('Activando respaldo de seguridad con Prisma Client fallback...');
        if (existsSync(outputPath)) {
          try { unlinkSync(outputPath); } catch {}
        }
      }
    }

    if (!dumpSuccess) {
      await dumpWithPrismaFallback(outputPath);
    }

    const stats = statSync(outputPath);
    const sizeKb = (stats.size / 1024).toFixed(2);
    console.log(`Archivo comprimido generado: ${fileName} (${sizeKb} KB)`);

    // Subir a Supabase Storage y rotar
    const { fileId } = await uploadAndRotate(outputPath, fileName);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('====================================================');
    console.log(`BACKUP COMPLETADO SATISFACTORIAMENTE en ${elapsed}s`);
    console.log(`Supabase Storage File Path: ${fileId}`);
    console.log('====================================================');

    // Registrar resumen si corre en GitHub Actions
    if (process.env.GITHUB_STEP_SUMMARY) {
      const { appendFileSync } = await import('node:fs');
      const summary = `
### Respaldo de Base de Datos Exitoso
- **Archivo:** \`${fileName}\`
- **Tamano:** \`${sizeKb} KB\`
- **Destino:** Supabase Storage (Bucket: \`${SUPABASE_BACKUP_BUCKET_ID}\`)
- **Supabase Path:** \`${fileId}\`
- **Retencion aplicada:** \`${RETENTION_DAYS} dias\`
- **Duracion:** \`${elapsed} segundos\`
`;
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8');
    }
  } finally {
    // Limpieza de archivo temporal local
    if (existsSync(outputPath)) {
      try {
        unlinkSync(outputPath);
        console.log('Archivo temporal local eliminado.');
      } catch {}
    }
  }
}

main().catch((err) => {
  console.error('Error fatal en el proceso de respaldo:', err.message);
  process.exit(1);
});
