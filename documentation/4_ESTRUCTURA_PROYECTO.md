# 📁 ESTRUCTURA DEL PROYECTO - PanaderIA Smart System

## 🗂️ ARQUITECTURA GENERAL

```
proyecto-panaderia/
├── apps/
│   ├── web/              # Next.js Web App
│   ├── mobile/           # React Native Mobile App
│   ├── api/              # NestJS Backend API
│   └── ai-service/       # Python FastAPI IA Service
├── packages/
│   ├── ui/               # Componentes compartidos
│   ├── types/            # TypeScript types compartidos
│   ├── utils/            # Utilidades compartidas
│   └── config/           # Configuraciones compartidas
├── documentacion/        # Documentación del proyecto
└── infrastructure/       # Docker, CI/CD, etc.
```

---

## 🌐 ESTRUCTURA WEB APP (Next.js)

```
apps/web/
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-bg.jpg
│   │   └── products/
│   ├── fonts/
│   └── favicon.ico
│
├── src/
│   ├── app/                          # App Router (Next.js 14+)
│   │   ├── (auth)/                   # Rutas de autenticación
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Layout para auth
│   │   │
│   │   ├── (shop)/                   # Rutas de tienda (layout público)
│   │   │   ├── page.tsx              # Home/Landing
│   │   │   ├── products/
│   │   │   │   ├── page.tsx          # Catálogo
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx      # Detalle producto
│   │   │   ├── categories/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── cart/
│   │   │   │   └── page.tsx
│   │   │   ├── checkout/
│   │   │   │   ├── shipping/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── payment/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── confirmation/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx            # Layout tienda
│   │   │
│   │   ├── (customer)/               # Rutas de cliente (requiere auth)
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── addresses/
│   │   │   │   └── page.tsx
│   │   │   ├── favorites/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (admin)/                  # Rutas de administración
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── customers/
│   │   │   │   └── page.tsx
│   │   │   ├── employees/
│   │   │   │   └── page.tsx
│   │   │   ├── inventory/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── promotions/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Layout admin
│   │   │
│   │   ├── api/                      # API Routes (Next.js)
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts      # NextAuth config
│   │   │   ├── webhooks/
│   │   │   │   └── stripe/
│   │   │   │       └── route.ts
│   │   │   └── upload/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── error.tsx                 # Error boundary
│   │   ├── loading.tsx               # Loading UI
│   │   ├── not-found.tsx             # 404 page
│   │   └── globals.css               # Global styles
│   │
│   ├── components/                   # Componentes React
│   │   ├── ui/                       # Componentes base (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (más componentes shadcn)
│   │   │
│   │   ├── layout/                   # Componentes de layout
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── breadcrumb.tsx
│   │   │
│   │   ├── products/                 # Componentes de productos
│   │   │   ├── product-card.tsx
│   │   │   ├── product-grid.tsx
│   │   │   ├── product-filters.tsx
│   │   │   ├── product-gallery.tsx
│   │   │   ├── product-info.tsx
│   │   │   └── related-products.tsx
│   │   │
│   │   ├── cart/                     # Componentes de carrito
│   │   │   ├── cart-item.tsx
│   │   │   ├── cart-summary.tsx
│   │   │   ├── cart-drawer.tsx
│   │   │   └── coupon-input.tsx
│   │   │
│   │   ├── checkout/                 # Componentes de checkout
│   │   │   ├── shipping-form.tsx
│   │   │   ├── payment-form.tsx
│   │   │   ├── order-summary.tsx
│   │   │   └── checkout-steps.tsx
│   │   │
│   │   ├── orders/                   # Componentes de pedidos
│   │   │   ├── order-card.tsx
│   │   │   ├── order-status.tsx
│   │   │   ├── order-tracking.tsx
│   │   │   └── order-timeline.tsx
│   │   │
│   │   ├── admin/                    # Componentes admin
│   │   │   ├── stats-card.tsx
│   │   │   ├── chart-wrapper.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── kanban-board.tsx
│   │   │   └── file-upload.tsx
│   │   │
│   │   └── common/                   # Componentes comunes
│   │       ├── search-bar.tsx
│   │       ├── pagination.tsx
│   │       ├── rating.tsx
│   │       ├── badge.tsx
│   │       ├── loading-spinner.tsx
│   │       └── empty-state.tsx
│   │
│   ├── lib/                          # Librerías y utilidades
│   │   ├── api/                      # Cliente API
│   │   │   ├── client.ts             # Axios/Fetch configurado
│   │   │   ├── products.ts           # API de productos
│   │   │   ├── orders.ts             # API de pedidos
│   │   │   ├── auth.ts               # API de autenticación
│   │   │   ├── cart.ts               # API de carrito
│   │   │   └── users.ts              # API de usuarios
│   │   │
│   │   ├── hooks/                    # Custom React Hooks
│   │   │   ├── use-cart.ts
│   │   │   ├── use-auth.ts
│   │   │   ├── use-products.ts
│   │   │   ├── use-orders.ts
│   │   │   ├── use-debounce.ts
│   │   │   ├── use-local-storage.ts
│   │   │   └── use-media-query.ts
│   │   │
│   │   ├── store/                    # Zustand stores
│   │   │   ├── cart-store.ts
│   │   │   ├── auth-store.ts
│   │   │   ├── ui-store.ts
│   │   │   └── filters-store.ts
│   │   │
│   │   ├── validations/              # Schemas de validación (Zod)
│   │   │   ├── auth.ts
│   │   │   ├── product.ts
│   │   │   ├── order.ts
│   │   │   └── user.ts
│   │   │
│   │   ├── utils/                    # Funciones utilitarias
│   │   │   ├── format.ts             # Formateo (fecha, precio, etc)
│   │   │   ├── cn.ts                 # Tailwind merge
│   │   │   ├── api-error.ts          # Manejo de errores
│   │   │   └── constants.ts          # Constantes
│   │   │
│   │   └── auth/                     # Configuración de autenticación
│   │       ├── next-auth.ts          # NextAuth config
│   │       └── auth-options.ts
│   │
│   ├── types/                        # TypeScript types
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── user.ts
│   │   ├── cart.ts
│   │   ├── api.ts
│   │   └── index.ts
│   │
│   └── styles/                       # Estilos
│       └── globals.css               # Tailwind + custom CSS
│
├── .env.local                        # Variables de entorno
├── .env.example                      # Ejemplo de variables
├── next.config.js                    # Configuración Next.js
├── tailwind.config.ts                # Configuración Tailwind
├── tsconfig.json                     # Configuración TypeScript
├── package.json
├── .eslintrc.json                    # ESLint config
├── .prettierrc                       # Prettier config
└── README.md
```

