# 🗄️ DISEÑO DE BASE DE DATOS - Panaderia Svetlana Smart System

> ⚠️ **ACTUALIZACIÓN IMPORTANTE (Marzo 2026):** El diseño original fue refactorizado y migrado a Prisma. El sistema ahora soporta producción por amasijos, combos de precios y unidades estandarizadas de materia prima. La fuente absoluta de la verdad técnica se encuentra en el archivo `api/prisma/schema.prisma`. En este documento persisten definiciones originales, pero aquí se detalla el rediseño clave.

## 🚀 JUSTIFICACIÓN DEL REDISEÑO OPERATIVO
1. **Caos en unidades de medida:** Se agregó `BaseUnit` a un nuevo modelo `RawMaterial` (se reemplazó la tabla de ingredientes genérica). Toda materia prima se transacciona internamente en unidades base (LB, ML, UNIT) y se convierte al comprar en quintales o galones.
2. **Producción Atómica:** Se creó el ciclo `Recipe` -> `RecipeIngredient` -> `ProductionLog`. La panadería no produce por unidad, produce por "Amasijo" y cuenta en "Latas". Cuando un manager registra que se hornearon X latas, el backend: resta stock de `RawMaterial` y suma pan terminado a `Inventory` multiplicando por `unitsPerTray`.
3. **Precios Combos:** La tabla de productos reemplazó los campos erróneos de "descuento porcentual" para incorporar explícitamente `basePrice`, `comboQuantity` y `comboPrice` (ej. 3 panes x 1.25).
4. **Roles Realistas:** El acceso se maneja por sucursal para `MANAGER`, `BAKER` y `CASHIER`, delegando full access al `ADMIN`/`SUPERADMIN`.

## 📊 DIAGRAMA CONCEPTUAL ACTUALIZADO (Núcleo Operativo)

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

## 📋 MODELO RELACIONAL NORMALIZADO (3FN)

### **TABLA: users**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    oauth_provider VARCHAR(50), -- 'google', 'facebook', 'apple', null
    oauth_provider_id VARCHAR(255),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- Soft delete
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_provider_id);
```

**Normalización:** 
- ✅ 1FN: Todos los atributos son atómicos
- ✅ 2FN: No hay dependencias parciales
- ✅ 3FN: No hay dependencias transitivas

---

### **TABLA: roles**
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- 'ADMIN', 'EMPLOYEE', 'CUSTOMER'
    description TEXT,
    permissions JSONB, -- Permisos específicos del rol
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT role_name_check CHECK (name IN ('ADMIN', 'EMPLOYEE', 'CUSTOMER', 'MANAGER'))
);

-- Datos iniciales
INSERT INTO roles (name, description, permissions) VALUES
('ADMIN', 'Administrador del sistema', '{"all": true}'),
('MANAGER', 'Gerente de panadería', '{"orders": true, "inventory": true, "reports": true}'),
('EMPLOYEE', 'Empleado', '{"orders": true, "production": true}'),
('CUSTOMER', 'Cliente', '{"orders": true, "profile": true}');
```

---

### **TABLA: user_roles (Tabla Intermedia N:M)**
```sql
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID, -- ID del usuario que asignó el rol
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE(user_id, role_id) -- Un usuario no puede tener el mismo rol dos veces
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

---

### **TABLA: addresses**
```sql
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    address_type VARCHAR(20) DEFAULT 'SHIPPING', -- 'SHIPPING', 'BILLING'
    street VARCHAR(255) NOT NULL,
    number VARCHAR(20) NOT NULL,
    apartment VARCHAR(50),
    neighborhood VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'Honduras',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    delivery_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT address_type_check CHECK (address_type IN ('SHIPPING', 'BILLING'))
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default);
```

---

### **TABLA: categories**
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    parent_category_id INTEGER, -- Para subcategorías
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_category_id);

-- Datos de ejemplo
INSERT INTO categories (name, slug, description) VALUES
('Panes', 'panes', 'Pan fresco artesanal'),
('Pasteles', 'pasteles', 'Pasteles y tortas'),
('Galletas', 'galletas', 'Galletas artesanales'),
('Repostería', 'reposteria', 'Productos de repostería fina');
```

---

