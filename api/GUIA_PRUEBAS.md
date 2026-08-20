# Guia Rapida de Pruebas - API Panaderia Svetlana

> **Alcance vigente (agosto de 2026):** prueba catálogo público, carrito y retiro en sucursal, inventario, materias primas, recetas, producción, cierre diario y las dos alertas operativas. No hay POS, pagos en tienda, direcciones de delivery ni dashboard predictivo. `PaymentMethod` solo acepta `EFECTIVO` y la caducidad con varios recordatorios aplica únicamente a productos `COMPRADO`.

## Preparacion Inicial

### 1. Asegúrate que el servidor esté corriendo
```powershell
cd api
node .\dist\src\main.js
```
Servidor en: http://localhost:4000
Swagger docs: http://localhost:4000/docs

### 2. Crear Usuario ADMIN (solo primera vez)

Opción A - Usando Prisma Studio:
```powershell
cd api
npm run prisma:studio
```
- Abre el modelo `User`
- Clic en "Add record"
- Datos:
  - email: `admin@panaderia.com`
  - passwordHash: (usa https://bcrypt-generator.com/ con "Admin123!")
  - firstName: `Admin`
  - lastName: `Sistema`
  - role: `ADMIN`
  - isActive: `true`

Opción B - SQL directo en Supabase:
```sql
INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", role, "isActive")
VALUES (
  gen_random_uuid(),
  'admin@panaderia.com',
  '$2a$10$hash_aqui', -- Genera el hash de "Admin123!" con bcrypt
  'Admin',
  'Sistema',
  'ADMIN',
  true
);
```

---

## Pruebas Esenciales (en orden)

### PASO 1: Autenticación

#### Registrar cliente
```http
POST http://localhost:4000/auth/register
Content-Type: application/json

{
  "email": "cliente@test.com",
  "password": "Cliente123!",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "+58 424-1234567"
}
```

#### Login ADMIN
```http
POST http://localhost:4000/auth/login
Content-Type: application/json

{
  "email": "admin@panaderia.com",
  "password": "Admin123!"
}
```
GUARDAR: `accessToken` y `refreshToken` de la respuesta

#### Login CLIENTE
```http
POST http://localhost:4000/auth/login
Content-Type: application/json

{
  "email": "cliente@test.com",
  "password": "Cliente123!"
}
```
GUARDAR: `accessToken` del cliente

---

### PASO 2: Configuración Inicial (ADMIN)

#### Crear Categoría
```http
POST http://localhost:4000/categories
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "Pan Dulce",
  "slug": "pan-dulce",
  "description": "Panes dulces tradicionales"
}
```
Obtener el `categoryId` desde Prisma Studio o la respuesta debe incluir el ID

#### Crear Sucursal
```http
POST http://localhost:4000/branches
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "Sucursal Centro",
  "slug": "sucursal-centro",
  "address": "Av. Principal #123",
  "phone": "+58 424-1234567"
}
```

#### Crear Producto
```http
POST http://localhost:4000/products
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "sku": "CONCHA-001",
  "name": "Concha de Vainilla",
  "description": "Pan dulce tradicional",
  "basePrice": 15.00,
  "isNew": true,
  "categorySlug": "pan-dulce",
  "origin": "PRODUCIDO"
}
```

---

### PASO 3: Inventario (ADMIN/MANAGER)

#### Agregar Stock Inicial
```http
POST http://localhost:4000/stock-movements
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "productSlug": "concha-vainilla",
  "toBranchSlug": "sucursal-centro",
  "type": "PRODUCCION",
  "quantity": 50,
  "note": "Stock inicial"
}
```

#### Verificar Inventario
```http
GET http://localhost:4000/inventory?branchSlug=sucursal-centro
```

---

### PASO 4: Experiencia Cliente

#### Ver Productos Destacados (Homepage)
```http
GET http://localhost:4000/products/featured?limit=10
```

#### Buscar Productos
```http
GET http://localhost:4000/products?search=concha&page=1
```

#### Ver Productos por Categoría
```http
GET http://localhost:4000/categories/pan-dulce/products?page=1
```

#### Hacer Pedido
```http
POST http://localhost:4000/orders/reserve
Authorization: Bearer {clienteToken}
Content-Type: application/json

{
  "branchSlug": "sucursal-centro",
  "paymentMethod": "EFECTIVO",
  "items": [
    {
      "productSlug": "concha-vainilla",
      "quantity": 3
    }
  ]
}
```
GUARDAR: `orderId` de la respuesta

#### Ver Mis Pedidos
```http
GET http://localhost:4000/orders/my-orders
Authorization: Bearer {clienteToken}
```

---

### PASO 5: Gestión de Pedidos (ADMIN)

#### Confirmar Pedido (para preparación)
```http
POST http://localhost:4000/orders/{orderId}/confirm
Authorization: Bearer {adminToken}
```

#### Entregar Pedido (descuenta inventario)
```http
POST http://localhost:4000/orders/{orderId}/pickup
Authorization: Bearer {adminToken}
```

---

## Endpoints Importantes por Rol

### PÚBLICO (sin autenticación)
- `GET /products` - Listar únicamente productos y categorías activas
- `GET /products/featured` - Productos destacados
- `GET /products/:slug` - Detalle de producto
- `GET /categories` - Listar categorías
- `GET /categories/:slug/products` - Productos por categoría
- `GET /branches` - Listar sucursales
- `GET /health` - Health check

### CLIENTE (autenticado)
Todo lo público más:
- `POST /auth/register` - Registro
- `POST /auth/login` - Login
- `GET /auth/me` - Mi perfil
- `PATCH /auth/me` - Actualizar perfil
- `POST /orders/reserve` - Hacer pedido
- `GET /orders/my-orders` - Mis pedidos
- `GET /orders/:id` - Ver mi pedido (solo si es suyo)
- `POST /orders/:id/cancel` - Cancelar mi pedido

### ADMIN
- Todo lo anterior más la administración de productos, categorías, sucursales, usuarios, configuración y métricas.
- `POST /products` - Crear producto
- `PATCH /products/:slug` - Actualizar producto
- `DELETE /products/:slug` - Eliminar producto
- `POST /categories` - Crear categoría
- `POST /branches` - Crear sucursal

### ADMIN / MANAGER
- `POST /stock-movements` - Crear movimiento
- `GET /stock-movements` - Ver movimientos
- `GET /orders` - Ver TODAS las órdenes
- `POST /orders/:id/confirm` - Confirmar pedido para preparación
- `POST /orders/:id/pickup` - Entregar pedido

### BAKER
- `GET /production` - Consultar producción de su sucursal
- `POST /production` - Registrar producción de su sucursal

---

## Nuevos Endpoints Implementados

### Críticos para Frontend

1. **GET /orders/my-orders**
   - Cliente ve solo sus pedidos
   - Paginado y filtrado por estado
   - Incluye datos de sucursal y productos

2. **GET /products/featured**
   - Productos nuevos o con descuento
   - Ideal para homepage
   - Ordenado por relevancia

3. **GET /categories/:slug/products**
   - Navegación por categorías
   - Paginado y ordenado
   - Incluye datos de categoría

4. **POST /orders/:id/confirm**
   - Confirmación del pedido para preparación
   - Transición PENDING → CONFIRMED
   - Se usa para iniciar la preparación; el pago se cobra en efectivo al retirar

### Mejoras de Seguridad

- Validación de propiedad en `GET /orders/:id`
- Guards ADMIN/MANAGER en stock-movements; BAKER queda limitado a producción y su sucursal asignada
- Filtro automático por userId en my-orders
- Bcryptjs para hash de contraseñas

---

## Usar Swagger (Recomendado)

1. Abre http://localhost:4000/docs
2. Haz clic en "Authorize" (candado arriba a la derecha)
3. Pega tu `accessToken` en el campo "Value"
4. Clic en "Authorize" y luego "Close"
5. Ahora puedes probar endpoints directamente en el navegador

**Ventajas:**
- Interfaz visual intuitiva
- Validaciones automáticas
- Ejemplos de respuestas
- No necesitas herramientas externas

---

## Usar REST Client (VS Code)

1. Instala la extensión "REST Client" en VS Code
2. Abre el archivo `PRUEBAS_API.http`
3. Haz clic en "Send Request" sobre cada petición
4. Los tokens se guardan automáticamente en variables

**Ventajas:**
- Todo en el editor
- Variables dinámicas
- Historial de peticiones
- Versionable con Git

---

## Flujo Completo E2E

### Caso de uso: Cliente hace un pedido

1. **Cliente se registra**
   ```
   POST /auth/register
   ```

2. **Cliente hace login**
   ```
   POST /auth/login
   → Guarda accessToken
   ```

3. **Cliente ve productos**
   ```
   GET /products/featured
   GET /categories/pan-dulce/products
   ```

4. **Cliente reserva pedido**
   ```
   POST /orders/reserve
   → Bloquea inventario (reserved++)
   &rarr; Retorna orderId
   ```

5. **Cliente ve su pedido**
   ```
   GET /orders/my-orders
   GET /orders/{orderId}
   ```

6. **ADMIN/MANAGER confirma el pedido**
   ```
   POST /orders/{orderId}/confirm
   → PENDING → CONFIRMED
   ```

7. **ADMIN/MANAGER registra el retiro**
   ```
   POST /orders/{orderId}/pickup
   → Descuenta inventario (quantity--)
   → Libera reserva (reserved--)
   → CONFIRMED → PICKED_UP
   ```

---

## Errores Comunes y Soluciones

### 401 Unauthorized
**Causa:** Token inválido, expirado o no enviado
**Solución:** 
- Verifica que estés enviando `Authorization: Bearer {token}`
- Haz login nuevamente para obtener un token fresco
- Revisa que el token no tenga espacios extras

### 403 Forbidden
**Causa:** No tienes permisos (rol incorrecto)
**Solución:**
- Verifica tu rol en la respuesta de `/auth/me`
- Usa un token de ADMIN para endpoints administrativos
- Revisa los guards en la documentación de Swagger

### 400 Bad Request - "Stock insuficiente"
**Causa:** No hay inventario disponible
**Solución:**
- Verifica el inventario: `GET /inventory?branchSlug=...`
- Agrega stock: `POST /stock-movements` (tipo PRODUCCION)

### 400 Bad Request - "Validación falló"
**Causa:** Body mal formado o campos faltantes
**Solución:**
- Revisa los ejemplos en Swagger
- Verifica que todos los campos requeridos estén presentes
- Confirma tipos de datos (números vs strings)

### 404 Not Found - "Orden no encontrada"
**Causa:** El orderId no existe o no te pertenece
**Solución:**
- Verifica el orderId
- Si eres cliente, solo puedes ver tus propias órdenes
- Si eres ADMIN, puedes usar `GET /orders` para buscarla

---

## Estados de Órdenes

```
PENDING → CONFIRMED → PREPARING → READY → PICKED_UP
   ↓
CANCELLED (en cualquier momento antes de PICKED_UP)
```

**Transiciones disponibles:**
- `reserve` → PENDING
- `confirm` → CONFIRMED
- `pickup` → PICKED_UP (directamente si es pickup en tienda)
- `cancel` → CANCELLED

---

## Próximos Pasos Recomendados

### Para probar el estado actual:
1. Aplicar las migraciones Prisma y ejecutar el seed en una base local o de pruebas.
2. Verificar en Swagger la visibilidad pública de productos y `GET /products/admin` con un usuario autorizado.
3. Probar compras de productos `COMPRADO` con recordatorios, producción de `PRODUCIDO`, cierre diario y las dos alertas.
4. Configurar Telegram solo si se desea validar sus consultas de lectura.

### Para Producción:
1. Deshabilitar Swagger (`SWAGGER_ENABLED=false`)
2. Configurar CORS con dominio específico
3. Rate limiting más estricto
4. Logging a archivo o servicio externo
5. Backup automático de base de datos
6. Monitoreo de salud del servidor
7. HTTPS obligatorio

---

## Resumen

El backend está preparado para soportar:
- Sistema de autenticación completo
- Catálogo de productos con filtros avanzados
- Carrito de compras (vía reserva de órdenes)
- Gestión de inventario multi-sucursal
- Panel Operación
- Producción, cierres y alertas operativas

**Siguiente paso:** aplicar migraciones en el entorno de prueba y validar el flujo con datos representativos de las dos sucursales.