---

## 📱 ESTRUCTURA MOBILE APP (React Native + Expo)

```
apps/mobile/
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── src/
│   ├── app/                          # Expo Router
│   │   ├── (tabs)/                   # Bottom tabs
│   │   │   ├── index.tsx             # Home
│   │   │   ├── catalog.tsx           # Catálogo
│   │   │   ├── cart.tsx              # Carrito
│   │   │   ├── orders.tsx            # Pedidos
│   │   │   ├── profile.tsx           # Perfil
│   │   │   └── _layout.tsx
│   │   │
│   │   ├── (auth)/                   # Auth screens
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── _layout.tsx
│   │   │
│   │   ├── product/
│   │   │   └── [id].tsx              # Detalle producto
│   │   │
│   │   ├── checkout/
│   │   │   ├── shipping.tsx
│   │   │   ├── payment.tsx
│   │   │   └── confirmation.tsx
│   │   │
│   │   ├── order/
│   │   │   └── [id].tsx              # Detalle pedido
│   │   │
│   │   ├── _layout.tsx               # Root layout
│   │   └── +not-found.tsx
│   │
│   ├── components/                   # Componentes
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   │
│   │   ├── products/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductList.tsx
│   │   │   └── ProductFilters.tsx
│   │   │
│   │   ├── cart/
│   │   │   ├── CartItem.tsx
│   │   │   └── CartSummary.tsx
│   │   │
│   │   └── common/
│   │       ├── SearchBar.tsx
│   │       ├── Rating.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   ├── lib/
│   │   ├── api/                      # API client
│   │   ├── hooks/                    # Custom hooks
│   │   ├── store/                    # Zustand stores
│   │   ├── utils/                    # Utilities
│   │   └── constants/
│   │
│   ├── types/
│   │   └── ...
│   │
│   └── styles/
│       └── theme.ts                  # NativeWind theme
│
├── app.json                          # Expo config
├── eas.json                          # EAS Build config
├── babel.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🔧 ESTRUCTURA BACKEND API (NestJS)

```
apps/api/
├── src/
│   ├── main.ts                       # Entry point
│   │
│   ├── app.module.ts                 # Root module
│   │
│   ├── config/                       # Configuraciones
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── stripe.config.ts
│   │   ├── cloudinary.config.ts
│   │   └── redis.config.ts
│   │
│   ├── common/                       # Código compartido
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   │
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── throttle.guard.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── prisma-exception.filter.ts
│   │   │
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   │
│   │   └── dto/
│   │       ├── pagination.dto.ts
│   │       └── response.dto.ts
│   │
│   ├── modules/                      # Módulos de negocio
│   │   │
│   │   ├── auth/                     # Autenticación
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── reset-password.dto.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── google.strategy.ts
│   │   │   │   └── facebook.strategy.ts
│   │   │   └── entities/
│   │   │       └── session.entity.ts
│   │   │
│   │   ├── users/                    # Usuarios
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   │
│   │   ├── products/                 # Productos
│   │   │   ├── products.module.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-product.dto.ts
│   │   │   │   ├── update-product.dto.ts
│   │   │   │   └── filter-product.dto.ts
│   │   │   └── entities/
│   │   │       └── product.entity.ts
│   │   │
│   │   ├── categories/
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── orders/                   # Pedidos
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-order.dto.ts
│   │   │   │   └── update-order-status.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── order.entity.ts
│   │   │   │   └── order-item.entity.ts
│   │   │   └── events/
│   │   │       └── order-created.event.ts
│   │   │
│   │   ├── cart/                     # Carrito
│   │   │   ├── cart.module.ts
│   │   │   ├── cart.controller.ts
│   │   │   ├── cart.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── payments/                 # Pagos
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── stripe.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── inventory/                # Inventario
│   │   │   ├── inventory.module.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inventory.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── reviews/                  # Reseñas
│   │   │   ├── reviews.module.ts
│   │   │   ├── reviews.controller.ts
│   │   │   ├── reviews.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── promotions/               # Promociones
│   │   │   ├── promotions.module.ts
│   │   │   ├── promotions.controller.ts
│   │   │   ├── promotions.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── notifications/            # Notificaciones
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── sms.service.ts
│   │   │   └── push.service.ts
│   │   │
│   │   ├── employees/                # Empleados
│   │   │   ├── employees.module.ts
│   │   │   ├── employees.controller.ts
│   │   │   └── employees.service.ts
│   │   │
│   │   ├── analytics/                # Analítica
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── analytics.service.ts
│   │   │
│   │   ├── reports/                  # Reportes
│   │   │   ├── reports.module.ts
│   │   │   ├── reports.controller.ts
│   │   │   └── reports.service.ts
│   │   │
│   │   └── upload/                   # Subida de archivos
│   │       ├── upload.module.ts
│   │       ├── upload.controller.ts
│   │       └── cloudinary.service.ts
│   │
│   ├── prisma/                       # Prisma ORM
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── schema.prisma
│   │
│   ├── database/
│   │   ├── migrations/               # Migraciones Prisma
│   │   └── seeders/                  # Datos de prueba
│   │       ├── seed.ts
│   │       ├── users.seed.ts
│   │       └── products.seed.ts
│   │
│   └── events/                       # Event Emitters
│       └── ...
│
├── test/                             # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🤖 ESTRUCTURA AI SERVICE (Python + FastAPI)

