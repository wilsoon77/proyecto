# Proyecto Panadería Svetlana (Monorepo)

Sistema ERP/POS para gestión integral de panaderías multi-sucursal. Control de producción por amasijos, inventario automatizado mediante recetas, punto de venta con combos de precios, y catálogo e-commerce.

## Estructura
- `api/`: Backend — NestJS + Prisma + Swagger (19 módulos, 44+ endpoints)
- `web/`: Frontend — Next.js 16 (App Router, React 19, TailwindCSS v3)
- `documentation/`: Documentación funcional y técnica

## Stack Tecnológico
| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v3, shadcn/ui |
| Backend | NestJS 10, TypeScript, Prisma ORM |
| Base de datos | PostgreSQL (Supabase) |
| Almacenamiento | Appwrite (imágenes de productos) |
| Monitoreo | Sentry (web y api) |
| Auth Frontend | hCaptcha para registro/login |
| Despliegue | Render (API) + Vercel (Web) |

## Requisitos
- Node.js 18+ (recomendado 20+)
- NPM (incluido con Node)

## Desarrollo local

### Backend (API):
```powershell
cd api
npm install
# Copia .env.example a .env y completa variables
npx prisma generate
npm run dev
```
Endpoints útiles:
- Swagger UI: `http://localhost:4000/docs`
- Health: `http://localhost:4000/health`
- Métricas Prometheus: `http://localhost:4000/metrics`

### Frontend (Web):
```powershell
cd web
npm install
npm run dev
```
Por defecto: `http://localhost:3000`

## Variables de entorno (API)
Crea un archivo `api/.env` basado en `api/.env.example`:
```env
# Base de datos (PostgreSQL/Supabase)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/postgres

# Autenticación (JWT) — generar con: openssl rand -base64 32
JWT_ACCESS_SECRET=tu_access_secret
JWT_REFRESH_SECRET=tu_refresh_secret

# Servidor
PORT=4000
CORS_ORIGINS=http://localhost:3000
NODE_ENV=development

# Supabase (OAuth, opcional)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Appwrite (Almacenamiento de imágenes)
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=tu_project_id
APPWRITE_API_KEY=tu_api_key
APPWRITE_BUCKET_ID=product-images
```

## Variables de entorno (Web)
Crea un archivo `web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Scripts útiles (API)
```powershell
npm run dev              # Servidor de desarrollo
npm run build            # Compilar TypeScript a dist
npm start                # Ejecutar desde dist
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Crear/aplicar migraciones dev
npm run prisma:deploy    # Aplicar migraciones en producción
npm run seed             # Datos iniciales
npm run openapi:gen:dist # Generar openapi.json
npm test                 # Ejecutar tests e2e
```

## Módulos del Backend
Auth, Products, Categories, Branches, Users, Addresses, Orders, Inventory, StockMovements, Dashboard, Health, Metrics, Storage (Appwrite), Supabase, Audit, Recipes, Production, RawMaterials.

## Roles del sistema
| Rol | Acceso |
|-----|--------|
| `ADMIN` | Acceso total al sistema |
| `MANAGER` | Ventas, inventario, producción, ajustes |
| `BAKER` | Producción y stock de materia prima |
| `CASHIER` | Punto de venta (POS) |
| `CUSTOMER` | Catálogo, carrito, pedidos, perfil |

## Paginación y cabeceras
Las rutas de listado devuelven `{ data, meta }` y además cabeceras:
- `X-Total-Count`: total de elementos
- `Link`: enlaces `first`, `last`, `prev`, `next`

## Despliegue
- **API**: Render — Build: `npm ci && npx prisma generate && npm run build`, Start: `npm run start:prod`
- **Web**: Vercel — Root directory: `web/`, Framework: Next.js
- **DB**: Supabase PostgreSQL
- **Storage**: Appwrite (imágenes)

Para detalles completos, ver `GUIA_DESPLIEGUE.md`.

## Notas
- Este monorepo permite trabajar de forma independiente en `api/` y `web/` sin interferencias.
- El archivo `.gitignore` en la raíz excluye artefactos de build y dependencias de ambos proyectos.
- Para cualquier cambio, crear rama, commit y PR según convenga.