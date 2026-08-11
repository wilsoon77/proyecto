# Panaderia Svetlana API (NestJS + Prisma)

Backend operativo para una panadería de dos sucursales: catálogo, pedidos para retiro, inventario, producción y alertas.

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

## Módulos implementados

| Módulo | Descripción |
|--------|-------------|
| `AuthModule` | Registro, login, refresh tokens, logout, perfil |
| `ProductsModule` | Catálogo, CRUD de productos y visibilidad en e-commerce |
| `CategoriesModule` | CRUD de categorías |
| `BranchesModule` | CRUD de sucursales |
| `UsersModule` | Gestión de usuarios (ADMIN) |
| `OrdersModule` | Reservas para retiro, cancelación, confirmación y recogida |
| `InventoryModule` | Inventario, lotes y caducidades |
| `StockMovementsModule` | Movimientos de inventario (producción, ventas, merma, etc.) |
| `DailyCloseModule` | Cierre diario y conciliación de producto terminado |
| `NotificationsModule` | Alertas de materia prima baja y caducidad próxima |
| `SystemConfigModule` | Configuración operativa |
| `TelegramModule` | Vinculación y asistente de consultas por Telegram |
| `RecipesModule` | CRUD de recetas (amasijos) |
| `ProductionModule` | Registro de producción (logs de horneos) |
| `RawMaterialsModule` | Gestión de materia prima |
| `TasksModule` | Expiración automática de reservas PENDING no confirmadas |
| `StorageModule` | Upload/gestión de imágenes (Appwrite) |
| `SupabaseModule` | Integración con Supabase Auth |
| `AuditModule` | Registro de auditoría de acciones |
| `HealthModule` | Health check (`/health`) |
| `MetricsModule` | Métricas Prometheus (`/metrics`) |
| `PrismaModule` | Servicio Prisma compartido |

## Endpoints principales

### Auth (7)
- `POST /auth/register` — Registro con hCaptcha
- `POST /auth/login` — Login con JWT
- `POST /auth/refresh` — Renovar tokens
- `POST /auth/logout` — Cerrar sesión
- `GET /auth/me` — Perfil del usuario
- `PATCH /auth/me` — Actualizar perfil
- `POST /auth/deactivate` — Desactivar cuenta

### Products
- `GET /products` — Listado con filtros, búsqueda, paginación
- `GET /products/:slug` — Detalle por slug
- `GET /products/featured` — Productos destacados
- `POST /products` — Crear (ADMIN)
- `PATCH /products/:slug` — Actualizar (ADMIN), incluyendo visibilidad en e-commerce
- `PUT /products/:slug` — Reemplazar (ADMIN)
- `DELETE /products/:slug` — Eliminar (ADMIN)

### Presentaciones comerciales

Los productos pueden incluir `presentations`, donde cada elemento define `name`, `unitsInStock`, `price`, `isForSale`, `isForProduction`, `isDefault` e `isActive`. El inventario siempre se almacena en la unidad base del producto.

En `POST /orders/reserve`, cada item puede enviar `presentationId`. La cantidad recibida es comercial; el servicio convierte automáticamente a unidades base para reservar y descontar inventario. Las órdenes guardan una copia del nombre, precio y cantidad comercial para conservar el historial.

El registro de producción acepta `productionPresentationId` y `productionQuantity`. El cierre diario y la reconciliación de inventario aceptan conteos por presentación y los convierten antes de generar movimientos.

La configuración funcional completa está en [`documentation/PRESENTACIONES_PRODUCTO.md`](../documentation/PRESENTACIONES_PRODUCTO.md).

### Categories
- `GET /categories` — Listado
- `GET /categories/:slug` — Detalle
- `POST /categories` — Crear (ADMIN)
- `PATCH /categories/:slug` — Actualizar (ADMIN)
- `DELETE /categories/:slug` — Eliminar (ADMIN)

### Branches
- `GET /branches` — Listado de sucursales
- `GET /branches/:id` — Detalle
- `POST /branches` — Crear (ADMIN)
- `PATCH /branches/:id` — Actualizar (ADMIN)
- `DELETE /branches/:id` — Eliminar (ADMIN)

### Users
- `GET /users` — Listado (ADMIN)
- `GET /users/:id` — Detalle (ADMIN)
- `POST /users` — Crear (ADMIN)
- `PATCH /users/:id` — Actualizar (ADMIN)
- `DELETE /users/:id/deactivate` — Desactivar (ADMIN)
- `POST /users/:id/reactivate` — Reactivar (ADMIN)

