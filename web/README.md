# Panadería Svetlana — Frontend Web

Frontend del sistema ERP/POS para panaderías, construido con Next.js 16 (App Router) y React 19.

## Stack
- **Next.js 16** — App Router, Server/Client Components
- **React 19** — UI library
- **TypeScript 5** — Tipado estático
- **Tailwind CSS v3** — Framework de utilidades CSS
- **shadcn/ui + Radix UI** — Componentes accesibles
- **Sentry** — Monitoreo de errores
- **hCaptcha** — Protección de formularios
- **Recharts** — Gráficos para dashboard admin
- **Sonner** — Notificaciones toast
- **Lucide React** — Iconografía

## Desarrollo local

```powershell
cd web
npm install
npm run dev
```
Abre http://localhost:3000

## Variables de entorno

Crear `web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Estructura del proyecto

```
web/src/
├── app/                          # App Router
│   ├── layout.tsx               # Layout raíz
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Estilos globales Tailwind
│   ├── login/                   # Inicio de sesión
│   ├── registro/                # Registro de usuario
│   ├── forgot-password/         # Recuperar contraseña
│   ├── reset-password/          # Restablecer contraseña
│   ├── productos/               # Catálogo de productos
│   ├── carrito/                 # Carrito de compras
│   ├── checkout/                # Proceso de pago
│   ├── pedidos/                 # Historial de pedidos
│   ├── perfil/                  # Perfil del usuario
│   ├── sucursales/              # Mapa de sucursales
│   ├── contacto/                # Página de contacto
│   ├── sobre-nosotros/          # Acerca de
│   ├── promociones/             # Promociones
│   ├── cookies/                 # Política de cookies
│   ├── privacidad/              # Política de privacidad
│   ├── terminos/                # Términos y condiciones
│   ├── auth/                    # Rutas de callback de auth
│   └── admin/                   # Panel administrativo
│       ├── page.tsx             # Dashboard principal
│       ├── layout.tsx           # Layout con sidebar admin
│       ├── productos/           # CRUD de productos
│       ├── categorias/          # Gestión de categorías
│       ├── usuarios/            # Gestión de usuarios
│       ├── ordenes/             # Gestión de pedidos
│       ├── inventario/          # Control de inventario
│       ├── produccion/          # Registro de producción
│       ├── sucursales/          # Gestión de sucursales
│       ├── configuracion/       # Configuración del sistema
│       └── historial/           # Historial de auditoría
│
├── components/
│   ├── ui/                      # 11 componentes base (shadcn/ui)
│   │   ├── badge.tsx
│   │   ├── breadcrumbs.tsx
│   │   ├── button.tsx
│   │   ├── captcha.tsx
│   │   ├── card.tsx
│   │   ├── confirm-dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── global-search.tsx
│   │   ├── input.tsx
│   │   ├── product-image.tsx
│   │   └── toast.tsx
│   ├── auth/                    # Componentes de autenticación
│   ├── filters/                 # Filtros de productos
│   ├── layout/                  # Navbar, Footer, LayoutWrapper
│   └── products/                # Componentes de productos
│
├── context/                     # Context API
│   ├── AuthContext.tsx          # Autenticación global
│   ├── CartContext.tsx          # Carrito de compras
│   └── ToastContext.tsx         # Notificaciones
│
├── hooks/                       # Hooks personalizados
│   ├── use-branches.ts          # Datos de sucursales
│   ├── use-categories.ts        # Datos de categorías
│   ├── use-orders.ts            # Datos de pedidos
│   └── use-products.ts          # Datos de productos
│
├── lib/
│   ├── api/                     # 15 servicios de API
│   │   ├── client.ts            # Cliente HTTP con interceptores
│   │   ├── auth.ts              # Servicio de autenticación
│   │   ├── products.ts          # Servicio de productos
│   │   ├── categories.ts        # Servicio de categorías
│   │   ├── branches.ts          # Servicio de sucursales
│   │   ├── orders.ts            # Servicio de pedidos
│   │   ├── addresses.ts         # Servicio de direcciones
│   │   ├── users.ts             # Servicio de usuarios
│   │   ├── inventory.ts         # Servicio de inventario
│   │   ├── admin.service.ts     # Servicios admin (productos)
│   │   ├── production.service.ts # Servicio de producción
│   │   ├── audit.ts             # Servicio de auditoría
│   │   ├── transformers.ts      # Transformadores API → Frontend
│   │   ├── types.ts             # Tipos de respuesta API
│   │   └── index.ts             # Barrel export
│   ├── constants.ts             # Constantes (moneda GTQ, rutas, envío)
│   ├── utils.ts                 # Utilidades (formatPrice, formatDate)
│   ├── mock.ts                  # Datos mock para desarrollo
│   ├── audit-helpers.ts         # Helpers de auditoría
│   ├── device-fingerprint.ts    # Fingerprint de dispositivos
│   └── supabase/                # Cliente Supabase
│
├── types/
│   └── index.ts                 # Tipos TypeScript del frontend
│
└── instrumentation.ts           # Configuración de Sentry
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (localhost:3000) |
| `npm run build` | Build de producción |
| `npm start` | Ejecutar build de producción |
| `npm run lint` | Ejecutar ESLint |

## Roles y Navegación

| Rol | Acceso |
|-----|--------|
| `CUSTOMER` | Catálogo, carrito, checkout, pedidos, perfil |
| `ADMIN` | Todo + Panel admin completo |
| `MANAGER` | Panel admin (sin configuración avanzada) |
| `BAKER` | Módulo de producción |
| `CASHIER` | POS (punto de venta) |

---
Última actualización: Marzo 2026
