# 📱 DISEÑO DE PANTALLAS - Panaderia Svetlana Smart System

## 🎨 SISTEMA DE DISEÑO

### Paleta de Colores
```css
/* Colores Principales */
--primary: #D97706 (Naranja cálido - pan recién horneado)
--primary-dark: #B45309
--primary-light: #FCD34D

/* Colores Secundarios */
--secondary: #059669 (Verde fresco)
--secondary-dark: #047857
--secondary-light: #34D399

/* Neutrales */
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-800: #1F2937
--gray-900: #111827

/* Estados */
--success: #10B981
--error: #EF4444
--warning: #F59E0B
--info: #3B82F6
```

### Tipografía
```css
/* Headers */
Font Family: 'Inter', sans-serif
H1: 2.5rem (40px) - Bold
H2: 2rem (32px) - SemiBold
H3: 1.5rem (24px) - SemiBold
H4: 1.25rem (20px) - Medium

/* Body */
Font Family: 'Inter', sans-serif
Body: 1rem (16px) - Regular
Small: 0.875rem (14px) - Regular
Caption: 0.75rem (12px) - Regular
```

---

## 📱 APLICACIÓN WEB - PANTALLAS

### **1. LANDING PAGE (Página Principal)**

#### Secciones:
```
┌─────────────────────────────────────────────────┐
│  NAVBAR                                         │
│  Logo | Productos | Promociones | Sobre | Login│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  HERO SECTION                                   │
│                                                 │
│  "Pan Artesanal Fresco Cada Día" 🥖            │
│  [Imagen grande de pan recién horneado]        │
│  [Botón: Ver Productos] [Botón: Ordenar Ahora]│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  PRODUCTOS DESTACADOS                           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ Pan  │ │Torta │ │Cookie│ │Pastel│          │
│  │$2.50 │ │$15.00│ │$1.00 │ │$12.00│          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  CATEGORÍAS                                     │
│  [Panes] [Pasteles] [Galletas] [Repostería]   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  PROMOCIONES ACTIVAS                            │
│  "2x1 en Galletas" | "20% OFF en Pasteles"     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  TESTIMONIOS                                    │
│  ⭐⭐⭐⭐⭐ "El mejor pan de la ciudad"          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  FOOTER                                         │
│  Contacto | Redes Sociales | Políticas         │
└─────────────────────────────────────────────────┘
```

#### Componentes:
- `<Navbar />` - Navegación principal con carrito
- `<HeroSection />` - Banner principal
- `<ProductGrid />` - Grid de productos destacados
- `<CategoryCards />` - Tarjetas de categorías
- `<PromoSlider />` - Carrusel de promociones
- `<Testimonials />` - Reseñas de clientes
- `<Footer />` - Pie de página

---

### **2. CATÁLOGO DE PRODUCTOS**

```
┌─────────────────────────────────────────────────┐
│  NAVBAR + Breadcrumb: Home > Productos          │
└─────────────────────────────────────────────────┘

┌────────────┬────────────────────────────────────┐
│  FILTROS   │  PRODUCTOS (Grid)                  │
│            │                                    │
│ Categorías │  ┌──────┐ ┌──────┐ ┌──────┐       │
│ □ Panes    │  │ Pan  │ │Torta │ │Cookie│       │
│ □ Pasteles │  │$2.50 │ │$15.00│ │$1.00 │       │
│ □ Galletas │  │⭐4.5 │ │⭐4.8 │ │⭐5.0 │       │
│            │  │[+]🛒 │ │[+]🛒 │ │[+]🛒 │       │
│ Precio     │  └──────┘ └──────┘ └──────┘       │
│ $0 - $50   │                                    │
│ [═══●═══]  │  ┌──────┐ ┌──────┐ ┌──────┐       │
│            │  │      │ │      │ │      │       │
│ Rating     │  │      │ │      │ │      │       │
│ ★★★★★ ↑   │  └──────┘ └──────┘ └──────┘       │
│            │                                    │
│ Disponible │  [Paginación: 1 2 3 ... 10]       │
│ ☑ En stock │                                    │
└────────────┴────────────────────────────────────┘
```

