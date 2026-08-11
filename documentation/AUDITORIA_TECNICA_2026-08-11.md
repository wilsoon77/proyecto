# Auditoría Técnica — Panadería Svetlana

> Fecha: 11 de agosto de 2026
> Alcance: carpetas `api/` (NestJS + Prisma + PostgreSQL), `web/` (Next.js 16 + BFF) y `documentation/`.
> Tipo: auditoría de solo lectura. No se modificó código.

---

## Resumen Ejecutivo

El proyecto se encuentra en un estado de madurez **notablemente alto** para su alcance (panadería con dos sucursales, pedidos para retiro, producción y control de inventario). La arquitectura BFF con cookies HttpOnly, las transacciones serializables con reintentos, el control de lotes FEFO y la máquina de estados de pedidos son puntos fuertes poco comunes en proyectos de este tamaño.

Los hallazgos más relevantes se concentran en:

1. **Inconsistencia semántica en `OrderItem.quantity`** (unidades físicas vs. cantidad de presentaciones) que rompe el invariante `quantity × unitPrice = total de línea`. — **Alta prioridad**
2. **Doble almacenamiento de contraseñas** (Supabase Auth + hash bcrypt local) con una espera arbitraria de 500 ms que introduce condiciones de carrera. — **Alta prioridad**
3. **Precio de combos (`comboQuantity`/`comboPrice`) definido en el esquema pero no aplicado en `reserve()`**, con posible discrepancia de cobro. — **Alta prioridad**
4. Protección del panel `/admin` únicamente en el cliente (`ProtectedRoute`), sin gating en el middleware/proxy. — **Media**
5. Sitemap estático sin URLs de productos y ausencia de `og:image` / JSON-LD de producto. — **Media (SEO)**

| Área | Calificación |
|---|---|
| Seguridad | 8 / 10 |
| SEO | 6.5 / 10 |
| Entidad-Relación | 8.5 / 10 |
| Esquema Prisma | 8 / 10 |
| Coherencia | 7 / 10 |
| Buenas prácticas | 7.5 / 10 |
| Lógica de negocio | 7.5 / 10 |

---

## 1. Seguridad

### 1.1 Fortalezas verificadas