```
apps/ai-service/
├── src/
│   ├── main.py                       # Entry point
│   │
│   ├── api/                          # API endpoints
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── predictions.py        # Predicción de demanda
│   │   │   ├── recommendations.py    # Recomendaciones
│   │   │   ├── sentiment.py          # Análisis de sentimientos
│   │   │   └── chatbot.py            # Chatbot
│   │   │
│   │   └── deps.py                   # Dependencies
│   │
│   ├── models/                       # Modelos de ML
│   │   ├── demand_forecasting/
│   │   │   ├── __init__.py
│   │   │   ├── model.py
│   │   │   ├── train.py
│   │   │   └── predict.py
│   │   │
│   │   ├── recommendations/
│   │   │   ├── __init__.py
│   │   │   ├── collaborative.py
│   │   │   └── content_based.py
│   │   │
│   │   └── sentiment/
│   │       ├── __init__.py
│   │       └── analyzer.py
│   │
│   ├── schemas/                      # Pydantic schemas
│   │   ├── prediction.py
│   │   ├── recommendation.py
│   │   └── sentiment.py
│   │
│   ├── services/                     # Business logic
│   │   ├── prediction_service.py
│   │   ├── recommendation_service.py
│   │   └── chatbot_service.py
│   │
│   ├── db/                           # Database
│   │   ├── mongodb.py                # MongoDB client
│   │   └── redis.py                  # Redis client
│   │
│   ├── utils/                        # Utilities
│   │   ├── preprocessing.py
│   │   ├── metrics.py
│   │   └── logging.py
│   │
│   └── config/                       # Configuration
│       ├── settings.py
│       └── constants.py
│
├── models/                           # Modelos pre-entrenados
│   ├── demand_model.pkl
│   └── recommender_model.pkl
│
├── data/                             # Datos para entrenamiento
│   ├── raw/
│   ├── processed/
│   └── training/
│
├── tests/
│   ├── test_predictions.py
│   └── test_recommendations.py
│
├── notebooks/                        # Jupyter notebooks
│   ├── 01_data_exploration.ipynb
│   ├── 02_model_training.ipynb
│   └── 03_evaluation.ipynb
│
├── requirements.txt
├── Dockerfile
├── .env
└── README.md
```

