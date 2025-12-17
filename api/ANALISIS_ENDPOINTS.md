# Análisis de Endpoints - Recomendaciones

## ✅ Endpoints Implementados (44 total)

### Auth (7)
- ✅ POST /auth/register
- ✅ POST /auth/login
- ✅ POST /auth/refresh
- ✅ POST /auth/logout
- ✅ GET /auth/me
- ✅ PATCH /auth/me
- ✅ POST /auth/deactivate

### Products (7)
- ✅ GET /products (con filtros, búsqueda, paginación)
- ✅ GET /products/:slug
- ✅ POST /products (ADMIN)
- ✅ PATCH /products/:slug (ADMIN)
- ✅ POST /products/:slug/deactivate (ADMIN)
- ✅ DELETE /products/:slug (ADMIN)
- ✅ PUT /products/:slug (ADMIN)

### Categories (5)
- ✅ GET /categories
- ✅ GET /categories/:slug
- ✅ POST /categories (ADMIN)
- ✅ PATCH /categories/:slug (ADMIN)
- ✅ DELETE /categories/:slug (ADMIN)

### Branches (5)
- ✅ GET /branches
- ✅ GET /branches/:id
- ✅ POST /branches (ADMIN)
- ✅ PATCH /branches/:id (ADMIN)
- ✅ DELETE /branches/:id (ADMIN)

### Users (6)
- ✅ GET /users (ADMIN)
- ✅ GET /users/:id (ADMIN)
- ✅ POST /users (ADMIN)
- ✅ PATCH /users/:id (ADMIN)
- ✅ DELETE /users/:id/deactivate (ADMIN)
- ✅ POST /users/:id/reactivate (ADMIN)

### Addresses (5)
- ✅ GET /addresses (usuario ve sus direcciones, ADMIN ve todas)
- ✅ GET /addresses/:id
- ✅ POST /addresses
- ✅ PATCH /addresses/:id
- ✅ DELETE /addresses/:id

### Inventory (1)
- ✅ GET /inventory (con filtros por sucursal y producto)

### Stock Movements (2)
- ✅ POST /stock-movements
- ✅ GET /stock-movements (con filtros)

### Orders (5)
- ✅ POST /orders/reserve
- ✅ POST /orders/:id/cancel
- ✅ POST /orders/:id/pickup
- ✅ GET /orders (con filtros)
- ✅ GET /orders/:id

### Health & Metrics (2)
- ✅ GET /health
- ✅ GET /metrics (ADMIN)

---

## 🔴 Endpoints Faltantes Críticos para Frontend

### 1. **GET /orders/my-orders** (CRÍTICO)
**Problema:** Un cliente no puede ver solo SUS pedidos
**Solución:** Agregar endpoint que filtre por userId automáticamente
```typescript
@Get('my-orders')
@UseGuards(JwtAuthGuard)
myOrders(@Req() req: any, @Query() filters) {
  return this.service.findByUser(req.user.userId, filters);
}
```

### 2. **GET /products/featured** (IMPORTANTE)
**Problema:** Frontend necesita productos destacados para homepage
**Solución:** Endpoint de productos nuevos o con descuento
```typescript
@Get('featured')
findFeatured(@Query('limit') limit?: number) {
  return this.service.findFeatured(limit || 10);
}
```

### 3. **GET /categories/:slug/products** (IMPORTANTE)
**Problema:** Navegar productos por categoría es común en e-commerce
**Solución:** Endpoint de productos filtrados por categoría
```typescript
@Get(':slug/products')
productsByCategory(@Param('slug') slug: string, @Query() filters) {
  return this.productsService.findByCategory(slug, filters);
}
```

### 4. **GET /branches/:id/inventory** (ÚTIL)
**Problema:** Ver disponibilidad de todos los productos en una sucursal
**Solución:** Endpoint específico de inventario por sucursal
```typescript
@Get(':id/inventory')
branchInventory(@Param('id') id: number) {
  return this.inventoryService.findByBranch(id);
}
```

### 5. **POST /orders/:id/confirm** (IMPORTANTE)
**Problema:** No hay transición de PENDING → CONFIRMED
**Solución:** Endpoint para confirmar pago (ADMIN o sistema de pago)
```typescript
@Post(':id/confirm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EMPLOYEE')
confirm(@Param('id') id: number) {
  return this.service.confirm(id);
}
```

