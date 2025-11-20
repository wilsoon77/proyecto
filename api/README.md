# PanaderIA API (NestJS + Prisma)

Backend para el sistema de gestión de panaderías.

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
- Swagger/OpenAPI (`/docs`) para exportar a Bump.sh
- Jobs asíncronos (BullMQ) para notificaciones

## Integración con el frontend
Cuando el endpoint `/products` esté conectado a Postgres:
- Sustituir `MOCK_PRODUCTS` por fetch al API desde Next.js (`fetch(process.env.API_URL + '/products')`).

## Bump.sh y Requestly
- Bump.sh: publicaremos el `openapi.json` generado por Swagger (script futuro `npm run openapi:export`).
- Requestly: se puede crear reglas para redirigir peticiones del front a staging o mocks de test.

## Scripts
| Script | Descripción |
|--------|-------------|
| `dev` | Ejecuta Nest en modo desarrollo (ts-node loader). |
| `build` | Compila TypeScript a `dist`. |
| `start` | Inicia servidor desde `dist`. |
| `prisma:migrate` | Crea/aplica migraciones en dev. |
| `prisma:deploy` | Aplica migraciones en producción. |
| `seed` | Ejecuta el script de seed inicial. |

## Notas de seguridad
- Reemplazar secretos por valores seguros antes de deploy.
- Activar rate limiting y Helmet en siguientes pasos.
- Usar roles y guards para proteger rutas sensibles.

---
Este README evolucionará conforme añadamos Auth, Orders y Swagger.
