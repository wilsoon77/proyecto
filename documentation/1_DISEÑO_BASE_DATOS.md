# DISEÑO DE BASE DE DATOS - Panaderia Svetlana Smart System

> **ACTUALIZACIÓN IMPORTANTE:** El diseño de la base de datos está implementado mediante Prisma ORM sobre PostgreSQL en Supabase. Toda la lógica operativa (amasijos, combos de precios, conversión de unidades de insumos y multi-sucursal) se encuentra reflejada en el código del esquema físico de Prisma en `api/prisma/schema.prisma`. Este documento representa la documentación técnica oficial de la estructura de tablas y relaciones implementadas.

---

## JUSTIFICACIÓN DEL REDISEÑO OPERATIVO

1. **Estandarización de Unidades de Medida:** Toda materia prima se registra en la tabla `RawMaterial` en unidades base normalizadas (LB, ML, UNIT). La conversión automática se realiza al registrar compras a proveedores en unidades comerciales (quintales, galones, cartones), garantizando un inventario de insumos consistente por sucursal (`RawMaterialInventory`).
2. **Producción Atómica (Ciclo Amasijo-Lata):** La panadería produce por amasijo y se cuenta en latas. Al registrar un ProductionLog (horneado de receta), el sistema ejecuta una transacción que descuenta de forma automática los ingredientes (`RecipeIngredient`) del inventario de insumos y suma el producto terminado (`Inventory`) multiplicando las latas por la equivalencia de unidades por lata del producto.
3. **Esquema de Precios y Combos:** Soporte directo en la tabla de productos para precios individuales y combos específicos (ej: 3 panes por Q1.25) mediante los campos `basePrice`, `comboQuantity` y `comboPrice`.
4. **Seguridad y Control de Acceso:** Asociación física de usuarios operativos (`User` con rol `MANAGER`, `BAKER` o `CASHIER`) a una sucursal específica (`Branch`), manteniendo roles claros y auditoría completa (`AuditLog`).
5. **Reservas para Recoger en Tienda:** Estructura de pedidos simplificada para gestionar la reserva física de stock en la sucursal seleccionada, sin soporte de delivery (campo de costo de envío predeterminado a 0).

---

## DIAGRAMA CONCEPTUAL (Núcleo Operativo)

```text
┌───────────┐      ┌────────────────┐      ┌────────────┐     ┌──────────────┐
│  USUARIO  │ 1──N │ PRODUCTION_LOG │ N──1 │   RECIPE   │ N──1│   PRODUCTO   │
└───────────┘      └───────┬────────┘      └───────┬────┘     └───────┬──────┘
                           │ 1                     │ 1                │ 1
                           │                       │                  │
                           ▼ N                     ▼ N                ▼ N
                   ┌────────────────┐      ┌────────────┐     ┌──────────────┐
                   │ STOCK_MOVEMENT │      │RECIPE_INGR.│     │   INVENTORY  │
                   └────────────────┘      └───────┬────┘     └──────────────┘
                                                   │ N
                                                   │                 
                                                   ▼ 1               
                   ┌────────────────┐      ┌────────────┐           
                   │ RAW_MAT_INVENT.│ N──1 │RAW_MATERIAL│           
                   └────────────────┘      └────────────┘
```

---

## MODELO RELACIONAL DE TABLAS (PostgreSQL)

### TABLA: users
Almacena las credenciales, información de perfil y roles de todos los usuarios (clientes y personal operativo).
```sql
CREATE TABLE users (
    id VARCHAR(191) PRIMARY KEY,
    email VARCHAR(191) UNIQUE NOT NULL,
    password_hash VARCHAR(191) NOT NULL,
    first_name VARCHAR(191) NOT NULL,
    last_name VARCHAR(191) NOT NULL,
    phone VARCHAR(32),
    role VARCHAR(50) DEFAULT 'CUSTOMER', -- 'CUSTOMER', 'ADMIN', 'MANAGER', 'BAKER', 'CASHIER'
    is_active BOOLEAN DEFAULT TRUE,
    branch_id INTEGER, -- Asignado si es personal operativo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users(email);
```

### TABLA: addresses
Almacena direcciones del cliente para contexto de facturación o contacto.
```sql
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(191),
    street VARCHAR(191) NOT NULL,
    city VARCHAR(191) NOT NULL,
    state VARCHAR(191),
    zone VARCHAR(191),
    reference VARCHAR(191),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
```