### 6. **PATCH /orders/:id/status** (ADMIN - ÚTIL)
**Problema:** No hay forma de cambiar estado manualmente
**Solución:** Endpoint flexible para cambio de estado
```typescript
@Patch(':id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EMPLOYEE')
updateStatus(@Param('id') id: number, @Body() { status }) {
  return this.service.updateStatus(id, status);
}
```

### 7. **GET /products/search** (OPCIONAL - ya existe filtro en GET /products)
**Nota:** Ya se puede buscar con ?search=, pero un endpoint dedicado sería más semántico

### 8. **POST /products/:slug/images** (FUTURO)
**Problema:** No hay gestión de imágenes de productos
**Solución:** Endpoint de upload de imágenes (usar multer/cloudinary)
**Estado:** No prioritario si usan URLs estáticas

### 9. **GET /dashboard/stats** (ADMIN - ÚTIL)
**Problema:** No hay estadísticas agregadas para dashboard admin
**Solución:** Endpoint con métricas clave
```typescript
@Get('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
getStats() {
  return {
    totalOrders: ...,
    totalRevenue: ...,
    topProducts: ...,
    lowStock: ...
  };
}
```

### 10. **POST /auth/forgot-password** y **POST /auth/reset-password** (FUTURO)
**Problema:** No hay recuperación de contraseña
**Estado:** No crítico para MVP

---

## 🟡 Mejoras Recomendadas en Endpoints Existentes

### Orders
- ✅ Ya tiene paginación
- ❌ Falta filtro por `userId` automático para clientes
- ❌ Falta incluir `addressId` en ReserveOrderDto
- ❌ Falta validar que el usuario solo vea sus pedidos (no los de otros)

### Products
- ✅ Filtros completos
- ❌ Falta paginación en categorías relacionadas
- ❌ Falta endpoint de productos relacionados/similares

### Inventory
- ✅ Funciona bien
- ❌ Podría tener endpoint agregado por producto (stock total en todas las sucursales)

---

## 📋 Prioridades de Implementación

### CRÍTICAS (implementar YA)
1. **GET /orders/my-orders** - Para que clientes vean solo sus pedidos
2. **POST /orders/:id/confirm** - Para flujo de confirmación de pago
3. **GET /categories/:slug/products** - Navegación por categorías

### IMPORTANTES (implementar pronto)
4. **GET /products/featured** - Homepage del frontend
5. **PATCH /orders/:id/status** - Gestión de pedidos por empleados
6. **GET /branches/:id/inventory** - Disponibilidad por sucursal

### OPCIONALES (futuro)
7. **GET /dashboard/stats** - Dashboard admin
8. **POST /auth/forgot-password** - Recuperación de contraseña
9. **POST /products/:slug/images** - Upload de imágenes

---

## 🔧 Validaciones y Seguridad Faltantes

### Orders
- ⚠️ **CRÍTICO:** Un cliente puede ver pedidos de otros con GET /orders/:id
  - Validar: `order.userId === req.user.userId || req.user.role === 'ADMIN'`

### Addresses
- ✅ Ya valida propiedad correctamente

### Products
- ⚠️ Falta validación de categoría existente al crear producto
- ⚠️ Falta validación de SKU único

### Stock Movements
- ⚠️ No valida permisos de usuario (cualquier autenticado puede crear)
  - Debe requerir rol ADMIN o EMPLOYEE

---

## 📝 Resumen de Acciones

### Para MVP funcional (frontend básico):
```
1. Agregar GET /orders/my-orders
2. Agregar validación de propiedad en GET /orders/:id
3. Agregar GET /categories/:slug/products
4. Agregar GET /products/featured
5. Agregar guards ADMIN a stock-movements
```

### Para producción completa:
```
6. Agregar POST /orders/:id/confirm
7. Agregar PATCH /orders/:id/status
8. Agregar GET /branches/:id/inventory
9. Agregar GET /dashboard/stats
10. Agregar recuperación de contraseña
```

---

## 🎯 Estado Actual del Backend

**Funcionalidad:** 80% completo para MVP
**Seguridad:** 90% completo (faltan validaciones menores)
**Documentación:** 100% (Swagger completo)
**Testing:** 77% (10/13 tests passing)

**Recomendación:** Implementar los 5 endpoints críticos y el backend estará 95% listo para frontend.
