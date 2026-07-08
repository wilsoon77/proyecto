# Planificacion de Sprints — Panaderia Svetlana Smart System

> **Proyecto de Graduacion**
> **Metodologia:** Scrum Hibrido — 8 Sprints de 2 semanas
> **Periodo de Ejecucion:** Julio 2026 — Octubre 2026
> **Fase previa (Mayo-Junio 2026):** Levantamiento de requerimientos, diseño de BD, mockups y documentacion.

---

## Contexto de Avance Actual

Aunque la planificacion en Jira se estructura como si el proyecto iniciara desde cero, el equipo cuenta con avance significativo realizado durante la fase de requisitos y diseño:

**Backend (NestJS):**
- 19 modulos implementados, 44+ endpoints documentados en Swagger
- Autenticacion JWT con Access+Refresh tokens, Helmet, CORS, Rate Limiting
- Modulos de Produccion y Inventario con transacciones ACID
- 27 unit tests + 7 e2e tests de produccion

**Frontend (Next.js):**
- 22+ paginas/rutas implementadas (Landing, Catalogo, Carrito, Checkout, Login, Registro, Perfil, Admin)
- 11 componentes UI, 3 layouts, 5 hooks, 3 contexts, 15 servicios API
- Build exitoso con 0 errores

**Base de Datos (PostgreSQL/Supabase):**
- 16 modelos Prisma, 11 migraciones aplicadas, 9 indices de rendimiento

> **Nota:** Las tareas en Jira se crean para dar seguimiento formal a cada funcionalidad, incluyendo las que ya fueron desarrolladas (se marcan como completadas al inicio del sprint correspondiente) y las que requieren refactorizacion, integracion o extension.

---

## Leyenda de Estimacion

| Etiqueta | Puntos de Historia | Horas Estimadas |
|----------|-------------------|-----------------|
| XS | 1 | 1-2h |
| S | 2 | 2-4h |
| M | 3 | 4-8h |
| L | 5 | 8-16h |
| XL | 8 | 16-24h |

**Tipo de Issue en Jira:**
- **Epic:** Modulo grande del sistema
- **Story (Historia):** Tarea funcional entregable
- **Subtask (Subtarea):** Paso tecnico dentro de la historia
- **Bug:** Correccion de defectos encontrados en testing

---

## Epics del Proyecto

| ID | Epic | Descripcion |
|----|------|-------------|
| EP-01 | Setup e Infraestructura | Configuracion de repositorio, CI/CD, entornos y herramientas |
| EP-02 | Autenticacion y Seguridad | Login, registro, JWT, roles, OAuth, proteccion de rutas |
| EP-03 | Catalogo y Productos | CRUD de productos, categorias, imagenes, tienda publica |
| EP-04 | Inventario y Materia Prima | Stock por sucursal, movimientos, insumos, conversion de unidades |
| EP-05 | Produccion Diaria | Recetas, amasijos, latas, produccion transaccional |
| EP-06 | Reservas y Checkout | Carrito, flujo de reserva, seleccion de sucursal, notificaciones |
| EP-07 | Administracion y Dashboard | Panel admin, KPIs, gestion de pedidos, auditoria |
| EP-08 | Punto de Venta (POS) | Venta presencial, descuento de inventario inmediato |
| EP-09 | Inteligencia Artificial | Prediccion de demanda, recomendaciones, chatbot |
| EP-10 | PWA y Experiencia Movil | Service Workers, manifiesto, cache offline, instalabilidad |
| EP-11 | Testing y Calidad | Pruebas unitarias, e2e, auditoria de seguridad |
| EP-12 | Deployment y Entrega Final | Despliegue produccion, documentacion, presentacion |

---

## Sprint 1: Setup e Infraestructura + Backend Core

**Fechas:** Julio 2026 — Semanas 1 y 2
**Objetivo del Sprint:** Tener el entorno de desarrollo completamente configurado, el backend conectado a la base de datos y la autenticacion funcional.

---