#### Funcionalidades:
- Filtros por categoría, precio, rating
- Búsqueda en tiempo real
- Ordenar por: Precio, Popularidad, Nuevo
- Vista Grid o Lista
- Agregar al carrito rápido
- Ver detalles del producto

#### Componentes:
- `<ProductFilters />` - Panel de filtros lateral
- `<ProductCard />` - Tarjeta de producto
- `<SearchBar />` - Barra de búsqueda
- `<SortDropdown />` - Ordenamiento
- `<Pagination />` - Paginación

---

### **3. DETALLE DE PRODUCTO**

```
┌─────────────────────────────────────────────────┐
│  Breadcrumb: Home > Productos > Pan Francés     │
└─────────────────────────────────────────────────┘

┌───────────────────┬─────────────────────────────┐
│                   │  Pan Francés Artesanal      │
│   [Imagen        │  ⭐⭐⭐⭐⭐ (4.8) 127 reseñas│
│    Principal]     │                             │
│                   │  $2.50                      │
│  [🔍]            │  En Stock (45 unidades)     │
│                   │                             │
│  [○] [○] [○]     │  Descripción:               │
│  Miniaturas       │  Pan francés recién         │
│                   │  horneado, crujiente por    │
│                   │  fuera, suave por dentro    │
│                   │                             │
│                   │  Peso: 250g                 │
│                   │  Calorías: 180 cal          │
│                   │  Vida útil: 2 días          │
│                   │                             │
│                   │  Alérgenos: 🌾 Gluten      │
│                   │                             │
│                   │  Cantidad: [- 1 +]          │
│                   │                             │
│                   │  [🛒 Agregar al Carrito]   │
│                   │  [♡ Agregar a Favoritos]   │
└───────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  INFORMACIÓN NUTRICIONAL                        │
│  [Tab: Nutrición | Ingredientes | Reseñas]     │
│                                                 │
│  Proteínas: 8g | Carbohidratos: 35g | Grasas: 2g│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  RESEÑAS DE CLIENTES                            │
│                                                 │
│  ⭐⭐⭐⭐⭐ Juan Pérez - "Excelente pan"        │
│  ⭐⭐⭐⭐ María García - "Muy fresco"          │
│                                                 │
│  [Escribir Reseña]                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  PRODUCTOS RELACIONADOS                         │
│  [Pan Integral] [Pan de Ajo] [Baguette]        │
└─────────────────────────────────────────────────┘
```

#### Componentes:
- `<ProductGallery />` - Galería de imágenes con zoom
- `<ProductInfo />` - Información principal
- `<QuantitySelector />` - Selector de cantidad
- `<AddToCartButton />` - Botón agregar al carrito
- `<ProductTabs />` - Tabs de información
- `<ReviewsList />` - Lista de reseñas
- `<ReviewForm />` - Formulario de reseña
- `<RelatedProducts />` - Productos relacionados

---

### **4. CARRITO DE COMPRAS**

```
┌─────────────────────────────────────────────────┐
│  Tu Carrito (3 productos)                       │
└─────────────────────────────────────────────────┘

┌────────────────────────────────┬────────────────┐
│  PRODUCTOS                     │  RESUMEN       │
│                                │                │
│  ┌─────────────────────────┐  │  Subtotal:     │
│  │ [Img] Pan Francés       │  │  $12.50        │
│  │       $2.50 x 5         │  │                │
│  │       [- 5 +] [🗑]     │  │  Descuento:    │
│  │       = $12.50          │  │  -$2.50        │
│  └─────────────────────────┘  │                │
│                                │  Envío:        │
│  ┌─────────────────────────┐  │  $3.00         │
│  │ [Img] Torta Chocolate   │  │                │
│  │       $15.00 x 1        │  │  ────────────  │
│  │       [- 1 +] [🗑]     │  │  TOTAL:        │
│  │       = $15.00          │  │  $28.00        │
│  └─────────────────────────┘  │                │
│                                │  ┌──────────┐ │
│  ┌─────────────────────────┐  │  │ COMPRAR  │ │
│  │ [Img] Galletas          │  │  └──────────┘ │
│  │       $1.00 x 3         │  │                │
│  │       [- 3 +] [🗑]     │  │  [♡ Guardar] │
│  │       = $3.00           │  │                │
│  └─────────────────────────┘  │                │
│                                │                │
│  ┌─────────────────────────┐  │                │
│  │ 🏷️ Código de descuento │  │                │
│  │ [________] [Aplicar]    │  │                │
│  └─────────────────────────┘  │                │
└────────────────────────────────┴────────────────┘

┌─────────────────────────────────────────────────┐
│  ✨ Recomendaciones para ti                     │
│  [Pan Integral] [Brownies]                      │
└─────────────────────────────────────────────────┘
```

