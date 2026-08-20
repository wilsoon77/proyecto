# DISEÑO DE PANTALLAS - Panaderia Svetlana Smart System

> **Documento inicial/histórico:** la pantalla actual se denomina **Operación**. POS, delivery, analítica predictiva y dashboards extensos no forman parte del alcance vigente.

## SISTEMA DE DISEÑO

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

## APLICACIÓN WEB - PANTALLAS

### 1. LANDING PAGE (Página Principal)

#### Secciones:
```
┌─────────────────────────────────────────────────┐
│  NAVBAR                                         │
│  Logo | Productos | Sobre Nosotros | Login      │
│  [Carrito: 0]                                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  HERO SECTION                                   │
│                                                 │
│  "Pan Artesanal Fresco Cada Día"                │
│  [Imagen grande de pan recién horneado]        │
│  [Botón: Ver Catálogo] [Botón: Reservar Ahora]  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  PRODUCTOS DESTACADOS                           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ Pan  │ │Torta │ │Gallet│ │Pastel│          │
│  │$2.50 │ │$15.00│ │$1.00 │ │$12.00│          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  CATEGORÍAS                                     │
│  [Panes] [Pasteles] [Galletas] [Repostería]     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  SOBRE NOSOTROS (Breve reseña)                  │
│  Calidad tradicional e ingredientes seleccionados│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  TESTIMONIOS                                    │
│  Calificación: Excelente. "El mejor pan"        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  FOOTER                                         │
│  Contacto | Sucursales | Políticas de Privacidad│
└─────────────────────────────────────────────────┘
```

#### Componentes:
- `<Navbar />` - Navegación principal con carrito
- `<HeroSection />` - Banner principal de bienvenida
- `<ProductGrid />` - Grid de productos destacados
- `<CategoryCards />` - Tarjetas de categorías
- `<Testimonials />` - Reseñas de clientes
- `<Footer />` - Pie de página

---

### 2. CATÁLOGO DE PRODUCTOS

```
┌─────────────────────────────────────────────────┐
│  NAVBAR + Breadcrumb: Home > Productos          │
└─────────────────────────────────────────────────┘

┌────────────┬────────────────────────────────────┐
│  FILTROS   │  PRODUCTOS (Grid)                  │
│            │                                    │
│ Categorías │  ┌──────┐ ┌──────┐ ┌──────┐       │
│ [ ] Panes  │  │ Pan  │ │Torta │ │Gallet│       │
│ [ ] Pastel │  │$2.50 │ │$15.00│ │$1.00 │       │
│ [ ] Gallet │  │4.5/5 │ │4.8/5 │ │5.0/5 │       │
│            │  │[+]Reservar │ │[+]Reservar  │       │
│ Precio     │  └──────┘ └──────┘ └──────┘       │
│ $0 - $50   │                                    │
│ [═══●═══]  │  ┌──────┐ ┌──────┐ ┌──────┐       │
│            │  │      │ │      │ │      │       │
│ Disponible │  │      │ │      │ │      │       │
│ [x] Stock  │  └──────┘ └──────┘ └──────┘       │
│            │                                    │
│            │  [Paginación: 1 2 3 ... 10]       │
└────────────┴────────────────────────────────────┘
```

#### Funcionalidades:
- Filtros por categoría, rango de precio y stock
- Búsqueda de productos en tiempo real
- Ordenamiento por: Precio ascendente/descendente, Popularidad
- Agregar rápido al carrito
- Ver detalles del producto

#### Componentes:
- `<ProductFilters />` - Panel de filtros lateral
- `<ProductCard />` - Tarjeta de producto en catálogo
- `<SearchBar />` - Barra de búsqueda
- `<SortDropdown />` - Desplegable de ordenamiento
- `<Pagination />` - Control de paginación

---

### 3. DETALLE DE PRODUCTO

```
┌─────────────────────────────────────────────────┐
│  Breadcrumb: Home > Productos > Pan Francés     │
└─────────────────────────────────────────────────┘

┌───────────────────┬─────────────────────────────┐
│                   │  Pan Francés Artesanal      │
│   [Imagen        │  Calificación: 4.8 / 5      │
│    Principal]     │                             │
│                   │  $2.50                      │
│  [Zoom]           │  En Stock (45 unidades)     │
│                   │                             │
│  [Img1][Img2]     │  Descripción:               │
│  Miniaturas       │  Pan francés recién         │
│                   │  horneado, crujiente por    │
│                   │  fuera, suave por dentro    │
│                   │                             │
│                   │  Peso: 250g                 │
│                   │  Calorías: 180 cal          │
│                   │  Vida útil: 2 días          │
│                   │  Alérgenos: Gluten          │
│                   │                             │
│                   │  Cantidad: [- 1 +]          │
│                   │                             │
│                   │  [Agregar al Carrito]       │
└───────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  INFORMACIÓN ADICIONAL                          │
│  [Tab: Nutrición | Ingredientes ]               │
│                                                 │
│  Proteínas: 8g | Carbohidratos: 35g | Grasas: 2g│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  PRODUCTOS RELACIONADOS                         │
│  [Pan Integral] [Pan de Ajo] [Baguette]        │
└─────────────────────────────────────────────────┘
```

