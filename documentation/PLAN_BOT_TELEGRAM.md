# Plan: Asistente privado de Telegram para los dueños de la panadería

> **Objetivo:** permitir que las cuentas autorizadas de la panadería consulten el estado del negocio desde Telegram usando lenguaje natural y reciban en Telegram las mismas alertas relevantes que hoy se entregan mediante notificaciones push.

> **Estado:** arquitectura implementada en el backend y frontend. Quedan como pasos operativos aplicar la migración, configurar secretos y registrar el webhook.

> **Principio central:** el modelo de IA nunca tendrá acceso directo a Prisma, SQL ni a las credenciales de la base de datos. El modelo únicamente podrá solicitar *tools* de lectura, y cada *tool* será validada y ejecutada por el backend con el usuario y las sucursales autorizadas.

## Decisiones confirmadas

- Habrá **un solo bot privado**, enfocado en los dueños. No habrá menús, comandos ni bots separados por rol.
- Podrán vincularse usuarios con rol `ADMIN` o `MANAGER`, siempre que estén activos y tengan habilitado el acceso al asistente.
- La aplicación tendrá un botón **“Abrir asistente en Telegram”** que iniciará el vínculo mediante un enlace profundo de Telegram.
- Los dueños podrán consultar información de **las dos sucursales**. El alcance se resolverá en el backend y no podrá ser alterado por el modelo ni por el texto del usuario.
- Las preguntas se harán en lenguaje natural. Se usará *tool calling* para convertirlas en consultas controladas sobre servicios de lectura del backend.
- La versión inicial será de **solo lectura**. Registrar compras, producción, ventas o cierres desde Telegram queda fuera de v1.
- Las alertas seguirán llegando a la aplicación mediante Web Push y, cuando exista un vínculo activo, también a Telegram.

## FASE 0 — Contrarrevisión del proyecto (completada)

La revisión se realizó con Graphify y con los archivos fuente actuales. El grafo sirve para navegar relaciones; para las decisiones finales se tomó como verdad el código y el esquema Prisma del estado actual del proyecto.

### 0.1 Hallazgos relevantes

| Área | Estado actual | Consecuencia para el asistente |
|---|---|---|
| Roles | `UserRole` contiene `ADMIN` y `MANAGER`, pero no `OWNER`. | No crear un rol nuevo. La elegibilidad será `ADMIN/MANAGER` más una capacidad explícita. |
| Alcance | `BranchScopeService` considera a `MANAGER` un rol limitado a sucursal y a `ADMIN` global. | No reutilizar el alcance de `MANAGER` sin más. El asistente tendrá un permiso explícito `ALL_BRANCHES` para las cuentas dueñas. |
| Push | `NotificationsModule` es global y `NotificationsService` ya persiste `Notification`, administra `PushSubscription` y envía Web Push. | Extender este servicio con el canal Telegram; no crear un segundo sistema de notificaciones. |
| Disparadores | Ya existen alertas para órdenes, producción, pérdidas y stock bajo de producto terminado/materia prima. | Telegram debe conectarse a los mismos eventos, evitando duplicar reglas de negocio. |
| Anti-spam | No existe una deduplicación robusta para stock bajo. | Añadir estado de alerta reutilizable antes de activar alertas repetitivas por Telegram. |
| Scope de alertas | `sendToRoles` actualmente no filtra por sucursal. | Corregir la selección de destinatarios para que una alerta de una sucursal no se mezcle con otra. |
| Servicios reutilizables | Existen `DashboardService`, `RawMaterialsService`, `InventoryService`, `OrdersService`, `ProductionService` y `DailyCloseService`. | Crear una fachada de lectura para el asistente y reutilizar estos servicios o sus consultas de dominio. |
| Consultas | El dashboard actual está orientado a la pantalla de hoy y devuelve un payload amplio; inventario y cierre necesitan respuestas más pequeñas y fechas explícitas. | No exponer directamente esos payloads al LLM; agregar métodos de consulta resumida y con zona horaria de negocio. |
| Cierre de día | `DailyCloseService` registra unidades, merma y sobrantes, pero no conserva un precio histórico por unidad. | No prometer al bot un monto monetario histórico de cierre hasta modelarlo correctamente. |
| Seguridad | No hay guard JWT global; los controladores protegen rutas explícitamente y la configuración no valida todas las variables al arranque. | Proteger cada endpoint nuevo de forma explícita y validar la configuración de Telegram/IA al habilitar el módulo. |

