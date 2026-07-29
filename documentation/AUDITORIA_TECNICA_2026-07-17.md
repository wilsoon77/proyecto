# Auditoría técnica del monorepo — Panadería Svetlana

**Fecha:** 17 de julio de 2026  
**Alcance:** `api/` (NestJS + Prisma), `web/` (Next.js), CI/CD, configuración de despliegue y documentación.  
**Modalidad:** revisión estática, revisión de configuración y verificaciones ejecutables. La auditoría inicial no alteró el comportamiento del producto; la sección de seguimiento documenta la remediación posterior aplicada en el mismo repositorio.

## Seguimiento de implementación — 17 de julio de 2026

Como continuación de esta auditoría se implementó una primera entrega técnica. No reemplaza los hallazgos de negocio que requieren una decisión de producto; deja el repositorio listo para desplegar y continuar el hardening de forma verificable.

| Área | Estado | Cambio aplicado |
|---|---|---|
| SEC-01 OAuth | ✅ Implementado | La API recibe un bearer token y obtiene la identidad con `supabase.auth.getUser`; ya no acepta ID, email o metadatos de identidad desde el body. Incluye dos pruebas unitarias de regresión. |
| OPS-01 Render | ✅ Implementado | Se añadió `start:prod` y Render usa `npm run start:prod`. El build genera Prisma explícitamente antes de compilar. |
| Gestor de paquetes | ✅ Implementado | API y web usan npm con `package-lock.json` propio y `npm ci` en despliegues. No se creó un workspace raíz para no alterar los directorios raíz actuales de Render (`api/`) y Vercel (`web/`). |
| CI/CD | ✅ Implementado | GitHub Actions usa cache de npm, `npm ci` y generación explícita de Prisma. Vercel y Render usan los lockfiles versionados; Dependabot revisará dependencias de API, web y workflows periódicamente. |
| SEC-03 hCaptcha | ✅ Implementación condicionada | La API verifica el token contra `siteverify`. Registro lo exige cuando `HCAPTCHA_SECRET` está configurado; login lo exige después del umbral de intentos y falla cerrado en producción si falta la configuración. |
| SEC-04/05 | ✅ Implementado | JWT ya no tiene secreto por defecto, `trust proxy` se limita por saltos y Sentry no inicia sin DSN ni recoge PII/replay sin máscara. |
| SEC-06 RLS | ⚠️ Pendiente de aplicar | Se agregó una migración para las cuatro tablas omitidas; debe aplicarse en la base productiva. |
| SEC-08 uploads | ✅ Mitigación aplicada | El interceptor limita a 5 MiB, un archivo y once partes, y rechaza MIME no permitido antes de entregar el buffer al servicio. La validación de firma binaria continúa como mejora posterior. |
| SEO técnico | ✅ Implementado | `metadataBase`, canonical, Open Graph, Twitter, `robots.txt`, `sitemap.xml`, JSON-LD de `Bakery`, SSR del catálogo e ISR/SSG de las fichas de producto. |

### Verificación de esta entrega

| Verificación | Resultado |
|---|---|
| `api: npm run prisma:generate` | ✅ Genera el cliente Prisma con npm. |
| `api: npm run build` | ✅ Correcta después de generación explícita de Prisma. |
| `api: npm run openapi:gen:dist` | ✅ Correcta. |
| `api: npm run test -- auth.service.spec.ts captcha.service.spec.ts --runInBand` | ✅ 5/5 pruebas de OAuth y comportamiento fail-closed de hCaptcha. |
| `web: npm run build` | ✅ Correcta; genera 43 rutas, incluidos `robots.txt` y `sitemap.xml`. |
| `npm audit --omit=dev` | ⚠️ Pendiente de hardening mayor | La ejecución final sobre los lockfiles npm queda registrada en “Actualización final de implementación”; aún hay advisories transitivos que requieren evaluar upgrades mayores. |

### Acciones manuales antes de producción

1. En Vercel, definir `NEXT_PUBLIC_SITE_URL` con el dominio canónico y las variables de Supabase requeridas.
2. En Render, configurar `HCAPTCHA_SECRET`, `CORS_ORIGINS`, `SENTRY_DSN` (opcional) y los secretos JWT reales; no usar valores de ejemplo.
3. Ejecutar desde `api/` una vez contra producción: `npm run prisma:deploy`, para aplicar también la migración RLS nueva.
4. Probar login OAuth real, registro con captcha y el comando de arranque de Render después del despliegue.

### Pendientes que requieren decisión de negocio

- Definir cuándo una orden usa retiro en sucursal frente a entrega a domicilio; el flujo `IN_DELIVERY → DELIVERED` está preparado, pero el checkout actual reserva para retiro.
- Aportar NAP, horarios, dominios y canal de contacto reales antes de completar SEO local, schema de sucursales y formulario de contacto.
- Decidir la ventana de cancelación para pedidos `READY` y si se requieren aprobaciones o reembolsos antes de cancelar pagos confirmados.
- Definir infraestructura de pruebas de integración con PostgreSQL efímero para probar concurrencia, RLS y permisos entre sucursales fuera de mocks.

