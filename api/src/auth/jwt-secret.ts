/**
 * Obtiene el secreto usado para firmar y validar JWT de la aplicación.
 * Nunca debe existir un valor por defecto: un secreto conocido permite emitir
 * tokens válidos fuera de la aplicación.
 */
export function getJwtAccessSecret(secret: string | undefined): string {
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET es obligatorio. Define un secreto aleatorio de al menos 32 caracteres.');
  }

  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET debe tener al menos 32 caracteres en producción.');
  }

  return secret;
}
