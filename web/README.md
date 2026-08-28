# Panadería Svetlana — Frontend Web

Frontend del sistema operativo de una panadería de dos sucursales, construido con Next.js 16 (App Router) y React 19. Incluye catálogo, carrito, retiro en sucursal, inventario, producción, cierre diario y alertas operativas; no incluye POS, pagos en tienda ni delivery.

## Stack
- **Next.js 16** — App Router, Server/Client Components
- **React 19** — UI library
- **TypeScript 5** — Tipado estático
- **Tailwind CSS v3** — Framework de utilidades CSS
- **shadcn/ui + Radix UI** — Componentes accesibles
- **Sentry** — Monitoreo de errores
- **hCaptcha** — Protección de formularios
- **Recharts** — Gráfica compacta para el panel Operación
- **Sonner** — Notificaciones toast
- **Lucide React** — Iconografía

## Desarrollo local

```powershell
cd web
npm ci
npm run dev
```
Abre http://localhost:3000

## Variables de entorno

Crear `web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Presentaciones comerciales

El catálogo permite seleccionar presentaciones como `Tira completa` y `Media tira`. El carrito y checkout envían la presentación seleccionada; el precio mostrado corresponde a esa presentación y no al precio base por pieza.

El flujo administrativo de conteo de inventario y cierre diario permite capturar presentaciones y piezas sueltas. Consulta [`documentation/planeacion/PRESENTACIONES_PRODUCTO.md`](../documentation/planeacion/PRESENTACIONES_PRODUCTO.md) para las reglas funcionales.

Desde Configuración, el administrador puede activar `Catálogo solo informativo`. En ese modo el público sigue viendo productos y precios, pero se ocultan los botones de compra, el carrito y el checkout; las reservas también quedan bloqueadas en la API.

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
│   ├── checkout/                # Reserva para retirar en sucursal
│   ├── pedidos/                 # Historial de pedidos
│   ├── perfil/                  # Perfil del usuario
│   ├── sucursales/              # Mapa de sucursales
│   ├── contacto/                # Página de contacto
│   ├── sobre-nosotros/          # Acerca de
│   ├── cookies/                 # Política de cookies
│   ├── privacidad/              # Política de privacidad
│   ├── terminos/                # Términos y condiciones
│   ├── auth/                    # Rutas de callback de auth
│   └── admin/                   # Panel administrativo
│       ├── page.tsx             # Panel Operación principal
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
│   │   ├── users.ts             # Servicio de usuarios
│   │   ├── inventory.ts         # Servicio de inventario
│   │   ├── admin.service.ts     # Servicios admin (productos)
│   │   ├── production.service.ts # Servicio de producción
│   │   ├── audit.ts             # Servicio de auditoría
│   │   ├── transformers.ts      # Transformadores API → Frontend
│   │   ├── types.ts             # Tipos de respuesta API
│   │   └── index.ts             # Barrel export
│   ├── constants.ts             # Constantes (moneda GTQ, rutas y pedidos)
│   ├── utils.ts                 # Utilidades (formatPrice, formatDate)
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
| `npm run start` | Ejecutar build de producción |
| `npm run lint` | Ejecutar ESLint |

## Roles y Navegación

| Rol | Acceso |
|-----|--------|
| `CUSTOMER` | Catálogo, carrito, checkout, pedidos, perfil |
| `ADMIN` | Todo + Panel admin completo |
| `MANAGER` | Panel admin: pedidos, inventario, producción, transferencias y cierre diario de ambas sucursales |
| `BAKER` | Módulo de producción |

---
Última actualización: Agosto 2026