## Resumen ejecutivo

El proyecto tiene una base sólida: TypeScript estricto en el frontend, separación clara entre API y web, Prisma con migraciones, control de roles, Swagger, health/metrics, manejo transaccional serializable en producción y una cobertura funcional amplia en interfaz. Sin embargo, hay problemas que conviene resolver antes de ampliar usuarios o sucursales.

Los dos bloqueadores más urgentes son:

1. El endpoint OAuth emite tokens propios basándose en un `supabaseUserId` enviado por el cliente, sin verificar un token de Supabase. Un atacante podría suplantar una cuenta conocida.
2. Render intenta ejecutar `npm run start:prod`, pero ese script no existe en `api/package.json`; el despliegue de la API no puede arrancar con la configuración versionada.

También se identificaron riesgos altos en el almacenamiento de tokens, anti-bot, aislamiento por sucursal, integridad de inventario, dependencias vulnerables y calidad de pruebas/CI. Para SEO, el sitio tiene una base visual buena, pero el catálogo y las fichas de producto no son renderizados con contenido indexable del lado del servidor y faltan los artefactos técnicos fundamentales de descubrimiento e indexación.

### Priorización global

| Prioridad | Cantidad | Qué significa |
|---|---:|---|
| P0 — bloquear y corregir de inmediato | 2 | Riesgo de toma de cuenta o despliegue inoperante. |
| P1 — resolver en el siguiente ciclo | 9 | Riesgo alto de seguridad, datos, operación o calidad. |
| P2 — planificar a corto plazo | 6 | Impacta SEO, conversión, mantenibilidad o resiliencia. |
| P3 — higiene y evolución | 4 | Reduce deuda técnica y fricción futura. |

## Alcance y metodología

- Se revisaron la arquitectura, configuración, controladores/servicios críticos, esquema Prisma, migraciones, rutas de Next, componentes de autenticación, flujos de pedidos, CI y documentación.
- Se identificaron 96 archivos TypeScript en `api/src` y 110 archivos TypeScript/TSX en `web/src`, además de 401 archivos versionados en el repositorio.
- No se imprimieron ni se copiaron valores de archivos `.env`; estos no están versionados.
- Los hallazgos marcados como “confirmados” se sustentan en código o comandos ejecutados. Los que dependen de permisos de la base de datos están señalados explícitamente como riesgo a validar en el entorno administrado.

### Verificaciones ejecutadas

| Verificación | Resultado | Observación |
|---|---|---|
| `api: npm run build` | ✅ Correcta | TypeScript compila sin errores. |
| `web: npm run build` | ✅ Correcta | Generó 41 rutas. Requirió acceso de red para descargar Geist desde Google Fonts. |
| `web: eslint src` | ❌ 56 errores, 55 advertencias | Hay `any`, hooks con dependencias incompletas, renderizaciones en efecto y código no usado. |
| `web: npm run lint` | ⚠️ No terminó en el plazo de verificación | El script ejecuta `eslint` sin acotar el objetivo; conviene limitarlo a código fuente y hacerlo determinista. |
| `api: jest src --runInBand` | ❌ 7 fallos / 20 éxitos | El mock de producción no contempla `prisma.branch.findUnique`. |
| `api: npm test -- --runInBand` | ❌ No reproducible | Las e2e intentan conectarse a una base Supabase externa; además hay mocks e inyecciones desactualizados. |
| `npm audit --omit=dev` | ⚠️ | Esta fila conserva el resultado de la auditoría inicial; el resultado ejecutado sobre los `package-lock.json` finales está en “Actualización final de implementación”. |

## Hallazgos P0 — acción inmediata

### SEC-01 — OAuth permite suplantación de identidad