#### Funcionalidades:
- Actualizar cantidades
- Eliminar productos
- Aplicar códigos de descuento
- Calcular envío
- Guardar carrito
- Ver recomendaciones

#### Componentes:
- `<CartItem />` - Item del carrito
- `<CartSummary />` - Resumen de compra
- `<CouponInput />` - Input de cupón
- `<CartRecommendations />` - Recomendaciones

---

### **5. CHECKOUT (Proceso de Compra)**

#### **Paso 1: Información de Envío**
```
┌─────────────────────────────────────────────────┐
│  Checkout                                       │
│  [●━━━━○━━━━○] 1.Envío 2.Pago 3.Confirmación  │
└─────────────────────────────────────────────────┘

┌────────────────────────────────┬────────────────┐
│  INFORMACIÓN DE ENVÍO          │  TU PEDIDO     │
│                                │                │
│  Tipo de Entrega:              │  3 productos   │
│  ● Delivery  ○ Pickup          │                │
│                                │  Pan x5        │
│  Dirección de Entrega:         │  Torta x1      │
│  ┌──────────────────────────┐ │  Galletas x3   │
│  │ Calle Principal #123     │ │                │
│  │ Col. Centro              │ │  Subtotal:     │
│  │ Tegucigalpa, Honduras    │ │  $30.50        │
│  └──────────────────────────┘ │                │
│                                │  Envío:        │
│  [+ Agregar Nueva Dirección]   │  $3.00         │
│                                │                │
│  Fecha de Entrega:             │  ────────────  │
│  [📅 11/11/2025] [⏰ 3:00 PM] │  Total:        │
│                                │  $33.50        │
│  Notas Especiales:             │                │
│  [________________________]    │  [Continuar]   │
│                                │                │
└────────────────────────────────┴────────────────┘
```

#### **Paso 2: Método de Pago**
```
┌─────────────────────────────────────────────────┐
│  Checkout                                       │
│  [●━━━━●━━━━○] 1.Envío 2.Pago 3.Confirmación  │
└─────────────────────────────────────────────────┘

┌────────────────────────────────┬────────────────┐
│  MÉTODO DE PAGO                │  TU PEDIDO     │
│                                │                │
│  ● Tarjeta de Crédito/Débito   │  Total: $33.50 │
│  ○ Pago contra entrega         │                │
│  ○ Transferencia bancaria      │  🔒 Pago      │
│                                │  Seguro        │
│  ┌──────────────────────────┐ │                │
│  │ 💳 Stripe Payment        │ │                │
│  │                          │ │                │
│  │ Número de Tarjeta        │ │                │
│  │ [____-____-____-____]    │ │                │
│  │                          │ │                │
│  │ Nombre                   │ │                │
│  │ [__________________]     │ │                │
│  │                          │ │                │
│  │ Exp.    CVV              │ │                │
│  │ [MM/YY] [___]            │ │                │
│  │                          │ │                │
│  │ [Guardar para después]  │ │                │
│  └──────────────────────────┘ │                │
│                                │                │
│  [← Volver]    [Pagar $33.50] │                │
└────────────────────────────────┴────────────────┘
```

#### **Paso 3: Confirmación**
```
┌─────────────────────────────────────────────────┐
│  ✅ ¡Pedido Confirmado!                         │
│  [●━━━━●━━━━●] Completado                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Número de Orden: #ORD-20250111-0042            │
│                                                 │
│  📧 Hemos enviado la confirmación a tu email    │
│  📱 Recibirás notificaciones del estado         │
│                                                 │
│  Estado: EN PREPARACIÓN                         │
│  Entrega estimada: 11 Nov, 3:00 PM              │
│                                                 │
│  [Ver Detalles] [Seguir Pedido] [Volver]       │
└─────────────────────────────────────────────────┘
```

---

### **6. PERFIL DE USUARIO**

