/**
 * Utilidades para auditoría: detección de campos realmente modificados
 * y obtención de la IP real del cliente.
 */

/**
 * Normaliza un valor para comparación (maneja Decimal, Date, null, undefined).
 */
function normalize(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || typeof val === 'bigint') return String(val);
  if (typeof val === 'boolean') return String(val);
  if (val instanceof Date) return val.toISOString();
  // Prisma Decimal tiene método toNumber()
  if (typeof val === 'object' && val !== null && 'toNumber' in val && typeof (val as any).toNumber === 'function') {
    return String((val as any).toNumber());
  }
  return String(val);
}

/**
 * Compara el registro anterior con los datos nuevos y retorna solo los campos
 * que realmente cambiaron de valor.
 *
 * @param oldRecord - Registro existente de la BD (antes de actualizar)
 * @param newData   - Datos enviados en el body del request
 * @param fieldMap  - Mapeo opcional de campos (ej. { categorySlug: 'categoryId' })
 *                    para cuando el body usa un nombre diferente al de la BD.
 * @returns Lista de nombres de campos que cambiaron
 */
export function getChangedFields(
  oldRecord: Record<string, unknown>,
  newData: Record<string, unknown>,
  fieldMap?: Record<string, string>,
): string[] {
  const changed: string[] = [];

  for (const key of Object.keys(newData)) {
    const newVal = newData[key];

    // Ignorar campos undefined (no enviados)
    if (newVal === undefined) continue;

    // Determinar qué campo del registro antiguo usar
    const oldKey = fieldMap?.[key] ?? key;
    const oldVal = oldRecord[oldKey];

    if (normalize(oldVal) !== normalize(newVal)) {
      changed.push(key);
    }
  }

  return changed;
}

/**
 * Obtiene la dirección IP real del cliente.
 * Prioriza el header X-Forwarded-For (proxies como Render, Vercel, Nginx)
 * y cae en req.ip como fallback.
 */
export function getClientIp(req: any): string {
  // X-Forwarded-For puede ser una cadena separada por comas: "clientIp, proxy1, proxy2"
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const first = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : forwarded[0];
    if (first) return first;
  }

  // req.ip funciona si trust proxy está habilitado en Express
  if (req.ip && req.ip !== '::1' && req.ip !== '::ffff:127.0.0.1') {
    return req.ip;
  }

  // Fallback absoluto
  return req.ip || req.connection?.remoteAddress || 'localhost';
}
