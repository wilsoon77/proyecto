# Guia de Despliegue a Produccion

Este documento describe cómo desplegar el proyecto de Panadería usando:
- **Frontend (Next.js)**: Vercel
- **Backend (NestJS)**: Render
- **Base de Datos**: Supabase PostgreSQL
- **Almacenamiento de Imágenes**: Appwrite

---

## Prerrequisitos

Antes de comenzar, asegúrate de tener:
- Cuenta en [Vercel](https://vercel.com) (gratuita)
- Cuenta en [Render](https://render.com) (gratuita)
- Cuenta en [Supabase](https://supabase.com) (ya tienes la base de datos)
- Cuenta en [Appwrite](https://appwrite.io) (tienes suscripción)
- Repositorio en GitHub con el código del proyecto

---

## 1. Configurar Appwrite (Storage)

### Paso 1: Crear proyecto en Appwrite
1. Ve a la [Consola de Appwrite](https://cloud.appwrite.io)
2. Crea un nuevo proyecto: **"Panadería"**
3. Anota el **Project ID** (ej: `507f1f77bcf86cd799439011`)

### Paso 2: Crear Bucket para imágenes
1. Ve a **Storage** → **Create Bucket**
2. Nombre: `product-images`
3. Permisos: 
   - Marcar "Read" para **Any** (imágenes públicas)
   - Desmarcar "Write" para Any (solo API puede subir)
4. Anota el **Bucket ID**

### Paso 3: Crear API Key
1. Ve a **Settings** → **API Keys**
2. Crea una nueva API Key con estos scopes:
   - `files.read`
   - `files.write`
3. Guarda la API Key de forma segura

### Variables a usar:
```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=tu_project_id
APPWRITE_API_KEY=tu_api_key_secreta
APPWRITE_BUCKET_ID=product-images
```

---

## 2. Desplegar Backend en Render

### Paso 1: Conectar repositorio
1. Ve a [Render Dashboard](https://dashboard.render.com)
2. **New** → **Web Service**
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio del proyecto

### Paso 2: Configurar servicio
- **Name**: `panaderia-api`
- **Region**: Oregon (US West) o la más cercana
- **Branch**: `main`
- **Root Directory**: `api`
- **Runtime**: Node
- **Build Command**: `npm ci && npx prisma generate && npm run build`
- **Start Command**: `npm run start:prod`
- **Instance Type**: Free (o Starter para mejor rendimiento)

### Paso 3: Variables de entorno
En la sección **Environment**, agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` |
| `JWT_ACCESS_SECRET` | (genera con `openssl rand -base64 32`) |
| `JWT_REFRESH_SECRET` | (genera con `openssl rand -base64 32`) |
| `CORS_ORIGINS` | `https://tu-frontend.vercel.app` |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `APPWRITE_ENDPOINT` | `https://cloud.appwrite.io/v1` |
| `APPWRITE_PROJECT_ID` | (tu project ID) |
| `APPWRITE_API_KEY` | (tu API key) |
| `APPWRITE_BUCKET_ID` | (tu bucket ID) |

### Paso 4: Desplegar
1. Click en **Create Web Service**
2. Espera a que el build termine (5-10 minutos primera vez)
3. Tu API estará disponible en: `https://panaderia-api.onrender.com`

### Paso 5: Ejecutar migraciones
Después del primer deploy, ejecuta las migraciones:
1. Ve a **Shell** en Render
2. Ejecuta: `npx prisma migrate deploy`
3. Opcional - Seed: `npx prisma db seed`

---

## 3. Desplegar Frontend en Vercel

### Paso 1: Importar proyecto
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. **Add New** → **Project**
3. Importa tu repositorio de GitHub

### Paso 2: Configurar proyecto
- **Project Name**: `panaderia-web`
- **Framework Preset**: Next.js (auto-detectado)
- **Root Directory**: `web`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

### Paso 3: Variables de entorno
Agrega estas variables:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://panaderia-api.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | (tu API key de Google Maps) |

### Paso 4: Desplegar
1. Click en **Deploy**
2. Espera a que el build termine (2-3 minutos)
3. Tu frontend estará en: `https://panaderia-web.vercel.app`

---

## 4. Configuración Post-Despliegue

### Actualizar CORS en Render
Una vez tengas la URL de Vercel, actualiza la variable:
```
CORS_ORIGINS=https://panaderia-web.vercel.app
```

### Dominio personalizado (opcional)
**En Vercel:**
1. Ve a **Settings** → **Domains**
2. Agrega tu dominio: `panaderia.tuempresa.com`
3. Configura DNS en tu registrador

**En Render:**
1. Ve a **Settings** → **Custom Domains**
2. Agrega: `api.panaderia.tuempresa.com`

---

## 5. Verificación

### Checklist de pruebas:
- [ ] API Health: `https://tu-api.onrender.com/health`
- [ ] Frontend carga correctamente
- [ ] Login funciona
- [ ] Productos se cargan desde la API
- [ ] Checkout crea órdenes
- [ ] Imágenes se muestran correctamente

### Monitoreo
- **Render**: Dashboard muestra logs y métricas
- **Vercel**: Analytics y Web Vitals disponibles
- **Appwrite**: Storage usage visible en dashboard

---

## Troubleshooting

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` use la conexión pooled (puerto 6543)
- Asegúrate de que `DIRECT_URL` use puerto 5432

### Error: "CORS blocked"
- Actualiza `CORS_ORIGINS` con la URL exacta del frontend
- No incluyas `/` al final de la URL

### Build falla en Render
- Revisa los logs de build
- Verifica que `prisma generate` se ejecute antes de `build`

### Imágenes no cargan
- Verifica permisos del bucket en Appwrite (Read: Any)
- Confirma que `APPWRITE_BUCKET_ID` es correcto

---

## Comandos útiles

```bash
# Generar secretos JWT
openssl rand -base64 32

# Ver logs en Render (local)
render logs --tail

# Ejecutar migraciones manualmente
npx prisma migrate deploy

# Verificar estado de la API
curl https://tu-api.onrender.com/health
```

---

## Tips

1. **Cold Starts**: El plan gratuito de Render "duerme" después de 15 min de inactividad. El primer request puede tardar 30-60 segundos.

2. **Caché de Vercel**: Next.js cachea automáticamente. Para refrescar, haz redeploy o usa `revalidate` en fetch.

3. **Backups**: Supabase hace backups automáticos. Considera exportar periódicamente.

4. **SSL**: Tanto Vercel como Render incluyen SSL gratis.

---

¡Tu aplicación está lista para producción!
