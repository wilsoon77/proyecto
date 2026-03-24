# Análisis de Endpoints — Estado Actual

> **Actualizado: Marzo 2026**

## ✅ Endpoints Implementados (44+ total)

### Auth (7) ✅
- ✅ POST /auth/register
- ✅ POST /auth/login
- ✅ POST /auth/refresh
- ✅ POST /auth/logout
- ✅ GET /auth/me
- ✅ PATCH /auth/me
- ✅ POST /auth/deactivate

### Products (7) ✅
- ✅ GET /products (con filtros, búsqueda, paginación)
- ✅ GET /products/:slug
- ✅ GET /products/featured
- ✅ POST /products (ADMIN/MANAGER)
- ✅ PATCH /products/:slug (ADMIN/MANAGER)
- ✅ PUT /products/:slug (ADMIN/MANAGER)
- ✅ DELETE /products/:slug (ADMIN)

### Categories (5) ✅
- ✅ GET /categories
- ✅ GET /categories/:slug
- ✅ POST /categories (ADMIN/MANAGER)
- ✅ PATCH /categories/:slug (ADMIN/MANAGER)
- ✅ DELETE /categories/:slug (ADMIN)

### Branches (5) ✅
- ✅ GET /branches
- ✅ GET /branches/:id
- ✅ POST /branches (ADMIN)
- ✅ PATCH /branches/:id (ADMIN)
- ✅ DELETE /branches/:id (ADMIN)

### Users (6) ✅
- ✅ GET /users (ADMIN)
- ✅ GET /users/:id (ADMIN)
- ✅ POST /users (ADMIN)
- ✅ PATCH /users/:id (ADMIN)
- ✅ DELETE /users/:id/deactivate (ADMIN)
- ✅ POST /users/:id/reactivate (ADMIN)

### Addresses (5) ✅
- ✅ GET /addresses (usuario ve sus direcciones, ADMIN ve todas)
- ✅ GET /addresses/:id
- ✅ POST /addresses
- ✅ PATCH /addresses/:id
- ✅ DELETE /addresses/:id

### Inventory (1) ✅
- ✅ GET /inventory (con filtros por sucursal y producto)

### Stock Movements (2) ✅
- ✅ POST /stock-movements
- ✅ GET /stock-movements (con filtros)

### Orders (5) ✅
- ✅ POST /orders/reserve
- ✅ POST /orders/:id/cancel
- ✅ POST /orders/:id/pickup
- ✅ GET /orders (con filtros, clientes ven solo sus pedidos)
- ✅ GET /orders/:id

### Dashboard (1) ✅
- ✅ GET /dashboard/stats (ADMIN/MANAGER)

### Health & Metrics (2) ✅
- ✅ GET /health
- ✅ GET /metrics (ADMIN)

### Recipes ✅
- ✅ CRUD completo de recetas (amasijos)

### Production ✅
- ✅ CRUD de registros de producción (horneos)

### Raw Materials ✅
- ✅ CRUD de gestión de materia prima

---

## 🟡 Mejoras Potenciales (Futuro)

### Endpoints que podrían agregarse:
1. **GET /categories/:slug/products** — Productos filtrados por categoría (se puede lograr con `GET /products?category=slug`)
2. **POST /auth/forgot-password** y **POST /auth/reset-password** — Recuperación de contraseña (parcialmente implementado en frontend)
3. **POST /products/:slug/images** — Upload de imágenes (se usa Appwrite directamente)
4. **GET /branches/:id/inventory** — Vista de inventario por sucursal (se puede lograr con `GET /inventory?branchId=X`)
5. **Webhooks de pago** — Integración con pasarela de pagos (no implementado aún)

### Validaciones que podrían mejorarse:
- Endpoint de búsqueda dedicado (`GET /products/search`) — actualmente se usa `?search=` en `GET /products`
- Paginación en endpoints de categorías relacionadas

---

## 📊 Estado del Backend

| Aspecto | Estado |
|---------|--------|
| **Funcionalidad** | ✅ 95%+ para MVP |
| **Seguridad** | ✅ Helmet, CORS, Rate Limiting, JWT, bcrypt, audit log |
| **Documentación API** | ✅ Swagger completo en `/docs` |
| **Testing** | ⚠️ Tests e2e de seguridad implementados, expandir cobertura |
| **Producción** | ✅ Módulos operativos, compilación sin errores |

---

## Roles del Sistema

| Rol | Acceso |
|-----|--------|
| `ADMIN` | Acceso total |
| `MANAGER` | Ventas, inventario, producción, reportes |
| `BAKER` | Producción y materia prima |
| `CASHIER` | Punto de venta |
| `CUSTOMER` | Catálogo, pedidos, perfil |

> **Nota:** No existe rol `EMPLOYEE`. Las funciones de empleado se dividen en `MANAGER`, `BAKER` y `CASHIER` según la responsabilidad operativa.