#### Componentes:
- `<ProductGallery />` - Galería de imágenes
- `<ProductInfo />` - Información principal, precio e ingredientes
- `<QuantitySelector />` - Selector de cantidad a comprar
- `<AddToCartButton />` - Botón de agregar al carrito
- `<ProductTabs />` - Pestañas de especificaciones nutricionales
- `<RelatedProducts />` - Carrusel de productos recomendados

---

### 4. CARRITO DE COMPRAS

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
│  │       [- 5 +] [Eliminar]│  │  Impuestos:    │
│  │       = $12.50          │  │  $1.50         │
│  │ └───────────────────────┘  │                │
│                                │  ────────────  │
│  ┌─────────────────────────┐  │  TOTAL:        │
│  │ [Img] Torta Chocolate   │  │  $29.00        │
│  │       $15.00 x 1        │  │                │
│  │       [- 1 +] [Eliminar]│  │  ┌──────────┐  │
│  │       = $15.00          │  │  │ RESERVAR │  │
│  └─────────────────────────┘  │  └──────────┘  │
│                                │                │
│  ┌─────────────────────────┐  │                │
│  │ [Img] Galletas          │  │                │
│  │       $1.00 x 3         │  │                │
│  │       [- 3 +] [Eliminar]│  │                │
│  │       = $3.00           │  │                │
│  └─────────────────────────┘  │                │
└────────────────────────────────┴────────────────┘

┌─────────────────────────────────────────────────┐
│  Recomendaciones para ti                        │
│  [Pan Integral] [Brownies]                      │
└─────────────────────────────────────────────────┘
```

#### Funcionalidades:
- Actualizar cantidades de productos
- Eliminar productos del carrito
- Ver total acumulado de reserva (sin cobro de envío)
- Visualizar recomendaciones personalizadas de productos

#### Componentes:
- `<CartItem />` - Fila del producto en carrito
- `<CartSummary />` - Panel resumen con el botón para ir a reservar
- `<CartRecommendations />` - Recomendaciones personalizadas

---

### 5. CHECKOUT (Proceso de Reserva en 2 Pasos)

#### Paso 1: Datos de la Reserva y Sucursal
```
┌─────────────────────────────────────────────────┐
│  Formulario de Reserva                          │
│  [●━━━━━○] 1.Datos de Reserva 2.Confirmación    │
└─────────────────────────────────────────────────┘

┌────────────────────────────────┬────────────────┐
│  DATOS DE RECOGIDA             │  TU RESERVA    │
│                                │                │
│  Sucursal de Recogida:         │  3 productos   │
│  ( ) Sucursal Centro           │                │
│  ( ) Sucursal Norte            │  Pan x5        │
│  ( ) Sucursal Sur              │  Torta x1      │
│                                │  Galletas x3   │
│  Fecha de Recogida:            │                │
│  [ Seleccionar Fecha (📅) ]    │  Subtotal:     │
│                                │  $27.50        │
│  Hora de Recogida:             │  Impuestos:    │
│  [ Seleccionar Hora (⏰) ]    │  $1.50         │
│                                │  ────────────  │
│  Pago al retirar: EFECTIVO     │  Total:        │
│  (sin cobro dentro del sistema)│  $29.00        │
│                                │                │
│                                │  [Confirmar]   │
│  Notas Especiales:             │                │
│  [________________________]    │                │
└────────────────────────────────┴────────────────┘
```

#### Paso 2: Confirmación de Reserva
```
┌─────────────────────────────────────────────────┐
│  ¡Reserva Confirmada Exitosamente!              │
│  [●━━━━━●] Completado                           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Número de Reserva: #ORD-20261111-0042          │
│                                                 │
│  Hemos enviado los detalles a tu correo         │
│                                                 │
│  Estado de Reserva: PENDIENTE DE RECOGIDA       │
│  Horario Pactado: 11 Nov 2026, 3:00 PM          │
│  Lugar: Sucursal Centro                         │
│                                                 │
│  [Ver Detalle de Reservas] [Volver al Inicio]   │
└─────────────────────────────────────────────────┘
```

#### Componentes:
- `<BranchSelector />` - Selector de sucursal
- `<DateTimePicker />` - Selectores de fecha y hora permitidas
- `<OrderSummary />` - Resumen del pedido
- `<ConfirmationCard />` - Tarjeta final con el código único de pedido

---

### 6. PERFIL DE USUARIO

```
┌─────────────────────────────────────────────────┐
│  Mi Cuenta                                      │
└─────────────────────────────────────────────────┘