### 0.2 Ajustes de arquitectura derivados

1. **No se creará `OWNER`** y no se modificarán los flujos de roles de la aplicación. El acceso del asistente será una capacidad adicional.
2. Se recomienda una política `AssistantAccess` con `enabled` y `scope = ALL_BRANCHES`. Para v1, las cuentas dueñas autorizadas tendrán las dos sucursales permitidas; no se hardcodearán correos ni IDs dentro del código.
3. `NotificationsService` seguirá siendo la fachada central. Se agregará un `TelegramChannel` interno o un adaptador equivalente, sin crear un `NotificationDispatcherService` paralelo.
4. Las *tools* no consultarán Prisma directamente desde el orquestador de IA. Llamarán a una fachada de lectura del dominio que reciba un contexto de usuario ya autorizado.
5. El vínculo de Telegram no otorgará permisos. En cada mensaje se volverán a comprobar usuario activo, rol y `AssistantAccess`.

## FASE 1 — Acceso, alcance y configuración

### 1.1 Política de acceso

La regla para procesar una pregunta será:

```text
usuario activo
  AND rol ∈ {ADMIN, MANAGER}
  AND AssistantAccess.enabled = true
  AND TelegramLink.active = true
  AND chat privado
```

Para estas cuentas, `AssistantAccess.scope = ALL_BRANCHES` resolverá las dos sucursales activas. Las *tools* recibirán los `branchIds` resultantes desde el servidor; el LLM nunca podrá suministrar una lista de sucursales para ampliar su propio alcance.

El alcance del asistente no cambia el alcance de los demás endpoints de la aplicación. Un `MANAGER` seguirá usando el `BranchScopeService` normal en la aplicación y solo tendrá alcance global dentro del asistente si cuenta con la capacidad explícita aprobada.

### 1.2 Variables de entorno

```env
TELEGRAM_BOT_TOKEN=             # secreto de @BotFather
TELEGRAM_BOT_USERNAME=          # nombre público usado para construir el deep link
TELEGRAM_WEBHOOK_URL=           # URL HTTPS pública en producción
TELEGRAM_WEBHOOK_SECRET=        # secreto del header X-Telegram-Bot-Api-Secret-Token
ASSISTANT_MODEL=                # configurable por entorno
GROQ_API_KEY=                   # clave privada de Groq para el asistente
ASSISTANT_MAX_STEPS=4
ASSISTANT_TIMEOUT_MS=30000
ASSISTANT_MAX_OUTPUT_TOKENS=700
ASSISTANT_MAX_MESSAGES_PER_MINUTE=10
ASSISTANT_MAX_MESSAGES_PER_DAY=100
TELEGRAM_LINK_MAX_FAILED_ATTEMPTS=5
TELEGRAM_LINK_BLOCK_MINUTES=15
```

- Los secretos nunca se escriben en el repositorio ni en logs.
- Si no existe `TELEGRAM_BOT_TOKEN`, el módulo debe quedar deshabilitado y la API debe arrancar normalmente con un warning.
- La validación de variables debe ocurrir cuando el módulo esté habilitado; no se debe romper el resto de la aplicación por una integración opcional apagada.
- La implementación usa Groq; el ID del modelo se mantiene configurable mediante `ASSISTANT_MODEL`.

### 1.3 Modelos Prisma propuestos

El esquema final debe integrarse con las relaciones existentes de `User` y con las migraciones de RLS del proyecto.