```
┌─────────────────────────────────────────────────┐
│  Mi Cuenta                                      │
└─────────────────────────────────────────────────┘

┌────────────┬────────────────────────────────────┐
│  MENÚ      │  PERFIL                            │
│            │                                    │
│ ● Perfil   │  [Avatar]                          │
│ ○ Pedidos  │  Juan Pérez                        │
│ ○ Direc.   │  juan@email.com                    │
│ ○ Favoritos│  +504 9999-9999                    │
│ ○ Puntos   │                                    │
│ ○ Seguridad│  ┌──────────────────────────────┐ │
│ ○ Salir    │  │ Editar Perfil               │ │
│            │  │                              │ │
│            │  │ Nombre: [____________]       │ │
│            │  │ Email:  [____________]       │ │
│            │  │ Teléfono: [__________]       │ │
│            │  │                              │ │
│            │  │ [Cancelar] [Guardar Cambios]│ │
│            │  └──────────────────────────────┘ │
│            │                                    │
│            │  Puntos de Fidelidad               │
│            │  ⭐ 1,250 puntos (Nivel: GOLD)    │
│            │  [Ver Recompensas]                 │
└────────────┴────────────────────────────────────┘
```

---

### **7. MIS PEDIDOS**

```
┌─────────────────────────────────────────────────┐
│  Mis Pedidos                                    │
│  [Todo] [Activos] [Completados] [Cancelados]   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  📦 Pedido #ORD-20250111-0042                   │
│  Estado: EN ENTREGA 🚚                          │
│  Fecha: 11 Nov 2025, 2:30 PM                    │
│  Total: $33.50                                  │
│                                                 │
│  Items: Pan x5, Torta x1, Galletas x3           │
│                                                 │
│  ────────────────────────────────────────────── │
│  ● Pedido Recibido     ✅ 2:30 PM              │
│  ● Preparando          ✅ 2:45 PM              │
│  ● En Camino           🔵 3:00 PM (actual)     │
│  ○ Entregado           ⏳                      │
│                                                 │
│  [📍 Rastrear] [📞 Contactar] [Ver Detalles]  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  📦 Pedido #ORD-20250109-0038                   │
│  Estado: ENTREGADO ✅                           │
│  Fecha: 09 Nov 2025                             │
│  Total: $25.00                                  │
│                                                 │
│  [Ver Detalles] [⭐ Dejar Reseña] [Reordenar]  │
└─────────────────────────────────────────────────┘
```

---

### **8. DASHBOARD ADMIN**

```
┌─────────────────────────────────────────────────┐
│  Panaderia Svetlana Admin | Juan Admin | 🔔 [3] | Salir │
└─────────────────────────────────────────────────┘

┌────────────┬────────────────────────────────────┐
│  MENÚ      │  DASHBOARD                         │
│            │                                    │
│ ● Dashboard│  Resumen de Hoy                    │
│ ○ Pedidos  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│ ○ Productos│  │$125│ │ 15 │ │ 89%│ │ 12 │     │
│ ○ Inventar.│  │Vtas│ │Ord.│ │Sat.│ │New│     │
│ ○ Clientes │  └────┘ └────┘ └────┘ └────┘     │
│ ○ Empleados│                                    │
│ ○ Reportes │  Gráfico de Ventas (Últimos 7d)   │
│ ○ Promoc.  │  [Gráfico de línea]                │
│ ○ Config.  │                                    │
│            │  Pedidos Recientes                 │
│            │  ┌──────────────────────────────┐ │
│            │  │ #042 | Juan P. | $33.50 | 🔵│ │
│            │  │ #041 | María G.| $15.00 | ✅│ │
│            │  └──────────────────────────────┘ │
│            │                                    │
│            │  Productos Bajo Stock ⚠️          │
│            │  • Pan Integral (3 unidades)       │
│            │  • Galletas Avena (5 unidades)     │
└────────────┴────────────────────────────────────┘
```

---

### **9. GESTIÓN DE PRODUCTOS (Admin)**

