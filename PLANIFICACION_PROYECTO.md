# Sistema de Gestion para Panaderia - Proyecto de Graduacion

## RESUMEN EJECUTIVO

**Nombre del Proyecto:** Panaderia Svetlana Smart System  
**Tipo:** Aplicacion Web Adaptable (PWA)  
**Objetivo:** Sistema integral de gestion para panaderias con automatizacion inteligente  

---

## ALCANCE DEL PROYECTO

### Funcionalidades Principales
1. **Tienda en Linea y Catalogo Publico**
   - Catalogo de productos con busqueda y filtros
   - Carrito de compras
   - Reserva de pedidos para recogida en tienda (sin envios a domicilio)

2. **Gestion Administrativa**
   - Inventario de productos terminados por sucursal
   - Insumos y materia prima con conversion de unidades de compra a unidades base
   - Control transaccional de produccion diaria (recetas por amasijo y latas)
   - Dashboard operativo multi-sucursal

3. **Sistema de Clientes**
   - Registro, inicio de sesion y perfiles de cliente
   - Historial de reservas de pedidos
   - Direcciones de facturacion y contacto

4. **IA y Automatizacion**
   - Prediccion de demanda de productos terminados para sugerencia de produccion diaria
   - Recomendaciones personalizadas de productos en la tienda en linea
   - Chatbot inteligente de atencion al cliente para FAQs y asistencia

---

## ARQUITECTURA TECNOLOGICA

### FRONTEND
- **Aplicacion Web Responsive y PWA (Progressive Web App):**
  - Framework: Next.js 14+ (React 18)
  - SSR y SSG para SEO optimo y carga veloz
  - App Router
  - Tailwind CSS y shadcn/ui para el sistema de diseno responsivo
  - Zustand para el estado global ligero del cliente
  - React Query para la sincronizacion de datos con el servidor
  - PWA: Service Workers y manifiesto de aplicacion web para hacer la aplicacion instalable en dispositivos moviles (Android/iOS) y permitir funcionalidad basica sin conexion.

### BACKEND
- **API y Servidor:**
  - Framework: NestJS
  - TypeScript nativo, arquitectura modular y documentacion con Swagger/OpenAPI
  - Autenticacion mediante JWT (Access Token y Refresh Token con rotacion)
  - Seguridad: Helmet.js, CORS, limitacion de tasa (Rate Limiting) y hasheo de contrasenas con bcrypt
  - Comunicacion en tiempo real: WebSockets

### BASE DE DATOS
- **Base de Datos Principal: PostgreSQL (Supabase)**
  - ACID compliance para transacciones seguras (critico para la produccion transaccional y reservas)
  - ORM: Prisma para tipado completo y migraciones controladas
  - No se utiliza base de datos complementaria (sin MongoDB) ni capa de cache externa (sin Redis) para mantener la infraestructura simple y sostenible.

### ALMACENAMIENTO DE ARCHIVOS
- **Almacenamiento en la Nube (Cloudinary)**
  - Imagenes de productos e insumos
  - Optimizacion automatica de imagenes

---

## SISTEMA DE NOTIFICACIONES
- **Email Service:**
  - Resend o similar para confirmacion de reservas y alertas administrativas.
- **Push Notifications:**
  - Web Push API nativa del navegador para dispositivos moviles y de escritorio (gracias al manifiesto PWA), evitando dependencias externas complejas.
- **SMS / Twilio:**
  - No se implementa canal de SMS por costos y simplificacion de flujo.

---

## INTELIGENCIA ARTIFICIAL

### Analisis y Prediccion
1. **Prediccion de Demanda:**
   - Time Series Forecasting para sugerencia automatica de produccion basada en ventas historicas.
2. **Sistema de Recomendaciones:**
   - Algoritmo colaborativo y basado en contenido para secciones de "Te puede gustar" en la tienda web.
3. **Chatbot Inteligente:**
   - Integracion con API de OpenAI o similar para resolver dudas frecuentes sobre sucursales, horarios, productos y pedidos.

---

## INFRAESTRUCTURA Y DEPLOYMENT
- **Hosting Frontend:** Vercel
- **Hosting Backend (API):** Render o Railway
- **Base de Datos:** Supabase (PostgreSQL)
- **CI/CD:** GitHub Actions
- **Monitoreo:** Sentry para tracking de errores en produccion

---

## CRONOGRAMA Y METODOLOGIA (Scrum Hibrido)