### Orders
- `POST /orders/reserve` — Reservar pedido para recoger en sucursal; una reserva PENDING expira por defecto en 2 horas si no se confirma
- `POST /orders/:id/cancel` — Cancelar
- `POST /orders/:id/confirm` — Confirmar pedido
- `POST /orders/:id/pickup` — Marcar recogido
- `PATCH /orders/:id/status` — Avanzar estado válido del flujo de retiro
- `GET /orders` — Listado de pedidos para retiro
- `GET /orders/my-orders` — Pedidos del cliente autenticado
- `GET /orders/:id` — Detalle

### Inventory & Stock
- `GET /inventory` — Inventario con filtros por sucursal
- `GET /inventory/low-stock` — Productos con stock bajo
- `GET /inventory/expirations` — Lotes próximos a vencer, vencidos o sin fecha
- `POST /inventory/expirations/check` — Ejecutar revisión de caducidades
- `POST /stock-movements` — Registrar movimiento
- `GET /stock-movements` — Historial de movimientos
- `POST /stock-movements/reconcile` — Conciliar conteo físico
- `GET /stock-movements/activity` — Resumen operativo para Operación

### Daily close
- `GET /daily-close/preview` — Vista previa del inventario a cerrar
- `POST /daily-close` — Registrar el cierre; bloquea nueva producción de la fecha cerrada
- `GET /daily-close` — Historial (ADMIN/MANAGER)
- `GET /daily-close/:id` — Detalle (ADMIN/MANAGER)

### Notifications, Telegram and operation
- `GET /notifications` — Historial de las dos alertas operativas
- `GET /notifications/config` — Configuraciones de materia prima baja y caducidad próxima
- `POST /notifications/test` — Prueba de una de esas dos alertas (ADMIN)
- `POST /telegram/link-session` — Vincular el asistente de Telegram
- `GET /stock-movements/activity` — Actividad resumida para el panel Operación

### Health & Metrics
- `GET /health` — Health check
- `GET /metrics` — Métricas Prometheus (ADMIN)

### Recipes, Production, Raw Materials
- Endpoints CRUD para recetas, producción y materia prima

La lista completa y los esquemas de request/response se generan desde los controladores actuales con `npm run openapi:gen:dist` y se visualizan en `/docs`.

## Requisitos previos
- Node.js >= 20
- Cuenta en Supabase con base PostgreSQL creada

## Configuración inicial
1. Copiar `.env.example` a `.env` y completar valores
2. Instalar dependencias: `npm ci`
3. Generar cliente Prisma: `npm run prisma:generate`
4. Aplicar migraciones: `npm run prisma:migrate -- --name init`
5. Sembrar datos iniciales: `npm run seed`
6. Ejecutar servidor: `npm run dev`

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
| `openapi:gen` | Genera `openapi.json` desde TypeScript sin conectar a DB |
| `openapi:gen:dist` | Compila y genera `openapi.json` sin conectar a DB |
| `test` / `test:e2e` | Ejecuta tests con Jest |

## Seguridad Implementada
- **Helmet** — Headers de seguridad HTTP
- **CORS** — Orígenes configurables via `CORS_ORIGINS`
- **Rate Limiting** — 100 req/min global (ThrottlerModule)
- **JWT** — Access tokens (15min) + Refresh tokens (7 días) con rotación
- **bcrypt** — Hash de contraseñas
- **hCaptcha** — Protección de registro/login
- **whitelist** — Elimina campos no declarados en los DTOs (`forbidNonWhitelisted=false`)
- **Swagger deshabilitado en producción**
- **Audit Log** — Registro de acciones con IP y User-Agent

## Scalar Cloud (OpenAPI automático)

Se usa GitHub Actions para validar y publicar `openapi.json` en Scalar. Ver `.github/workflows/` para detalles.

## Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total al sistema |
| `MANAGER` | Dueños/familia — ambas sucursales, inventario, producción, transferencias y pedidos |
| `BAKER` | Panadero — producción y materia prima |
| `CASHIER` | Cajero — pedidos para retiro, conteo y cierre de su sucursal |
| `CUSTOMER` | Cliente — catálogo, pedidos, perfil |

---
Última actualización: Agosto 2026
