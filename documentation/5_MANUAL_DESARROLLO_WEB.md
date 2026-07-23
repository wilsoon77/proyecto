# Manual de Desarrollo Web - Panaderia Svetlana

## Índice
1. [Estado Actual del Proyecto](#estado-actual)
2. [Tecnologías Implementadas](#tecnologias-implementadas)
3. [Estructura del Proyecto Web](#estructura-del-proyecto)
4. [Componentes Creados](#componentes-creados)
5. [Configuración de Guatemala](#configuracion-guatemala)
6. [Gestión del Proyecto](#gestion-del-proyecto)
7. [Roadmap de Desarrollo](#roadmap)
8. [Problemas Resueltos](#problemas-resueltos)

---

## Estado Actual del Proyecto {#estado-actual}

### Completado (Múltiples Fases)

#### 1. Proyecto Next.js Completo
- Next.js 16.1.6 con App Router
- React 19.2.0
- TypeScript configurado
- Tailwind CSS v3.4.18 instalado y funcionando
- ESLint 9 configurado (eslint.config.mjs)
- Estructura de carpetas `src/` implementada
- Sistema de alias `@/*` configurado
- Sentry integrado para monitoreo de errores
- hCaptcha para protección de formularios

#### 2. Dependencias Actuales
```json
{
  "dependencies": {
    "next": "^16.1.6",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "@hcaptcha/react-hcaptcha": "^2.0.2",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-slot": "^1.2.4",
    "@sentry/nextjs": "^10.39.0",
    "@supabase/ssr": "^0.8.0",
    "@supabase/supabase-js": "^2.93.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.553.0",
    "recharts": "^3.7.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.4.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^3.4.18",
    "postcss": "^8.5.6",
    "autoprefixer": "^10.4.22",
    "eslint": "^9",
    "eslint-config-next": "16.0.1"
  }
}
```

#### 3. Páginas Implementadas (22+)
- Landing page completa (Hero, beneficios, productos destacados)
- Catálogo de productos con filtros y búsqueda
- Carrito de compras
- Checkout
- Login y Registro (con hCaptcha)
- Recuperación de contraseña
- Perfil de usuario
- Historial de pedidos
- Sucursales
- Contacto, Sobre nosotros, Promociones
- Páginas legales (cookies, privacidad, términos)
- Panel Admin completo (dashboard, productos, categorías, usuarios, órdenes, inventario, producción, sucursales, configuración, historial de auditoría)

---

## Tecnologías Implementadas {#tecnologias-implementadas}

### Frontend Framework
- **Next.js 16.1.6**: Framework React con App Router
- **React 19.2**: Biblioteca UI
- **TypeScript 5**: Tipado estático

### Estilos y UI
- **Tailwind CSS v3.4**: Framework de utilidades CSS
- **shadcn/ui**: Sistema de componentes (11 componentes implementados)
- **Radix UI**: Primitivos accesibles (dropdown-menu, slot)
- **Recharts**: Gráficos interactivos en dashboard admin
- **Sonner**: Notificaciones toast

### Seguridad y Monitoreo
- **@sentry/nextjs**: Monitoreo de errores en producción
- **@hcaptcha/react-hcaptcha**: Protección de formularios

### Integración Backend
- **@supabase/ssr + @supabase/supabase-js**: Cliente Supabase
- **Cliente HTTP personalizado**: En `src/lib/api/client.ts` con interceptores, refresh automático de tokens

### Utilidades
- **clsx**: Composición condicional de clases CSS
- **tailwind-merge**: Merge inteligente de clases Tailwind
- **class-variance-authority**: Variantes de componentes
- **lucide-react**: Iconografía moderna (usado activamente)

---

## Estructura del Proyecto Web {#estructura-del-proyecto}

```
web/
├── src/
│   ├── app/                    # App Router de Next.js (22+ rutas)
│   │   ├── layout.tsx         # Layout raíz
│   │   ├── page.tsx           # Landing page
│   │   ├── globals.css        # Estilos globales Tailwind
│   │   ├── login/             # Inicio de sesión
│   │   ├── registro/          # Registro
│   │   ├── productos/         # Catálogo
│   │   ├── carrito/           # Carrito
│   │   ├── checkout/          # Checkout
│   │   ├── pedidos/           # Historial
│   │   ├── perfil/            # Perfil
│   │   ├── sucursales/        # Sucursales
│   │   └── admin/             # Panel admin (9 sub-rutas)
│   │
│   ├── components/
│   │   ├── ui/                # 11 componentes (badge, breadcrumbs, button, captcha, card, confirm-dialog, dropdown-menu, global-search, input, product-image, toast)
│   │   ├── auth/              # Componentes de autenticación
│   │   ├── filters/           # Filtros de productos
│   │   ├── layout/            # Navbar, Footer, LayoutWrapper
│   │   └── products/          # Componentes de productos
│   │
│   ├── context/               # Context API
│   │   ├── AuthContext.tsx    # Autenticación global
│   │   ├── CartContext.tsx    # Carrito de compras
│   │   └── ToastContext.tsx   # Notificaciones
│   │
│   ├── hooks/                 # 5 hooks personalizados
│   │   ├── use-branches.ts
│   │   ├── use-categories.ts
│   │   ├── use-orders.ts
│   │   └── use-products.ts
│   │
│   ├── lib/
│   │   ├── api/               # 15 archivos de servicios API
│   │   │   ├── client.ts      # Cliente HTTP con interceptores
│   │   │   ├── auth.ts        # Servicio de autenticación
│   │   │   ├── products.ts    # Servicio de productos
│   │   │   ├── transformers.ts # Transformadores API -> Frontend
│   │   │   ├── types.ts       # Tipos de respuesta API
│   │   │   └── ...            # +10 servicios más
│   │   ├── utils.ts           # Utilidades (formatPrice, formatDate)
│   │   ├── constants.ts       # Constantes (GTQ, rutas)
│   │   ├── mock.ts            # Datos mock
│   │   ├── audit-helpers.ts   # Helpers de auditoría
│   │   ├── device-fingerprint.ts # Fingerprint
│   │   └── supabase/          # Cliente Supabase
│   │
│   ├── types/
│   │   └── index.ts           # Interfaces TypeScript
│   │
│   └── instrumentation.ts    # Configuración Sentry
│
├── public/                    # Archivos estáticos
├── tailwind.config.ts         # Configuración Tailwind con tema
├── components.json            # Configuración shadcn/ui
├── next.config.ts             # Configuración Next.js
├── eslint.config.mjs          # Configuración ESLint 9
├── vercel.json                # Configuración Vercel
├── sentry.*.config.ts         # Configuración Sentry
├── tsconfig.json              # Configuración TypeScript
└── package.json               # Dependencias del proyecto
```

---

## Configuración de Guatemala {#configuracion-guatemala}

### Constantes Globales (`src/lib/constants.ts`)

```typescript
// Configuración de moneda
export const CURRENCY = {
  code: 'GTQ',
  symbol: 'Q',
  name: 'Quetzal Guatemalteco',
} as const

// Configuración de pedidos (solo reserva / recoger en sucursal)
export const ORDER_CONFIG = {
  country: 'Guatemala',
  minOrderAmount: 15.00, // Pedido mínimo Q15
} as const

// Configuración regional
export const LOCALE = {
  language: 'es-GT',
  timezone: 'America/Guatemala',
  country: 'GT',
} as const

// Rutas de la aplicación
export const ROUTES = {
  home: '/',
  products: '/productos',
  product: (slug: string) => `/productos/${slug}`,
  categories: '/categorias',
  category: (slug: string) => `/categorias/${slug}`,
  cart: '/carrito',
  checkout: '/checkout',
  promotions: '/promociones',
  about: '/sobre-nosotros',
  contact: '/contacto',
  branches: '/sucursales',
  privacy: '/privacidad',
  terms: '/terminos',
  cookies: '/cookies',
  orders: '/pedidos',
  order: (id: string) => `/pedidos/${id}`,
  profile: '/perfil',
  login: '/login',
  register: '/registro',
} as const
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

## Gestión del Proyecto {#gestion-del-proyecto}

### Comandos Disponibles

```powershell
# Navegar al proyecto web
cd web

# Instalar dependencias
corepack enable
pnpm install --frozen-lockfile

# Iniciar servidor de desarrollo
pnpm run dev
# → http://localhost:3000

# Compilar para producción
pnpm run build

# Ejecutar versión de producción
pnpm run start

# Linting
pnpm run lint
```

### Variables de Entorno

Crear archivo `.env.local` en `/web/`:

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> **Nota:** El frontend no conecta directamente a la base de datos. Toda la comunicación es vía la API de NestJS. No se usa NextAuth ni MongoDB.

### Estructura Implementada

Ver la estructura completa en `web/README.md`. Los directorios principales que ya existen:
- `app/` — 22+ rutas (productos, carrito, checkout, perfil, admin con 9 sub-módulos, etc.)
- `components/` — 5 carpetas (ui, auth, filters, layout, products)
- `context/` — 3 contexts (Auth, Cart, Toast)
- `hooks/` — 5 hooks personalizados
- `lib/api/` — 15 servicios de API

---

## Roadmap de Desarrollo {#roadmap}

### Fase 1: Configuración Inicial (COMPLETADA)
- [x] Setup de Next.js 16 con TypeScript
- [x] Configuración de Tailwind CSS v3
- [x] Instalación de shadcn/ui y dependencias
- [x] Creación de utilidades para Guatemala (GTQ)
- [x] 11 componentes UI base
- [x] Landing Page completa
- [x] Configuración de constantes y tipos
- [x] Sentry integrado
- [x] hCaptcha configurado

---

### Fase 2: Componentes UI Core (COMPLETADA)

#### 2.1 Layout Components (Completado)
- [x] `Navbar` completo (logo, navegación, buscador, carrito, menú usuario)
- [x] `Footer` con enlaces rápidos y políticas
- [x] `LayoutWrapper` para consistencia
- [x] Layout admin con sidebar

#### 2.2 Product Components (Completado)
- [x] Componentes de productos en `components/products/`
- [x] Filtros en `components/filters/`
- [x] `ProductImage` optimizado

#### 2.3 UI Components (shadcn/ui) (Completado)
- [x] `Input`, `Card`, `Badge`, `DropdownMenu`, `Toast`, `Button`, `Captcha`, `Breadcrumbs`, `ConfirmDialog`, `GlobalSearch`

---

### Fase 3: Páginas Principales (COMPLETADA)

#### 3.1 Catálogo de Productos (Completado)
- [x] `/productos` - Catálogo con filtros, búsqueda, paginación
- [x] Detalle de producto

#### 3.2 Carrito y Checkout (Completado)
- [x] `/carrito` - Carrito con Context API
- [x] `/checkout` - Proceso de compra

#### 3.3 Autenticación (Completado)
- [x] `/login` - Inicio de sesión con JWT
- [x] `/registro` - Registro con hCaptcha
- [x] `/forgot-password` - Recuperación
- [x] `/reset-password` - Restablecimiento
- [x] Autenticación JWT propia (no NextAuth)

---

### Fase 4: Área de Usuario (COMPLETADA)

- [x] `/perfil` - Perfil de usuario
- [x] `/pedidos` - Historial de pedidos
- [ ] Favoritos (pendiente)
- [ ] Notificaciones en tiempo real (pendiente)

---

### Fase 5: Panel Administrativo (COMPLETADA)

#### 5.1 Dashboard (Completado)
- [x] `/admin` - Dashboard con estadísticas, gráficos (Recharts), pedidos recientes

#### 5.2 Gestión de Productos (Completado)
- [x] `/admin/productos` - CRUD completo
- [x] `/admin/categorias` - Gestión de categorías
- [x] `/admin/inventario` - Control de stock

#### 5.3 Gestión de Pedidos (Completado)
- [x] `/admin/ordenes` - Lista y gestión de pedidos

#### 5.4 Gestión de Usuarios (Completado)
- [x] `/admin/usuarios` - CRUD con roles (MANAGER, BAKER, CASHIER)

#### 5.5 Gestión Multi-Sucursal (Completado)
- [x] `/admin/sucursales` - Gestión de sucursales

#### 5.6 Producción y Auditoría (Completado)
- [x] `/admin/produccion` - Registro de producción
- [x] `/admin/historial` - Historial de auditoría
- [x] `/admin/configuracion` - Configuración

#### 5.6 Reportes y Analytics
- [ ] `/admin/reportes` - Centro de reportes
  - Ventas por período
  - Productos más vendidos
  - Clientes frecuentes
  - Rendimiento por sucursal
- [ ] Exportación a PDF/Excel

---

### Fase 6: Integración Backend (COMPLETADA)

#### 6.1 Setup de API (Completado)
- [x] Cliente HTTP personalizado (`lib/api/client.ts`) con Fetch API
- [x] Interceptores para refresh automático de tokens
- [x] Manejo de errores global

#### 6.2 Context y Estado Global (Completado)
- [x] AuthContext (autenticación JWT)
- [x] CartContext (carrito con localStorage)
- [x] ToastContext (notificaciones)

#### 6.3 Conexión con Backend (Completado)
- [x] 15 servicios de API (auth, products, categories, branches, orders, addresses, users, inventory, production, audit, admin, transformers, types)
- [ ] WebSockets para tiempo real (pendiente)

---

### Fase 7: Optimización y PWA (2-3 días)

- [ ] Optimización de imágenes (Next Image)
- [ ] Lazy loading de componentes
- [ ] Server Components vs Client Components
- [ ] SEO (metadata, sitemap, robots.txt)
- [ ] PWA setup (service worker, manifest)
- [ ] Caché strategies
- [ ] Lighthouse optimization

---

### Fase 8: Testing (3-4 días)

- [ ] Unit tests (Jest + React Testing Library)
- [ ] Integration tests
- [ ] E2E tests (Playwright/Cypress)
- [ ] Accessibility testing (a11y)

---

### Fase 9: Deploy (1-2 días)

- [ ] Build de producción
- [ ] Deploy en Vercel
- [ ] Configuración de dominios
- [ ] Variables de entorno en producción
- [ ] CI/CD con GitHub Actions
- [ ] Monitoreo (Sentry, Analytics)

---

## Estado de Desarrollo Web

| Fase | Estado |
|------|--------|
| 1. Configuración Inicial | Completada |
| 2. Componentes UI Core | Completada (11 componentes) |
| 3. Páginas Principales | Completada (22+ páginas) |
| 4. Área de Usuario | Completada (perfil, pedidos) |
| 5. Panel Administrativo | Completada (9 sub-módulos) |
| 6. Integración Backend | Completada (15 servicios API) |
| 7. Optimización y PWA | Parcial (Sentry, imágenes optimizadas) |
| 8. Testing | Pendiente |
| 9. Deploy | Parcial (Vercel configurado) |
| **Progreso Total** | **~75% Completado** |

---

## Problemas Resueltos {#problemas-resueltos}

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
2. Instalar Tailwind CSS v3: `pnpm add -D tailwindcss@3 postcss autoprefixer`
3. Crear `postcss.config.js`
4. Simplificar `globals.css` eliminando `@apply`

### 3. Warnings CSS: "Unknown at rule @tailwind"
**Problema**: Warnings en el editor sobre `@tailwind`.  
**Solución**: Son solo warnings del linter CSS, no afectan la funcionalidad. Se pueden ignorar.

---

## Recursos y Referencias

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

## Próximos Pasos

1. **Módulo de Producción para BAKER** — Pantalla táctil para registrar horneos
2. **Testing E2E** — Playwright o Cypress
3. **Optimización SEO** — Metadata, sitemap, robots.txt
4. **PWA** — Service worker, manifest
5. **WebSockets** — Notificaciones en tiempo real

---

## Notas Importantes

### Multi-Sucursal
El sistema está diseñado desde el inicio para soportar múltiples sucursales:
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
**Última Actualización**: 23 de marzo de 2026  
**Versión**: 2.0.0