```prisma
enum AssistantScope {
  ALL_BRANCHES
}

model AssistantAccess {
  id        String         @id @default(uuid())
  userId    String         @unique
  enabled   Boolean        @default(true)
  scope     AssistantScope @default(ALL_BRANCHES)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  user      User           @relation(fields: [userId], references: [id])
}

model TelegramLink {
  id         String    @id @default(uuid())
  userId     String    @unique
  chatId     String    @unique
  username   String?
  active     Boolean   @default(true)
  linkedAt   DateTime  @default(now())
  unlinkedAt DateTime?
  lastSeenAt DateTime?
  user       User      @relation(fields: [userId], references: [id])
}

model TelegramLinkToken {
  id        String    @id @default(uuid())
  tokenHash String    @unique
  userId    String
  expiresAt DateTime
  usedAt    DateTime?
  revokedAt DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id])

  @@index([userId, expiresAt])
}

model TelegramUpdate {
  updateId   BigInt   @id
  receivedAt DateTime @default(now())
  processedAt DateTime?
}
```

Reglas:

- El token del deep link será aleatorio, de un solo uso, con TTL de 10 minutos y almacenado únicamente como hash.
- `userId` y `chatId` serán únicos para evitar vínculos ambiguos.
- Un vínculo desactivado se conserva para auditoría y puede reactivarse mediante un nuevo flujo autorizado.
- Si se intenta vincular otro chat a un usuario que ya tiene uno activo, se requerirá una acción explícita de revinculación; no se moverá silenciosamente el vínculo.
- Las tablas nuevas deberán incluir RLS en la migración y políticas coherentes con el patrón de seguridad de las tablas existentes.

## FASE 2 — Botón de la aplicación y módulo Telegram

### 2.1 Flujo recomendado desde la aplicación

1. La aplicación muestra **“Abrir asistente en Telegram”** a usuarios elegibles. Esto es solo una mejora de UX; el backend sigue siendo la autoridad.
2. El botón llama a un endpoint autenticado, por ejemplo `POST /telegram/link-session`.
3. El backend valida `ADMIN/MANAGER`, usuario activo y `AssistantAccess`, crea un `TelegramLinkToken` y devuelve un enlace como:

   ```text
   https://t.me/<TELEGRAM_BOT_USERNAME>?start=<token-de-un-solo-uso>
   ```

4. El frontend abre ese enlace en una nueva pestaña o en la aplicación de Telegram.
5. Telegram envía `/start <token>` al webhook. El backend valida el token dentro de una transacción, crea el vínculo y confirma la conexión.

Endpoints mínimos:

```text
POST   /telegram/link-session   # JWT + rol/capacidad; genera deep link
GET    /telegram/link-status    # JWT; informa si existe vínculo activo
DELETE /telegram/link            # JWT; desactiva el vínculo
POST   /telegram/webhook         # público para Telegram; protegido por secret token
```

### 2.2 Estructura sugerida

```text
api/src/telegram/
  telegram.module.ts
  telegram.controller.ts          # webhook y endpoints autenticados
  telegram.service.ts              # Telegram Bot API, sendMessage, setWebhook
  telegram-link.service.ts         # token, vínculo, revocación
  telegram-update.service.ts       # idempotencia de update_id
  dto/telegram-update.dto.ts

api/src/assistant/
  assistant.module.ts
  assistant.service.ts             # orquestación del modelo y tools
  assistant-policy.service.ts      # rol, capacidad, sucursales y contexto
  assistant-read.service.ts        # fachada de lecturas resumidas
  tools/
    sales.tools.ts
    inventory.tools.ts
    orders.tools.ts
    production.tools.ts
    daily-close.tools.ts
```

### 2.3 Seguridad del webhook y comandos

- Validar `X-Telegram-Bot-Api-Secret-Token`; requests inválidas se rechazan sin consultar datos.
- Aceptar únicamente `chat.type = private`; ignorar o rechazar grupos y canales.
- Persistir/procesar `update_id` de forma idempotente para que los reintentos de Telegram no repitan vínculos, mensajes ni alertas.
- Responder rápido al webhook y delegar el procesamiento largo a un flujo controlado; no depender de que Telegram mantenga abierta una petición mientras responde el LLM.
- Aplicar rate limit por `chatId`; el throttler global por IP no es suficiente para este caso.
- Limitar mensajes entrantes, por ejemplo a 500 caracteres, y rechazar archivos o tipos de update no soportados en v1.

Comandos base:

