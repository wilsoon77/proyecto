# Guía de Configuración de Subdominios y Dominios Personalizados

Esta guía detalla paso a paso qué plataformas y variables debes configurar al cambiar el subdominio gratuito de Vercel (a corto plazo) o al adquirir y vincular un dominio personalizado propio (a largo plazo).

---

## 🗺️ Mapa de Servicios y sus Responsabilidades

| Servicio | Rol en el Proyecto | ¿Requiere cambios de dominio? |
| :--- | :--- | :--- |
| **Vercel** | Frontend (Next.js) | **Sí** (Dominio principal y variable SEO) |
| **Render** | Backend / API (NestJS) | **Sí** (Variables `CORS_ORIGINS` y `HCAPTCHA`) *(El subdominio de Render se mantiene igual)* |
| **Supabase** | Base de Datos y Auth (OAuth) | **Sí** (Site URL y Redirect URLs autorizadas) |
| **Google Cloud** | Proveedor OAuth de Google | **Sí** (Orígenes JavaScript autorizados) |
| **hCaptcha** | Verificación antibot | **Sí** (Dominios / Hostnames permitidos) |

---

## 1. 🌐 Render (Backend / API)

El subdominio de tu API en Render (ej. `https://panaderia-api.onrender.com`) **no necesita cambiarse**. Lo que debes actualizar son las variables que restringen el acceso a la API:

En **[Render Dashboard](https://dashboard.render.com)** → Tu Web Service (`panaderia-api`) → **Environment**:

### `CORS_ORIGINS`
Permite qué orígenes web pueden consultar la API. Puedes colocar múltiples dominios separados por coma para soportar desarrollo local, subdominio de pruebas y dominio de producción simultáneamente:
```env
CORS_ORIGINS=https://tu-subdominio.vercel.app,https://tudominio.com,http://localhost:3000
```

### `HCAPTCHA_ALLOWED_HOSTNAMES` *(si hCaptcha está activo)*
```env
HCAPTCHA_ALLOWED_HOSTNAMES=tu-subdominio.vercel.app,tudominio.com,localhost
```

---

## 2. ⚡ Vercel (Frontend)

En **[Vercel Dashboard](https://vercel.com/dashboard)** → Tu proyecto (`panaderia-web`):

### Paso A: Asignar el Dominio / Subdominio
1. Ve a **Settings → Domains**.
2. **Corto plazo:** Edita o añade tu subdominio de Vercel deseado (ej. `mi-panaderia.vercel.app`).
3. **Largo plazo (Dominio propio):** Haz clic en **Add Domain**, escribe `tudominio.com` y configura en tu registrador de dominios los registros DNS que Vercel te indique (generalmente un registro `A` apuntando a la IP de Vercel o un `CNAME` hacia `cname.vercel-dns.com`).

### Paso B: Variable de Entorno SEO
En **Settings → Environment Variables**:
```env
NEXT_PUBLIC_SITE_URL=https://tu-subdominio.vercel.app
```
*(Cuando pases al dominio final, cambia esta variable a `https://tudominio.com`). La aplicación la utiliza para generar sitemaps, canonical URLs y metadatos OpenGraph.*

---

## 3. 🛡️ Supabase (Autenticación y Redirecciones)

En **[Supabase Dashboard](https://supabase.com/dashboard)** → Tu Proyecto → **Authentication → URL Configuration**:

### A. Site URL
La URL base principal hacia donde se redirigen los usuarios:
```text
https://tu-subdominio.vercel.app
```
*(O tu dominio final `https://tudominio.com`).*

### B. Redirect URLs (Wildcards permitidos)
Debes registrar todas las rutas de retorno autorizadas para evitar que el login OAuth o la recuperación de contraseña sean bloqueados. **Puedes registrar todas a la vez:**
```text
https://tu-subdominio.vercel.app/**
https://tu-subdominio.vercel.app/auth/callback
https://tu-subdominio.vercel.app/reset-password
https://tudominio.com/**
https://tudominio.com/auth/callback
https://tudominio.com/reset-password
http://localhost:3000/**
```

---

## 4. 🔑 Google Cloud Console (Google OAuth)

Para que el botón de **"Continuar con Google"** funcione con el nuevo dominio:

1. Ve a **[Google Cloud Console](https://console.cloud.google.com/)** → **APIs & Services** → **Credentials**.
2. Selecciona tu **OAuth 2.0 Client ID** (tipo Web Application).
3. **Orígenes autorizados de JavaScript (Authorized JavaScript origins):**
   * `https://tu-subdominio.vercel.app`
   * `https://tudominio.com`
   * `http://localhost:3000`
4. **URIs de redireccionamiento autorizados (Authorized redirect URIs):**
   * Aquí **NO** colocas la URL de Vercel, sino la URL de tu proyecto en Supabase (ya configurada previamente):
   * `https://<TU-PROJECT-REF>.supabase.co/auth/v1/callback`

---

## 5. 🤖 hCaptcha (Protección Antibot)

Si tienes activado el servicio de hCaptcha:

1. Ingresa a tu panel de **[hCaptcha Dashboard](https://www.hcaptcha.com/)**.
2. Entra a la configuración de tu **Site Key**.
3. En la sección **Domains / Hostnames**, añade:
   * `tu-subdominio.vercel.app`
   * `tudominio.com`
   * `localhost` (para desarrollo)

---

## 📋 Lista de Verificación Rápida (Checklist)

Al hacer el cambio de dominio o subdominio, valida lo siguiente:

- [ ] **Acceso Web:** La web carga en `https://tu-dominio.com`.
- [ ] **CORS API:** Las peticiones al backend no devuelven error `CORS error / Network Error` en la consola del navegador.
- [ ] **Google OAuth:** El inicio de sesión con Google abre la ventana y redirige exitosamente a la tienda.
- [ ] **Recuperación de Contraseña:** El enlace enviado al correo dirige a `https://tu-dominio.com/reset-password`.
- [ ] **hCaptcha:** El widget de verificación carga sin errores de hostname no autorizado.