- **BFF con cookies HttpOnly** (`web/src/lib/auth/bff.ts`): los tokens nunca tocan JavaScript del navegador; el cliente (`lib/api/client.ts`) lo documenta y lo cumple. Excelente decisión.
- **CSRF de doble envío** (cookie `panaderia_csrf` + header `x-csrf-token`) reforzado con validación de `Origin` y `Sec-Fetch-Site` en `isValidCsrfRequest`. El BFF rechaza métodos mutantes sin CSRF válido.
- **BFF bloquea rutas emisoras de tokens** (`TOKEN_ISSUING_PATHS`) y sanea segmentos de ruta (`..`, `\`). Correcto contra path traversal hacia el backend.
- **JWT de acceso a 15 min + refresh tokens rotados**, hasheados con bcrypt, con revocación individual y global (`token.service.ts`). Formato `userId.random` para lookup acotado.
- **Secreto JWT validado al arranque** (`jwt-secret.ts`): exige ≥32 caracteres en producción y solo permite fallback en CI (`SKIP_DB=1`).
- **Helmet + CORS estricto por `CORS_ORIGINS`** con fail-closed en producción; `trust proxy` configurable por `TRUST_PROXY_HOPS`.
- **Rate limiting global** con `@nestjs/throttler` como guard global en `app.module.ts`.
- **Captcha inteligente** basado en `LoginAttempt` (email/IP/dispositivo) + dispositivos de confianza (`TrustedDevice`). Buen equilibrio UX/seguridad.
- **Auditoría exhaustiva** (`AuditLog` con snapshot de `userName`, IP y user-agent) aplicada en operaciones sensibles de pedidos.
- **RLS** aplicado por migraciones (`lock_down_rls`, `lock_down_new_tables`), coherente con acceso vía Prisma con rol de servicio.
- **Aislamiento por sucursal** (`BranchScopeService`): MANAGER/CASHIER quedan acotados a su sucursal en pedidos; CUSTOMER solo ve sus propias órdenes (`detail` con `userId`).
- Respuestas de login genéricas ("Credenciales inválidas") sin revelar existencia del email; registro de intentos fallidos antes de lanzar la excepción.

### 1.2 Hallazgos y recomendaciones

| # | Severidad | Hallazgo | Recomendación |
|---|---|---|---|
| S-1 | **Alta** | **Doble almacenamiento de contraseñas**: `register()` crea el usuario en Supabase Auth **y** guarda un `passwordHash` bcrypt local. Dos sistemas de verdad para la credencial más sensible; un cambio de contraseña en un lado puede divergir del otro. | Elegir una sola fuente: o Supabase Auth verifica contraseñas (y el hash local desaparece), o la API es dueña de la credencial y Supabase solo se usa para OAuth. |
| S-2 | **Alta** | `register()` usa `await new Promise(resolve => setTimeout(resolve, 500))` para esperar el trigger de Supabase (`on_auth_user_created`). Es una condición de carrera latente: en momentos de latencia el flujo toma la rama incorrecta. | Reemplazar la espera fija por reintentos con backoff sobre `findUnique`, o eliminar la dependencia del trigger creando el registro localmente con `upsert` idempotente (como ya se hace en el flujo OAuth con manejo de `P2002`). |
| S-3 | Media | Usuarios OAuth se crean con `passwordHash: ''` (string vacío) sobre una columna `String` obligatoria. Aunque `bcrypt.compare` devuelve `false` ante un hash vacío, es un estado ambiguo que depende del comportamiento de la librería. | Hacer `passwordHash` nullable (`String?`) y rechazar explícitamente el login con contraseña cuando sea `null` ("Esta cuenta usa Google/OAuth"). |
| S-4 | Media | El panel `/admin` solo está protegido del lado cliente (`ProtectedRoute.tsx`); `proxy.ts` refresca la sesión de Supabase pero no bloquea rutas. Los datos están protegidos por la API, pero el shell del admin se sirve a cualquiera y hay "flash" de contenido. | Añadir gating en `proxy.ts` (o en `admin/layout.tsx` como Server Component) verificando la cookie `panaderia_access` y el rol antes de renderizar, con redirect a `/login`. |
| S-5 | Media | `validateRefreshToken` ejecuta `bcrypt.compare` en bucle sobre todos los tokens vigentes del usuario. Con muchas sesiones abiertas, cada refresh cuesta N comparaciones bcrypt (~100 ms c/u): vector de agotamiento de CPU. | Hashear el refresh token con SHA-256 (es aleatorio de 256 bits, no necesita bcrypt) y buscar por igualdad exacta indexada. Es el patrón estándar y elimina el bucle. |
| S-6 | Media | `next.config.ts` solo define headers para `/sw.js`. Faltan headers de seguridad base en el sitio desplegado: `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/CSP. El BFF solo añade `nosniff` a sus propias respuestas. | Añadir un bloque `headers()` global en `next.config.ts` con HSTS, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y `X-Frame-Options: SAMEORIGIN`; considerar CSP en modo report-only como primer paso. |
| S-7 | Media | Swagger puede quedar activo en producción vía `SWAGGER_ENABLED=true`; el propio código lo marca como "temporal para pruebas". Expone la superficie completa de la API. | Confirmar que en producción la variable está en `false` (o ausente) y proteger `/docs` con autenticación básica si se necesita en staging. |
| S-8 | Baja | `ValidationPipe` con `forbidNonWhitelisted: false`: los campos extra se descartan en silencio. Aceptable, pero oculta errores de integración. | Activar `forbidNonWhitelisted: true` al menos fuera de producción. |
| S-9 | Baja | El refresh token expone el `userId` en claro dentro de la cookie (`{userId}.{random}`). El id es un cuid poco sensible, pero es información gratuita para un atacante. | Con la migración a SHA-256 (S-5) el prefijo deja de ser necesario. |
| S-10 | Baja | `LoginAttempt`, `RefreshToken` expirados y `AuditLog` crecen sin política de retención (solo existe el cron de inventario y el de tareas cada 10 min). | Añadir un job de purga (p. ej. `LoginAttempt` > 90 días, refresh tokens expirados > 30 días). |
| S-11 | Baja | `org: "wilson-exe"` y `project` de Sentry hardcodeados en `next.config.ts`; `tunnelRoute: "/monitoring"` está bien. | Mover a variables de entorno para portabilidad. |

---

## 2. SEO

### 2.1 Fortalezas

- `metadata` completo en `layout.tsx`: `metadataBase`, título, descripción, OpenGraph con `locale: es_GT`, Twitter card, `robots` con directivas para Googlebot, `canonical`, manifest e íconos.
- `robots.ts` y `sitemap.ts` generados por convención de App Router; `disallow` correcto de rutas privadas (`/admin`, `/api`, `/carrito`, `/checkout`...).
- JSON-LD `@type: Bakery` inyectado con escape de `<` (previene XSS en el script LD+JSON).
- `generateMetadata` dinámico en `productos/[slug]/page.tsx`.
- `lang="es-GT"`, fuentes con `display: swap`, `loading.tsx` y `error.tsx` en catálogo (buenos para Core Web Vitals y UX de rastreo).

### 2.2 Hallazgos y recomendaciones

| # | Severidad | Hallazgo | Recomendación |
|---|---|---|---|
| SEO-1 | **Media** | El **sitemap es estático**: solo 5 URLs fijas. Las fichas `productos/[slug]` —el contenido indexable más valioso— no aparecen. | Hacer `sitemap.ts` asíncrono y consultar el catálogo público de la API para incluir cada producto activo con `lastModified` (usar `updatedAt`). |
| SEO-2 | **Media** | No hay `og:image` ni `twitter:image` (card `summary` sin imagen). Los compartidos en WhatsApp/Facebook —canal clave para una panadería en Guatemala— salen sin foto. | Añadir una imagen OG de marca (1200×630) en el layout y la imagen del producto en `generateMetadata` de la ficha; subir la card a `summary_large_image`. |
| SEO-3 | Media | El JSON-LD `Bakery` solo tiene `name` y `url`. Falta `address`, `geo`, `telephone`, `openingHoursSpecification`, `servesCuisine` — lo esencial para SEO local. | Enriquecer el schema con los datos reales de `Branch` (ya existen `latitude`, `longitude`, `address`, `phone` en la BD) y emitir un `LocalBusiness`/`Bakery` por sucursal en `/sucursales`. |
| SEO-4 | Media | Sin JSON-LD `Product` (con `offers`, `price`, `priceCurrency: GTQ`, `availability`) en la ficha de producto ni `BreadcrumbList` pese a existir el componente de breadcrumbs. | Añadir ambos schemas; habilitan rich results de producto en Google. |
| SEO-5 | Baja | `NEXT_PUBLIC_SITE_URL` cae a `http://localhost:3000` si falta la variable: un despliegue mal configurado publicaría sitemap/canonicals con localhost. | Fallar el build (o loguear error) en producción si la variable no está definida. |
| SEO-6 | Baja | Páginas estáticas (`/sobre-nosotros`, `/sucursales`, `/contacto`, legales) sin `metadata` propio verificable por página; heredan el título global. | Exportar `metadata` específico por página con títulos y descripciones únicos. |

---

## 3. Modelo Entidad-Relación

### 3.1 Fortalezas

El modelo es coherente con el dominio real de una panadería y está bien comentado en el propio schema:

- **Cadena completa de trazabilidad**: `RawMaterial` → `RecipeIngredient` → `Recipe` → `ProductionLog` → `StockMovement` → `Inventory`/`InventoryLot` → `InventoryLotConsumption`. Se puede reconstruir qué lote alimentó qué venta.
- **Normalización de unidades** inteligente: compra en `UnitOfPurchase` (quintal, arroba, galón, cartón) convertida a `BaseUnit` (LB/ML/UNIT) — refleja el negocio guatemalteco real.
- **`Inventory` como resumen + `InventoryLot` para FEFO** con `sourceType` (incluida `TRANSFERENCIA` que preserva caducidad entre sucursales). Diseño maduro.
- **Snapshots desnormalizados correctos**: `OrderItem.productName`, `DailyCloseItem.productName`, `AuditLog.userName`, `presentationName/Units` — los documentos históricos sobreviven a cambios/borrados del catálogo.
- **`DailyClose` con `@@unique([branchId, closeDate])`**: imposible duplicar el cierre de una jornada.
- Constraints únicos bien colocados: `[productId, branchId]`, `[recipeId, rawMaterialId]`, `[userId, deviceId]`, `[branchId, alertType, resourceKey]`.

### 3.2 Hallazgos y recomendaciones

| # | Severidad | Hallazgo | Recomendación |
|---|---|---|---|
| ER-1 | **Alta** | **Sobrecarga semántica en `OrderItem`**: en `reserve()` se guarda `quantity = stockQuantity` (unidades físicas) pero `unitPrice` es el precio **por presentación**, y el subtotal se calcula como `unitPrice × cantidad de presentaciones`. Resultado: para items con presentación, `quantity × unitPrice ≠ total de línea`. Cualquier reporte, reembolso o re-cálculo que lea `OrderItem` directamente producirá montos incorrectos. | Definir el invariante y ser consistente: `quantity` = presentaciones vendidas (unidad comercial), y las unidades físicas ya viven en `presentationQuantity × presentationUnits`. Alternativamente, añadir `lineTotal` persistido. Documentarlo en el schema. |
| ER-2 | Media | `Branch` y `Category` no tienen `isActive`. No se puede retirar una sucursal o categoría sin romper relaciones históricas. | Añadir soft-delete (`isActive`) siguiendo el patrón ya usado en `Product`, `Recipe` y `RawMaterial`. |
| ER-3 | Media | `Order` no persiste la fecha límite de la reserva (el auto-cancelado a 2 h vive solo en configuración + cron). Si cambia la config, cambia retroactivamente el vencimiento de pedidos ya creados. | Persistir `expiresAt` en `Order` al momento de reservar. |
| ER-4 | Baja | `Order.paymentMethod` es `String?` libre. | Convertir a enum (`EFECTIVO`, `TARJETA`, ...) para integridad y reportes. |
| ER-5 | Baja | `Order.discount` existe pero ningún flujo lo usa (siempre 0). Campo muerto o funcionalidad pendiente. | Decidir: implementar descuentos (combos, ER-Neg-1) o documentar que está reservado. |
| ER-6 | Baja | `ProductImage` no tiene unique en `[productId, position]` ni `onDelete` explícito desde `Product`. | Añadir `@@unique([productId, position])` y política de borrado. |

---

## 4. Esquema Prisma (implementación)

### 4.1 Fortalezas

- `directUrl` separado del pooler para migraciones — correcto para Supabase/Neon.
- **Índices deliberados y comentados** alineados a los queries reales: `[isActive, isAvailable]`, `[type, createdAt]`, `[branchId, expiresAt]`, `[userId, isRead]`, etc.
- Dinero en `Decimal(10,2)` y costos en `Decimal(10,4)`; cantidades de materia prima en `Decimal(12,4)`. Nada de floats para dinero.
- Políticas `onDelete` pensadas caso por caso: `Cascade` en dependientes puros (tokens, notificaciones, lotes), `SetNull` donde el histórico debe sobrevivir (`AuditLog.userId`, `presentationId` en items).
- 22 migraciones con nombres descriptivos que narran la evolución del proyecto, incluida la reducción de alcance (`reduce_scope_remove_forecasting`).

### 4.2 Hallazgos

| # | Severidad | Hallazgo | Recomendación |
|---|---|---|---|
| P-1 | Media | `User.passwordHash String` obligatorio choca con el flujo OAuth (ver S-3). | `String?` + validación explícita. |
| P-2 | Baja | `AuditLog.details` es `String @db.Text` conteniendo JSON. Pierde queryabilidad (`->>`, índices GIN). | Migrar a `Json`, como ya se hace en `SystemConfig.value` y `Notification.metadata`. |
| P-3 | Baja | `SystemConfig.type` y `category`, `NotificationConfig.category`, `AuditLog.action/entity` son strings libres donde el resto del schema usa enums. | Convertir a enums los dominios cerrados. |
| P-4 | Baja | Las constantes de conversión de `UnitOfPurchase` (QUINTAL=100 LB, GALON=3785 ML, CARTON=30 UNIT) viven solo en comentarios y en el backend. | Centralizarlas en un único módulo exportado y testeado (parece existir; confirmar que no hay duplicación entre API y web). |
| P-5 | Baja | Prisma 5.19 con NestJS 10, mientras `@nestjs/passport` está en v11 (mayor desalineada con el resto del ecosistema Nest 10). | Alinear majors de NestJS y planificar upgrade a Prisma 6.x. |

---

## 5. Coherencia (código ↔ código, código ↔ documentación)

### 5.1 Fortalezas

- `api/ANALISIS_ENDPOINTS.md` (actualizado agosto 2026) declara explícitamente el alcance vigente y lo que **no** existe (POS, forecasting, delivery) — coincide con la migración `reduce_scope_remove_forecasting` y con el código. Ejemplar.
- La documentación es abundante y estructurada (diseño de BD, pantallas, casos de uso, pruebas de seguridad, manual de desarrollo, auditoría previa 2026-07-17).
- El flujo pickup-only está reflejado de punta a punta: migración `pickup_only_orders`, máquina de estados `order-state.ts`, y descripciones Swagger.

### 5.2 Hallazgos

| # | Severidad | Hallazgo | Recomendación |
|---|---|---|---|
| C-1 | Media | `documentation/ANALITICA_PREDICCIONES.md` (405 líneas) documenta un módulo de analítica/forecasting **eliminado** por la migración `20260810100000_reduce_scope_remove_forecasting`. Un lector nuevo asumiría que existe. | Mover a una carpeta `archive/` o añadir un banner "OBSOLETO — módulo retirado en agosto 2026". Aplicar el mismo criterio a `PLAN_BOT_TELEGRAM.md` si ya se implementó (marcar como ejecutado). |
| C-2 | Media | **Triple proveedor de infraestructura**: Supabase (auth), Appwrite (storage de imágenes según `next.config.ts` y `node-appwrite` en la API) y PostgreSQL. La documentación no explica claramente esta división y `4_ESTRUCTURA_PROYECTO.md` debería ser la fuente de verdad. | Añadir un diagrama "quién provee qué" y justificar Appwrite vs. Supabase Storage (o consolidar en uno). |
| C-3 | Media | `web/src/lib/mock.ts` con `MOCK_PRODUCTS` sigue en el bundle de producción como fallback. Riesgo de mostrar catálogo falso ante un fallo silencioso de la API. | Restringir el fallback a `NODE_ENV !== 'production'` o eliminarlo y mostrar estado de error honesto. |
| C-4 | Baja | Archivos residuales versionados: `api/test-output.txt`, `api/test_output.txt`, y scripts `test-*.mjs` sueltos en la raíz de `web/`. | Limpiar y añadir a `.gitignore`; mover scripts de prueba a `web/test/` o `scripts/`. |
| C-5 | Baja | `package-lock.json` de 86 bytes en la raíz del repo sin que exista un workspace raíz — confunde a herramientas y humanos. | Eliminarlo o formalizar workspaces (npm workspaces / turborepo). |
| C-6 | Baja | Documentos de planificación duplicados entre la raíz (`PLANIFICACION_PROYECTO.md`, `PLAN_DE_INICIO.md`, `TESTING.md`) y `documentation/`. Dos "hogares" para documentación. | Consolidar todo en `documentation/` y dejar en la raíz solo `README.md` con enlaces. |
| C-7 | Baja | Numeración duplicada en docs: existen `3_CASOS_DE_USO.md` **y** `3_PRUEBAS_SEGURIDAD.md`. | Renumerar. |

---

## 6. Buenas Prácticas

### 6.1 Fortalezas

- **Servicios orquestadores delgados**: `AuthService` delega a `TokenService`, `PasswordService`, `SessionService`, `CaptchaService` — SRP real, no solo declarado en comentarios.
- **Transacciones serializables con retry sobre `P2034`** y backoff incremental (`withSerializableRetry`) — manejo correcto de la concurrencia de inventario.
- Máquina de estados de pedidos (`assertOrderTransition`) con tests (`order-state.spec.ts`); specs presentes en los módulos críticos (auth, inventario, producción, cierre diario, asistente).
- Paginación defensiva (`Math.max(1, ...)`, tope de 100) + headers estándar (`X-Total-Count`, `Link`).
- DTOs con `class-validator`, filtros de excepción globales, logging estructurado con pino y auditoría de negocio separada del logging técnico.
- Zona horaria de negocio centralizada (`business-date.ts` + `BUSINESS_TIMEZONE` en el cron de caducidades) — evita el clásico bug de cierres a medianoche UTC.
- CI para OpenAPI (`openapi:gen` con `SKIP_DB`), `render.yaml` para despliegue reproducible.

### 6.2 Hallazgos

| # | Severidad | Hallazgo | Recomendación |
|---|---|---|---|
| BP-1 | Media | Uso extendido de `any` en puntos críticos: `normalizeOrder(order: any)`, `const order: any`, `req: any` en todos los controladores, `where: any`. Se pierde el principal beneficio de Prisma (tipos generados). | Tipar `req.user` con una interfaz `AuthenticatedRequest`, usar `Prisma.OrderGetPayload<...>` en lugar de `any`, y tipar los `where` con `Prisma.OrderWhereInput`. |
| BP-2 | Media | Serialización de `Decimal` resuelta a mano por servicio (`normalizeOrder`). Cada módulo nuevo puede olvidarlo y filtrar objetos Decimal al JSON. | Centralizar en un interceptor global de serialización o en `toJSON` del cliente Prisma. |
| BP-3 | Baja | `console.log`/`console.warn` en `main.ts` conviviendo con `LoggerService` estructurado. | Usar el logger también en bootstrap. |
| BP-4 | Baja | Validación de entorno al arranque limitada al secreto JWT. `DATABASE_URL`, `CORS_ORIGINS`, claves de Supabase, VAPID, etc. fallan tarde y de forma opaca. | Validar todo el entorno con un schema (zod/joi) en el bootstrap, fail-fast con mensajes claros. |
| BP-5 | Baja | `bcryptjs` (JS puro) para hashing en servidor: ~3-5× más lento que `bcrypt` nativo, relevante en el bucle de S-5. | Migrar a `bcrypt` nativo o a `argon2id`. |
| BP-6 | Baja | El BFF reenvía solo `content-type`, `accept` y `x-request-id`; correcto y minimalista, pero no propaga `accept-language`. | Propagarlo si se planea i18n de mensajes de error. |

---

## 7. Lógica de Negocio — Mejoras Propuestas

### 7.1 Lo que está bien resuelto

- **Reserva de stock atómica**: verificación de disponibilidad (lotes vendibles − reservado), incremento de `reserved`, y validación de monto mínimo, todo dentro de una transacción serializable. El pedido nace consistente o no nace.
- **Pickup con triple verificación**: reserva suficiente, stock físico suficiente y lotes vigentes suficientes; luego decrementa, crea `StockMovement VENTA` y consume lotes FEFO con auditoría de consumo. Muy sólido.
- **Cancelación** que valida que la reserva coincida con la orden antes de liberar — detecta corrupción de datos en vez de propagarla.
- Auto-cancelación de pedidos `PENDING` vía cron cada 10 minutos + configuración (`orders.max_items`, `orders.min_amount`, `orders.accept_orders`, modo mantenimiento) administrable en `SystemConfig`.
- Alertas de caducidad con cron diario 07:00 hora de Guatemala y `AlertState` con anti-spam (`lastNotifiedAt`).

### 7.2 Mejoras recomendadas

| # | Impacto | Hallazgo | Recomendación |
|---|---|---|---|
| N-1 | **Alto** | **El precio de combo no se aplica**: el schema modela `comboQuantity`/`comboPrice` (ej. "3 × Q1.25") y el mock del front lo expone, pero `reserve()` calcula `unitPrice` solo desde `presentation.price ?? basePrice`. Un cliente que pide 3 panes franceses paga Q1.50 en lugar de Q1.25 (o el front muestra un precio y la API cobra otro). | Aplicar la regla de combo en el servidor dentro de `reserve()` (piso: `floor(qty / comboQuantity) × comboPrice + resto × basePrice`) y usar el campo `discount` ya existente para registrar el ahorro. El precio SIEMPRE debe recalcularse en el servidor. |
| N-2 | **Alto** | Corregir la semántica de `OrderItem.quantity` (ER-1) — es la base de reportes de ventas, cierre diario y cualquier conciliación futura. | Ver ER-1. Añadir test de invariante: `sum(lineTotal) = subtotal`. |
| N-3 | Medio | **La reserva no aparta lotes**: entre reservar y recoger, los lotes pueden vencer y el pickup falla con "unidades vencidas" — el cliente descubre el problema en el mostrador. | Al reservar, hacer soft-allocation FEFO (marcar cantidad reservada por lote) o, más simple, notificar proactivamente al staff cuando un lote que respalda reservas activas entra en ventana de caducidad. |
| N-4 | Medio | `Inventory.quantity` e `InventoryLot.availableQuantity` son dos fuentes de verdad actualizadas en paralelo; un bug en cualquier flujo las desincroniza silenciosamente (el código ya se defiende con `sellableLots ?? inventory.quantity`). | Job nocturno de conciliación que compare `sum(lots.availableQuantity)` vs `Inventory.quantity` por producto/sucursal y genere alerta/auditoría ante drift. |
| N-5 | Medio | Pedidos de invitados: `pedidos/page.tsx` recurre a `localStorage.lastOrder`; si el invitado borra datos o cambia de dispositivo pierde toda referencia, y no puede consultar estado por la API. | Emitir un token de seguimiento firmado (o código corto + teléfono) al crear el pedido, con endpoint público de consulta limitada (estado + sucursal, sin datos personales). |
| N-6 | Medio | El cierre diario registra `soldQty` inferido del conteo físico, pero no se concilia contra las ventas registradas (`StockMovement VENTA`) del día. | Añadir al reporte de cierre la columna "ventas del sistema vs. ventas inferidas" para detectar ventas no registradas o mermas disfrazadas. |
| N-7 | Bajo | `updateStatus` permite `PENDING → CONFIRMED → PREPARING → READY` sin registrar quién debe preparar ni tiempos; no hay timestamps por transición. | Persistir historial de transiciones (tabla `OrderStatusHistory` o reutilizar `AuditLog` con consulta dedicada) para métricas de tiempos de preparación. |
| N-8 | Bajo | `orders.min_amount` se valida después de crear la orden y sus items (se revierte por transacción, pero consume ids de secuencia y trabajo). | Validar el subtotal con los `preparedItems` antes de abrir la escritura. |
| N-9 | Bajo | `paymentMethod` llega del cliente sin validación de dominio. | Enum + validación en DTO (ver ER-4). |

---

## 8. Plan de Acción Priorizado

**Inmediato (correctitud de dinero y datos):**
1. N-1 — Aplicar precio de combo en el servidor.
2. ER-1 / N-2 — Definir y corregir el invariante de `OrderItem.quantity`.
3. S-1 / S-2 — Unificar la fuente de verdad de contraseñas y eliminar el `setTimeout(500)`.

**Corto plazo (seguridad):**
4. S-4 — Gating server-side de `/admin`.
5. S-5 / S-9 — Refresh tokens con SHA-256 y lookup indexado.
6. S-6 — Headers de seguridad globales en `next.config.ts`.
7. S-3 / P-1 — `passwordHash` nullable para OAuth.

**Mediano plazo (SEO y robustez):**
8. SEO-1 / SEO-2 — Sitemap dinámico de productos + imágenes OG.
9. SEO-3 / SEO-4 — JSON-LD enriquecido (LocalBusiness por sucursal, Product, BreadcrumbList).
10. N-4 — Job de conciliación Inventory ↔ Lotes.
11. C-1 / C-6 — Higiene documental (archivar obsoletos, consolidar en `documentation/`).

**Continuo:**
12. BP-1 / BP-2 — Erradicar `any` y centralizar serialización de Decimals.
13. S-10 — Políticas de retención de datos.

---

*Auditoría generada el 2026-08-11. Complementa y no sustituye a `AUDITORIA_TECNICA_2026-07-17.md`; los hallazgos de aquella que ya fueron resueltos (BFF, CSRF, branch scope) se reconocen aquí como fortalezas.*
