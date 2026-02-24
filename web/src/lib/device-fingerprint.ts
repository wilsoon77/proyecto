/**
 * Utilidad para generar un fingerprint único del dispositivo
 * Usado para implementar "dispositivos de confianza" y captcha inteligente
 */

export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return '';
  
  // Recopilar información del dispositivo
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    // @ts-expect-error deviceMemory no está en todos los navegadores
    navigator.deviceMemory || 0,
  ];
  
  // Crear hash simple del fingerprint
  const fingerprint = components.join('|');
  return hashString(fingerprint);
}

// Hash simple para el fingerprint (no criptográfico, solo para identificación)
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convertir a string hexadecimal y agregar timestamp del primer uso
  const storedId = getStoredDeviceId();
  if (storedId) return storedId;
  
  const newId = Math.abs(hash).toString(16) + '-' + Date.now().toString(36);
  storeDeviceId(newId);
  return newId;
}

const DEVICE_ID_KEY = 'device_fingerprint';

function getStoredDeviceId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(DEVICE_ID_KEY);
}

function storeDeviceId(id: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(DEVICE_ID_KEY, id);
}

export function getDeviceId(): string {
  const stored = getStoredDeviceId();
  if (stored) return stored;
  return generateDeviceFingerprint();
}