### STORY 1.1 — Configuracion del Repositorio y Monorepo
**Epic:** EP-01 | **Estimacion:** M (3 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 1.1.1 | Inicializar repositorio Git con estructura monorepo (carpetas `api/` y `web/`) | Backend | XS |
| 1.1.2 | Configurar `.gitignore`, `.env.example` para api y web | Backend | XS |
| 1.1.3 | Configurar ESLint y Prettier compartido en ambos proyectos | Fullstack | S |
| 1.1.4 | Documentar instrucciones de setup local en README.md | Fullstack | XS |

---

### STORY 1.2 — Setup de Base de Datos PostgreSQL (Supabase)
**Epic:** EP-01 | **Estimacion:** M (3 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 1.2.1 | Crear proyecto en Supabase y obtener credenciales de conexion | Backend | XS |
| 1.2.2 | Configurar Prisma ORM: `schema.prisma` con provider PostgreSQL y variables de entorno | Backend | S |
| 1.2.3 | Definir modelos base de Prisma: User, Branch, Category, Product | Backend | M |
| 1.2.4 | Ejecutar primera migracion y validar conexion desde NestJS | Backend | S |

---

### STORY 1.3 — Setup de NestJS y Estructura Modular
**Epic:** EP-01 | **Estimacion:** M (3 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 1.3.1 | Inicializar proyecto NestJS con TypeScript estricto | Backend | S |
| 1.3.2 | Crear modulo PrismaModule (singleton de PrismaClient) | Backend | S |
| 1.3.3 | Configurar Swagger/OpenAPI para documentacion automatica | Backend | S |
| 1.3.4 | Configurar variables de entorno con `@nestjs/config` y `ConfigModule` | Backend | XS |
| 1.3.5 | Configurar Helmet.js, CORS y Rate Limiting global | Backend | S |

---

### STORY 1.4 — Autenticacion JWT (Access + Refresh Token)
**Epic:** EP-02 | **Estimacion:** XL (8 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 1.4.1 | Crear AuthModule con AuthService y AuthController | Backend | M |
| 1.4.2 | Implementar endpoint `POST /auth/register` con hasheo bcrypt | Backend | M |
| 1.4.3 | Implementar endpoint `POST /auth/login` con emision de JWT (access + refresh) | Backend | M |
| 1.4.4 | Implementar endpoint `POST /auth/refresh` con rotacion de refresh token | Backend | M |
| 1.4.5 | Implementar endpoint `POST /auth/logout` (invalidar refresh token) | Backend | S |
| 1.4.6 | Implementar endpoint `GET /auth/me` y `PATCH /auth/me` | Backend | S |
| 1.4.7 | Crear JwtAuthGuard y RolesGuard para proteccion de rutas | Backend | M |
| 1.4.8 | Crear decoradores `@Public()` y `@Roles()` | Backend | S |

---

### STORY 1.5 — Setup de Next.js y Estructura Frontend Base
**Epic:** EP-01 | **Estimacion:** M (3 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 1.5.1 | Inicializar proyecto Next.js con App Router y TypeScript | Frontend | S |
| 1.5.2 | Configurar Tailwind CSS y shadcn/ui como sistema de diseño | Frontend | S |
| 1.5.3 | Crear layout principal con Navbar, Footer y LayoutWrapper | Frontend | M |
| 1.5.4 | Configurar cliente HTTP base (`api-client.ts`) con interceptores de token | Frontend | M |

---

### STORY 1.6 — Pantallas de Login y Registro (Frontend)
**Epic:** EP-02 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 1.6.1 | Crear pagina de Login (`/login`) con formulario y validacion Zod | Frontend | M |
| 1.6.2 | Crear pagina de Registro (`/registro`) con formulario completo | Frontend | M |
| 1.6.3 | Implementar AuthContext para manejo de sesion y tokens | Frontend | M |
| 1.6.4 | Implementar logica de refresh token automatico en el cliente HTTP | Frontend | S |
| 1.6.5 | Proteger rutas privadas con middleware de autenticacion | Frontend | S |

---

**Total Sprint 1:** ~25 puntos | 6 Stories | 27 Subtareas

---

## Sprint 2: Catalogo de Productos y Tienda Publica

**Fechas:** Julio 2026 — Semanas 3 y 4
**Objetivo del Sprint:** Catalogo publico funcional con CRUD administrativo de productos y categorias, integracion de imagenes.

---

### STORY 2.1 — CRUD de Categorias (Backend)
**Epic:** EP-03 | **Estimacion:** M (3 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 2.1.1 | Crear CategoriesModule con servicio y controlador | Backend | S |
| 2.1.2 | Implementar endpoints: GET, GET/:slug, POST, PATCH, DELETE | Backend | M |
| 2.1.3 | Validar que no se pueda eliminar categoria con productos asociados | Backend | S |
| 2.1.4 | Agregar decoradores de roles (ADMIN/MANAGER para escritura, publico para lectura) | Backend | XS |

---

### STORY 2.2 — CRUD de Productos (Backend)
**Epic:** EP-03 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 2.2.1 | Crear ProductsModule con servicio y controlador | Backend | S |
| 2.2.2 | Implementar endpoints CRUD con filtros, busqueda y paginacion | Backend | L |
| 2.2.3 | Implementar endpoint `GET /products/featured` para productos destacados | Backend | S |
| 2.2.4 | Implementar logica de slug unico auto-generado desde nombre | Backend | S |
| 2.2.5 | Soportar campos de combo: `basePrice`, `comboQuantity`, `comboPrice` | Backend | S |
| 2.2.6 | Soportar `isActive`, `isAvailable` y `origin` (PRODUCIDO/REVENTA) | Backend | S |

---

### STORY 2.3 — Gestion de Imagenes (Cloudinary/Appwrite)
**Epic:** EP-03 | **Estimacion:** M (3 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 2.3.1 | Crear StorageModule para subida y eliminacion de imagenes | Backend | M |
| 2.3.2 | Implementar endpoint de upload vinculado a producto con posicion | Backend | S |
| 2.3.3 | Implementar endpoint de eliminacion de imagen por ID | Backend | S |

---

### STORY 2.4 — Landing Page (Frontend)
**Epic:** EP-03 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 2.4.1 | Diseñar e implementar Hero Section con CTA principal | Frontend | M |
| 2.4.2 | Implementar seccion de Productos Destacados (consumir API featured) | Frontend | M |
| 2.4.3 | Implementar seccion de Categorias con navegacion al catalogo filtrado | Frontend | S |
| 2.4.4 | Implementar seccion de Sucursales con mapa/ubicaciones | Frontend | S |
| 2.4.5 | Implementar Footer con informacion de contacto y enlaces | Frontend | S |

---

### STORY 2.5 — Catalogo Publico y Detalle de Producto (Frontend)
**Epic:** EP-03 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 2.5.1 | Crear pagina de catalogo (`/productos`) con grid responsive | Frontend | M |
| 2.5.2 | Implementar filtros por categoria, busqueda por texto y ordenamiento | Frontend | M |
| 2.5.3 | Implementar paginacion en catalogo | Frontend | S |
| 2.5.4 | Crear pagina de detalle de producto (`/productos/[slug]`) | Frontend | M |
| 2.5.5 | Mostrar badges de combo (ej: "3x Q1.25") y estado del producto | Frontend | S |

---

### STORY 2.6 — Panel Administrativo de Productos (Frontend)
**Epic:** EP-03 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 2.6.1 | Crear layout de panel admin con sidebar y navegacion por modulos | Frontend | M |
| 2.6.2 | Crear pagina admin de productos (`/admin/productos`) con tabla y acciones | Frontend | M |
| 2.6.3 | Crear formulario de crear/editar producto con subida de imagenes | Frontend | L |
| 2.6.4 | Crear pagina admin de categorias (`/admin/categorias`) con CRUD | Frontend | M |

---

**Total Sprint 2:** ~26 puntos | 6 Stories | 24 Subtareas

---

## Sprint 3: Inventario y Materia Prima

**Fechas:** Agosto 2026 — Semanas 1 y 2
**Objetivo del Sprint:** Sistema de inventario por sucursal, movimientos de stock, gestion de materia prima con conversion de unidades.

---

### STORY 3.1 — CRUD de Sucursales (Backend + Frontend)
**Epic:** EP-03 | **Estimacion:** M (3 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 3.1.1 | Implementar BranchesModule: endpoints CRUD (ADMIN) y listado publico | Backend | M |
| 3.1.2 | Crear pagina admin de sucursales (`/admin/sucursales`) con formulario CRUD | Frontend | M |
| 3.1.3 | Crear pagina publica de sucursales (`/sucursales`) con info de cada una | Frontend | S |

---

### STORY 3.2 — Inventario de Producto Terminado por Sucursal
**Epic:** EP-04 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 3.2.1 | Implementar InventoryModule con InventoryService (separacion de capas) | Backend | M |
| 3.2.2 | Implementar endpoint `GET /inventory` con filtros por sucursal y producto | Backend | M |
| 3.2.3 | Implementar endpoint `GET /inventory/low-stock` con umbral configurable | Backend | S |
| 3.2.4 | Crear pagina admin de inventario (`/admin/inventario`) con tabla por sucursal | Frontend | M |
| 3.2.5 | Implementar indicadores visuales de bajo stock y alertas | Frontend | S |

---

### STORY 3.3 — Movimientos de Inventario (Stock Movements)
**Epic:** EP-04 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 3.3.1 | Implementar StockMovementsModule con tipos: COMPRA, PRODUCCION, TRANSFERENCIA, MERMA, PERDIDA_ROBO, SOBRANTE, VENTA | Backend | L |
| 3.3.2 | Implementar validaciones por tipo (origen/destino obligatorios, cantidad positiva) | Backend | M |
| 3.3.3 | Implementar endpoint `GET /stock-movements` con filtros y paginacion | Backend | S |
| 3.3.4 | Crear interfaz para registrar movimientos manuales (ajustes, mermas) en admin | Frontend | M |
| 3.3.5 | Crear vista de historial de movimientos con filtros | Frontend | M |

---

### STORY 3.4 — Gestion de Materia Prima (RawMaterial)
**Epic:** EP-04 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 3.4.1 | Implementar RawMaterialsModule: CRUD de insumos con unidad base (LB, ML, UNIT) | Backend | M |
| 3.4.2 | Implementar RawMaterialInventory: stock de insumos por sucursal | Backend | M |
| 3.4.3 | Crear pagina admin de materia prima con tabla de insumos y stock por sucursal | Frontend | M |

---

### STORY 3.5 — Registro de Compras con Conversion de Unidades
**Epic:** EP-04 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 3.5.1 | Implementar logica de conversion: quintal, arroba, libra, litro, galon, carton, unidad -> unidad base | Backend | M |
| 3.5.2 | Implementar endpoint de registro de compra que convierte y suma inventario atomicamente | Backend | M |
| 3.5.3 | Crear formulario de registro de compras en panel admin con selector de unidad comercial | Frontend | M |
| 3.5.4 | Mostrar preview de conversion (ej: "1 quintal = 100 lb") antes de confirmar | Frontend | S |

---

**Total Sprint 3:** ~23 puntos | 5 Stories | 20 Subtareas

---

## Sprint 4: Produccion Diaria Transaccional

**Fechas:** Agosto 2026 — Semanas 3 y 4
**Objetivo del Sprint:** Modulo de recetas por amasijo funcional con produccion transaccional ACID que descuenta insumos e incrementa producto terminado.

---

### STORY 4.1 — CRUD de Recetas por Amasijo
**Epic:** EP-05 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 4.1.1 | Implementar RecipesModule: CRUD completo de recetas | Backend | M |
| 4.1.2 | Implementar RecipeIngredient: asociar ingredientes (RawMaterial) con cantidad por amasijo | Backend | M |
| 4.1.3 | Implementar campo `unitsPerTray` en Product para rendimiento por lata | Backend | S |
| 4.1.4 | Validar que solo ADMIN y MANAGER puedan crear/editar recetas | Backend | XS |
| 4.1.5 | Crear pagina admin de recetas (`/admin/recetas`) con formulario de ingredientes dinamico | Frontend | L |
| 4.1.6 | Mostrar resumen visual de receta: ingredientes, producto resultante, latas estandar | Frontend | M |

---

### STORY 4.2 — Produccion Diaria Transaccional (Backend)
**Epic:** EP-05 | **Estimacion:** XL (8 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 4.2.1 | Implementar ProductionModule con ProductionService | Backend | M |
| 4.2.2 | Implementar logica de produccion: recibir receta, numero de latas y sucursal | Backend | M |
| 4.2.3 | Implementar transaccion ACID Serializable: descontar materia prima + incrementar producto terminado | Backend | L |
| 4.2.4 | Implementar rollback completo si falta algun insumo | Backend | M |
| 4.2.5 | Implementar retry automatico para errores de concurrencia (Prisma P2034) | Backend | S |
| 4.2.6 | Implementar timeout de transaccion (10s produccion, 5s queries) | Backend | S |
| 4.2.7 | Registrar movimiento tipo PRODUCCION en StockMovements al completar | Backend | S |
| 4.2.8 | Crear endpoint `GET /production` con historial paginado por sucursal | Backend | S |

---

### STORY 4.3 — Interfaz de Produccion Diaria (Frontend)
**Epic:** EP-05 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 4.3.1 | Crear pagina admin de produccion (`/admin/produccion`) | Frontend | M |
| 4.3.2 | Implementar formulario: seleccionar receta, ingresar latas, seleccionar sucursal | Frontend | M |
| 4.3.3 | Mostrar preview de consumo de insumos antes de confirmar produccion | Frontend | M |
| 4.3.4 | Mostrar resultado: unidades producidas (latas x unitsPerTray) | Frontend | S |
| 4.3.5 | Crear tabla de historial de produccion con filtros por fecha y sucursal | Frontend | M |

---

### STORY 4.4 — Tests de Produccion y Transacciones
**Epic:** EP-11 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 4.4.1 | Escribir unit tests para ProductionService (descuento correcto de insumos) | Backend | M |
| 4.4.2 | Escribir unit tests para rollback cuando falta insumo | Backend | M |
| 4.4.3 | Escribir e2e tests de produccion: flujo completo con base de datos real | Backend | M |
| 4.4.4 | Escribir e2e test de atomicidad: validar que fallo parcial no deja datos inconsistentes | Backend | M |

---

**Total Sprint 4:** ~23 puntos | 4 Stories | 21 Subtareas

---

## Sprint 5: Reservas de Pedidos y Checkout

**Fechas:** Septiembre 2026 — Semanas 1 y 2
**Objetivo del Sprint:** Flujo completo de reserva de pedidos: carrito, seleccion de sucursal/fecha de recogida, confirmacion y notificaciones.

---

### STORY 5.1 — Carrito de Compras (Frontend)
**Epic:** EP-06 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 5.1.1 | Implementar CartContext con persistencia en localStorage | Frontend | M |
| 5.1.2 | Crear pagina de carrito (`/carrito`) con listado de items | Frontend | M |
| 5.1.3 | Implementar acciones: modificar cantidad, eliminar item, vaciar carrito | Frontend | M |
| 5.1.4 | Calcular subtotal con logica de combos (comboQuantity/comboPrice) | Frontend | M |
| 5.1.5 | Mostrar contador de carrito en Navbar actualizado en tiempo real | Frontend | S |

---

### STORY 5.2 — Flujo de Checkout / Reserva (Frontend)
**Epic:** EP-06 | **Estimacion:** XL (8 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 5.2.1 | Crear pagina de checkout (`/checkout`) con pasos secuenciales | Frontend | M |
| 5.2.2 | Paso 1: Revision de carrito con resumen de productos y precios | Frontend | S |
| 5.2.3 | Paso 2: Seleccion de sucursal de recogida (consumir API branches) | Frontend | M |
| 5.2.4 | Paso 3: Seleccion de fecha y hora de recogida (dentro de horario operativo) | Frontend | M |
| 5.2.5 | Paso 4: Metodo de pago (pago en caja o transferencia previa) y notas opcionales | Frontend | S |
| 5.2.6 | Paso 5: Confirmacion final y envio de reserva al backend | Frontend | M |
| 5.2.7 | Pantalla de confirmacion con numero de orden, detalle y sucursal | Frontend | M |

---

### STORY 5.3 — Sistema de Reservas (Backend)
**Epic:** EP-06 | **Estimacion:** XL (8 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 5.3.1 | Implementar OrdersModule: modelo Order con items, sucursal, fecha recogida | Backend | M |
| 5.3.2 | Implementar endpoint `POST /orders/reserve` con reserva transaccional de stock | Backend | L |
| 5.3.3 | Generar numero de orden unico (formato ORD-YYYYMMDD-XXXX) | Backend | S |
| 5.3.4 | Implementar endpoint `POST /orders/:id/cancel` con liberacion de stock reservado | Backend | M |
| 5.3.5 | Implementar endpoint `GET /orders` con filtro por usuario (clientes ven solo sus pedidos) | Backend | M |
| 5.3.6 | Implementar endpoint `GET /orders/:id` con detalle completo | Backend | S |
| 5.3.7 | Implementar endpoint `POST /orders/:id/pickup` para entrega con descuento fisico | Backend | M |

---

### STORY 5.4 — Historial de Pedidos del Cliente (Frontend)
**Epic:** EP-06 | **Estimacion:** M (3 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 5.4.1 | Crear pagina de mis pedidos (`/pedidos`) con listado y estados | Frontend | M |
| 5.4.2 | Crear vista de detalle de pedido individual | Frontend | M |
| 5.4.3 | Implementar accion de cancelar pedido desde el frontend (solo PENDING/CONFIRMED) | Frontend | S |

---

### STORY 5.5 — Notificaciones por Email
**Epic:** EP-06 | **Estimacion:** M (3 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 5.5.1 | Integrar servicio de email (Resend o similar) en NestJS | Backend | M |
| 5.5.2 | Enviar email de confirmacion de reserva al cliente con detalles de recogida | Backend | M |
| 5.5.3 | Enviar email de notificacion a administradores de la sucursal | Backend | S |
| 5.5.4 | Enviar email al cambiar estado critico del pedido (confirmado, listo, cancelado) | Backend | M |

---

**Total Sprint 5:** ~27 puntos | 5 Stories | 24 Subtareas

---

## Sprint 6: Panel Administrativo y Dashboard

**Fechas:** Septiembre 2026 — Semanas 3 y 4
**Objetivo del Sprint:** Dashboard operativo con KPIs, gestion de reservas con flujo de estados, auditoria, gestion de usuarios.

---

### STORY 6.1 — Dashboard Operativo Multi-Sucursal
**Epic:** EP-07 | **Estimacion:** XL (8 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 6.1.1 | Implementar endpoint `GET /dashboard/stats` con KPIs: ventas del dia, pedidos, mermas, stock critico | Backend | L |
| 6.1.2 | Implementar filtros del dashboard por sucursal y rango de fechas | Backend | M |
| 6.1.3 | Crear pagina de Dashboard admin (`/admin`) con tarjetas de KPIs | Frontend | M |
| 6.1.4 | Implementar graficos: ventas semanales, top productos, estados de pedidos | Frontend | L |
| 6.1.5 | Implementar selector de sucursal para filtrar dashboard | Frontend | S |
| 6.1.6 | Implementar indicadores de alerta: stock bajo, reservas pendientes del dia | Frontend | M |

---

### STORY 6.2 — Gestion de Pedidos/Reservas (Admin)
**Epic:** EP-07 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 6.2.1 | Implementar endpoint `PATCH /orders/:id/status` con transiciones validas | Backend | M |
| 6.2.2 | Validar flujo de estados: PENDING->CONFIRMED->PREPARING->READY->DELIVERED y cancelacion | Backend | M |
| 6.2.3 | Crear pagina admin de ordenes (`/admin/ordenes`) con vista tipo Kanban por estados | Frontend | L |
| 6.2.4 | Implementar acciones: cambiar estado, agregar notas internas, cancelar con razon | Frontend | M |
| 6.2.5 | Mostrar timeline de estados en el detalle de cada reserva | Frontend | S |

---

### STORY 6.3 — Gestion de Usuarios (Admin)
**Epic:** EP-07 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 6.3.1 | Implementar UsersModule: CRUD con asignacion de roles y sucursal | Backend | M |
| 6.3.2 | Implementar desactivar/reactivar usuario (soft delete) | Backend | S |
| 6.3.3 | Crear pagina admin de usuarios (`/admin/usuarios`) con tabla y filtros por rol | Frontend | M |
| 6.3.4 | Crear formulario de crear/editar usuario con asignacion de rol y sucursal | Frontend | M |

---

### STORY 6.4 — Modulo de Auditoria
**Epic:** EP-07 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 6.4.1 | Implementar AuditModule: registrar acciones criticas (crear, actualizar, eliminar, login) | Backend | M |
| 6.4.2 | Implementar endpoint `GET /audit` con filtros por entidad, accion, usuario y fecha | Backend | M |
| 6.4.3 | Integrar interceptor de auditoria en modulos criticos (productos, inventario, ordenes, usuarios) | Backend | M |
| 6.4.4 | Crear pagina admin de historial de auditoria (`/admin/historial`) con tabla y filtros | Frontend | M |

---

### STORY 6.5 — Perfil de Cliente y Direcciones
**Epic:** EP-07 | **Estimacion:** M (3 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 6.5.1 | Implementar AddressesModule: CRUD de direcciones del usuario | Backend | M |
| 6.5.2 | Crear pagina de perfil (`/perfil`) con edicion de datos personales | Frontend | M |
| 6.5.3 | Crear seccion de direcciones en perfil con CRUD (agregar, editar, eliminar) | Frontend | M |

---

**Total Sprint 6:** ~26 puntos | 5 Stories | 22 Subtareas

---

## Sprint 7: IA, POS y PWA

**Fechas:** Octubre 2026 — Semanas 1 y 2
**Objetivo del Sprint:** Integrar modulos de IA (prediccion, recomendaciones, chatbot), punto de venta presencial y capacidades PWA.

---

### STORY 7.1 — Prediccion de Demanda (IA)
**Epic:** EP-09 | **Estimacion:** XL (8 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 7.1.1 | Diseñar modelo de datos para almacenar predicciones de demanda | Backend | S |
| 7.1.2 | Implementar servicio de recopilacion de datos historicos de ventas (90 dias) | Backend | M |
| 7.1.3 | Implementar algoritmo de prediccion de series temporales (promedio movil ponderado + estacionalidad semanal) | Backend | L |
| 7.1.4 | Implementar Cron Job nocturno para ejecucion automatica de prediccion | Backend | M |
| 7.1.5 | Implementar endpoint `GET /predictions` para consultar sugerencias de produccion | Backend | S |
| 7.1.6 | Crear seccion en Dashboard: graficos de prediccion y tabla de produccion recomendada | Frontend | L |

---

### STORY 7.2 — Recomendaciones Personalizadas (IA)
**Epic:** EP-09 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 7.2.1 | Implementar servicio de recomendaciones basado en historial de compras y categorias preferidas | Backend | L |
| 7.2.2 | Implementar fallback para clientes nuevos/anonimos (productos populares) | Backend | S |
| 7.2.3 | Implementar endpoint `GET /recommendations` con cache temporal | Backend | M |
| 7.2.4 | Crear seccion "Recomendado para ti" en la tienda web (catalogo y landing) | Frontend | M |

---

### STORY 7.3 — Chatbot de Atencion al Cliente (IA)
**Epic:** EP-09 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 7.3.1 | Integrar API de OpenAI o similar en NestJS | Backend | M |
| 7.3.2 | Crear contexto del chatbot con informacion del negocio (sucursales, horarios, productos, FAQs) | Backend | M |
| 7.3.3 | Implementar endpoint de chat con historial de conversacion por sesion | Backend | M |
| 7.3.4 | Crear widget de chatbot flotante en el frontend con interfaz de mensajes | Frontend | L |

---

### STORY 7.4 — Punto de Venta Presencial (POS)
**Epic:** EP-08 | **Estimacion:** XL (8 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 7.4.1 | Implementar endpoint POS: crear orden tipo venta directa con estado DELIVERED inmediato | Backend | M |
| 7.4.2 | Implementar descuento de inventario fisico inmediato en transaccion | Backend | M |
| 7.4.3 | Implementar logica de combos de precio en el calculo del POS | Backend | M |
| 7.4.4 | Crear pagina POS (`/admin/pos`) con interfaz rapida de seleccion de productos | Frontend | L |
| 7.4.5 | Implementar busqueda rapida y seleccion de cantidades en POS | Frontend | M |
| 7.4.6 | Implementar resumen de venta con total y boton de confirmar | Frontend | M |
| 7.4.7 | Restringir acceso POS a roles CASHIER y MANAGER | Backend | XS |

---

### STORY 7.5 — Configuracion PWA
**Epic:** EP-10 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 7.5.1 | Crear y configurar `manifest.json` con nombre, iconos, colores del tema | Frontend | S |
| 7.5.2 | Implementar Service Worker para cache de assets estaticos y paginas clave | Frontend | L |
| 7.5.3 | Implementar banner de instalacion "Agregar a pantalla de inicio" | Frontend | S |
| 7.5.4 | Configurar Web Push API para notificaciones push en navegador | Frontend | M |
| 7.5.5 | Validar instalabilidad en Android (Chrome) y desktop | Frontend | S |

---

**Total Sprint 7:** ~31 puntos | 5 Stories | 26 Subtareas

---

## Sprint 8: Testing, Deployment y Entrega Final

**Fechas:** Octubre 2026 — Semanas 3 y 4
**Objetivo del Sprint:** Pruebas completas, correccion de bugs, despliegue a produccion, documentacion final y preparacion de presentacion de tesis.

---

### STORY 8.1 — Pruebas Unitarias y de Integracion
**Epic:** EP-11 | **Estimacion:** XL (8 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 8.1.1 | Completar unit tests de AuthService (registro, login, refresh, logout) | Backend | M |
| 8.1.2 | Completar unit tests de OrdersService (reserva, cancelacion, entrega) | Backend | M |
| 8.1.3 | Completar unit tests de InventoryService y StockMovementsService | Backend | M |
| 8.1.4 | Completar unit tests de RawMaterialsService y RecipesService | Backend | M |
| 8.1.5 | Revisar y ampliar cobertura de tests existentes de ProductionService | Backend | S |
| 8.1.6 | Escribir tests de integracion para flujos criticos: reserva completa, produccion, POS | Backend | L |

---

### STORY 8.2 — Pruebas E2E y Auditoria de Seguridad
**Epic:** EP-11 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 8.2.1 | Escribir e2e tests: flujo completo de registro -> login -> reserva -> cancelacion | Backend | L |
| 8.2.2 | Escribir e2e tests de proteccion de rutas por rol (verificar 401/403) | Backend | M |
| 8.2.3 | Ejecutar auditoria de seguridad: rate limiting, inyeccion SQL, XSS, CORS | Backend | M |
| 8.2.4 | Validar rotacion de refresh tokens y invalidacion tras logout | Backend | S |

---

### STORY 8.3 — Correccion de Bugs y Polish
**Epic:** EP-11 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 8.3.1 | Revisar y corregir bugs encontrados en testing (backend) | Backend | L |
| 8.3.2 | Revisar y corregir bugs encontrados en testing (frontend) | Frontend | L |
| 8.3.3 | Optimizar rendimiento: consultas N+1, indices faltantes, lazy loading | Fullstack | M |
| 8.3.4 | Revisar responsive design en todas las pantallas criticas | Frontend | M |

---

### STORY 8.4 — Configuracion CI/CD
**Epic:** EP-12 | **Estimacion:** M (3 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 8.4.1 | Configurar GitHub Actions: ejecutar tests automaticos en cada PR | DevOps | M |
| 8.4.2 | Configurar pipeline de build y lint en CI | DevOps | S |
| 8.4.3 | Configurar deploy automatico del frontend a Vercel en branch main | DevOps | S |
| 8.4.4 | Configurar deploy automatico del backend a Render en branch main | DevOps | S |

---

### STORY 8.5 — Despliegue a Produccion
**Epic:** EP-12 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 8.5.1 | Configurar variables de entorno de produccion en Vercel (frontend) | DevOps | S |
| 8.5.2 | Configurar variables de entorno de produccion en Render (backend) | DevOps | S |
| 8.5.3 | Ejecutar migraciones de Prisma en base de datos de produccion (Supabase) | Backend | S |
| 8.5.4 | Configurar Sentry para monitoreo de errores en produccion (frontend y backend) | Fullstack | M |
| 8.5.5 | Validar endpoints de salud (`/health`) y metricas (`/metrics`) en produccion | Backend | S |
| 8.5.6 | Ejecutar smoke tests en entorno de produccion | Fullstack | M |

---

### STORY 8.6 — Documentacion Final y Entrega
**Epic:** EP-12 | **Estimacion:** L (5 pts)

| # | Subtarea | Responsable | Est. |
|---|----------|-------------|------|
| 8.6.1 | Actualizar documentacion tecnica del proyecto (README, guia de despliegue, estructura) | Fullstack | M |
| 8.6.2 | Escribir manual de usuario para panel administrativo | Fullstack | M |
| 8.6.3 | Preparar presentacion final de tesis (slides) | Fullstack | L |
| 8.6.4 | Grabar demo del sistema funcionando (video o presentacion en vivo) | Fullstack | M |

---

**Total Sprint 8:** ~31 puntos | 6 Stories | 24 Subtareas

---

## Resumen General de Sprints

| Sprint | Periodo | Enfoque | Stories | Subtareas | Puntos |
|--------|---------|---------|---------|-----------|--------|
| 1 | Jul S1-S2 | Setup + Auth + Estructura base | 6 | 27 | ~25 |
| 2 | Jul S3-S4 | Catalogo, Productos, Tienda publica | 6 | 24 | ~26 |
| 3 | Ago S1-S2 | Inventario, Materia Prima, Sucursales | 5 | 20 | ~23 |
| 4 | Ago S3-S4 | Produccion transaccional, Recetas | 4 | 21 | ~23 |
| 5 | Sep S1-S2 | Reservas, Checkout, Notificaciones | 5 | 24 | ~27 |
| 6 | Sep S3-S4 | Dashboard, Admin, Auditoria, Usuarios | 5 | 22 | ~26 |
| 7 | Oct S1-S2 | IA, POS, PWA | 5 | 26 | ~31 |
| 8 | Oct S3-S4 | Testing, Deploy, Documentacion | 6 | 24 | ~31 |
| **TOTAL** | | | **42** | **188** | **~212** |

---

## Trazabilidad: Requerimientos por Sprint

| Requerimiento | Sprint(s) |
|---------------|-----------|
| RF01: Autenticacion y sesiones | Sprint 1 |
| RF02: Gestion de usuarios y roles | Sprint 1, Sprint 6 |
| RF03: Gestion de sucursales | Sprint 3 |
| RF04: Gestion de productos | Sprint 2 |
| RF05: Gestion de categorias | Sprint 2 |
| RF06: Gestion de imagenes | Sprint 2 |
| RF07: Tienda en linea y catalogo | Sprint 2 |
| RF08: Reserva de pedidos en linea | Sprint 5 |
| RF09: Gestion operativa de pedidos | Sprint 6 |
| RF10: Punto de venta (POS) | Sprint 7 |
| RF11: Inventario por sucursal | Sprint 3 |
| RF12: Movimientos de inventario | Sprint 3 |
| RF13: Gestion de materia prima | Sprint 3 |
| RF14: Compras con conversion | Sprint 3 |
| RF15: Recetas por amasijo | Sprint 4 |
| RF16: Produccion transaccional | Sprint 4 |
| RF17: Dashboard multi-sucursal | Sprint 6 |
| RF18: Auditoria | Sprint 6 |
| RF19: Perfil y direcciones | Sprint 6 |

---

## Notas para Configuracion en Jira

1. **Tipo de Proyecto:** Scrum Board
2. **Epics:** Crear los 12 Epics listados arriba como primer paso
3. **Sprints:** Crear 8 sprints con las fechas indicadas
4. **Stories:** Cada "STORY X.Y" se crea como Issue tipo Story bajo su Epic correspondiente
5. **Subtareas:** Cada fila de subtarea se crea como Subtask dentro de su Story
6. **Labels sugeridos:** `backend`, `frontend`, `fullstack`, `devops`, `testing`, `ia`
7. **Componentes sugeridos:** `API (NestJS)`, `Web (Next.js)`, `Base de Datos`, `Infraestructura`, `IA`
8. **Definition of Done por Story:**
   - Codigo implementado y compilando sin errores
   - Endpoint documentado en Swagger (si aplica)
   - Prueba manual exitosa
   - Code review aprobado
   - Desplegado en entorno de desarrollo