```
┌─────────────────────────────────────────────────┐
│  Productos                                      │
│  [+ Nuevo Producto] [📥 Importar] [📤 Exportar]│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  🔍 [Buscar productos...]  [Filtros▾]          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Tabla de Productos                             │
│  ┌──────────────────────────────────────────┐  │
│  │ [✓] | Img | Nombre | Cat. | Precio | Stock│ │
│  ├──────────────────────────────────────────┤  │
│  │ [ ] | 🥖 | Pan F. | Panes| $2.50 | 45   │ │
│  │ [ ] | 🍰 | Torta  | Past.| $15.0 | 12   │ │
│  │ [ ] | 🍪 | Cookie | Gall.| $1.00 | ⚠️5 │ │
│  │                                          │  │
│  │ [Acciones: ✏️ Editar | 👁️ Ver | 🗑️ Borrar]│  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [Paginación: 1 2 3 ... 10] Mostrando 1-20/187 │
└─────────────────────────────────────────────────┘
```

---

### **10. GESTIÓN DE PEDIDOS (Admin)**

```
┌─────────────────────────────────────────────────┐
│  Pedidos                                        │
│  [Todos] [Pendientes] [En Proceso] [Entregados]│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Vista de Kanban                                │
│                                                 │
│  PENDIENTE    EN PREP.    EN CAMINO   ENTREGADO│
│  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐ │
│  │ #042 │    │ #041 │    │ #039 │    │ #038 │ │
│  │$33.50│    │$15.00│    │$28.00│    │$45.00│ │
│  │ 2:30 │    │ 1:15 │    │11:30 │    │ 9:00 │ │
│  └──────┘    └──────┘    └──────┘    └──────┘ │
│  ┌──────┐    ┌──────┐                          │
│  │ #040 │    │ #037 │                          │
│  │$22.00│    │$19.50│                          │
│  └──────┘    └──────┘                          │
│                                                 │
│  [Arrastrar para cambiar estado]                │
└─────────────────────────────────────────────────┘
```

---

### **11. REPORTES Y ANALÍTICA (Admin)**

```
┌─────────────────────────────────────────────────┐
│  Reportes y Analítica                           │
│  [📅 Hoy] [Esta Semana] [Este Mes] [Custom]    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  KPIs Principales                               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ Ventas │ │ Pedidos│ │  AOV   │ │  CTR   │  │
│  │$1,234  │ │   45   │ │ $27.42 │ │ 23.5% │  │
│  │ ↑ 12%  │ │ ↑ 8%   │ │ ↓ 3%   │ │ ↑ 5%  │  │
│  └────────┘ └────────┘ └────────┘ └────────┘  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Ventas por Categoría                           │
│  [Gráfico de Donut]                             │
│  🥖 Panes: 45%                                  │
│  🍰 Pasteles: 30%                               │
│  🍪 Galletas: 15%                               │
│  🧁 Repostería: 10%                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Predicción de Demanda (IA) 🤖                  │
│  [Gráfico de Línea con Predicción]              │
│  Productos con mayor demanda mañana:             │
│  • Pan Francés: 85 unidades estimadas           │
│  • Torta Chocolate: 12 unidades estimadas       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  [📥 Exportar PDF] [📊 Exportar Excel]          │
└─────────────────────────────────────────────────┘
```

---

## 📱 APLICACIÓN MÓVIL - PANTALLAS

### **ARQUITECTURA DE NAVEGACIÓN**

```
Bottom Tab Navigator
├─ Home (Stack)
│  ├─ HomeScreen
│  ├─ ProductDetailScreen
│  └─ CategoryScreen
│
├─ Catálogo (Stack)
│  ├─ ProductsScreen
│  ├─ ProductDetailScreen
│  └─ FilterScreen
│
├─ Carrito (Stack)
│  ├─ CartScreen
│  ├─ CheckoutScreen
│  └─ OrderConfirmationScreen
│
├─ Pedidos (Stack)
│  ├─ OrdersListScreen
│  └─ OrderDetailScreen
│
└─ Perfil (Stack)
   ├─ ProfileScreen
   ├─ EditProfileScreen
   ├─ AddressesScreen
   └─ SettingsScreen
```

---

### **M1. HOME SCREEN (Móvil)**