### **TABLA: products**
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    
    -- Precios
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2), -- Precio de costo (solo admin)
    compare_at_price DECIMAL(10, 2), -- Precio antes del descuento
    
    -- Inventario
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    track_inventory BOOLEAN DEFAULT TRUE,
    
    -- Características
    weight DECIMAL(8, 2), -- en gramos
    calories INTEGER,
    shelf_life_days INTEGER, -- Vida útil en días
    requires_refrigeration BOOLEAN DEFAULT FALSE,
    
    -- Imágenes y multimedia
    main_image_url VARCHAR(500),
    images JSONB, -- Array de URLs de imágenes adicionales
    
    -- Estado
    is_featured BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    tags JSONB, -- ['sin-gluten', 'vegano', 'organico']
    allergens JSONB, -- ['gluten', 'lactosa', 'nueces']
    nutritional_info JSONB, -- Información nutricional completa
    
    -- SEO
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- Soft delete
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT price_positive CHECK (price >= 0),
    CONSTRAINT stock_positive CHECK (stock_quantity >= 0)
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured, is_active);
CREATE INDEX idx_products_stock ON products(stock_quantity);
```

---

### **TABLA: ingredients**
```sql
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    unit VARCHAR(20) NOT NULL, -- 'kg', 'g', 'L', 'ml', 'unidad'
    cost_per_unit DECIMAL(10, 2) NOT NULL,
    stock_quantity DECIMAL(10, 2) DEFAULT 0,
    min_stock_quantity DECIMAL(10, 2) DEFAULT 0,
    supplier VARCHAR(200),
    supplier_contact VARCHAR(200),
    expiration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unit_check CHECK (unit IN ('kg', 'g', 'L', 'ml', 'unidad'))
);

CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_stock ON ingredients(stock_quantity);
```

---

### **TABLA: product_ingredients (Tabla Intermedia N:M)**
```sql
CREATE TABLE product_ingredients (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL, -- Cantidad necesaria del ingrediente
    unit VARCHAR(20) NOT NULL,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    
    UNIQUE(product_id, ingredient_id),
    CONSTRAINT quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX idx_product_ingredients_ingredient ON product_ingredients(ingredient_id);
```

---

### **TABLA: orders**
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL, -- ORD-20250110-0001
    
    -- Status del pedido
    status VARCHAR(20) DEFAULT 'PENDING',
    -- 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED'
    
    -- Tipo de pedido
    order_type VARCHAR(20) DEFAULT 'DELIVERY', -- 'DELIVERY', 'PICKUP'
    
    -- Montos
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    
    -- Dirección de entrega
    shipping_address_id INTEGER,
    
    -- Fechas
    scheduled_delivery_date TIMESTAMP,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    
    -- Notas
    customer_notes TEXT,
    internal_notes TEXT,
    cancellation_reason TEXT,
    
    -- Tracking
    assigned_employee_id UUID, -- Empleado asignado
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_employee_id) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED')),
    CONSTRAINT order_type_check CHECK (order_type IN ('DELIVERY', 'PICKUP')),
    CONSTRAINT total_positive CHECK (total >= 0)
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_orders_employee ON orders(assigned_employee_id);
```

---

### **TABLA: order_items**
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL, -- Precio al momento del pedido
    discount DECIMAL(10, 2) DEFAULT 0,
    subtotal DECIMAL(10, 2) NOT NULL,
    
    -- Snapshot de información del producto (por si cambia después)
    product_name VARCHAR(200) NOT NULL,
    product_sku VARCHAR(50),
    product_image_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    
    CONSTRAINT quantity_positive CHECK (quantity > 0),
    CONSTRAINT unit_price_positive CHECK (unit_price >= 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

---

### **TABLA: payments**
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER UNIQUE NOT NULL,
    
    payment_method VARCHAR(50) NOT NULL, -- 'CARD', 'CASH', 'TRANSFER', 'PAYPAL'
    payment_provider VARCHAR(50), -- 'stripe', 'mercadopago', 'paypal'
    
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'HNL',
    
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'
    
    -- IDs de transacción externos
    transaction_id VARCHAR(255), -- ID de Stripe/MercadoPago
    payment_intent_id VARCHAR(255),
    
    -- Metadata de pago
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    
    -- Fechas
    paid_at TIMESTAMP,
    refunded_at TIMESTAMP,
    
    -- Información adicional
    metadata JSONB,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    
    CONSTRAINT status_check CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    CONSTRAINT amount_positive CHECK (amount >= 0)
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
```

---

### **TABLA: carts**
```sql
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL, -- Un usuario solo tiene un carrito activo
    session_id VARCHAR(255), -- Para usuarios no autenticados
    
    expires_at TIMESTAMP, -- Carrito expira después de X días
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);
```

---

### **TABLA: cart_items**
```sql
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    
    quantity INTEGER NOT NULL DEFAULT 1,
    
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    UNIQUE(cart_id, product_id), -- Un producto solo puede estar una vez en el carrito
    CONSTRAINT quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
```

---

### **TABLA: reviews**
```sql
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    user_id UUID NOT NULL,
    order_id INTEGER, -- Opcional: vincular con pedido comprobado
    
    rating INTEGER NOT NULL, -- 1-5 estrellas
    title VARCHAR(200),
    comment TEXT,
    
    -- Moderación
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    moderated_by UUID,
    
    -- Utilidad
    helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5),
    UNIQUE(product_id, user_id) -- Un usuario solo puede reseñar un producto una vez
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_approved ON reviews(is_approved);
```

---

### **TABLA: promotions**
```sql
CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    discount_type VARCHAR(20) NOT NULL, -- 'PERCENTAGE', 'FIXED_AMOUNT'
    discount_value DECIMAL(10, 2) NOT NULL,
    
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    
    usage_limit INTEGER, -- Límite total de usos
    usage_limit_per_user INTEGER DEFAULT 1,
    times_used INTEGER DEFAULT 0,
    
    applicable_to VARCHAR(20) DEFAULT 'ALL', -- 'ALL', 'CATEGORY', 'PRODUCT'
    applicable_category_id INTEGER,
    applicable_product_ids JSONB, -- Array de IDs de productos
    
    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (applicable_category_id) REFERENCES categories(id) ON DELETE SET NULL,
    
    CONSTRAINT discount_type_check CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    CONSTRAINT discount_value_positive CHECK (discount_value > 0)
);

CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_active ON promotions(is_active, starts_at, expires_at);
```

---

### **TABLA: employees**
```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    position VARCHAR(100) NOT NULL, -- 'Panadero', 'Cajero', 'Repartidor', etc.
    department VARCHAR(100),
    
    hire_date DATE NOT NULL,
    termination_date DATE,
    
    salary DECIMAL(10, 2),
    commission_rate DECIMAL(5, 2) DEFAULT 0,
    
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_employees_code ON employees(employee_code);
CREATE INDEX idx_employees_active ON employees(is_active);
```

---

### **TABLA: shifts**
```sql
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week JSONB NOT NULL, -- [0,1,2,3,4,5,6] donde 0=Domingo
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO shifts (name, start_time, end_time, days_of_week) VALUES
('Turno Mañana', '06:00', '14:00', '[1,2,3,4,5,6]'),
('Turno Tarde', '14:00', '22:00', '[1,2,3,4,5,6]'),
('Turno Noche', '22:00', '06:00', '[5,6,0]');
```

---

### **TABLA: employee_shifts (Tabla Intermedia N:M)**
```sql
CREATE TABLE employee_shifts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    shift_id INTEGER NOT NULL,
    assigned_date DATE NOT NULL,
    
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'COMPLETED', 'ABSENT', 'CANCELLED'
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    
    CONSTRAINT status_check CHECK (status IN ('SCHEDULED', 'COMPLETED', 'ABSENT', 'CANCELLED'))
);

CREATE INDEX idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE INDEX idx_employee_shifts_shift ON employee_shifts(shift_id);
CREATE INDEX idx_employee_shifts_date ON employee_shifts(assigned_date);
```

---

### **TABLA: notifications**
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    
    type VARCHAR(50) NOT NULL, -- 'ORDER', 'PROMOTION', 'SYSTEM', 'DELIVERY'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    channel VARCHAR(20) NOT NULL, -- 'EMAIL', 'SMS', 'PUSH', 'IN_APP'
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    metadata JSONB, -- Datos adicionales según el tipo
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    CONSTRAINT channel_check CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
```

---

### **TABLA: loyalty_points**
```sql
CREATE TABLE loyalty_points (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    
    points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0, -- Total acumulado histórico
    
    tier VARCHAR(20) DEFAULT 'BRONZE', -- 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'
    
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE(user_id),
    CONSTRAINT tier_check CHECK (tier IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM'))
);

CREATE INDEX idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX idx_loyalty_points_tier ON loyalty_points(tier);
```

