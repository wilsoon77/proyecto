# Panaderia Svetlana API (NestJS + Prisma)

Backend para el sistema ERP/POS de panaderías multi-sucursal.

## Documentacion API

**Swagger local:** http://localhost:4000/docs (cuando el servidor esté corriendo)

## Stack
- NestJS 10 (Framework HTTP / modular)
- Prisma 5 (ORM para PostgreSQL)
- PostgreSQL (Supabase en la nube)
- TypeScript estricto
- Validación con class-validator / class-transformer
- Almacenamiento de imágenes: Appwrite (node-appwrite)
- Logging: nestjs-pino + pino-pretty
- Métricas: prom-client (Prometheus)
- Seguridad: Helmet, CORS, ThrottlerModule (Rate Limiting), JWT Access+Refresh tokens, bcrypt

## Módulos Implementados (19)

| Módulo | Descripción |
|--------|-------------|
| `AuthModule` | Registro, login, refresh tokens, logout, perfil |
| `ProductsModule` | CRUD de productos con filtros, paginación, búsqueda |
| `CategoriesModule` | CRUD de categorías |
| `BranchesModule` | CRUD de sucursales |
| `UsersModule` | Gestión de usuarios (ADMIN) |
| `AddressesModule` | Direcciones de envío |
| `OrdersModule` | Reserva, cancelación, pickup, listado de pedidos |
| `InventoryModule` | Inventario de producto terminado por sucursal |
| `StockMovementsModule` | Movimientos de inventario (producción, ventas, merma, etc.) |
| `DashboardModule` | Estadísticas agregadas para dashboard admin |
| `RecipesModule` | CRUD de recetas (amasijos) |
| `ProductionModule` | Registro de producción (logs de horneos) |
| `RawMaterialsModule` | Gestión de materia prima |
| `StorageModule` | Upload/gestión de imágenes (Appwrite) |
| `SupabaseModule` | Integración con Supabase Auth |
| `AuditModule` | Registro de auditoría de acciones |
| `HealthModule` | Health check (`/health`) |
| `MetricsModule` | Métricas Prometheus (`/metrics`) |
| `PrismaModule` | Servicio Prisma compartido |

## Endpoints (44+)

### Auth (7)
- `POST /auth/register` — Registro con hCaptcha
- `POST /auth/login` — Login con JWT
- `POST /auth/refresh` — Renovar tokens
- `POST /auth/logout` — Cerrar sesión
- `GET /auth/me` — Perfil del usuario
- `PATCH /auth/me` — Actualizar perfil
- `POST /auth/deactivate` — Desactivar cuenta

### Products (7)
- `GET /products` — Listado con filtros, búsqueda, paginación
- `GET /products/:slug` — Detalle por slug
- `GET /products/featured` — Productos destacados
- `POST /products` — Crear (ADMIN/MANAGER)
- `PATCH /products/:slug` — Actualizar (ADMIN/MANAGER)
- `PUT /products/:slug` — Reemplazar (ADMIN/MANAGER)
- `DELETE /products/:slug` — Eliminar (ADMIN)

### Categories (5)
- `GET /categories` — Listado
- `GET /categories/:slug` — Detalle
- `POST /categories` — Crear (ADMIN/MANAGER)
- `PATCH /categories/:slug` — Actualizar (ADMIN/MANAGER)
- `DELETE /categories/:slug` — Eliminar (ADMIN)

### Branches (5)
- `GET /branches` — Listado de sucursales
- `GET /branches/:id` — Detalle
- `POST /branches` — Crear (ADMIN)
- `PATCH /branches/:id` — Actualizar (ADMIN)
- `DELETE /branches/:id` — Eliminar (ADMIN)

### Users (6)
- `GET /users` — Listado (ADMIN)
- `GET /users/:id` — Detalle (ADMIN)
- `POST /users` — Crear (ADMIN)
- `PATCH /users/:id` — Actualizar (ADMIN)
- `DELETE /users/:id/deactivate` — Desactivar (ADMIN)
- `POST /users/:id/reactivate` — Reactivar (ADMIN)

### Addresses (5)
- `GET /addresses` — Mis direcciones (o todas para ADMIN)
- `GET /addresses/:id` — Detalle
- `POST /addresses` — Crear
- `PATCH /addresses/:id` — Actualizar
- `DELETE /addresses/:id` — Eliminar

### Orders (5)
- `POST /orders/reserve` — Reservar pedido
- `POST /orders/:id/cancel` — Cancelar
- `POST /orders/:id/pickup` — Marcar recogido
- `GET /orders` — Listado con filtros
- `GET /orders/:id` — Detalle

### Inventory & Stock (3)
- `GET /inventory` — Inventario con filtros por sucursal
- `POST /stock-movements` — Registrar movimiento
- `GET /stock-movements` — Historial de movimientos

### Dashboard (1)
- `GET /dashboard/stats` — Estadísticas (ADMIN/MANAGER)

### Health & Metrics (2)
- `GET /health` — Health check
- `GET /metrics` — Métricas Prometheus (ADMIN)

### Recipes, Production, Raw Materials
- Endpoints CRUD para recetas, producción y materia prima

## Requisitos previos
- Node.js >= 18
- Cuenta en Supabase con base PostgreSQL creada

## Configuración inicial
1. Copiar `.env.example` a `.env` y completar valores
2. Habilitar Corepack: `corepack enable`
3. Instalar dependencias: `pnpm install --frozen-lockfile`
4. Generar cliente Prisma: `pnpm run prisma:generate`
5. Aplicar migraciones: `pnpm run prisma:migrate -- --name init`
6. Sembrar datos iniciales: `pnpm run seed`
7. Ejecutar servidor: `pnpm run dev`

## Scripts

| Script | Descripción |
|--------|-------------|
| `dev` | Ejecuta Nest en modo desarrollo (ts-node loader) |
| `build` | Compila TypeScript a `dist` |
| `start` | Inicia servidor desde `dist` |
| `prisma:migrate` | Crea/aplica migraciones en dev |
| `prisma:deploy` | Aplica migraciones en producción |
| `prisma:generate` | Genera el cliente Prisma |
| `seed` | Ejecuta el script de seed inicial |
| `openapi:gen:dist` | Genera `openapi.json` sin conectar a DB |
| `test` / `test:e2e` | Ejecuta tests con Jest |

## Seguridad Implementada
- **Helmet** — Headers de seguridad HTTP
- **CORS** — Orígenes configurables via `CORS_ORIGINS`
- **Rate Limiting** — 100 req/min global (ThrottlerModule)
- **JWT** — Access tokens (15min) + Refresh tokens (7 días) con rotación
- **bcrypt** — Hash de contraseñas
- **hCaptcha** — Protección de registro/login
- **forbidNonWhitelisted** — Validación estricta de DTOs
- **Swagger deshabilitado en producción**
- **Audit Log** — Registro de acciones con IP y User-Agent

## Scalar Cloud (OpenAPI automático)

Se usa GitHub Actions para validar y publicar `openapi.json` en Scalar. Ver `.github/workflows/` para detalles.

## Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total al sistema |
| `MANAGER` | Dueños/familia — ventas, inventario, producción |
| `BAKER` | Panadero — producción y materia prima |
| `CASHIER` | Cajero — solo punto de venta |
| `CUSTOMER` | Cliente — catálogo, pedidos, perfil |

---
Última actualización: Marzo 2026
