# PanaderIA API (NestJS + Prisma)

Backend para el sistema de gestión de panaderías.

## 📚 Documentación API

**Swagger local:** http://localhost:4000/docs (cuando el servidor esté corriendo)

## Stack
- NestJS (Framework HTTP / modular)
- Prisma (ORM para PostgreSQL)
- PostgreSQL (Supabase en la nube)
- TypeScript estricto
- Validación con class-validator / class-transformer

## Requisitos previos
- Node.js >= 18
- Cuenta en Supabase (o Neon) con una base Postgres creada
- GitHub Actions (CI) opcional

## Configuración inicial
1. Copiar `.env.example` a `.env` y reemplazar valores:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
JWT_ACCESS_SECRET="tu_access_secret"
JWT_REFRESH_SECRET="tu_refresh_secret"
PORT=4000
CORS_ORIGINS="http://localhost:3000"
```
2. Instalar dependencias:
```bash
npm install
```
3. Generar cliente Prisma y migrar:
```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```
4. Sembrar datos iniciales:
```bash
npm run seed
```
5. Ejecutar servidor dev:
```bash
npm run dev
```

## Endpoints iniciales
- `GET /products` (query: search, category, min, max, sort)
- `GET /products/:slug`

## Próximos módulos
- Auth (register/login, JWT)
- Orders (creación, estado)
- Branches (sucursales)
- Swagger/OpenAPI (`/docs`) para documentación y pruebas
- Jobs asíncronos (BullMQ) para notificaciones

## Integración con el frontend
Cuando el endpoint `/products` esté conectado a Postgres:
- Sustituir `MOCK_PRODUCTS` por fetch al API desde Next.js (`fetch(process.env.API_URL + '/products')`).

## Requestly
- Se puede crear reglas para redirigir peticiones del front a staging o mocks de test.

## Scripts
| Script | Descripción |
|--------|-------------|
| `dev` | Ejecuta Nest en modo desarrollo (ts-node loader). |
| `build` | Compila TypeScript a `dist`. |
| `start` | Inicia servidor desde `dist`. |
| `prisma:migrate` | Crea/aplica migraciones en dev. |
| `prisma:deploy` | Aplica migraciones en producción. |
| `seed` | Ejecuta el script de seed inicial. |

## Scalar Cloud (OpenAPI automático)

Se agregó el workflow de GitHub Actions [\.github/workflows/scalar-openapi.yml](../.github/workflows/scalar-openapi.yml) para:

- Validar `openapi.json` en Pull Requests.
- Publicar automáticamente el OpenAPI en Scalar al hacer push a `main`.

### Requisitos para activarlo

1. Crear cuenta en Scalar y obtener un API Key desde el dashboard.
2. Configurar en GitHub (Settings > Secrets and variables > Actions):
	- Secret: `SCALAR_API_KEY`
	- Variable: `SCALAR_NAMESPACE`
 	- Variable opcional: `OPENAPI_SERVER_URL` (ejemplo: `https://proyecto-dp81.onrender.com`) para que `Test Request` en Scalar apunte a tu backend real.
3. Confirmar el slug publicado (actualmente fijo como `panaderia-api` en el workflow).
4. El workflow usa Node 24 porque `@scalar/cli` requiere Node >= 24.

### Flujo del pipeline

1. Instala dependencias del backend.
2. Genera `openapi.json` con `npm run openapi:gen:dist`.
3. Valida el documento con `@scalar/cli`.
4. Calcula una versión automática para Scalar con formato `<package.json version>-<run_number>.<run_attempt>`.
5. Publica a Scalar Registry en `main` usando esa versión (historial limpio sin sobreescritura).

## Notas de seguridad
- Reemplazar secretos por valores seguros antes de deploy.
- Activar rate limiting y Helmet en siguientes pasos.
- Usar roles y guards para proteger rutas sensibles.

---
Este README evolucionará conforme añadamos Auth, Orders y Swagger.
