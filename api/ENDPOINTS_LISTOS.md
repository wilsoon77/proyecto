# ENDPOINTS IMPLEMENTADOS

> **Actualizado: Marzo 2026**
> Todos los endpoints listados aquí están implementados, documentados en Swagger y listos para usar.
> **Swagger UI:** `http://localhost:4000/docs`

---

## Resumen de Endpoints (44+)

| Módulo | Endpoints | Autenticación |
|--------|-----------|---------------|
| Auth | 7 | Parcial (login/register públicos) |
| Products | 7 | Lectura pública, escritura ADMIN/MANAGER |
| Categories | 5 | Lectura pública, escritura ADMIN/MANAGER |
| Branches | 5 | Lectura pública, escritura ADMIN |
| Users | 6 | ADMIN |
| Addresses | 5 | Autenticado |
| Orders | 5 | Autenticado |
| Inventory | 1 | Autenticado |
| Stock Movements | 2 | Autenticado |
| Dashboard | 1 | ADMIN/MANAGER |
| Health & Metrics | 2 | Público / ADMIN |
| Recipes | CRUD | ADMIN/MANAGER |
| Production | CRUD | ADMIN/MANAGER/BAKER |
| Raw Materials | CRUD | ADMIN/MANAGER |

---

## Detalle de Endpoints Clave

### GET /products/featured
**URL:** `http://localhost:4000/products/featured`
**Parámetros:** `limit` (1-50, default: 10)

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Pan Francés",
    "slug": "pan-frances",
    "basePrice": 0.50,
    "comboQuantity": 3,
    "comboPrice": 1.25,
    "isNew": true,
    "origin": "PRODUCIDO",
    "category": "Panes",
    "images": [{ "id": 1, "url": "...", "position": 0 }]
  }
]
```

---

### GET /orders (con my-orders)
**URL:** `http://localhost:4000/orders`
**Autenticación:** Bearer Token
**Parámetros:** `status`, `page`, `pageSize`

Clientes ven automáticamente solo sus pedidos. ADMIN/MANAGER ven todos.

---

### PATCH /orders/:id/status
**URL:** `http://localhost:4000/orders/123/status`
**Autenticación:** Bearer Token (ADMIN/MANAGER)
**Body:** `{ "status": "CONFIRMED" }`

**Estados válidos:** PENDING, CONFIRMED, PREPARING, READY, IN_DELIVERY, DELIVERED, CANCELLED, PICKED_UP

---

### GET /dashboard/stats
**URL:** `http://localhost:4000/dashboard/stats`
**Autenticación:** Bearer Token (ADMIN/MANAGER)

---

## Pasos para Probar

1. **Inicia el servidor:**
   ```powershell
   cd api
   pnpm run dev
   ```

2. **Abre Swagger UI:** `http://localhost:4000/docs`

3. **Prueba sin autenticación:**
   - `GET /products`, `GET /products/featured`, `GET /categories`, `GET /branches`

4. **Autentícate:**
   - `POST /auth/login` → obtén token
   - Click "Authorize" en Swagger → pega el token

5. **Prueba endpoints autenticados:**
   - `GET /orders`, `GET /dashboard/stats`, etc.

---

## Roles disponibles

| Rol | Acceso |
|-----|--------|
| `ADMIN` | Acceso total |
| `MANAGER` | Ventas, inventario, producción, usuarios |
| `BAKER` | Producción y materia prima |
| `CASHIER` | Punto de venta |
| `CUSTOMER` | Catálogo, pedidos, perfil |

**Backend completamente funcional**