┌────────────┬────────────────────────────────────┐
│  MENÚ      │  PERFIL                            │
│            │                                    │
│ ● Perfil   │  [Avatar]                          │
│ ○ Reservas │  Juan Pérez                        │
│ ○ Direc.   │  juan@email.com                    │
│ ○ Seguridad│  +502 5555-5555                    │
│ ○ Salir    │                                    │
│            │  ┌──────────────────────────────┐ │
│            │  │ Editar Perfil               │ │
│            │  │                              │ │
│            │  │ Nombre: [Juan Pérez      ]   │ │
│            │  │ Email:  [juan@email.com  ]   │ │
│            │  │ Teléfono: [5555-5555     ]   │ │
│            │  │                              │ │
│            │  │ [Cancelar] [Guardar Cambios]│ │
│            │  └──────────────────────────────┘ │
└────────────┴────────────────────────────────────┘
```

---

### 7. MIS RESERVAS (Historial de Pedidos)

```
┌─────────────────────────────────────────────────┐
│  Mis Reservas                                   │
│  [Todas] [Pendientes] [Listas] [Entregadas]     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Reserva #ORD-20261111-0042                     │
│  Estado: LISTO PARA RECOGER                     │
│  Fecha programada: 11 Nov 2026, 3:00 PM         │
│  Lugar: Sucursal Centro                         │
│  Total: $29.00                                  │
│                                                 │
│  Detalle: Pan Francés x5, Torta x1, Galletas x3 │
│                                                 │
│  Timeline:                                      │
│  - Reserva Recibida    (Completado 2:30 PM)     │
│  - En Horno/Preparando (Completado 2:45 PM)     │
│  - Listo en Sucursal   (Actual - Esperando)     │
│                                                 │
│  [Cancelar Reserva] [📞 Contactar Sucursal]     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Reserva #ORD-20261109-0038                     │
│  Estado: ENTREGADO Y PAGADO                     │
│  Fecha de entrega: 09 Nov 2026                  │
│  Total: $25.00                                  │
│                                                 │
│  [Ver Detalles] [Volver a Reservar]             │
└─────────────────────────────────────────────────┘
```

---

### 8. DASHBOARD ADMIN

```
┌─────────────────────────────────────────────────┐
│  Panaderia Svetlana Admin | Encargado Centro | Salir│
└─────────────────────────────────────────────────┘