| Comando | Comportamiento |
|---|---|
| `/start` | Bienvenida; si trae token válido, completa el vínculo. |
| `/ayuda` | Ejemplos de preguntas y límites del asistente. |
| `/desvincular` | Desactiva el vínculo después de validar el chat. |
| Texto libre | Se envía al asistente de lenguaje natural. |

Un chat sin vínculo activo recibirá únicamente instrucciones de vinculación y nunca datos del negocio.

## FASE 3 — Asistente con tool calling, solo lectura

### 3.1 Arquitectura de una pregunta

```text
Telegram webhook
  → TelegramLink + usuario activo + AssistantAccess
  → AssistantContext { userId, role, allowedBranchIds, timezone }
  → modelo con tools allowlisted
  → tool validada en backend
  → servicio de dominio de lectura
  → resultado agregado y sanitizado
  → respuesta breve en Telegram
```

El modelo puede decidir qué *tool* necesita y con qué parámetros declarativos, pero:

- no recibe `userId` ni `branchIds` como parámetros controlables;
- no puede escribir SQL, usar Prisma, llamar URLs arbitrarias ni ejecutar acciones;
- no puede invocar métodos de escritura del dominio;
- no puede recibir filas completas ni campos sensibles;
- no puede ampliar el alcance más allá de `AssistantContext`.

Sí se recomienda *tool calling*: separa la interpretación del lenguaje natural de la autorización y de la consulta real. La base de datos sigue siendo consultada por el backend, mediante servicios controlados, nunca por el LLM.

### 3.2 Catálogo inicial de tools

| Tool | Fuente o adaptación | Preguntas que cubre |
|---|---|---|
| `salesSummary` | Nueva lectura resumida sobre órdenes/dashboard, con fecha de negocio y sucursal. | “¿Cómo van las ventas hoy?”, “¿cuánto se vendió ayer?” |
| `lowRawMaterials` | `RawMaterialsService`, respetando `RawMaterial.minStock` por material. | “¿Qué materia prima está baja?”, “¿qué debo comprar?” |
| `productInventory` | `InventoryService` más resolución segura por nombre/slug. | “¿Cuánto pan queda?”, “¿qué stock hay de tortas?” |
| `pendingOrders` | `OrdersService`, con límite y campos mínimos. | “¿Hay pedidos pendientes?” |
| `productionSummary` | `ProductionService`, con fecha y sucursales explícitas. | “¿Qué se produjo hoy?” |
| `dailyCloseSummary` | `DailyCloseService`, solo unidades, merma y sobrantes disponibles. | “¿Cómo cerró el día?”, “¿hubo merma?” |

Reglas para todas las tools:

- Usar schemas estrictos, preferiblemente Zod, para fechas, filtros y límites.
- La fecha relativa (“hoy”, “ayer”, “este lunes”) debe convertirse usando `America/Guatemala` y validarse antes de consultar.
- Por defecto se agregan las dos sucursales y se devuelve un desglose por sucursal. Un filtro de sucursal solo puede elegir una de las sucursales ya autorizadas.
- No aceptar IDs de usuario ni de sucursal provenientes directamente del modelo.
- Limitar rangos, número de resultados y tamaño del resultado entregado al contexto del modelo.
- Si una consulta necesita una forma de datos que los servicios actuales no ofrecen, agregar un método de lectura específico; no exponer el método de escritura ni el payload completo del dashboard.

Adaptaciones necesarias antes de implementar las tools:

- **Ventas:** el dashboard actual está centrado en el día actual y usa un payload amplio; crear una consulta de resumen por fecha/sucursal y definir claramente qué estados de orden cuentan como venta.
- **Materia prima:** mantener el umbral por material y unificar la comparación del umbral para que alerta y consulta no discrepen.
- **Inventario:** agregar resolución controlada por nombre, además del slug, sin permitir filtros libres que se concatenen a consultas.
- **Producción:** acordar si la fecha representa `createdAt` o una fecha operativa; usar la misma semántica en app y bot.
- **Cierre:** no reportar dinero histórico como si existiera; el modelo actual permite reportar unidades, merma y sobrantes, salvo que se agregue un precio histórico al dominio.

### 3.3 Comportamiento del modelo