### Fase de Incepcion y Requisitos (Mayo - Junio 2026)
- Levantamiento de requerimientos y casos de uso.
- Diseno base de datos y mockups de pantallas en Figma.
- Aprobacion del alcance y consolidacion de la documentacion inicial.

### Fase de Desarrollo y Ejecucion (Julio - Octubre 2026)
La ejecucion se divide en 8 Sprints de 2 semanas cada uno:

* **Sprint 1 (Julio - Semanas 1 y 2): Setup & Backend Core**
  - Inicializacion de repositorio, configuracion del monorepo.
  - Setup de NestJS, conexion a PostgreSQL via Prisma.
  - Implementacion de autenticacion JWT y seguridad base.

* **Sprint 2 (Julio - Semanas 3 y 4): Modulo de Catalogo y Productos**
  - CRUD de productos y categorias en panel administrativo.
  - Integracion con Cloudinary para subida de imagenes.
  - Frontend: Landing page y catalogo responsive publico.

* **Sprint 3 (Agosto - Semanas 1 y 2): Inventario y Materia Prima**
  - Implementacion de insumos (RawMaterial) y RawMaterialInventory.
  - Logica de conversion de unidades de compra a unidades base.
  - Flujo de movimientos de inventario de producto terminado.

* **Sprint 4 (Agosto - Semanas 3 y 4): Produccion Diaria Transaccional**
  - Implementacion del modulo de recetas por amasijo (Recipe y RecipeIngredient).
  - Desarrollo del servicio de ProductionLog con transacciones ACID para descontar ingredientes e incrementar stock terminado en una sola operacion atomica.

* **Sprint 5 (Septiembre - Semanas 1 y 2): Reservas y Checkout**
  - Carrito de compras web y flujo de reservas de pedidos.
  - Integracion de checkout con seleccion de sucursal y fecha/hora de recogida.
  - Notificaciones por email y push para confirmacion de pedidos.

* **Sprint 6 (Septiembre - Semanas 3 y 4): Modulo Administrativo y Dashboard**
  - Panel Kanban para la gestion y entrega de reservas en tienda.
  - KPIs operativos y graficos estadisticos del dashboard multi-sucursal.
  - Historico de auditoria y logs del sistema.

* **Sprint 7 (Octubre - Semanas 1 y 2): Integracion de IA y PWA**
  - Implementacion de algoritmos de sugerencia de produccion y recomendacion en la tienda.
  - Configuracion de Service Workers, manifiesto de app web y cache local para soporte PWA.
  - Pruebas unitarias y de integracion.

* **Sprint 8 (Octubre - Semanas 3 y 4): Testing, Deployment y Entrega**
  - Pruebas e2e completas y auditoria de seguridad.
  - Despliegue final en produccion (Vercel + Railway/Render + Supabase).
  - Preparacion de manuales tecnicos y presentacion final de tesis.

---

## COSTOS ESTIMADOS (Fase de Desarrollo)
- Vercel (Hosting Web): Plan Gratuito
- Supabase (PostgreSQL): Plan Gratuito (Free Tier)
- Render/Railway (API): Plan Gratuito / Bajo Costo (~$5-7/mes)
- Cloudinary (Almacenamiento de Imagenes): Plan Gratuito
- Resend (Emailing): Plan Gratuito
- Dominio: ~$10-15/ano
**Costo total desarrollo: ~$10-25**

---

## STACK TECNOLOGICO
- **Frontend Web & PWA:** Next.js 14+, React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand, React Query, Zod.
- **Backend API:** NestJS, TypeScript, Prisma, PostgreSQL (Supabase), WebSockets.
- **Herramientas DevOps & Calidad:** Docker, GitHub Actions, Sentry, Vitest.

---

## VALOR ACADÉMICO PARA GRADUACION
- **Arquitectura de Software Profesional:** Aplicacion de diseno modular, transacciones ACID, y uso de APIs RESTful seguras.
- **Innovacion con Inteligencia Artificial:** Integracion de modelos predictivos y de recomendacion orientados a la optimizacion de un negocio real.
- **Adaptabilidad Movil Sostenible:** Uso de Progressive Web App (PWA) para garantizar un enfoque multi-dispositivo sin incurrir en costos de tiendas nativas.
- **Gestion de Datos Complejos:** Conversion automatica de unidades de peso/volumen y produccion por latas/amasijos (logica de negocio no generica).
