/**
 * Script de prueba directa para WhatsApp Cloud API (Meta)
 * Uso:
 *   node scripts/test-whatsapp.mjs <NUMERO_TELEFONO> [NOMBRE]
 * Ejemplo:
 *   node scripts/test-whatsapp.mjs 50212345678 Wilson
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde api/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const token = process.env.WHATSAPP_API_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'alerta_inventario';
const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || 'es';

console.log('--- Diagnóstico de Configuración WhatsApp ---');
console.log(`Phone Number ID: ${phoneId ? phoneId : '❌ NO CONFIGURADO'}`);
console.log(`API Token: ${token ? `${token.slice(0, 10)}... (Configurado)` : '❌ NO CONFIGURADO'}`);
console.log(`Plantilla: ${templateName} (${templateLang})`);
console.log('--------------------------------------------\n');

if (!token || !phoneId) {
  console.error('❌ Error: Debes configurar WHATSAPP_API_TOKEN y WHATSAPP_PHONE_NUMBER_ID en tu archivo .env');
  process.exit(1);
}

const targetPhoneRaw = process.argv[2];
const targetName = process.argv[3] || 'Administrador';

if (!targetPhoneRaw) {
  console.log('ℹ️ Para enviar una prueba a un teléfono real, ejecuta:');
  console.log('   node scripts/test-whatsapp.mjs <NUMERO_CON_CODIGO_PAIS>');
  console.log('   Ejemplo: node scripts/test-whatsapp.mjs 50212345678 Wilson\n');
  process.exit(0);
}

const targetPhone = targetPhoneRaw.replace(/\D/g, '');

const isHelloWorld = process.argv.includes('--hello') || templateName === 'hello_world';

const payload = isHelloWorld
  ? {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: targetPhone,
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US',
        },
      },
    }
  : {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: targetPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: templateLang,
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: targetName },
              { type: 'text', text: 'Materia prima baja' },
              { type: 'text', text: 'Harina de Trigo tiene 12.5 LB en Sucursal Central' },
            ],
          },
        ],
      },
    };

console.log(`🚀 Enviando alerta de prueba a ${targetPhone}...`);

try {
  const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = rawText;
  }

  if (!response.ok || (data && data.error)) {
    console.error('❌ Meta API respondió con error:', data.error || data);
    if (data?.error?.code === 131030) {
      console.error('\n💡 Causa probable: El número no está en la lista de números permitidos (Sandbox allowlist) de Meta for Developers.');
    } else if (data?.error?.code === 190) {
      console.error('\n💡 Causa probable: El token de acceso ha expirado o es inválido.');
    } else if (data?.error?.code === 132001) {
      console.error('\n💡 Causa probable: La plantilla aún no existe o el nombre/idioma no coincide exactamente.');
    }
    process.exit(1);
  }

  console.log('✅ ¡Mensaje enviado exitosamente!');
  console.log('Detalle de respuesta de Meta:', JSON.stringify(data, null, 2));
} catch (err) {
  console.error('❌ Excepción al conectar con Meta:', err.message);
  process.exit(1);
}
