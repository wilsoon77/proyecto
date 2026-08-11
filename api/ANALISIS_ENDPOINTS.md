# Análisis de endpoints — alcance operativo actual

> Actualizado: agosto de 2026. La fuente de verdad para esquemas y respuestas es Swagger/OpenAPI en `/docs`.

## Alcance

La API cubre el flujo mínimo de una panadería con dos sucursales:

- catálogo, carrito y pedidos para retiro en sucursal;
- recetas, producción y consumo de materia prima;
- inventario de producto terminado y materia prima;
- alertas operativas de materia prima baja y caducidad próxima;
- cierres diarios y consulta por Telegram.

No se exponen módulos de POS, dashboard predictivo, analíticas de demanda, direcciones de envío ni entregas a domicilio.

## Endpoints implementados

### Autenticación y usuarios

- `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- `/auth/me`, `/auth/deactivate`, `/auth/oauth-callback`
- `/auth/reset-password`, `/auth/reset-password/recovery`
- CRUD administrativo de `/users`

### Catálogo

- CRUD administrativo de `/products` y `/categories`.
- `GET /products` y `GET /products/:slug` para el catálogo.
- `isActive=false` oculta el producto del e-commerce, pero no lo elimina del inventario ni del cierre diario.
- Las presentaciones comerciales convierten cantidades de venta a la unidad base.

### Pedidos para retiro

- `POST /orders/reserve`
- `POST /orders/:id/confirm`
- `PATCH /orders/:id/status`
- `POST /orders/:id/cancel`
- `POST /orders/:id/pickup`
- `GET /orders`, `GET /orders/my-orders`, `GET /orders/:id`

Estados válidos: `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `PICKED_UP` y `CANCELLED`. Una reserva `PENDING` sin confirmar se cancela automáticamente después de 2 horas por defecto y libera su reserva de inventario. Los demás estados no expiran automáticamente.

### Inventario y producción

- `GET /inventory`, `GET /inventory/low-stock`
- `GET /inventory/expirations`, `POST /inventory/expirations/check`
- `POST /stock-movements`, `GET /stock-movements`
- `POST /stock-movements/reconcile`, `GET /stock-movements/activity`
- CRUD de `/recipes`, `/production` y `/raw-materials`
- `POST /raw-materials/purchase` para compras de materia prima

La caducidad solo aplica a lotes de productos de origen `COMPRADO` con control de caducidad activo. Los lotes vencidos permanecen visibles para registrar una `MERMA`; no desaparecen por una tarea automática.

### Cierre diario

- `GET /daily-close/preview`
- `POST /daily-close`
- `GET /daily-close`, `GET /daily-close/:id`

El cierre concilia el conteo y la merma de producto terminado. Una vez cerrado el día, se bloquea nueva `PRODUCCION` para esa fecha; las compras, mermas, pérdidas, transferencias y otros ajustes siguen disponibles para registrar movimientos reales.

### Alertas y asistentes

Las únicas configuraciones de notificación son:

1. `inventory.raw_material_low`
2. `inventory.expiration_warning`

Los usuarios `MANAGER` reciben alertas de ambas sucursales. Los endpoints `/notifications` exponen el historial, configuración y pruebas de estas dos alertas. `/telegram` permite vincular el asistente para consultas operativas.

## Roles y sucursales

| Rol | Alcance |
|---|---|
| `ADMIN` | Acceso administrativo global |
| `MANAGER` | Lectura y operación de ambas sucursales; puede transferir inventario entre ellas |
| `BAKER` | Producción y operación de su sucursal asignada |
| `CASHIER` | Pedidos para retiro, conteo y cierre de su sucursal |
| `CUSTOMER` | Catálogo, carrito, reservas, pedidos y perfil |

## Generación y verificación

```bash
npm run openapi:gen
npm run openapi:gen:dist
```

Ambos comandos generan `openapi.json` sin conectar a la base de datos. El pipeline de CI valida el artefacto antes de publicarlo en Scalar.
