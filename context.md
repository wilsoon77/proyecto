# Contexto y Arquitectura del Proyecto: "Panaderia Svetlana"

## 1. Resumen del Proyecto
"Panaderia Svetlana" es un sistema ERP/POS diseñado para una panadería familiar con esquema multi-sucursal. El objetivo principal no es la burocracia industrial, sino la agilidad operativa: control de inventario de materia prima automatizado mediante recetas, trazabilidad de producción y un punto de venta (POS) rápido.

**Stack Tecnológico:**
- Backend: NestJS (19 módulos)
- Frontend: Next.js 16 (App Router, React 19)
- Base de Datos: PostgreSQL (Supabase)
- ORM: Prisma
- Almacenamiento de Imágenes: Appwrite
- Monitoreo: Sentry
- Infraestructura: Render (API) / Vercel (Web)

## 2. Reglas de Negocio Clave (¡Importante para la lógica!)
El sistema debe estar adaptado a un negocio familiar y ágil. Se deben evitar flujos de aprobación complejos (ej. compras a proveedores sin facturación compleja, transferencias directas).

### Roles de Usuario (Enum `UserRole` en Prisma)
- `ADMIN`: Acceso total (Desarrollador/Soporte). Equivale al concepto de SUPERADMIN.
- `MANAGER`: Dueños y familia. Acceso casi total (Ventas, Inventario, Ajustes de Merma, Producción).
- `BAKER`: Panadero. Solo ve órdenes de producción y stock de materia prima.
- `CASHIER`: Vendedor de mostrador. Solo ve el Punto de Venta (POS) y no tiene acceso a reportes de ganancias ni inventario de materia prima.
- `CUSTOMER`: Cliente registrado. Ve sus pedidos, perfil y el catálogo/storefront.

## 3. Lógica de Producción (El Motor del Sistema)
La panadería NO produce pan por pan, produce por "Amasijos" (Batches) y cuenta por "Latas". La base de datos y la lógica del backend deben soportar esta conversión matemática:

1. **Unidad Base de Inventario (Normalización):** Toda la materia prima se almacena en el backend en su unidad base (Libras `LB` para sólidos, Mililitros `ML` para líquidos, Unidades `UNIT` para cartones/paquetes). Si el usuario registra una compra de "1 Quintal de Harina", el backend multiplica por 100 y suma 100 LBs al inventario.

2. **Recetas por Amasijo (`Recipe`):**
   Una receta define los ingredientes exactos para un "Amasijo estándar". 
   *Ejemplo: 1 Amasijo de Francés = 50lb harina, 2lb levadura, 1lb sal, 3lb manteca.*

3. **Rendimiento y Empaquetado (`unitsPerTray`):**
   El producto final (ej. Pan Francés) tiene configurado cuántas unidades caben en 1 Lata (Ej. 36 unidades).

4. **Flujo de Producción (Automatizado):**
   Cuando el `MANAGER` registra que salieron "33 latas de Pan Francés de 1 Amasijo":
   - El sistema RESTA la materia prima del amasijo de la bodega.
   - El sistema SUMA los panes a la sala de ventas (`33 latas * 36 unidades = 1188 panes`).

## 4. Lógica de Ventas (Punto de Venta)
- **Tamaños:** Los tamaños diferentes (Ej. Pan dulce grande vs pequeño) son `Products` distintos en la base de datos para no cruzar inventarios.
- **Precios por Volumen (Combos):** Los productos tienen precios individuales y precios de promoción. 
  *Ejemplo: El pan dulce vale Q0.50 c/u, pero si llevan 3 vale Q1.25. El modelo de datos soporta `basePrice`, `comboQuantity` y `comboPrice`.*

## 5. Control de Fechas de Caducidad
Solo aplica para "Productos de Reventa" comprados a proveedores (Ej. Jugos, Lácteos). Al registrar un movimiento de entrada (`COMPRA`) de estos productos, se guardará una fecha de caducidad opcional. Un `Cron Job` en NestJS revisará estas fechas para emitir alertas tempranas en el Dashboard.

## 6. Estado Actual (Actualizado — Marzo 2026)

### ✅ Base de Datos
- **Refactorización del `schema.prisma` COMPLETADA.**
- 16 modelos Prisma con 10 migraciones aplicadas.
- Roles alineados: `CUSTOMER`, `ADMIN`, `MANAGER`, `BAKER`, `CASHIER`.
- Materia Prima (`RawMaterial`) con unidades normalizadas (`BaseUnit`).
- Recetas (`Recipe`, `RecipeIngredient`) y producción (`ProductionLog`).
- Combos de precio (`basePrice`, `comboQuantity`, `comboPrice`).
- Auditoría (`AuditLog`), dispositivos confiables (`TrustedDevice`), intentos de login (`LoginAttempt`).

### ✅ Backend (NestJS)
- **19 módulos completamente implementados:** Auth, Products, Categories, Branches, Users, Addresses, Orders, Inventory, StockMovements, Dashboard, Health, Metrics, Storage (Appwrite), Supabase, Audit, Recipes, Production, RawMaterials, Prisma.
- **44+ endpoints** documentados en Swagger (`/docs`).
- Seguridad: Helmet, CORS, Rate Limiting (ThrottlerModule), JWT con Access+Refresh tokens, bcrypt.
- Compilación TypeScript sin errores.

### ✅ Frontend (Next.js 16)
- **22+ pages/rutas:** Landing, Productos, Carrito, Checkout, Login, Registro, Perfil, Pedidos, Sucursales, Admin (Dashboard, Productos, Categorías, Usuarios, Órdenes, Inventario, Producción, Sucursales, Configuración, Historial de Auditoría).
- **11 componentes UI:** badge, breadcrumbs, button, captcha, card, confirm-dialog, dropdown-menu, global-search, input, product-image, toast.
- **3 componentes de layout:** Navbar, Footer, LayoutWrapper.
- **5 hooks personalizados:** use-branches, use-categories, use-orders, use-products + barrel export.
- **3 contexts:** AuthContext, CartContext, ToastContext.
- **15 servicios de API** en `src/lib/api/` con cliente HTTP, transformadores, y tipos.
- Features: combo badges ("3x Q1.25"), toggles de visibilidad (isActive/isAvailable), roles operativos granulares.
- Build exitoso con 0 errores.

### 🔜 Próximos Pasos
1. Módulo de Producción para el Panadero (BAKER): pantalla en `/admin/produccion` con formulario de registro de horneado.
2. Cron Job de alertas de caducidad.
3. Optimización de rendimiento y SEO.
4. Testing E2E.