```
┌─────────────────────────┐
│  ☰  Panaderia Svetlana    🔔 🛒 │
├─────────────────────────┤
│                         │
│  Hola, Juan! 👋         │
│                         │
│  🔍 Buscar productos... │
│                         │
├─────────────────────────┤
│  🔥 Promociones         │
│  ┌──────────┐           │
│  │ 2x1 en   │→          │
│  │ Galletas │           │
│  └──────────┘           │
├─────────────────────────┤
│  Categorías             │
│  ┌────┐┌────┐┌────┐    │
│  │🥖 ││🍰 ││🍪 │    │
│  │Pan││Tort││Cook│    │
│  └────┘└────┘└────┘    │
├─────────────────────────┤
│  Productos Destacados   │
│  ┌───────┐ ┌───────┐   │
│  │ Pan   │ │ Torta │   │
│  │ $2.50 │ │$15.00 │   │
│  │ ⭐4.5│ │ ⭐4.8│   │
│  │ [+🛒]│ │ [+🛒]│   │
│  └───────┘ └───────┘   │
│                         │
└─────────────────────────┘
  [🏠] [📦] [🛒] [📋] [👤]
```

---

### **M2. PRODUCTO DETALLE (Móvil)**

```
┌─────────────────────────┐
│  ← Pan Francés     ♡ ⋮ │
├─────────────────────────┤
│                         │
│    [Imagen Grande]      │
│                         │
│    ○ ○ ● ○ ○          │
├─────────────────────────┤
│  Pan Francés Artesanal  │
│  ⭐⭐⭐⭐⭐ (4.8) 127  │
│                         │
│  $2.50                  │
│  En Stock (45 unidades) │
│                         │
├─────────────────────────┤
│  Descripción ▾          │
│  Pan recién horneado,   │
│  crujiente por fuera... │
│                         │
│  Información ▾          │
│  • Peso: 250g           │
│  • Calorías: 180        │
│  • Vida útil: 2 días    │
│                         │
│  Alérgenos ▾            │
│  🌾 Gluten             │
│                         │
│  Reseñas (127) ▾        │
│  ⭐⭐⭐⭐⭐ Juan P.     │
│  "Excelente pan..."     │
│                         │
└─────────────────────────┘
┌─────────────────────────┐
│  [- 1 +]  [🛒 Agregar] │
└─────────────────────────┘
```

---

### **M3. CARRITO (Móvil)**

```
┌─────────────────────────┐
│  ← Mi Carrito (3)       │
├─────────────────────────┤
│  ┌─────────────────────┐│
│  │[Img] Pan Francés    ││
│  │      $2.50 x 5      ││
│  │      [- 5 +]  🗑   ││
│  │      = $12.50       ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │[Img] Torta Chocolate││
│  │      $15.00 x 1     ││
│  │      [- 1 +]  🗑   ││
│  │      = $15.00       ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │[Img] Galletas       ││
│  │      $1.00 x 3      ││
│  │      [- 3 +]  🗑   ││
│  │      = $3.00        ││
│  └─────────────────────┘│
│                         │
│  🏷️ Código descuento   │
│  [________] [Aplicar]   │
│                         │
├─────────────────────────┤
│  Subtotal:      $30.50 │
│  Descuento:     -$2.50 │
│  Envío:          $3.00 │
│  ─────────────────────  │
│  Total:         $31.00 │
└─────────────────────────┘
┌─────────────────────────┐
│  [Continuar Comprando]  │
│  [Proceder al Pago]     │
└─────────────────────────┘
```

---

### **M4. CHECKOUT (Móvil)**

```
┌─────────────────────────┐
│  ← Checkout             │
│  ●━━━○━━━○             │
│  Envío Pago Confirm     │
├─────────────────────────┤
│  Tipo de Entrega        │
│  ● Delivery             │
│  ○ Pickup               │
│                         │
│  Dirección de Entrega   │
│  ┌─────────────────────┐│
│  │📍 Casa              ││
│  │   Calle Principal #││
│  │   Col. Centro       ││
│  │   ● Seleccionada    ││
│  └─────────────────────┘│
│  [+ Nueva Dirección]    │
│                         │
│  Fecha de Entrega       │
│  📅 11/11/2025          │
│  ⏰ 3:00 PM             │
│                         │
│  Notas Especiales       │
│  ┌─────────────────────┐│
│  │                     ││
│  └─────────────────────┘│
│                         │
├─────────────────────────┤
│  Total: $31.00          │
└─────────────────────────┘
┌─────────────────────────┐
│  [Continuar al Pago]    │
└─────────────────────────┘
```