---

## 📦 PACKAGES COMPARTIDOS

### **packages/ui/**
```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   └── ...
│   │
│   ├── hooks/
│   └── utils/
│
├── package.json
└── tsconfig.json
```

### **packages/types/**
```
packages/types/
├── src/
│   ├── product.ts
│   ├── order.ts
│   ├── user.ts
│   └── index.ts
│
├── package.json
└── tsconfig.json
```

---

## 🐳 ESTRUCTURA DOCKER

```
infrastructure/
├── docker/
│   ├── web/
│   │   └── Dockerfile
│   ├── api/
│   │   └── Dockerfile
│   ├── ai-service/
│   │   └── Dockerfile
│   └── nginx/
│       ├── Dockerfile
│       └── nginx.conf
│
├── docker-compose.yml                # Desarrollo
├── docker-compose.prod.yml           # Producción
│
└── kubernetes/                       # Kubernetes configs (opcional)
    ├── deployments/
    ├── services/
    └── ingress/
```

---

## 📋 ARCHIVOS DE CONFIGURACIÓN RAÍZ

```
proyecto-panaderia/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI Pipeline
│       ├── deploy-web.yml            # Deploy web
│       └── deploy-api.yml            # Deploy API
│
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
│
├── .husky/                           # Git hooks
│   ├── pre-commit
│   └── pre-push
│
├── documentacion/                    # Toda la documentación
│   ├── 1_DISEÑO_BASE_DATOS.md
│   ├── 2_DISEÑO_PANTALLAS.md
│   ├── 3_CASOS_DE_USO.md
│   └── 4_ESTRUCTURA_PROYECTO.md
│
├── .gitignore
├── .prettierrc
├── .eslintrc.json
├── turbo.json                        # Si usas Turborepo
├── pnpm-workspace.yaml               # Si usas pnpm
├── package.json
├── README.md
└── LICENSE
```

---

## 🔧 SCRIPTS ÚTILES

### **package.json (raíz)**
```json
{
  "name": "panaderia-smart-system",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "cd apps/web && npm run dev",
    "dev:api": "cd apps/api && npm run start:dev",
    "dev:mobile": "cd apps/mobile && npm run start",
    "dev:ai": "cd apps/ai-service && uvicorn src.main:app --reload",
    
    "build": "turbo run build",
    "build:web": "cd apps/web && npm run build",
    "build:api": "cd apps/api && npm run build",
    
    "test": "turbo run test",
    "test:web": "cd apps/web && npm run test",
    "test:api": "cd apps/api && npm run test",
    
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    
    "db:migrate": "cd apps/api && npx prisma migrate dev",
    "db:seed": "cd apps/api && npx prisma db seed",
    "db:studio": "cd apps/api && npx prisma studio",
    
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    
    "prepare": "husky install"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

---

## 📝 CONVENCIONES DE CÓDIGO

### **Naming Conventions**
```typescript
// Archivos
product-card.tsx          // Componentes
use-cart.ts              // Hooks
product.service.ts       // Services
create-product.dto.ts    // DTOs

// Componentes
<ProductCard />          // PascalCase
<CartItem />

// Funciones
getUserById()            // camelCase
calculateTotal()

// Constantes
const MAX_ITEMS = 50     // UPPER_SNAKE_CASE
const API_BASE_URL = ''

// Interfaces/Types
interface Product {}     // PascalCase
type OrderStatus = ''
```

### **Estructura de Componente**
```typescript
// 1. Imports
import React from 'react'
import { Button } from '@/components/ui/button'

// 2. Types
interface ProductCardProps {
  product: Product
  onAddToCart: (id: string) => void
}

// 3. Component
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // 3a. Hooks
  const [isHovered, setIsHovered] = useState(false)
  
  // 3b. Handlers
  const handleClick = () => {
    onAddToCart(product.id)
  }
  
  // 3c. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

---

## ✅ CHECKLIST DE ESTRUCTURA

- [x] Separación clara de Frontend/Backend/IA
- [x] Componentes reutilizables
- [x] Types compartidos
- [x] Configuración centralizada
- [x] Testing estructura incluida
- [x] Docker setup
- [x] CI/CD workflows
- [x] Documentación organizada
- [x] Scripts de desarrollo
- [x] Convenciones definidas

**Estructura completa y lista para implementar** 🚀
