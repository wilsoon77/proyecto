/**
 * Obtiene el secreto usado para firmar y validar JWT de la aplicación.
 * Nunca debe existir un secreto débil en producción, pero permite un fallback
 * seguro en modo SKIP_DB (generación de OpenAPI en CI) y desarrollo local.
 */
export function getJwtAccessSecret(secret: string | undefined): string {
  const effectiveSecret =
    secret ||
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET ||
    (process.env.SKIP_DB === '1' ? 'ci-dummy-jwt-secret-key-32-chars-long' : undefined);

  if (!effectiveSecret) {
    throw new Error('JWT_ACCESS_SECRET es obligatorio. Define un secreto aleatorio de al menos 32 caracteres.');
  }

  if (process.env.NODE_ENV === 'production' && effectiveSecret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET debe tener al menos 32 caracteres en producción.');
  }

  return effectiveSecret;
}