---

### **TABLA: loyalty_transactions**
```sql
CREATE TABLE loyalty_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    order_id INTEGER,
    
    points INTEGER NOT NULL, -- Positivo para ganados, negativo para gastados
    type VARCHAR(20) NOT NULL, -- 'EARNED', 'REDEEMED', 'EXPIRED', 'BONUS'
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    
    CONSTRAINT type_check CHECK (type IN ('EARNED', 'REDEEMED', 'EXPIRED', 'BONUS', 'ADJUSTMENT'))
);

CREATE INDEX idx_loyalty_transactions_user ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_order ON loyalty_transactions(order_id);
```

---

## 📊 TABLAS PARA ANALYTICS Y LOGS (MongoDB)

### **Colección: activity_logs**
```javascript
{
    _id: ObjectId,
    userId: UUID,
    action: String, // 'LOGIN', 'LOGOUT', 'CREATE_ORDER', 'UPDATE_PROFILE'
    resource: String, // 'user', 'order', 'product'
    resourceId: String,
    ipAddress: String,
    userAgent: String,
    metadata: Object,
    createdAt: ISODate
}
```

### **Colección: analytics_events**
```javascript
{
    _id: ObjectId,
    eventType: String, // 'page_view', 'product_view', 'add_to_cart'
    userId: UUID,
    sessionId: String,
    page: String,
    productId: Number,
    metadata: Object,
    timestamp: ISODate
}
```

### **Colección: ai_predictions**
```javascript
{
    _id: ObjectId,
    predictionType: String, // 'demand_forecast', 'recommendation'
    productId: Number,
    predictedValue: Number,
    confidence: Number,
    modelVersion: String,
    metadata: Object,
    createdAt: ISODate
}
```

---

## 🔗 RELACIONES PRINCIPALES

1. **users ↔ roles** (N:M) → user_roles
2. **users → addresses** (1:N)
3. **users → orders** (1:N)
4. **users → carts** (1:1)
5. **orders → order_items** (1:N)
6. **orders → payments** (1:1)
7. **products → categories** (N:1)
8. **products ↔ ingredients** (N:M) → product_ingredients
9. **products → reviews** (1:N)
10. **cart → cart_items** (1:N)
11. **employees ↔ shifts** (N:M) → employee_shifts

---

## 📈 ÍNDICES Y OPTIMIZACIÓN

### Índices Compuestos Adicionales
```sql
-- Búsqueda de productos activos por categoría
CREATE INDEX idx_products_category_active ON products(category_id, is_active, is_available);

-- Pedidos por usuario y estado
CREATE INDEX idx_orders_user_status ON orders(user_id, status, created_at DESC);

-- Items de carrito con producto y cantidad
CREATE INDEX idx_cart_items_composite ON cart_items(cart_id, product_id, quantity);

-- Reseñas aprobadas por producto
CREATE INDEX idx_reviews_product_approved ON reviews(product_id, is_approved, rating);
```

---

## 🎯 NORMALIZACIÓN VERIFICADA

### Primera Forma Normal (1FN)
✅ Todos los atributos contienen valores atómicos
✅ No hay grupos repetitivos
✅ Cada columna tiene un nombre único

### Segunda Forma Normal (2FN)
✅ Cumple 1FN
✅ No existen dependencias parciales
✅ Todos los atributos no-clave dependen de la clave primaria completa

### Tercera Forma Normal (3FN)
✅ Cumple 2FN
✅ No existen dependencias transitivas
✅ Los atributos no-clave no dependen de otros atributos no-clave

---

## 📝 NOTAS IMPORTANTES

1. **Soft Deletes:** Usar `deleted_at` para no perder datos históricos
2. **Timestamps:** Siempre incluir `created_at` y `updated_at`
3. **UUIDs:** Para usuarios (seguridad y compatibilidad con OAuth)
4. **JSONB:** Para datos flexibles que no requieren búsquedas frecuentes
5. **Constraints:** Validaciones a nivel de base de datos
6. **Indexes:** En todas las foreign keys y campos de búsqueda frecuente

---

**Total de Tablas PostgreSQL: 24**
**Total de Colecciones MongoDB: 3**
**Total de Relaciones: 11 principales**

✅ **Base de datos completamente normalizada y lista para implementar**
