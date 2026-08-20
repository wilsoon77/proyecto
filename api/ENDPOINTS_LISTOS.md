# ENDPOINTS IMPLEMENTADOS (REFERENCIA HISTÓRICA)

> **Actualizado:** agosto de 2026. Este inventario conserva ejemplos del documento inicial; Swagger en `/docs` y `api/ANALISIS_ENDPOINTS.md` son la fuente de verdad. No existe un módulo POS ni un endpoint predictivo `/dashboard/stats`.
> **Swagger UI:** `http://localhost:4000/docs`

---

## Resumen de Endpoints (44+)

| Módulo | Endpoints | Autenticación |
|--------|-----------|---------------|
| Auth | 7 | Parcial (login/register públicos) |
| Products | Catálogo público + consulta administrativa | Lectura pública; administración protegida |
| Categories | 5 | Lectura pública, escritura ADMIN |
| Branches | 5 | Lectura pública, escritura ADMIN |
| Users | 6 | ADMIN |
| Orders | Reservas, estados y retiro | Cliente / ADMIN / MANAGER |
| Inventory | Inventario, bajo stock y caducidades | ADMIN / MANAGER |
| Stock Movements | Movimientos, conciliación y actividad | ADMIN / MANAGER |
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

**Estados válidos:** PENDING, CONFIRMED, PREPARING, READY, CANCELLED, PICKED_UP. El flujo es únicamente para retiro en sucursal.

---

### Operación
La pantalla `/admin` presenta el panel Operación con KPIs simples, actividad y las dos alertas operativas. La actividad se consulta mediante los endpoints actuales de inventario/cierre; no hay un módulo de dashboard predictivo.

---

## Pasos para Probar

1. **Inicia el servidor:**
   ```powershell
   cd api
   npm run dev
   ```

2. **Abre Swagger UI:** `http://localhost:4000/docs`

3. **Prueba sin autenticación:**
   - `GET /products`, `GET /products/featured`, `GET /categories`, `GET /branches`

4. **Autentícate:**
   - `POST /auth/login` → obtén token
   - Click "Authorize" en Swagger → pega el token

5. **Prueba endpoints autenticados:**
   - `GET /orders`, `GET /inventory`, `GET /daily-close`, etc.

---

## Roles disponibles

| Rol | Acceso |
|-----|--------|
| `ADMIN` | Acceso total |
| `MANAGER` | Pedidos para retiro, inventario, producción, transferencias y cierres de ambas sucursales |
| `BAKER` | Producción y operación de su sucursal asignada |
| `CUSTOMER` | Catálogo, pedidos, perfil |

**Backend completamente funcional**
