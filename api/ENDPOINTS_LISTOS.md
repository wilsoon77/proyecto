## ENDPOINTS LISTOS PARA PROBAR ✅

Todos los endpoints están implementados, documentados en Swagger y listos para usar.

---

### **1. GET /products/featured** ✅
**Descripción:** Productos destacados (nuevos o con descuento)
**URL:** `http://localhost:3000/products/featured`
**Parámetros Query:** 
- `limit` (opcional): número de productos (1-50, default: 10)

**Ejemplo cURL:**
```bash
curl -X GET "http://localhost:3000/products/featured?limit=5"
```

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "name": "Concha",
    "slug": "concha",
    "price": 10.5,
    "discountPct": 10,
    "isNew": true,
    "category": { "id": 1, "name": "Pan Dulce" }
  }
]
```

---

### **2. GET /orders/my-orders** ✅
**Descripción:** Mis órdenes (usuario autenticado)
**URL:** `http://localhost:3000/orders/my-orders`
**Autenticación:** Requerida (Bearer Token)
**Parámetros Query:**
- `status` (opcional): filtrar por estado
- `page` (opcional): número de página (default: 1)
- `pageSize` (opcional): items por página (default: 10)

**Ejemplo cURL:**
```bash
curl -X GET "http://localhost:3000/orders/my-orders?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Respuesta esperada:**
```json
{
  "data": [
    {
      "id": 123,
      "orderNumber": "ORD-000123",
      "status": "PENDING",
      "total": 500,
      "createdAt": "2026-01-26T10:00:00Z",
      "items": [...]
    }
  ],
  "meta": {
    "total": 5,
    "pageCount": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

---

### **3. PATCH /orders/:id/status** ✅
**Descripción:** Cambiar estado de una orden (ADMIN/EMPLOYEE)
**URL:** `http://localhost:3000/orders/123/status`
**Autenticación:** Requerida (Bearer Token - ADMIN/EMPLOYEE)
**Método:** PATCH
**Body requerido:**
```json
{
  "status": "CONFIRMED"
}
```

**Estados válidos:**
- PENDING
- CONFIRMED
- PREPARING
- READY
- IN_DELIVERY
- DELIVERED
- CANCELLED
- PICKED_UP

**Ejemplo cURL:**
```bash
curl -X PATCH "http://localhost:3000/orders/123/status" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'
```

**Respuesta esperada:**
```json
{
  "id": 123,
  "orderNumber": "ORD-000123",
  "status": "CONFIRMED",
  "total": 500,
  "updatedAt": "2026-01-26T10:15:00Z"
}
```

---

### **4. GET /dashboard/stats** ✅
**Descripción:** Estadísticas del dashboard (ADMIN ONLY)
**URL:** `http://localhost:3000/dashboard/stats`
**Autenticación:** Requerida (Bearer Token - ADMIN)
**Método:** GET

**Ejemplo cURL:**
```bash
curl -X GET "http://localhost:3000/dashboard/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

**Respuesta esperada:**
```json
{
  "summary": {
    "totalOrders": 150,
    "totalRevenue": 15000.50,
    "avgOrderValue": 100.30,
    "pendingOrders": 5,
    "activeProducts": 45,
    "totalCategories": 8,
    "totalBranches": 3
  },
  "last30Days": {
    "ordersCount": 45,
    "revenue": 4500.00,
    "avgOrderValue": 100.00
  },
  "ordersByStatus": [
    { "status": "DELIVERED", "count": 100 },
    { "status": "PENDING", "count": 5 },
    { "status": "CONFIRMED", "count": 10 },
    { "status": "CANCELLED", "count": 2 }
  ],
  "topProducts": [
    { "productId": 1, "name": "Concha", "slug": "concha", "totalSold": 50 },
    { "productId": 2, "name": "Bolillo", "slug": "bolillo", "totalSold": 40 }
  ],
  "lowStockProducts": [
    { "productId": 5, "productName": "Pan Integral", "branchName": "Centro", "available": 2 }
  ]
}
```

---

## SWAGGER DOCUMENTATION ✅

Todos los endpoints aparecerán automáticamente en Swagger UI cuando inicies el servidor:

**URL:** `http://localhost:3000/api`

**Ubicación en Swagger:**
- **products:** GET /products/featured ✅
- **orders:** GET /orders/my-orders ✅
- **orders:** PATCH /orders/:id/status ✅ (NUEVO)
- **dashboard:** GET /dashboard/stats ✅ (NUEVO)

---

## PASOS PARA PROBAR:

1. **Inicia el servidor:**
   ```bash
   cd api
   npm run start:dev
   ```

2. **Abre Swagger UI:**
   ```
   http://localhost:3000/api
   ```

3. **Prueba sin autenticación:**
   - GET /products/featured ✅

4. **Autentícate primero:**
   - POST /auth/login (obtén token)
   - Copia el token en el botón "Authorize" de Swagger

5. **Prueba endpoints autenticados:**
   - GET /orders/my-orders ✅
   - PATCH /orders/:id/status ✅
   - GET /dashboard/stats ✅ (solo si tienes rol ADMIN)

---

## RESUMEN ESTADO ✅

| Endpoint | Status | Swagger | Errores | Listo |
|----------|--------|---------|---------|-------|
| GET /products/featured | ✅ Implementado | ✅ Documentado | ❌ Ninguno | ✅ SÍ |
| GET /orders/my-orders | ✅ Implementado | ✅ Documentado | ❌ Ninguno | ✅ SÍ |
| PATCH /orders/:id/status | ✅ Nuevo | ✅ Documentado | ❌ Ninguno | ✅ SÍ |
| GET /dashboard/stats | ✅ Nuevo | ✅ Documentado | ❌ Ninguno | ✅ SÍ |

**🎉 LISTOS PARA PROBAR**