### TABLA: refresh_tokens
Gestión de sesiones activas y seguridad móvil/web con rotación de tokens.
```sql
CREATE TABLE refresh_tokens (
    id VARCHAR(191) PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    hashed_token VARCHAR(191) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    user_agent VARCHAR(500),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

### TABLA: trusted_devices
Registra los dispositivos de confianza del usuario para auditoría.
```sql
CREATE TABLE trusted_devices (
    id VARCHAR(191) PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    device_id VARCHAR(191) NOT NULL,
    name VARCHAR(191),
    user_agent VARCHAR(500),
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, device_id)
);
```

### TABLA: login_attempts
Control de seguridad para mitigar ataques de fuerza bruta y disparar captchas.
```sql
CREATE TABLE login_attempts (
    id VARCHAR(191) PRIMARY KEY,
    email VARCHAR(191) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL,
    device_id VARCHAR(191),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TABLA: categories
Agrupamiento jerárquico de productos del catálogo.
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(191) UNIQUE NOT NULL,
    slug VARCHAR(191) UNIQUE NOT NULL,
    description VARCHAR(191)
);
```

### TABLA: products
Definición de productos del catálogo, incluyendo precios de combo y latas equivalentes.
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(191) UNIQUE NOT NULL,
    name VARCHAR(191) NOT NULL,
    slug VARCHAR(191) UNIQUE NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    combo_quantity INTEGER,
    combo_price DECIMAL(10, 2),
    origin VARCHAR(50) DEFAULT 'PRODUCIDO', -- 'PRODUCIDO', 'COMPRADO'
    units_per_tray INTEGER, -- Unidades que rinde una lata (solo si es PRODUCIDO)
    is_new BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    category_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE INDEX idx_products_category ON products(category_id);
```

### TABLA: product_images
Imágenes secundarias y de catálogo para cada producto.
```sql
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

### TABLA: raw_materials
Insumos base registrados en el catálogo de producción (ej: Harina, Levadura, Manteca).
```sql
CREATE TABLE raw_materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(191) UNIQUE NOT NULL,
    base_unit VARCHAR(50) NOT NULL, -- 'LB', 'ML', 'UNIT'
    cost_per_unit DECIMAL(10, 4) NOT NULL,
    min_stock DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TABLA: raw_material_inventories
Control de existencias físicas de materias primas por sucursal, expresado siempre en unidad base.
```sql
CREATE TABLE raw_material_inventories (
    id SERIAL PRIMARY KEY,
    raw_material_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    quantity DECIMAL(12, 4) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    UNIQUE(raw_material_id, branch_id)
);
```