- Responder en español, de forma breve y orientada a decisiones.
- Mostrar unidades y separar totales de cada sucursal cuando corresponda.
- Usar únicamente datos devueltos por tools; no inventar cifras.
- Indicar honestamente cuando una pregunta está fuera del catálogo.
- Rechazar acciones de escritura en v1 y dirigir al usuario a la aplicación.
- Mantener un límite de pasos del loop y un timeout global.
- No almacenar memoria conversacional en v1; cada pregunta será independiente.

## SECCIÓN TRANSVERSAL — Seguridad y guardarraíles

### S.1 Validaciones por mensaje

```text
secret del webhook válido
  → update_id no procesado
  → chat privado y rate limit permitido
  → TelegramLink activo
  → usuario existente, activo y con rol ADMIN/MANAGER
  → AssistantAccess habilitado y scope ALL_BRANCHES
  → mensaje dentro de límites
  → tools de solo lectura con contexto inyectado por backend
  → respuesta sanitizada y sin detalles internos
```

La revalidación del usuario en cada mensaje es obligatoria. Quitar el rol, desactivar la cuenta o deshabilitar `AssistantAccess` debe inutilizar el chat en la siguiente pregunta.

### S.2 Inyección de prompt y fuga de datos

- La seguridad no depende del *system prompt*: las tools deben ser seguras aunque el modelo sea manipulado.
- El usuario nunca podrá pedir que la tool opere como otro `userId`.
- No habrá tools para usuarios, contraseñas, tokens, configuración, SQL, filesystem ni URLs arbitrarias.
- Las respuestas de tools contendrán agregados, top-N y campos operativos mínimos; nunca `passwordHash`, tokens ni datos personales innecesarios.
- Los errores enviados a Telegram serán genéricos. Stack traces y detalles internos irán solo a logs protegidos.
- Registrar metadatos de la interacción —chat, duración, tools, éxito/fallo— sin guardar por defecto la conversación completa.

### S.3 Cuenta y límites

- Token de vínculo hasheado, TTL corto, un solo uso y revocable.
- Máximo de intentos fallidos de vinculación por chat, con bloqueo temporal.
- Rate limit por minuto y por día antes de invocar el LLM.
- `maxOutputTokens`, número máximo de pasos y timeout configurables.
- Auditoría de vínculo creado, vínculo revocado, intento fallido y bloqueo por abuso usando `AuditService`.
- Rotación documentada de `TELEGRAM_BOT_TOKEN` y `TELEGRAM_WEBHOOK_SECRET`.

## FASE 4 — Notificaciones multi-canal: Web Push + Telegram

### 4.1 Integración con el servicio existente

No se creará un segundo flujo de notificaciones. `NotificationsService` continuará siendo responsable de:

1. resolver la configuración del evento;
2. persistir la notificación interna;
3. entregar por Web Push mediante el comportamiento existente;
4. entregar por Telegram a los destinatarios con `TelegramLink.active`;
5. aislar errores entre canales con `Promise.allSettled` o un mecanismo equivalente.

El canal Telegram debe ser un adaptador pequeño: si el usuario no tiene vínculo activo, hace no-op; si Telegram falla, el Web Push no debe perderse.

### 4.2 Eventos y destinatarios

Conservar los eventos actuales y conectar el canal Telegram sin duplicar sus reglas:

- `order.new_pending`, `order.cancelled`, `order.status_changed`;
- `inventory.low_stock`, `inventory.raw_material_low`, `inventory.loss_detected`;
- `production.assigned`;
- `daily_close.completed`, nuevo evento después de confirmar un cierre;
- `telegram.linked`, confirmación de un nuevo vínculo.

Para los eventos asociados a una sucursal, el destinatario se resolverá con la sucursal del evento y la política `ALL_BRANCHES` del dueño. El método actual `sendToRoles` debe revisarse para no enviar indiscriminadamente alertas branch-specific a usuarios que no correspondan.

La configuración de notificaciones debe incluir las claves nuevas necesarias, especialmente la confirmación `telegram.linked` y el cierre de día. No asumir que una configuración inexistente habilita automáticamente el envío.

### 4.3 Anti-spam y resolución de alertas

El estado debe representar una alerta vigente por recurso, no crear una fila distinta por cada ciclo de estado:

