# 📱 Manual de Desarrollo Web - PanaderIA

## 📋 Índice
1. [Estado Actual del Proyecto](#estado-actual)
2. [Tecnologías Implementadas](#tecnologías-implementadas)
3. [Estructura del Proyecto Web](#estructura-del-proyecto)
4. [Componentes Creados](#componentes-creados)
5. [Configuración de Guatemala](#configuración-guatemala)
6. [Gestión del Proyecto](#gestión-del-proyecto)
7. [Roadmap de Desarrollo](#roadmap)
8. [Problemas Resueltos](#problemas-resueltos)

---

## 🎯 Estado Actual del Proyecto {#estado-actual}

### ✅ Completado (Fase 1 - Configuración Inicial)

#### 1. Proyecto Next.js Inicializado
- ✅ Next.js 16.0.1 con App Router
- ✅ TypeScript configurado
- ✅ Tailwind CSS v3 instalado y funcionando
- ✅ ESLint configurado
- ✅ Estructura de carpetas `src/` implementada
- ✅ Sistema de alias `@/*` configurado

#### 2. Dependencias Instaladas
```json
{
  "dependencies": {
    "next": "16.0.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@radix-ui/react-slot": "^1.1.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5",
    "lucide-react": "^0.469.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^3.4.17",
    "postcss": "^8",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "16.0.1"
  }
}
```

#### 3. Página Principal (Landing Page)
- ✅ Hero Section con branding de panadería
- ✅ Sección de beneficios (envío, frescura)
- ✅ Grid de 4 productos destacados
- ✅ Navbar simple con navegación
- ✅ Footer con información de contacto
- ✅ Diseño responsive (mobile-first)

---

## 🛠️ Tecnologías Implementadas {#tecnologías-implementadas}

### Frontend Framework
- **Next.js 16.0.1**: Framework React con App Router
- **React 19**: Biblioteca UI (sin React Compiler)
- **TypeScript 5**: Tipado estático

### Estilos y UI
- **Tailwind CSS v3**: Framework de utilidades CSS
- **shadcn/ui**: Sistema de componentes (Button implementado)
- **Radix UI**: Primitivos accesibles para componentes

### Utilidades
- **clsx**: Composición condicional de clases CSS
- **tailwind-merge**: Merge inteligente de clases Tailwind
- **class-variance-authority**: Variantes de componentes
- **lucide-react**: Iconos (preparado, no usado aún)

---

## 📁 Estructura del Proyecto Web {#estructura-del-proyecto}

```
web/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # ✅ Landing page (COMPLETADA)
│   │   └── globals.css        # ✅ Estilos globales Tailwind
│   │
│   ├── components/
│   │   └── ui/
│   │       └── button.tsx     # ✅ Componente Button shadcn/ui
│   │
│   ├── lib/
│   │   ├── utils.ts           # ✅ Utilidades (formatPrice, formatDate)
│   │   └── constants.ts       # ✅ Constantes globales (GTQ, rutas, envío)
│   │
│   ├── types/
│   │   └── index.ts           # ✅ Interfaces TypeScript
│   │
│   └── hooks/                 # Hooks personalizados (vacío)
│
├── public/                    # Archivos estáticos
├── tailwind.config.ts         # ✅ Configuración Tailwind con tema
├── postcss.config.js          # ✅ Configuración PostCSS
├── tsconfig.json              # Configuración TypeScript
├── next.config.ts             # Configuración Next.js
├── package.json               # Dependencias del proyecto
└── .eslintrc.json            # Configuración ESLint
```

---

## 🧩 Componentes Creados {#componentes-creados}

### 1. Button Component (`src/components/ui/button.tsx`)

Componente base de shadcn/ui con 6 variantes:

```typescript
<Button variant="default">Botón Normal</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="outline">Contorno</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="ghost">Fantasma</Button>
<Button variant="link">Enlace</Button>

// Tamaños disponibles
<Button size="default">Normal</Button>
<Button size="sm">Pequeño</Button>
<Button size="lg">Grande</Button>
<Button size="icon">Solo Icono</Button>
```

**Ubicación**: `src/components/ui/button.tsx`

---

## 🇬🇹 Configuración de Guatemala {#configuración-guatemala}

### Constantes Globales (`src/lib/constants.ts`)

```typescript
// Moneda
export const CURRENCY = {
  code: 'GTQ',
  symbol: 'Q',
  name: 'Quetzal Guatemalteco'
}

// Configuración Regional
export const LOCALE = 'es-GT'
export const TIMEZONE = 'America/Guatemala'

// Envío
export const SHIPPING = {
  baseFee: 15.00,              // Q15 tarifa base
  freeShippingThreshold: 100.00, // Gratis desde Q100
  minOrderAmount: 25.00         // Pedido mínimo Q25
}

// Rutas de Navegación
export const ROUTES = {
  home: '/',
  products: '/productos',
  cart: '/carrito',
  checkout: '/checkout',
  orders: '/pedidos',
  profile: '/perfil',
  admin: '/admin'
}
```

### Funciones de Formato (`src/lib/utils.ts`)

```typescript
// Formatear precios en Quetzales
formatPrice(25.50)  // → "Q 25.50"
formatPrice(100)    // → "Q 100.00"

// Formatear fechas en español guatemalteco
formatDate(new Date())  // → "11 de noviembre de 2025"
```

---

## 🎮 Gestión del Proyecto {#gestión-del-proyecto}

### Comandos Disponibles

```powershell
# Navegar al proyecto web
cd web

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000

# Compilar para producción
npm run build

# Ejecutar versión de producción
npm start

# Linting
npm run lint
```

### Variables de Entorno (Pendiente)

Crear archivo `.env.local` en `/web/`:

```env
# API Backend (cuando se implemente)
NEXT_PUBLIC_API_URL=http://localhost:4000

# Base de Datos (para Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/panaderia

# Autenticación (JWT)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# MongoDB (Analytics)
MONGODB_URI=mongodb://localhost:27017/panaderia-analytics
```

### Estructura de Archivos por Crear

```
src/
├── app/
│   ├── productos/          # Página de productos
│   ├── carrito/           # Carrito de compras
│   ├── checkout/          # Proceso de pago
│   ├── perfil/            # Perfil de usuario
│   ├── admin/             # Panel administrativo
│   └── api/               # API Routes de Next.js
│
├── components/
│   ├── ui/                # Componentes base (shadcn/ui)
│   ├── layout/            # Navbar, Footer, Sidebar
│   ├── products/          # ProductCard, ProductGrid
│   ├── cart/              # CartItem, CartSummary
│   └── forms/             # Formularios reutilizables
│
├── lib/
│   ├── api/               # Funciones de API
│   ├── hooks/             # Hooks personalizados
│   └── validations/       # Schemas de validación (Zod)
│
└── context/               # Context API (carrito, usuario)
```

---

## 🗺️ Roadmap de Desarrollo {#roadmap}

### ✅ Fase 1: Configuración Inicial (COMPLETADA)
- [x] Setup de Next.js 16 con TypeScript
- [x] Configuración de Tailwind CSS v3
- [x] Instalación de shadcn/ui y dependencias
- [x] Creación de utilidades para Guatemala (GTQ)
- [x] Componente Button base
- [x] Landing Page básica
- [x] Configuración de constantes y tipos

---

### 🔄 Fase 2: Componentes UI Core (SIGUIENTE)

**Estimado: 2-3 días**

#### 2.1 Layout Components
- [ ] `Navbar` completo con:
  - Logo y navegación
  - Buscador de productos
  - Carrito con contador
  - Menú de usuario
  - Selector de sucursal
- [ ] `Footer` mejorado con:
  - Enlaces rápidos
  - Redes sociales
  - Newsletter
  - Políticas y términos
- [ ] `Sidebar` para admin/dashboard

#### 2.2 Product Components
- [ ] `ProductCard` - Tarjeta de producto
- [ ] `ProductGrid` - Grid responsive de productos
- [ ] `ProductDetail` - Vista detallada de producto
- [ ] `ProductFilters` - Filtros y búsqueda
- [ ] `CategoryBadge` - Badge de categoría

#### 2.3 UI Components (shadcn/ui)
- [ ] `Input` - Campos de texto
- [ ] `Select` - Selector dropdown
- [ ] `Card` - Contenedor de tarjeta
- [ ] `Badge` - Etiquetas
- [ ] `Dialog` - Modal
- [ ] `DropdownMenu` - Menú desplegable
- [ ] `Form` - Sistema de formularios
- [ ] `Toast` - Notificaciones

---

### 📦 Fase 3: Páginas Principales (3-4 días)

#### 3.1 Catálogo de Productos
- [ ] `/productos` - Página de productos
  - Grid de productos con paginación
  - Filtros por categoría, precio
  - Búsqueda en tiempo real
  - Ordenamiento (precio, popularidad, nuevo)
- [ ] `/productos/[id]` - Detalle de producto
  - Galería de imágenes
  - Descripción completa
  - Selector de cantidad
  - Productos relacionados
  - Reviews y calificaciones

#### 3.2 Carrito y Checkout
- [ ] `/carrito` - Carrito de compras
  - Lista de productos
  - Actualizar cantidades
  - Eliminar items
  - Resumen de costos
  - Código de descuento
- [ ] `/checkout` - Proceso de compra
  - Formulario de envío
  - Selección de método de pago
  - Resumen de pedido
  - Confirmación

#### 3.3 Autenticación
- [ ] `/login` - Inicio de sesión
- [ ] `/registro` - Registro de usuario
- [ ] `/recuperar-contraseña` - Recuperación
- [ ] Integración con NextAuth.js
- [ ] OAuth (Google, Facebook - opcional)

---

### 👤 Fase 4: Área de Usuario (2-3 días)

- [ ] `/perfil` - Perfil de usuario
  - Información personal
  - Direcciones guardadas
  - Métodos de pago
- [ ] `/pedidos` - Historial de pedidos
  - Lista de pedidos
  - Detalle de cada pedido
  - Estado de envío
  - Reordenar
- [ ] `/favoritos` - Productos favoritos
- [ ] Notificaciones y preferencias

---

### 🔧 Fase 5: Panel Administrativo (5-7 días)

#### 5.1 Dashboard
- [ ] `/admin` - Dashboard principal
  - Estadísticas de ventas
  - Gráficas de rendimiento
  - Productos más vendidos
  - Pedidos recientes
  - Alertas de inventario

#### 5.2 Gestión de Productos
- [ ] `/admin/productos` - Lista de productos
- [ ] `/admin/productos/nuevo` - Crear producto
- [ ] `/admin/productos/[id]` - Editar producto
- [ ] `/admin/categorias` - Gestión de categorías
- [ ] `/admin/inventario` - Control de stock

#### 5.3 Gestión de Pedidos
- [ ] `/admin/pedidos` - Lista de pedidos
- [ ] `/admin/pedidos/[id]` - Detalle de pedido
- [ ] Actualización de estados
- [ ] Asignación de repartidores

#### 5.4 Gestión de Usuarios
- [ ] `/admin/clientes` - Lista de clientes
- [ ] `/admin/empleados` - Gestión de empleados
- [ ] Roles y permisos

#### 5.5 Gestión Multi-Sucursal
- [ ] `/admin/sucursales` - Lista de sucursales
- [ ] `/admin/sucursales/[id]` - Detalle de sucursal
- [ ] Transferencias entre sucursales
- [ ] Reportes por sucursal

#### 5.6 Reportes y Analytics
- [ ] `/admin/reportes` - Centro de reportes
  - Ventas por período
  - Productos más vendidos
  - Clientes frecuentes
  - Rendimiento por sucursal
- [ ] Exportación a PDF/Excel

---

### 🔌 Fase 6: Integración Backend (4-5 días)

#### 6.1 Setup de API
- [ ] Configurar cliente HTTP (Axios/Fetch)
- [ ] Interceptores para auth
- [ ] Manejo de errores global
- [ ] Loading states

#### 6.2 Context y Estado Global
- [ ] Context de Autenticación
- [ ] Context de Carrito
- [ ] Context de Sucursal
- [ ] Zustand/Redux (opcional)

#### 6.3 Conexión con Backend
- [ ] Endpoints de productos
- [ ] Endpoints de pedidos
- [ ] Endpoints de autenticación
- [ ] Endpoints de usuario
- [ ] WebSockets para notificaciones en tiempo real

---

### 📱 Fase 7: Optimización y PWA (2-3 días)

- [ ] Optimización de imágenes (Next Image)
- [ ] Lazy loading de componentes
- [ ] Server Components vs Client Components
- [ ] SEO (metadata, sitemap, robots.txt)
- [ ] PWA setup (service worker, manifest)
- [ ] Caché strategies
- [ ] Lighthouse optimization

---

### 🧪 Fase 8: Testing (3-4 días)

- [ ] Unit tests (Jest + React Testing Library)
- [ ] Integration tests
- [ ] E2E tests (Playwright/Cypress)
- [ ] Accessibility testing (a11y)

---

### 🚀 Fase 9: Deploy (1-2 días)

- [ ] Build de producción
- [ ] Deploy en Vercel
- [ ] Configuración de dominios
- [ ] Variables de entorno en producción
- [ ] CI/CD con GitHub Actions
- [ ] Monitoreo (Sentry, Analytics)

---

## ⏱️ Estimación Total de Desarrollo Web

| Fase | Tiempo Estimado | Estado |
|------|----------------|--------|
| 1. Configuración Inicial | 1 día | ✅ COMPLETADA |
| 2. Componentes UI Core | 2-3 días | ⏳ Pendiente |
| 3. Páginas Principales | 3-4 días | ⏳ Pendiente |
| 4. Área de Usuario | 2-3 días | ⏳ Pendiente |
| 5. Panel Administrativo | 5-7 días | ⏳ Pendiente |
| 6. Integración Backend | 4-5 días | ⏳ Pendiente |
| 7. Optimización y PWA | 2-3 días | ⏳ Pendiente |
| 8. Testing | 3-4 días | ⏳ Pendiente |
| 9. Deploy | 1-2 días | ⏳ Pendiente |
| **TOTAL** | **23-35 días** | **4% Completado** |

---

## 🐛 Problemas Resueltos {#problemas-resueltos}

### 1. Error: React Compiler
**Problema**: Pregunta durante instalación de Next.js sobre React Compiler.  
**Solución**: Se seleccionó "NO" porque es experimental y no es necesario para este proyecto.  
**Impacto**: Ninguno, el proyecto funciona perfectamente sin él.

### 2. Error: `@apply border-border` en Tailwind
**Problema**: 
```
Cannot apply unknown utility class 'border-border'
```
**Causa**: Next.js 16 intenta usar Tailwind CSS v4 que tiene sintaxis incompatible.  
**Solución**: 
1. Desinstalar Tailwind v4
2. Instalar Tailwind CSS v3: `npm install -D tailwindcss@3 postcss autoprefixer`
3. Crear `postcss.config.js`
4. Simplificar `globals.css` eliminando `@apply`

### 3. Warnings CSS: "Unknown at rule @tailwind"
**Problema**: Warnings en el editor sobre `@tailwind`.  
**Solución**: Son solo warnings del linter CSS, no afectan la funcionalidad. Se pueden ignorar.

---

## 📚 Recursos y Referencias

### Documentación Oficial
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Documentación del Proyecto
- `1_DISEÑO_BASE_DATOS.md` - Esquema de base de datos
- `2_DISEÑO_PANTALLAS.md` - Wireframes de interfaces
- `3_CASOS_DE_USO.md` - Casos de uso del sistema
- `4_ESTRUCTURA_PROYECTO.md` - Arquitectura general

---

## 🎯 Próximos Pasos Inmediatos

1. **Crear componentes de layout** (Navbar, Footer)
2. **Implementar más componentes shadcn/ui** (Input, Card, Dialog)
3. **Crear página de productos** con grid y filtros
4. **Setup de Context API** para carrito y auth
5. **Preparar integración con backend** (API routes o cliente HTTP)

---

## 📝 Notas Importantes

### Multi-Sucursal
✅ El sistema está diseñado desde el inicio para soportar múltiples sucursales:
- Inventario independiente por local
- Empleados asignados a sucursales
- Ventas y reportes por sucursal
- Transferencias entre locales
- Dashboard consolidado para administradores

### Consideraciones de Desarrollo
- **Mobile-First**: Todos los componentes deben ser responsive
- **Accesibilidad**: Seguir estándares WCAG 2.1
- **Performance**: Optimizar con Server Components cuando sea posible
- **SEO**: Metadata en cada página
- **Internacionalización**: Preparado para es-GT, extensible a otros idiomas

---

**Fecha de Creación**: 11 de noviembre de 2025  
**Última Actualización**: 11 de noviembre de 2025  
**Versión**: 1.0.0