┌────────────┬────────────────────────────────────┐
│  MENÚ      │  DASHBOARD GENERAL                 │
│            │                                    │
│ ● Dashboard│  Resumen del Día                   │
│ ○ Reservas │  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│ ○ Productos│  │$125│ │ 15 │ │ 98%│ │ 04 │     │
│ ○ Inventar.│  │Vtas│ │Res.│ │Cump│ │Agot│     │
│ ○ Clientes │  └────┘ └────┘ └────┘ └────┘     │
│ ○ Reportes │                                    │
│ ○ Config.  │  Ventas Semanales (Por sucursal)   │
│            │  [Gráfico de barras comparativo]   │
│            │                                    │
│            │  Reservas Recientes                │
│            │  ┌──────────────────────────────┐ │
│            │  │ #042 | Juan P. | $29.00 | Listo  │ │
│            │  │ #041 | María G.| $15.00 | Prep.  │ │
│            │  └──────────────────────────────┘ │
│            │                                    │
│            │  Alertas de Materia Prima Baja     │
│            │  - Harina Suave (25 Libras - Min)  │
└────────────┴────────────────────────────────────┘
```

---

### 9. GESTIÓN DE PRODUCTOS (Admin)

```
┌─────────────────────────────────────────────────┐
│  Catálogo de Productos                          │
│  [+ Nuevo Producto]                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  [Buscar productos...]       [Categorías▾]      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Listado de Productos                           │
│  ┌──────────────────────────────────────────┐  │
│  │ Nombre | SKU | Categoría | Precio | Stock│  │
│  ├──────────────────────────────────────────┤  │
│  │ Pan F. | PF1 | Panes     | $2.50  | 45   │  │
│  │ Torta  | TC1 | Pasteles  | $15.00 | 12   │  │
│  │ Cookie | GA1 | Galletas  | $1.00  | 5    │  │
│  │                                          │  │
│  │ [Acciones: Editar | Ver Detalle | Eliminar] │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [Paginación: 1 2 3] Mostrando 1-10 de 30       │
└─────────────────────────────────────────────────┘
```

---

### 10. GESTIÓN DE PEDIDOS (Admin / Reservas)

```
┌─────────────────────────────────────────────────┐
│  Reservas de Clientes                           │
│  [Todas] [Pendientes] [En Preparación] [Listas] │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Tablero Kanban de Control                      │
│                                                 │
│  PENDIENTE      EN PREPARACIÓN    LISTO EN TIENDA │
│  ┌─────────┐    ┌─────────┐      ┌─────────┐      │
│  │ #ORD-042│    │ #ORD-041│      │ #ORD-040│      │
│  │ $29.00  │    │ $15.00  │      │ $22.50  │      │
│  │ 15:00   │    │ 16:30   │      │ 12:15   │      │
│  └─────────┘    └─────────┘      └─────────┘      │
│                                                 │
│  [Arrastrar tarjeta para cambiar estado]        │
└─────────────────────────────────────────────────┘
```

---

### 11. REPORTES Y ANALÍTICA (Admin)

```
┌─────────────────────────────────────────────────┐
│  Reportes y Rendimiento                         │
│  [Hoy] [Esta Semana] [Este Mes]                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Gráficos Estadísticos                          │
│                                                 │
│  Ventas Totales por Sucursal:                   │
│  - Sucursal Centro: $1,250.00                   │
│  - Sucursal Norte: $850.00                      │
│                                                 │
│  Predicción de Demanda Inteligente (IA):        │
│  [Gráfico de línea - Estimaciones futuras]      │
│  Sugerencias de producción para mañana:         │
│  - Pan Francés: 80 unidades estimadas           │
│  - Baguette: 20 unidades estimadas             │
└─────────────────────────────────────────────────┘
```

---

## COMPONENTES REUTILIZABLES

### Librería de Componentes (TypeScript / React)
```typescript
// Botones
<Button variant="primary" size="lg">Confirmar Reserva</Button>
<Button variant="outline" size="md">Cancelar</Button>
<IconButton icon="cart" badge={3} />

// Tarjetas
<ProductCard product={data} onAddToCart={handleAdd} />
<CategoryCard category={data} />
<OrderCard order={data} />

// Formularios
<Input label="Email" type="email" />
<Select options={branches} label="Sucursal de recogida" />
<TextArea label="Notas de reserva" rows={4} />

// Feedback
<Alert type="success">Reserva creada con éxito</Alert>
<Toast message="Estado actualizado" />
<Modal title="Confirmar Acción" onClose={handleClose} />
<Loader />

// Navegación
<Breadcrumb items={breadcrumbs} />
<Pagination currentPage={1} totalPages={10} />
<Tabs tabs={tabs} />

// Tablas e Indicadores
<Table columns={columns} data={products} />
<Badge>Listo para recoger</Badge>
<PriceDisplay price={12.50} />
```

---

## RESPONSIVE BREAKPOINTS
```css
sm: 640px   /* Dispositivos móviles / Tablets pequeños */
md: 768px   /* Tablets en modo vertical */
lg: 1024px  /* Computadoras de escritorio estándar */
xl: 1280px  /* Monitores de pantalla ancha */
```

---

## CHECKLIST DE PANTALLAS (APLICACIÓN WEB RESPONSIVE)

- [x] Landing Page (Página de inicio y bienvenida)
- [x] Catálogo de Productos (Filtros y búsqueda)
- [x] Detalle de Producto (Información y galería)
- [x] Carrito de Compras (Gestión de ítems a reservar)
- [x] Checkout (2 pasos: Datos de recogida y Confirmación)
- [x] Perfil de Usuario (Datos personales y direcciones)
- [x] Historial de Reservas (Listas de pedidos de clientes)
- [x] Dashboard de Administración (Resumen general y gráficos)
- [x] Gestión de Catálogo de Productos (CRUD completo para Admin)
- [x] Panel Kanban de Control de Reservas (Cambio de estados para Admin)
- [x] Reportes y Analítica (Ventas y predicciones de IA)

**Total: 11 pantallas web responsivas diseñadas**