```prisma
enum AlertType {
  RAW_MATERIAL_LOW
  PRODUCT_LOW
}

model AlertState {
  id              String    @id @default(uuid())
  branchId        String
  alertType       AlertType
  resourceKey     String    // por ejemplo raw-material:<id> o product:<id>
  active          Boolean   @default(true)
  firstTriggeredAt DateTime @default(now())
  lastNotifiedAt  DateTime @default(now())
  resolvedAt      DateTime?
  updatedAt       DateTime  @updatedAt

  @@unique([branchId, alertType, resourceKey])
  @@index([branchId, active])
}
```

Reglas:

- Notificar cuando el recurso cruza de normal a bajo.
- No repetir el mismo evento mientras siga bajo, salvo un resumen periódico explícito.
- Resolver y rearmar cuando el recurso vuelva al umbral normal después de una compra o ajuste válido.
- Usar una sola semántica de comparación para consulta y alerta; documentar si el umbral normal es `>=` o `>`.
- Cubrir tanto materia prima como producto terminado, porque ambos ya generan alertas en el sistema.

## FASE 5 — Orden de implementación

| # | Entregable | Dependencia |
|---|---|---|
| 1 | Política `AssistantAccess`, alcance `ALL_BRANCHES`, variables y migración Prisma con RLS. | Fase 0 |
| 2 | `TelegramLink`, token de deep link, webhook seguro, comandos y endpoints de estado/desvinculación. | 1 |
| 3 | Botón “Abrir asistente en Telegram” y estados de vínculo en la aplicación. | 2 |
| 4 | Módulo `assistant`, contexto de seguridad y dos tools iniciales: ventas y materia prima baja. | 2 |
| 5 | Tools de inventario, órdenes, producción y cierre; pruebas de fechas y agregación de las dos sucursales. | 4 |
| 6 | Canal Telegram dentro de `NotificationsService`, eventos de vínculo/cierre y deduplicación de alertas. | 2 y revisión de eventos actuales |
| 7 | Pruebas de seguridad, límites, observabilidad, webhook público y despliegue. | 3, 5 y 6 |

## Criterios de aceptación

- El botón solo aparece como UX para usuarios elegibles; el backend rechaza cualquier intento no autorizado.
- El enlace profundo expira, es de un solo uso y no almacena el token en claro.
- Un chat no vinculado, un grupo, un usuario inactivo o un usuario sin `ADMIN/MANAGER` no recibe datos.
- Un `MANAGER` dueño autorizado puede consultar las dos sucursales; una pregunta no puede ampliar el alcance.
- Las respuestas de ventas, inventario, producción y cierre muestran totales y desglose por sucursal cuando aplica.
- El LLM no tiene acceso a Prisma, SQL ni credenciales; las tools son allowlisted, validadas y de solo lectura.
- Una solicitud de escritura se rechaza y se redirige a la aplicación.
- Un webhook con secret incorrecto, `update_id` repetido o rate limit excedido no procesa una consulta.
- Una alerta configurada llega a Web Push y Telegram cuando corresponde; la caída de un canal no bloquea el otro.
- Stock bajo no genera mensajes repetidos mientras permanezca bajo y vuelve a notificar después de resolverse y cruzar nuevamente el umbral.
- Quitar el rol, desactivar el usuario o apagar `AssistantAccess` revoca el acceso en el siguiente mensaje.
- Con el bot deshabilitado por configuración, la API y las notificaciones push existentes siguen funcionando.
- Se prueban migraciones, RLS, scopes, deep links, inyección de prompt, grupos, rate limits y fallos independientes de los canales.

## Supuestos restantes

1. V1 será de solo lectura y sin memoria conversacional.
2. Producción usará webhook HTTPS; desarrollo podrá usar un modo local separado si el entorno no tiene URL pública.
3. Groq será el proveedor de IA y `ASSISTANT_MODEL` se mantendrá configurable por entorno.
4. El cierre de día no reportará montos históricos hasta que el modelo de datos los pueda respaldar correctamente.
5. Las dos sucursales se resolverán por configuración/política, no mediante IDs hardcodeados en el prompt o en las tools.