**Evidencia:** [`api/src/auth/auth.controller.ts`](../api/src/auth/auth.controller.ts) expone `POST /auth/oauth-callback` sin guardia (líneas 91–98). [`api/src/auth/auth.service.ts`](../api/src/auth/auth.service.ts) busca o crea el usuario usando `input.supabaseUserId` y después firma sus JWT (líneas 238–293). El callback de Next envía esos campos como JSON, no un token verificable, en [`web/src/app/auth/callback/route.ts`](../web/src/app/auth/callback/route.ts#L80-L89).

**Impacto:** cualquier cliente que conozca o adivine el ID de Supabase de una cuenta puede invocar la API directamente y recibir access/refresh tokens de esa cuenta. Es un riesgo de toma de cuenta.

**Acción propuesta:**

1. Deshabilitar temporalmente el endpoint y los botones OAuth hasta desplegar la validación.
2. Enviar el `access_token` de Supabase desde el callback al backend en `Authorization: Bearer ...`.
3. En la API, obtener el usuario mediante `supabase.auth.getUser(accessToken)` y derivar de ahí —nunca del body— el ID, correo y metadatos permitidos.
4. Alternativamente, convertir el flujo en una llamada interna BFF con secreto rotado y comparación en tiempo constante; la validación del token del proveedor sigue siendo preferible.
5. Añadir pruebas negativas: ID arbitrario, correo de otra cuenta, token vencido y token de otro proyecto deben devolver 401/403.

### OPS-01 — configuración de Render apunta a un script inexistente

**Evidencia:** [`api/render.yaml`](../api/render.yaml) usa `startCommand: npm run start:prod`; la guía raíz y [`GUIA_DESPLIEGUE.md`](../GUIA_DESPLIEGUE.md) lo repiten. [`api/package.json`](../api/package.json) solo define `start`, no `start:prod`.

**Impacto:** después de compilar, Render fallará al iniciar la API con la configuración versionada actual.

**Acción propuesta:** escoger una única convención y documentarla: añadir `"start:prod": "node dist/src/main.js"` o cambiar Render y las guías a `npm run start`. Añadir un smoke test de release que ejecute exactamente el comando de arranque desde `api/`.

## Hallazgos P1 — siguiente ciclo obligatorio

### SEC-02 — access y refresh tokens se exponen a JavaScript

**Evidencia:** [`web/src/lib/api/client.ts`](../web/src/lib/api/client.ts) guarda ambos tokens en `localStorage` (líneas 10–66); el callback OAuth los entrega primero en cookies con `httpOnly: false` en [`web/src/app/auth/callback/route.ts`](../web/src/app/auth/callback/route.ts#L103-L120).

**Impacto:** una vulnerabilidad XSS o una dependencia comprometida puede extraer el refresh token de larga duración y mantener la sesión. El riesgo aumenta con “recordarme por 30 días”.

**Acción propuesta:** adoptar un BFF o sesión de servidor. Mantener el refresh token solo en cookie `HttpOnly`, `Secure`, `SameSite` apropiado y con rotación; dejar el access token en memoria o usar cookies de sesión junto con mitigación CSRF. No migrar a cookies sin diseñar el modelo CSRF/CORS.

### SEC-03 — hCaptcha se muestra, pero la API no lo verifica ni lo exige

**Evidencia:** los DTO aceptan `captchaToken` en [`api/src/auth/dto/auth.dto.ts`](../api/src/auth/dto/auth.dto.ts), pero [`api/src/auth/auth.service.ts`](../api/src/auth/auth.service.ts) no lo consume en `register` ni `login`. El frontend solo impide el envío en navegador ([`web/src/app/login/page.tsx`](../web/src/app/login/page.tsx#L64-L99), [`web/src/app/registro/page.tsx`](../web/src/app/registro/page.tsx#L36-L79)).

**Impacto:** un cliente automatizado puede omitir el frontend y llamar a la API sin resolver CAPTCHA; la protección anti-bots es cosmética.

**Acción propuesta:** añadir `HCAPTCHA_SECRET` solo en API, verificar el token mediante `siteverify`, validar hostname y vigencia, y rechazar server-side registro/login cuando corresponda. Cubrir el flujo con tests de token ausente, inválido, válido y expirado.

### SEC-04 — secretos y dirección IP no fallan de forma segura

**Evidencia:** JWT tiene el fallback conocido `dev_access_secret_change_me` en [`api/src/auth/auth.module.ts`](../api/src/auth/auth.module.ts) y [`jwt.strategy.ts`](../api/src/auth/jwt.strategy.ts). Además, [`api/src/main.ts`](../api/src/main.ts#L31) habilita `trust proxy` para cualquier salto.

**Impacto:** una variable omitida en producción deja una clave predecible; `trust proxy: true` permite falsificar `X-Forwarded-For` si la topología no lo filtra, afectando rate limit, CAPTCHA inteligente y auditoría.

**Acción propuesta:** validar variables obligatorias al arrancar (sin fallback en producción ni staging), implementar esquema de configuración y usar un valor explícito de `TRUST_PROXY` (por ejemplo, un salto o rangos de proxy conocidos). Probar spoofing de `X-Forwarded-For`.

### SEC-05 — telemetría captura PII y replay antes de consentimiento

**Evidencia:** API y web usan `sendDefaultPii: true`; en [`web/instrumentation-client.ts`](../web/instrumentation-client.ts) el replay tiene `maskAllText: false` y `blockAllMedia: false`. El banner de cookies solo persiste una preferencia local y no controla Sentry ([`CookieConsent.tsx`](../web/src/components/ui/CookieConsent.tsx)).

**Impacto:** se pueden enviar a un tercero correos, IP, direcciones, contenido de formularios, pedidos y capturas de pantalla antes de cualquier elección del usuario. La política de privacidad no describe este tratamiento con precisión.

**Acción propuesta:** cambiar a `sendDefaultPii: false`, enmascarar texto y medios, configurar scrubbing de campos sensibles, activar replay/telemetría no esencial después del consentimiento y actualizar las políticas con responsable legal. Los DSN no son secretos por sí mismos, pero deben estar en variables de entorno para desacoplar entornos.

### SEC-06 — RLS no cubre tablas creadas después de la migración de bloqueo

**Evidencia:** la migración [`20260401060055_lock_down_rls`](../api/prisma/migrations/20260401060055_lock_down_rls/migration.sql) habilita RLS para las 19 tablas entonces existentes. Migraciones posteriores crean `SystemConfig`, `NotificationConfig`, `Notification` y `PushSubscription` sin habilitar RLS.

**Impacto:** si Supabase concede acceso a `anon` o `authenticated`, las nuevas tablas pueden quedar accesibles por la API de datos directa. `Notification` y `PushSubscription` contienen datos de usuarios y endpoints push.

**Acción propuesta:** crear una migración que habilite RLS, revoque grants no requeridos y defina políticas explícitas para las cuatro tablas. Probar con roles `anon`/`authenticated`, no solo con el usuario administrador usado por Prisma. Este hallazgo requiere confirmar grants del proyecto Supabase, pero no debe dejarse sin resolver.

### SEC-07 — dependencias de producción con vulnerabilidades conocidas

**Evidencia:** la comprobación final con `npm audit --omit=dev` sobre los lockfiles npm reporta 11 hallazgos de producción en `api` (7 moderados y 4 altos) y 5 en `web` (2 moderados y 3 altos). La mayoría son transitivos y las correcciones sugeridas implican Nest 11, Swagger 11 o una actualización mayor de Next; no se aplicó `--force`.

**Impacto:** exposición a DoS, ReDoS, problemas de parsing y vulnerabilidades transitivas conocidas.

**Acción propuesta:** crear una rama de actualización, actualizar primero versiones directas compatibles y ejecutar build, pruebas y smoke tests. No aplicar `--force` ni sobrescrituras transitivas sin revisar cambios mayores. Añadir Dependabot o Renovate y un job de auditoría programado.

### AUTH-01 — no existe aislamiento efectivo por sucursal para roles operativos

**Evidencia:** los usuarios operativos sí tienen `branchId`, pero los controladores aceptan cualquier sucursal recibida. El propio dashboard reconoce el TODO en [`api/src/dashboard/dashboard.controller.ts`](../api/src/dashboard/dashboard.controller.ts#L69-L73). Producción usa `dto.branchId` antes que la sucursal del usuario ([`production.service.ts`](../api/src/production/production.service.ts#L57-L58)); inventario, pedidos y movimientos tampoco comparan la sucursal solicitada con la del actor.

**Impacto:** un `MANAGER`, `BAKER` o `CASHIER` de una sucursal puede consultar, producir, vender, ajustar o cancelar operaciones en otra, según la ruta.

**Acción propuesta:** centralizar la regla en un `BranchScopeGuard`/servicio: `ADMIN` puede cruzar sucursales; los demás roles se limitan a su `branchId` persistido. Derivar la sucursal server-side, ignorar o validar parámetros de cliente, y probar cada endpoint con actor de sucursal A contra datos de B.

### DATA-01 — pedidos e inventario pueden quedar inconsistentes o sobre-reservarse

**Evidencia:** `reserve` valida disponibilidad y luego incrementa reservas sin aislamiento serializable ni actualización condicional ([`orders.service.ts`](../api/src/orders/orders.service.ts#L69-L105)); además el cálculo de combos solo existe en la venta POS (líneas 182–199), no en reserva web. `updateStatus` acepta cualquier estado válido sin modelar transiciones ni ajustar inventario (líneas 406–438).

**Impacto:** dos reservas concurrentes pueden superar el stock; líneas duplicadas del mismo producto también deben agregarse antes de validar. Cambiar a `DELIVERED`/`CANCELLED` mediante el endpoint genérico puede desincronizar stock y reservas. El cliente web puede recibir un total distinto al de POS para promociones.

**Acción propuesta:**

- Agrupar ítems por producto, usar transacciones serializables con retry o un `UPDATE ... WHERE quantity - reserved >= cantidad` atómico.
- Implementar una máquina de estados permitidos y dejar que solo comandos de dominio (`confirm`, `pickup`, `cancel`) modifiquen stock/reservas.
- Reutilizar un único calculador de precios para carrito web y POS; persistir precio, descuento y promoción aplicados.
- Añadir pruebas de concurrencia, ítems duplicados, transiciones inválidas, cancelación/entrega repetida y combos.

### QLT-01 — pruebas y CI no protegen de regresiones actuales

**Evidencia:**

- `jest src --runInBand`: 7 fallos de `ProductionService` porque el mock no incluye `prisma.branch.findUnique`; solo 20 pruebas pasan.
- La suite completa depende de una base Supabase externa y no alcanza una conclusión reproducible en entorno aislado. También fallan pruebas de paginación al no proveer `AuditService` después de cambiar el controlador.
- Las e2e y el lint están condicionados por variables opcionales en [`.github/workflows/backend-ci.yml`](../.github/workflows/backend-ci.yml) y [`.github/workflows/frontend-ci.yml`](../.github/workflows/frontend-ci.yml), por lo que normalmente no bloquean PRs.
- `eslint src` devuelve 56 errores y 55 advertencias.

**Impacto:** cambios que rompen pruebas, permisos, inventario o UX pueden llegar a `main` sin señal de CI.

**Acción propuesta:** separar `test:unit`, `test:e2e` y `test:integration`; usar PostgreSQL efímero/testcontainers o una base de pruebas dedicada; corregir mocks y teardown; hacer build, lint y unit tests obligatorios en cada PR; activar e2e en una etapa aislada; establecer cobertura mínima para auth, pedidos, sucursales e inventario.

## Hallazgos P2 — corto plazo

### SEO-01 — la base técnica SEO es incompleta y el catálogo llega después de hidratar

**Evidencia:** solo el layout raíz declara metadata básica ([`web/src/app/layout.tsx`](../web/src/app/layout.tsx#L24-L28)). No hay `sitemap.ts`, `robots.ts`, metadata por ruta/producto, canonical, Open Graph, Twitter cards ni JSON-LD. Inicio, catálogo y detalle de producto son Client Components y cargan datos con `useEffect` ([`page.tsx`](../web/src/app/page.tsx), [`productos/page.tsx`](../web/src/app/productos/page.tsx), [`productos/[slug]/page.tsx`](../web/src/app/productos/[slug]/page.tsx)).

**Impacto:** los rastreadores pueden recibir HTML sin productos ni descripción específica; se desaprovechan páginas de producto, búsquedas locales y previsualizaciones sociales.

**Acción propuesta:**

1. Añadir `metadataBase` y una variable de URL pública; definir título con template, canonical, Open Graph, Twitter y robots por ruta.
2. Crear `app/robots.ts` y `app/sitemap.ts`; incluir solo rutas públicas y productos activos, excluir `/admin`, auth, carrito, checkout, perfil y pedidos.
3. Convertir inicio, catálogo y fichas públicas a Server Components o rutas híbridas con cache/ISR. Implementar `generateMetadata` en cada producto y usar el contenido de API para nombre, descripción, imagen, precio y disponibilidad.
4. Añadir JSON-LD para `BakeryOrCoffeeShop`/`LocalBusiness`, `Product`, `Offer`, `BreadcrumbList` y sucursales. Alimentarlo con datos reales, no placeholders.
5. Agregar `loading.tsx` y `error.tsx` por segmentos públicos; usar `next/image` y `sizes` adecuados para mejorar LCP.

### SEO-02 — datos locales y conversión no están listos para producción

**Evidencia:** el footer y contacto muestran teléfono, correo, redes y enlaces de tiendas de ejemplo ([`Footer.tsx`](../web/src/components/layout/Footer.tsx), [`contacto/page.tsx`](../web/src/app/contacto/page.tsx)). El formulario de contacto espera 800 ms y muestra éxito sin enviar ni persistir el mensaje.

**Impacto:** se pierden contactos reales, Google recibe NAP (nombre, dirección, teléfono) inconsistente y el usuario ve una confirmación falsa.

**Acción propuesta:** conectar contacto a un endpoint protegido con rate limit/CAPTCHA y correo/ticketing; reemplazar todos los placeholders por datos reales o eliminar los enlaces; centralizar NAP, horarios y redes en configuración; añadir enlaces a Google Business Profile, `mailto:`/`tel:` reales y schema por sucursal.

### SEC-08 — carga de archivos valida tarde y confía en MIME del cliente

**Evidencia:** [`storage.controller.ts`](../api/src/storage/storage.controller.ts#L35) usa `FileInterceptor('file')` sin límites de Multer. El máximo de 5 MB se comprueba después de que el buffer ya está en memoria y se acepta `mimetype` enviado por el cliente ([`storage.service.ts`](../api/src/storage/storage.service.ts#L57-L64)).

**Impacto:** un upload grande o malformado puede agotar memoria; la superficie coincide además con vulnerabilidades altas transitivas de Multer detectadas por auditoría.

**Acción propuesta:** establecer `limits.fileSize` y número de archivos en Multer, validar firma binaria con una librería actualizada, re-encodear imágenes, limitar dimensiones y añadir antivirus/escaneo si se escala el uso. Mantener Appwrite con permisos mínimos y URLs firmadas si las imágenes no son públicas.

### UX-01 — permisos visibles de interfaz y permisos reales no coinciden

**Evidencia:** el menú permite Dashboard a `BAKER` y `CASHIER`, pero la API de dashboard solo permite `ADMIN`/`MANAGER`. También expone Productos a `MANAGER`, mientras los mutadores de producto en API son solo `ADMIN` ([`web/src/app/admin/layout.tsx`](../web/src/app/admin/layout.tsx#L55-L78), [`api/src/dashboard/dashboard.controller.ts`](../api/src/dashboard/dashboard.controller.ts), [`api/src/products/products.controller.ts`](../api/src/products/products.controller.ts)).

**Impacto:** pantallas visibles terminan en 403, aumentan soporte y generan incertidumbre de roles.

**Acción propuesta:** definir un único mapa de capacidades compartido o generado desde contratos; usarlo tanto para navegar como para proteger API. Añadir pruebas de matriz rol × ruta × sucursal.

### QLT-02 — validaciones y accesibilidad presentan inconsistencias

**Evidencia:** registro acepta 6 caracteres en UI, mientras API exige 8; varias etiquetas no tienen `htmlFor` ni inputs con `id`; el lint también reporta hooks con dependencias incompletas y múltiples `any`.

**Impacto:** errores evitables en registro, peor experiencia con lector de pantalla y mayor riesgo de efectos obsoletos/re-renderizados en React 19.

**Acción propuesta:** compartir reglas de formulario entre frontend y DTO/API, corregir semántica de campos y mensajes `aria-live`, sustituir `any` por tipos de API y resolver el lint antes de elevar el umbral a cero advertencias.

### DOC-01 — documentación y configuración no reflejan el estado actual

**Evidencia:** README/documentación mencionan 19 módulos y 44+ endpoints, mientras `AppModule` importa 22 módulos. Las guías indican `start:prod` inexistente y documentos de desarrollo aún presentan CI/CD/deploy como pendientes aunque existen workflows. CI usa Node 24; las guías indican Node 18+ y no hay `engines` en paquetes.

**Impacto:** onboarding, despliegue y soporte se basan en instrucciones incompletas o incorrectas.

**Acción propuesta:** crear una tabla de compatibilidad de runtime, actualizar guía de despliegue tras corregir el script, generar inventario API desde OpenAPI y establecer revisión de documentación como parte de Definition of Done.

## Hallazgos P3 — higiene y evolución

1. **Monorepo sin orquestación raíz.** No hay `package.json` raíz, workspaces ni scripts agregados. Evaluar npm workspaces y comandos `dev`, `build`, `test`, `lint` por paquete; no es necesario introducir Turbo hasta que la carga lo justifique.
2. **Configuración PostCSS duplicada.** `web/postcss.config.js` y `web/postcss.config.mjs` usan plugins distintos; el segundo referencia `@tailwindcss/postcss`, que no figura como dependencia directa. Conservar una sola configuración compatible con Tailwind 3.
3. **Artefactos generados versionados.** `web/tsconfig.tsbuildinfo`, `api/test-output.txt` y `api/test_output.txt` deberían salir del control de versiones e incorporarse a `.gitignore`. Los logs ya contienen detalles de infraestructura y quedan obsoletos rápidamente.
4. **Build depende de Google Fonts.** La build pasó con red, pero falla en entornos sin salida a Google. Si se requiere reproducibilidad/offline, autoalojar Geist o definir una fuente local/fallback.

## Plan recomendado

### Fase 0 — antes del próximo despliegue (P0)

| Entregable | Criterio de aceptación |
|---|---|
| OAuth verificado server-side | No se emite JWT si el token Supabase falta, es inválido o pertenece a otro usuario. Prueba negativa incluida. |
| Arranque de Render corregido | El comando exacto de `render.yaml` inicia `dist/src/main.js` en un smoke test. |
| Contención | OAuth público deshabilitado hasta que la validación esté desplegada. |

### Fase 1 — seguridad y datos (1 sprint)

| Orden | Trabajo | Criterio de aceptación |
|---:|---|---|
| 1 | Migrar almacenamiento de sesión a cookies HttpOnly/BFF | Refresh token no puede leerse con JavaScript; CSRF y logout probados. |
| 2 | Verificación hCaptcha en API | Peticiones automatizadas sin token válido son rechazadas. |
| 3 | Validación de configuración, JWT y proxy | Producción no inicia sin secretos válidos; IP no puede ser falsificada por headers de cliente. |
| 4 | RLS y grants de nuevas tablas | Pruebas con roles públicos no pueden leer ni escribir notificaciones, push ni configuración privada. |
| 5 | Actualizar dependencias vulnerables | `npm audit --omit=dev` sin vulnerabilidades altas; builds y smoke tests verdes. |

### Fase 2 — integridad operativa y calidad (1 sprint)

| Orden | Trabajo | Criterio de aceptación |
|---:|---|---|
| 1 | Guard de sucursal y matriz de permisos | Un actor no administrador no accede ni muta datos de otra sucursal. |
| 2 | Máquina de estados y reserva atómica | No hay sobreventa con solicitudes simultáneas ni cambios de estado inconsistentes. |
| 3 | Precio compartido carrito/POS | Mismo conjunto de productos produce el mismo total y descuento en ambos canales. |
| 4 | Reparar pruebas y CI obligatorio | Unit + lint + build bloquean PR; e2e usa base aislada. |
| 5 | Endurecer uploads | Límites de tamaño antes de buffer, verificación binaria y pruebas de archivo malicioso. |

### Fase 3 — SEO, conversión y experiencia (1–2 sprints)

| Orden | Trabajo | Criterio de aceptación |
|---:|---|
| 1 | Metadata, sitemap, robots y canonical | Search Console detecta sitemap; rutas privadas son noindex. |
| 2 | SSR/ISR de catálogo y producto | El HTML inicial contiene nombre, descripción, precio e imagen del producto. |
| 3 | Schema y datos locales reales | Validación Schema.org sin errores para negocio, productos y sucursales. |
| 4 | Contacto funcional | Cada envío deja ticket/correo trazable; no se muestra éxito si falla. |
| 5 | Accesibilidad y Web Vitals | Formularios etiquetados, imágenes con alt correcto y presupuesto LCP/CLS/INP medido. |

### Fase 4 — mantenibilidad continua

- Eliminar configuraciones y artefactos duplicados.
- Definir `engines` y una versión de Node alineada con CI/despliegue.
- Añadir Dependabot/Renovate, auditoría de dependencias programada y revisión mensual de observabilidad/privacidad.
- Mantener un ADR corto por decisiones de auth, multi-sucursal, RLS y cache/SEO.

## Actualización final de implementación — 27 de julio de 2026

Esta sección sustituye el estado de los hallazgos marcados originalmente como pendientes cuando se contradiga con el seguimiento inicial. Los cambios fueron compilados y probados en el mismo repositorio; no se ejecutaron contra los servicios productivos.

| Área | Estado actual | Implementación y alcance |
|---|---|---|
| SEC-02 — sesión web | ✅ Implementado | El navegador ya no guarda tokens de aplicación en `localStorage`. Las rutas `/api/auth/*` y `/api/bff/*` de Next.js mantienen access/refresh tokens únicamente en cookies `HttpOnly`, `Secure` en producción y `SameSite=Lax`. Los POST/PATCH/PUT/DELETE exigen token CSRF doble-submit y rechazan orígenes cross-site. |
| BFF y OAuth | ✅ Implementado | Login, registro, logout, sesión, refresh transparente y callback OAuth pasan por el BFF. El callback deja los tokens propios exclusivamente en cookies HttpOnly; la recuperación de contraseña también sincroniza con la API mediante BFF, sin exponer el bearer a la API desde el navegador. |
| AUTH-01 — sucursales | ✅ Implementado | `BranchScopeService` fuerza la sucursal asignada para `MANAGER`, `BAKER` y `CASHIER` en inventario, dashboard, producción, materias primas, movimientos y pedidos. `ADMIN` conserva alcance global; rutas de catálogo y clientes no se mezclan con el alcance operativo. |
| DATA-01 — pedidos | ✅ Implementado | Se agregó una máquina de estados explícita: `PENDING → CONFIRMED → PREPARING → READY → PICKED_UP` o `READY → IN_DELIVERY → DELIVERED`, con cancelación sólo desde estados no terminales. Cancelación y cumplimiento liberan/descuentan inventario en transacciones serializables con retry. |
| Inventario reservado | ✅ Implementado | Reservas y POS agrupan líneas repetidas, verifican disponibilidad real (`quantity - reserved`) y evitan ventas/ajustes/reconciliaciones que dejen inventario por debajo de reservas activas. El cron de expiración vuelve a leer la orden dentro de la transacción antes de cancelarla. |
| SEO SSR/ISR | ✅ Implementado | `/productos` renderiza el catálogo desde servidor con filtros SSR y fetch revalidado cada 60 s. `/productos/[slug]` genera metadata, JSON-LD `Product`, parámetros estáticos y revalidación de 60 s; incluye `loading` y `error` states. La interacción de carrito permanece en componentes cliente. |
| Dependencias | ✅ Mitigación controlada | Se actualizaron versiones compatibles de Nest 10, React 19, Sentry, Supabase y herramientas. Las versiones quedan reproducibles mediante los `package-lock.json` de cada aplicación. No se usó `--force` ni se saltó a versiones mayores de framework. |

### Auditoría de dependencias posterior

| Comando | Resultado final | Pendiente razonado |
|---|---|---|
| `api: npm audit --omit=dev` | ⚠️ 11 hallazgos (7 moderados, 4 altos) | Los fixes automáticos proponen Nest 11/Swagger 11; planificar upgrade mayor con pruebas de regresión. |
| `web: npm audit --omit=dev` | ⚠️ 5 hallazgos (2 moderados, 3 altos) | Los avisos pasan por Next/PostCSS/Sharp; evaluar una actualización mayor de Next y validar SSR/ISR antes de aplicarla. |

### Verificación final

| Verificación | Resultado |
|---|---|
| `api: npm run build` | ✅ Correcta después de alcance por sucursal y transiciones. |
| `api: npm test -- branch-scope.service.spec.ts order-state.spec.ts auth.service.spec.ts captcha.service.spec.ts daily-close.service.spec.ts` | ✅ 14/14 pruebas registradas. |
| `web: npm run build` | ✅ Correcta; `/productos` aparece como SSR y `/productos/[slug]` como SSG con parámetros estáticos. |
| `api` y `web`: `npm ci` | ✅ Correcta en ambos directorios; los lockfiles actuales son reproducibles para Render y Vercel. |
| `api`: `npm run prisma:generate` + `npm run build` | ✅ Correcta después de la instalación npm final. |
| Pruebas focalizadas (5 suites) | ✅ 14/14 pruebas; sucursal, estados de pedido, auth, captcha y cierre diario. |

### Requisitos de despliegue de esta entrega

1. En Vercel definir `API_INTERNAL_URL` hacia la API de Render (o una URL privada equivalente), además de `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_SITE_URL`.
2. Ejecutar `npm run prisma:deploy` desde `api/` contra producción antes de habilitar operaciones multi-sucursal.
3. Probar con usuarios reales de dos sucursales: inventario, producción, movimiento, POS, confirmación/cancelación y detalle de orden deben devolver 403 fuera de la sucursal asignada.
4. Probar login, registro, OAuth, refresh de sesión y recuperación de contraseña en el dominio final, incluida la protección CSRF.
5. La generación de rutas de producto necesita API accesible durante el build. Si Render está temporalmente inaccesible, `dynamicParams` permite servir la ficha bajo demanda, pero conviene configurar `API_INTERNAL_URL` y evitar cold starts durante el deploy.

## Backlog SEO detallado

| Área | Cambio propuesto | Beneficio |
|---|---|---|
| Descubrimiento | `robots.ts` + `sitemap.ts` con productos y sucursales activas | Mejor rastreo y exclusión de área privada. |
| Metadatos | `generateMetadata` por producto/categoría; canonical y `metadataBase` | Mejor CTR e indexación de long tail. |
| Renderizado | Server Components/ISR para inicio, catálogo y detalle | Contenido indexable y mejor LCP. |
| Datos estructurados | `LocalBusiness`, `Product`, `Offer`, `BreadcrumbList` | Resultados enriquecidos y SEO local. |
| SEO local | NAP real, horarios por sucursal, enlaces de mapa y Google Business Profile | Confianza y búsquedas “cerca de mí”. |
| Conversión | Formulario real, WhatsApp real, promociones con landing indexable | Menos leads perdidos. |
| Medición | Search Console, Web Vitals y analítica condicionada al consentimiento | Decisiones basadas en búsqueda y rendimiento sin capturar PII innecesaria. |

## Ideas de mejora de producto

- **Pronóstico de producción:** recomendar amasijos por sucursal a partir de ventas históricas, día de semana y merma.
- **Disponibilidad por franja horaria:** permitir reservas para mañana/tarde y mostrar stock estimado de recién horneado.
- **Pedidos especiales:** flujo separado para pasteles personalizados con fecha, referencia visual, anticipo y confirmación manual.
- **Recompra rápida:** historial de productos frecuentes y combos sugeridos, siempre con consentimiento y sin invadir privacidad.
- **Tablero operacional por sucursal:** alertas de producción pendiente, baja materia prima, reservas a vencer y merma, respetando el nuevo alcance de roles.

## Aspectos positivos que conviene preservar

- Uso de transacciones serializables con retry en producción.
- Separación razonable de módulos de Nest y servicios de dominio.
- Swagger/OpenAPI, health endpoint, métricas y Sentry ya integrados.
- Paginación y filtros presentes en API.
- Rutas públicas, administración y documentación ya están bien diferenciadas a nivel de estructura.
- Las variables `.env` no están versionadas y existen plantillas de configuración.

---

**Siguiente decisión recomendada:** aplicar la migración RLS en producción y ejecutar el smoke test de sesión BFF, multi-sucursal y estados de pedido antes de abrir tráfico. Después, decidir el alcance funcional de entregas a domicilio y completar datos locales reales para SEO.
