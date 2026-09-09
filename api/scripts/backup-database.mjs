import { spawn, execSync } from 'node:child_process';
import { createGzip } from 'node:zlib';
import { createWriteStream, existsSync, statSync, unlinkSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Cargar variables de entorno si existen localmente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────

const APPWRITE_ENDPOINT = (process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1').replace(/\/$/, '').trim();
const APPWRITE_PROJECT_ID = (process.env.APPWRITE_PROJECT_ID || '').trim().replace(/^["']|["']$/g, '');
const APPWRITE_API_KEY = (process.env.APPWRITE_API_KEY || '').trim().replace(/^["']|["']$/g, '');
const APPWRITE_BACKUP_BUCKET_ID = (process.env.APPWRITE_BACKUP_BUCKET_ID || '').trim().replace(/^["']|["']$/g, '');
const RETENTION_DAYS = Number.parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);

/**
 * Resuelve y sanea la URL de conexión para pg_dump.
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
      console.log('ℹ️  Convirtiendo connection pooler (6543) a session pooler (5432) para pg_dump...');
      parsed.port = '5432';
    }

    // Parámetros soportados nativamente por libpq en cadenas de conexión URI:
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

    // Eliminar cualquier parámetro ajeno a libpq (como connection_limit, schema, pgbouncer, pool_timeout)
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
    console.warn('⚠️  No se pudo parsear como URL estándar. Aplicando saneamiento manual:', err.message);
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
 * Verifica si pg_dump está disponible en el entorno del sistema.
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
    console.log('📦 Ejecutando pg_dump nativo...');

    // Excluir esquemas internos de extensiones y gestión de Supabase para evitar conflictos
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
        reject(new Error(`pg_dump finalizó con código de salida ${code}. Error: ${stderrData}`));
      }
    });
  });
}

/**
 * Fallback usando Prisma si pg_dump no está instalado localmente.
 */
async function dumpWithPrismaFallback(outputPath) {
  console.log('ℹ️  pg_dump no detectado en el host. Utilizando fallback con Prisma Client...');
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

    console.log('✅ Respaldo generado mediante Prisma.');
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Sube el archivo de backup a Appwrite Storage y aplica la política de rotación.
 * Utiliza la API REST nativa de Appwrite para máxima confiabilidad y portabilidad.
 */
async function uploadAndRotate(filePath, fileName) {
  if (!APPWRITE_API_KEY || !APPWRITE_PROJECT_ID || !APPWRITE_BACKUP_BUCKET_ID) {
    throw new Error('Variables de entorno APPWRITE_API_KEY, APPWRITE_PROJECT_ID o APPWRITE_BACKUP_BUCKET_ID ausentes.');
  }

  console.log(`ℹ️  Conectando a Appwrite Storage (${APPWRITE_ENDPOINT})...`);
  console.log(`ℹ️  Project ID: ${APPWRITE_PROJECT_ID ? `${APPWRITE_PROJECT_ID.slice(0, 4)}... (longitud: ${APPWRITE_PROJECT_ID.length})` : 'VACÍO'}`);
  console.log(`ℹ️  API Key: ${APPWRITE_API_KEY ? `Configurada (longitud: ${APPWRITE_API_KEY.length}, prefijo: ${APPWRITE_API_KEY.slice(0, 9)})` : 'VACÍA'}`);
  console.log(`ℹ️  Bucket ID: ${APPWRITE_BACKUP_BUCKET_ID ? `${APPWRITE_BACKUP_BUCKET_ID.slice(0, 4)}... (longitud: ${APPWRITE_BACKUP_BUCKET_ID.length})` : 'VACÍO'}`);

  const buffer = readFileSync(filePath);
  const blob = new Blob([new Uint8Array(buffer)], { type: 'application/gzip' });

  const formData = new FormData();
  formData.append('fileId', 'unique()');
  formData.append('file', blob, fileName);

  console.log(`📤 Subiendo archivo ${fileName} a Appwrite Bucket [${APPWRITE_BACKUP_BUCKET_ID}]...`);
  const uploadRes = await fetch(
    `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BACKUP_BUCKET_ID}/files`,
    {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
      },
      body: formData,
    },
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    if (uploadRes.status === 401) {
      throw new Error(
        `Error al subir a Appwrite (401 No autorizado): ${errorText}\n` +
        '👉 Solución: Revisa en GitHub Secrets que APPWRITE_API_KEY sea la clave de API generada en Appwrite Console con el permiso "Storage > files.write" y "files.read", sin espacios ni comillas.'
      );
    }
    throw new Error(`Error al subir a Appwrite (${uploadRes.status}): ${errorText}`);
  }

  const uploaded = await uploadRes.json();
  const fileId = uploaded.$id;
  console.log(`✅ Archivo respaldado con éxito en Appwrite! (File ID: ${fileId})`);

  // Rotación: eliminar backups más antiguos que RETENTION_DAYS
  console.log(`🧹 Verificando política de retención (${RETENTION_DAYS} días)...`);
  try {
    const listRes = await fetch(
      `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BACKUP_BUCKET_ID}/files`,
      {
        headers: {
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': APPWRITE_API_KEY,
        },
      },
    );

    if (listRes.ok) {
      const list = await listRes.json();
      const now = Date.now();
      let deletedCount = 0;

      for (const file of list.files) {
        if (file.$id === fileId) continue; // No borrar el archivo recién subido

        const fileDate = new Date(file.$createdAt).getTime();
        const ageDays = (now - fileDate) / (1000 * 60 * 60 * 24);

        if (ageDays > RETENTION_DAYS) {
          console.log(`🗑️  Eliminando respaldo antiguo: ${file.name} (antigüedad: ${ageDays.toFixed(1)} días)...`);
          await fetch(
            `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BACKUP_BUCKET_ID}/files/${file.$id}`,
            {
              method: 'DELETE',
              headers: {
                'X-Appwrite-Project': APPWRITE_PROJECT_ID,
                'X-Appwrite-Key': APPWRITE_API_KEY,
              },
            },
          );
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`✨ Se eliminaron ${deletedCount} respaldos antiguos por política de retención.`);
      } else {
        console.log(`👍 Todos los respaldos existentes están dentro del período de ${RETENTION_DAYS} días.`);
      }
    }
  } catch (rotError) {
    console.warn('⚠️ No fue posible completar la rotación de archivos antiguos:', rotError.message);
  }

  return { fileId };
}

// ─────────────────────────────────────────────────────────────
// EJECUCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('🛡️  INICIANDO SISTEMA DE BACKUP AUTOMÁTICO');
  console.log(`📅 Fecha/Hora: ${new Date().toISOString()}`);
  console.log(`⏳ Retención configurada: ${RETENTION_DAYS} días`);
  console.log('====================================================');

  const dbUrl = getBackupDatabaseUrl();
  if (!dbUrl) {
    throw new Error('No se encontró URL de base de datos (SUPABASE_BACKUP_URL o DATABASE_URL).');
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
        console.warn(`⚠️  pg_dump nativo reportó un problema (${dumpErr.message}).`);
        console.warn('🔄 Activando respaldo de seguridad con Prisma Client fallback...');
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
    console.log(`📁 Archivo comprimido generado: ${fileName} (${sizeKb} KB)`);

    // Subir a Appwrite y rotar
    const { fileId } = await uploadAndRotate(outputPath, fileName);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('====================================================');
    console.log(`🎉 BACKUP COMPLETADO SATISFACTORIAMENTE en ${elapsed}s`);
    console.log(`💾 Appwrite File ID: ${fileId}`);
    console.log('====================================================');

    // Registrar resumen si corre en GitHub Actions
    if (process.env.GITHUB_STEP_SUMMARY) {
      const { appendFileSync } = await import('node:fs');
      const summary = `
### 🛡️ Respaldo de Base de Datos Exitoso
- **Archivo:** \`${fileName}\`
- **Tamaño:** \`${sizeKb} KB\`
- **Destino:** Appwrite Storage (Bucket: \`${APPWRITE_BACKUP_BUCKET_ID}\`)
- **Appwrite File ID:** \`${fileId}\`
- **Retención aplicada:** \`${RETENTION_DAYS} días\`
- **Duración:** \`${elapsed} segundos\`
`;
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8');
    }
  } finally {
    // Limpieza de archivo temporal local
    if (existsSync(outputPath)) {
      try {
        unlinkSync(outputPath);
        console.log('🧹 Archivo temporal local eliminado.');
      } catch {}
    }
  }
}

main().catch((err) => {
  console.error('❌ Error fatal en el proceso de respaldo:', err.message);
  process.exit(1);
});