---

### **M5. MIS PEDIDOS (Móvil)**

```
┌─────────────────────────┐
│  ← Mis Pedidos          │
│  [Activos] [Historial]  │
├─────────────────────────┤
│  📦 #ORD-042            │
│  EN CAMINO 🚚           │
│  ┌─────────────────────┐│
│  │ ● Recibido    ✅   ││
│  │ ● Preparando  ✅   ││
│  │ ● En Camino   🔵   ││
│  │ ○ Entregado   ⏳   ││
│  └─────────────────────┘│
│  Items: 3               │
│  Total: $33.50          │
│  Llegada: 3:00 PM       │
│                         │
│  [📍Rastrear] [Detalle]│
├─────────────────────────┤
│  📦 #ORD-038            │
│  ENTREGADO ✅           │
│  09 Nov 2025            │
│  Total: $25.00          │
│                         │
│  [Ver] [⭐Reseñar]     │
├─────────────────────────┤
│                         │
└─────────────────────────┘
  [🏠] [📦] [🛒] [📋] [👤]
```

---

### **M6. PERFIL (Móvil)**

```
┌─────────────────────────┐
│  ← Mi Perfil            │
├─────────────────────────┤
│      [Avatar]           │
│      Juan Pérez         │
│   juan@email.com        │
│                         │
│   ⭐ 1,250 Puntos      │
│   Nivel: GOLD           │
│   [Ver Recompensas]     │
├─────────────────────────┤
│  👤 Editar Perfil       │
│  📍 Mis Direcciones     │
│  ♡  Favoritos           │
│  🎁 Puntos y Premios    │
│  🔔 Notificaciones      │
│  🔐 Seguridad           │
│  ❓ Ayuda               │
│  ⚙️ Configuración       │
│  🚪 Cerrar Sesión       │
│                         │
│  Versión 1.0.0          │
└─────────────────────────┘
  [🏠] [📦] [🛒] [📋] [👤]
```

---

## 🎨 COMPONENTES REUTILIZABLES

### Librería de Componentes
```typescript
// Botones
<Button variant="primary" size="lg">Comprar</Button>
<Button variant="outline" size="md">Cancelar</Button>
<IconButton icon="cart" badge={3} />

// Tarjetas
<ProductCard product={data} onAddToCart={handleAdd} />
<CategoryCard category={data} />
<OrderCard order={data} />

// Formularios
<Input label="Email" type="email" />
<Select options={categories} label="Categoría" />
<TextArea label="Notas" rows={4} />
<Checkbox label="Recordarme" />
<Radio options={options} />

// Feedback
<Alert type="success">Producto agregado</Alert>
<Toast message="Pedido confirmado" />
<Modal title="Confirmar" onClose={handleClose} />
<Loader />

// Navegación
<Breadcrumb items={breadcrumbs} />
<Pagination currentPage={1} totalPages={10} />
<Tabs tabs={tabs} />

// Datos
<Table columns={columns} data={products} />
<Badge>Nuevo</Badge>
<Rating value={4.5} />
<PriceDisplay price={12.50} compareAt={15.00} />

// Layout
<Container>
<Grid cols={3}>
<Card>
<Sidebar>
```

---

## 📐 RESPONSIVE BREAKPOINTS

```css
/* Mobile First */
sm: 640px   // Tablet
md: 768px   // Tablet Landscape
lg: 1024px  // Desktop
xl: 1280px  // Large Desktop
2xl: 1536px // Extra Large
```

---

## ✅ CHECKLIST DE PANTALLAS

### Web App
- [x] Landing Page
- [x] Catálogo de Productos
- [x] Detalle de Producto
- [x] Carrito
- [x] Checkout (3 pasos)
- [x] Perfil de Usuario
- [x] Mis Pedidos
- [x] Dashboard Admin
- [x] Gestión de Productos
- [x] Gestión de Pedidos
- [x] Reportes y Analítica

### Mobile App
- [x] Home
- [x] Producto Detalle
- [x] Carrito
- [x] Checkout
- [x] Mis Pedidos
- [x] Perfil

**Total: 17 pantallas principales diseñadas** ✅