### TABLA: recipes
Recetas de producción asociadas a un producto producido.
```sql
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    name VARCHAR(191) NOT NULL,
    standard_trays INTEGER NOT NULL, -- Latas estimadas por amasijo
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### TABLA: recipe_ingredients
Ingredientes requeridos por receta de amasijo, medidos en unidad base del insumo.
```sql
CREATE TABLE recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL,
    raw_material_id INTEGER NOT NULL,
    quantity DECIMAL(10, 4) NOT NULL,
    
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
    UNIQUE(recipe_id, raw_material_id)
);
```

### TABLA: production_logs
Bitácora de producción diaria (horneado de amasijos) que dispara el movimiento de inventarios.
```sql
CREATE TABLE production_logs (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    user_id VARCHAR(191) NOT NULL,
    trays_produced INTEGER NOT NULL, -- Latas reales obtenidas
    units_produced INTEGER NOT NULL, -- Calculado: latas * units_per_tray
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### TABLA: inventories
Existencias físicas y reservas comprometidas de producto terminado en cada sucursal.
```sql
CREATE TABLE inventories (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 0, -- Stock físico en sucursal
    reserved INTEGER DEFAULT 0, -- Reservas activas de clientes
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    UNIQUE(product_id, branch_id)
);
```

### TABLA: stock_movements
Kárdex o historial de transacciones físicas de producto terminado (producción, mermas, ventas, compras).
```sql
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    from_branch_id INTEGER,
    to_branch_id INTEGER,
    type VARCHAR(50) NOT NULL, -- 'PRODUCCION', 'COMPRA', 'VENTA', 'TRANSFERENCIA', 'MERMA'
    quantity INTEGER NOT NULL,
    production_log_id INTEGER,
    expires_at TIMESTAMP,
    user_id VARCHAR(191),
    reference_id VARCHAR(191),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (from_branch_id) REFERENCES branches(id),
    FOREIGN KEY (to_branch_id) REFERENCES branches(id),
    FOREIGN KEY (production_log_id) REFERENCES production_logs(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### TABLA: branches
Sucursales del negocio que operan como centros independientes de inventario.
```sql
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    slug VARCHAR(191) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(191),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TABLA: orders
Reservas de pedidos generadas por los clientes en la plataforma.
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(191) UNIQUE NOT NULL,
    user_id VARCHAR(191),
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED', 'PICKED_UP'
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00, -- Siempre 0 para reservas de recogida
    discount DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(191),
    shipping_method VARCHAR(191) DEFAULT 'PICKUP',
    branch_id INTEGER,
    customer_notes TEXT,
    address_id INTEGER, -- Opcional para facturación
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### TABLA: order_items
Desglose detallado de los productos e importes individuales de una orden.
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(191) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
```

### TABLA: audit_logs
Bitácora de seguridad del sistema para auditoría de acciones administrativas y de login.
```sql
CREATE TABLE audit_logs (
    id VARCHAR(191) PRIMARY KEY,
    user_id VARCHAR(191),
    user_name VARCHAR(191) NOT NULL,
    action VARCHAR(191) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
    entity VARCHAR(191) NOT NULL, -- 'Product', 'Order', 'User', etc.
    entity_id VARCHAR(191),
    entity_name VARCHAR(191),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### TABLA: system_configs
Configuraciones dinámicas administrables del sistema en formato clave-valor tipado.
```sql
CREATE TABLE system_configs (
    id SERIAL PRIMARY KEY,
    key VARCHAR(191) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    type VARCHAR(191) DEFAULT 'string',
    category VARCHAR(191) NOT NULL,
    label VARCHAR(191) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_read_only BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TABLA: notification_configs
Configuración de plantillas, roles y parámetros para alertas automáticas del sistema.
```sql
CREATE TABLE notification_configs (
    id SERIAL PRIMARY KEY,
    key VARCHAR(191) UNIQUE NOT NULL,
    name VARCHAR(191) NOT NULL,
    description TEXT,
    category VARCHAR(191) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(191) NOT NULL,
    message TEXT NOT NULL,
    target_roles JSONB NOT NULL,
    thresholds JSONB,
    sound_type VARCHAR(191) DEFAULT 'suave',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TABLA: notifications
Historial de alertas del sistema enviadas (in-app) para visualización del usuario.
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    type VARCHAR(191) NOT NULL,
    title VARCHAR(191) NOT NULL,
    message TEXT NOT NULL,
    url VARCHAR(191),
    icon VARCHAR(191),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
```

### TABLA: push_subscriptions
Suscripciones activas de Web Push para alertas a navegadores web y móviles (PWA).
```sql
CREATE TABLE push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh VARCHAR(191) NOT NULL,
    auth VARCHAR(191) NOT NULL,
    user_agent VARCHAR(191),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## RELACIONES DE BASE DE DATOS
1. **users → addresses** (1:N)
2. **users → refresh_tokens** (1:N)
3. **users → trusted_devices** (1:N)
4. **users → orders** (1:N)
5. **users → production_logs** (1:N)
6. **users → audit_logs** (1:N)
7. **users → notifications** (1:N)
8. **users → push_subscriptions** (1:N)
9. **branches → users** (1:N)
10. **branches → raw_material_inventories** (1:N)
11. **branches → production_logs** (1:N)
12. **branches → inventories** (1:N)
13. **branches → orders** (1:N)
14. **categories → products** (1:N)
15. **products → product_images** (1:N)
16. **products → recipes** (1:N)
17. **products → inventories** (1:N)
18. **products → order_items** (1:N)
19. **products → stock_movements** (1:N)
20. **raw_materials → raw_material_inventories** (1:N)
21. **raw_materials → recipe_ingredients** (1:N)
22. **recipes → recipe_ingredients** (1:N)
23. **recipes → production_logs** (1:N)
24. **production_logs → stock_movements** (1:N)
25. **orders → order_items** (1:N)
26. **orders → addresses** (N:1)

---

## NORMALIZACIÓN VERIFICADA (3FN)

* **Primera Forma Normal (1FN):** Todos los valores en los campos de las tablas son atómicos. No existen grupos repetitivos; en su lugar, se utilizan relaciones y tablas intermedias dedicadas como `recipe_ingredients`.
* **Segunda Forma Normal (2FN):** Se cumple la 1FN y todas las columnas no clave de las tablas dependen por completo de sus respectivas claves primarias completas (sin dependencias parciales).
* **Tercera Forma Normal (3FN):** Se cumple la 2FN y no existen dependencias transitivas entre columnas no clave (es decir, las columnas no clave dependen exclusivamente de la clave primaria y no de otras columnas no clave).

---

**Total de Tablas PostgreSQL:** 23  
**Total de Relaciones:** 26  

El diseño de la base de datos se encuentra completamente normalizado a nivel documental y alineado de forma exacta al esquema físico del motor de base de datos implementado en Prisma.
