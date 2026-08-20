# Auditoría del Modelo Entidad–Relación

**Proyecto:** Panadería Svetlana (`api/prisma/schema.prisma`)
**Fecha:** 11 de agosto de 2026
**Alcance:** 33 modelos / 8 enums. Revisión de normalización, cardinalidades, integridad referencial y evaluación de si el número de tablas es excesivo para el dominio.

> **Nota de vigencia:** esta auditoría corresponde al modelo previo al recorte de alcance. El estado actual es pickup-only, sin POS ni forecasting; `PaymentMethod` solo permite `EFECTIVO`; se retiró `CASHIER`; y `Product.expirationAlertDays` es una lista de recordatorios para productos `COMPRADO`. La fuente actual es `api/prisma/schema.prisma`.

> **Seguimiento posterior:** las recomendaciones de endurecimiento de sesiones, `isActive` en sucursales/categorías, `expiresAt` de reservas, `ProductImage`, índices FEFO, restricciones SQL y `OrderItem.lineTotal` se incorporaron en migraciones posteriores. Las propuestas de POS, proveedores de materia prima, caducidad de insumos, múltiples métodos de pago y forecasting quedan fuera del alcance vigente.

---

## 1. Veredicto ejecutivo

> **El modelo es correcto y está bien normalizado para el alcance operativo actual: catálogo con retiro, producción por amasijos, inventario multi-sucursal con lotes y caducidad, cierres diarios, notificaciones multicanal, Telegram de consulta y auditoría. Las referencias a POS, forecasting y pagos distintos de efectivo en este informe son históricas.**

La intuición de "son muchas tablas para una panadería" es razonable si se compara con un e-commerce simple (que resolvería el problema con 8–10 tablas: usuario, categoría, producto, imagen, pedido, detalle, dirección, config). Pero este esquema soporta **cinco subsistemas independientes**, y cada uno aporta su propio bloque de tablas:

| Subsistema | Tablas | ¿Se puede reducir? |
|---|---|---|
| Autenticación y sesiones | 4 (`User`, `RefreshToken`, `TrustedDevice`, `LoginAttempt`) | No — cada una tiene ciclo de vida y retención distintos |
| Catálogo y precios | 4 (`Category`, `Product`, `ProductPresentation`, `ProductImage`) | No, pero hay una **redundancia real** en combos (ver §4.1) |
| Producción (amasijos) | 4 (`RawMaterial`, `RawMaterialInventory`, `Recipe`, `RecipeIngredient`) | No — es el núcleo del negocio |
| Inventario y trazabilidad | 4 (`Inventory`, `InventoryLot`, `InventoryLotConsumption`, `StockMovement`) | No — FEFO y auditoría exigen las cuatro |
| Operación de sucursal | 3 (`Branch`, `DailyClose`, `DailyCloseItem`) | No |
| Ventas | 2 (`Order`, `OrderItem`) | No |
| Notificaciones y alertas | 4 (`NotificationConfig`, `Notification`, `PushSubscription`, `AlertState`) | Parcialmente (ver §4.2) |
| Telegram / asistente | 5 (`TelegramLink`, `TelegramLinkToken`, `TelegramUpdate`, `TelegramLinkAttempt`, `AssistantAccess`) | Sí, hay 2 candidatas a fusión (ver §4.3) |
| Transversal | 2 (`AuditLog`, `SystemConfig`) | No |

**Conclusión numérica:** de 33 tablas, **28 son estructuralmente necesarias**, 3 son candidatas discutibles a fusión (`TelegramLinkAttempt`, `AssistantAccess`, `TelegramUpdate`) y 2 campos —no tablas— son la única redundancia de diseño real (`comboQuantity` / `comboPrice` en `Product`). Es decir: **el esquema está sobre-dimensionado en menos del 10%**, lo cual es sano.

Verificamos además con búsqueda en el código que **las 33 tablas se usan en runtime**; no hay tablas muertas.

---

## 2. Análisis de normalización

### 2.1 Primera forma normal (1NF)

Cumple. No hay campos multivaluados en columnas escalares. Los únicos campos que almacenan colecciones son `Json` y están justificados:

| Campo | Contenido | Justificación |
|---|---|---|
| `NotificationConfig.targetRoles` | `["CUSTOMER"]` | Configuración, no dato transaccional. No se consulta con `WHERE role = ...` |
| `NotificationConfig.channels` | `["IN_APP","PUSH"]` | Idem |
| `NotificationConfig.thresholds` | `{ threshold: 50, unit: "LB" }` | Estructura variable por tipo de alerta |
| `SystemConfig.value` | valor tipado | Patrón key-value intencional |
| `Notification.metadata` | payload libre | Snapshot, no relacional |
| `AuditLog.details` | JSON en `Text` | Diff serializado |

**Observación:** `targetRoles` es el único que podría necesitar consulta inversa (por ejemplo, "¿qué notificaciones recibe un MANAGER?"). Si esa consulta llega a ser frecuente, se normalizaría con una tabla puente `NotificationConfigRole`. Hoy no se justifica: el volumen es de decenas de filas y se resuelve en memoria.

### 2.2 Segunda forma normal (2NF)

Cumple. Todas las tablas con clave compuesta lógica tienen los atributos dependiendo de la clave completa:

- `RecipeIngredient(recipeId, rawMaterialId) → quantity` ✔
- `Inventory(productId, branchId) → quantity, reserved` ✔
- `RawMaterialInventory(rawMaterialId, branchId) → quantity` ✔
- `InventoryLotConsumption(lotId, stockMovementId) → quantity` ✔
- `DailyCloseItem(dailyCloseId, productId) → conteos` ✔
- `AlertState(branchId, alertType, resourceKey) → estado` ✔

Todas estas combinaciones tienen `@@unique`, que es exactamente lo correcto: la PK sintética existe por comodidad de Prisma, y la clave natural está protegida por índice único. Esto evita el error clásico de permitir dos filas de inventario para el mismo producto/sucursal.

### 2.3 Tercera forma normal (3NF) y desnormalizaciones deliberadas

Cumple, con **desnormalizaciones intencionales y correctas** de tipo *snapshot histórico*:

| Campo redundante | Tabla | Veredicto |
|---|---|---|
| `productName` | `OrderItem`, `DailyCloseItem` | ✅ Correcto. Un pedido histórico debe mostrar el nombre vigente al momento de la venta, aunque el producto se renombre |
| `unitPrice` | `OrderItem` | ✅ Correcto. Los precios cambian; la factura no |
| `presentationName/Quantity/Units` | `OrderItem`, `ProductionLog` | ✅ Correcto, y además necesario porque `presentationId` es `onDelete: SetNull` |
| `userName` | `AuditLog` | ✅ Correcto. El log debe sobrevivir al borrado del usuario (`onDelete: SetNull` en `userId`) |
| `Notification.title/message` | `Notification` | ✅ Correcto. Renderizado ya resuelto; si cambia la plantilla, el historial no se altera |
| `ProductionLog.unitsProduced` | derivado de `traysProduced × unitsPerTray` | ✅ Aceptable. `unitsPerTray` puede cambiar en el futuro y el log debe ser inmutable |
| `Inventory.quantity` | agregado de `InventoryLot.availableQuantity` | ⚠️ Ver §3.1 — es la única desnormalización que introduce riesgo real |

Estas no son violaciones de 3NF en el sentido problemático: son *dimensiones de tipo 2* (historización), que es la práctica estándar en documentos contables. Un modelo que hiciera JOIN a `Product` para imprimir un ticket de hace seis meses sería un modelo peor, no mejor.

---

## 3. Riesgos e inconsistencias detectados

### 3.1 Doble fuente de verdad: `Inventory` vs `InventoryLot` (riesgo alto)

`Inventory.quantity` es el resumen y `SUM(InventoryLot.availableQuantity)` es el detalle. Ambos se mantienen por código de aplicación, no por la base de datos. Si una transacción actualiza uno y falla al actualizar el otro, el stock queda descuadrado de forma silenciosa y **el esquema no lo detecta**.

Mitigaciones recomendadas (sin cambiar el modelo):
- Toda escritura de stock debe pasar por un único servicio, dentro de una sola `$transaction`.
- Añadir una verificación periódica (job) que compare `Inventory.quantity` contra la suma de lotes por producto/sucursal y notifique divergencias vía `AlertState`.
- Evaluar un `CHECK` o trigger en Postgres como red de seguridad.

**No recomiendo eliminar `Inventory`** para dejar solo lotes: el POS necesita leer disponibilidad en O(1) y `reserved` es un concepto por producto/sucursal, no por lote.

### 3.2 Faltan restricciones de dominio a nivel de base de datos (riesgo medio)

El esquema confía enteramente en la capa de aplicación para invariantes que Postgres podría garantizar:

- `Inventory.quantity >= 0` y `reserved >= 0` y `reserved <= quantity`
- `InventoryLot.availableQuantity BETWEEN 0 AND initialQuantity`
- `StockMovement.quantity > 0` (el signo lo define `type`, así que un valor negativo corrompe el cálculo)
- `Order.total = subtotal - discount`
- `RecipeIngredient.quantity > 0`, `ProductionLog.traysProduced > 0`
- `ProductPresentation.unitsInStock > 0`

Prisma no expresa `CHECK`, pero se pueden añadir por migración SQL manual. Es la mejora de integridad con mejor relación costo/beneficio del modelo.

### 3.3 `StockMovement` con semántica polimórfica (riesgo medio)

`fromBranchId` y `toBranchId` son ambos opcionales, y qué combinación es válida depende de `type`:

| `type` | Esperado |
|---|---|
| `PRODUCCION`, `COMPRA`, `SOBRANTE` | solo `toBranchId` |
| `VENTA`, `MERMA`, `PERDIDA_ROBO` | solo `fromBranchId` |
| `TRANSFERENCIA` | ambos, y distintos |

El esquema permite las 4 combinaciones para los 7 tipos, incluyendo el caso absurdo de ambos nulos. Esto es un contrato implícito que solo vive en el código. Igualmente `productionLogId` solo debe existir cuando `type = PRODUCCION`, y `expiresAt` solo tiene sentido en `COMPRA`.

Se resuelve con `CHECK` compuestos, sin tocar la estructura de tablas. **No recomiendo partir `StockMovement` en varias tablas por tipo**: perdería el libro mayor unificado, que es su mayor virtud (un solo `ORDER BY createdAt` reconstruye la historia de stock).

### 3.4 Inconsistencia en políticas `onDelete` (riesgo medio)

Las reglas de borrado no siguen un criterio uniforme:

| Relación | Política | Comentario |
|---|---|---|
| `Product → Inventory` | por defecto (`Restrict`) | ✔ bien, protege stock |
| `Product → InventoryLot` | `Cascade` | ⚠️ borrar un producto borra su trazabilidad de lotes |
| `Product → OrderItem` | `Restrict` | ✔ bien |
| `Product → StockMovement` | `Restrict` | ✔ bien |
| `Product → ProductImage` | por defecto | ⚠️ deja imágenes huérfanas bloqueando el borrado |
| `Product → ProductPresentation` | `Cascade` | ✔ coherente (dependiente débil) |
| `Branch → InventoryLot` | `Cascade` | ⚠️ borrar sucursal destruye lotes históricos |
| `Branch → Inventory / StockMovement / Order` | `Restrict` | ✔ |

El resultado práctico es que un `Product` es indeleble por sus `OrderItem`/`StockMovement` (correcto), así que el `Cascade` en `InventoryLot` casi nunca se dispara. Pero la asimetría es una trampa para el próximo desarrollador. **Recomendación:** unificar la política — entidades maestras (`Product`, `Branch`, `User`, `Category`, `RawMaterial`) nunca se borran físicamente, solo con `isActive = false`; y dejar `Cascade` únicamente en dependientes débiles (`ProductImage`, `ProductPresentation`, `RecipeIngredient`, `OrderItem`, `DailyCloseItem`, tokens).

Nota: `Category` y `Branch` no tienen campo `isActive`, a diferencia de `Product`, `RawMaterial`, `Recipe` y `ProductPresentation`. Es una asimetría a corregir si se pretende desactivar una sucursal sin borrarla.

### 3.5 `Branch.name` no es único (riesgo bajo)

`slug` es único pero `name` no. Dos sucursales podrían llamarse igual con slugs distintos, lo que confunde en reportes y en el selector del POS. Mismo caso en `Recipe.name` (que sí tiene sentido repetir entre productos distintos, pero debería ser único por `productId`: falta `@@unique([productId, name])`).

### 3.6 `Order` sin sucursal ni usuario obligatorios (riesgo bajo–medio)

`Order.branchId` y `Order.userId` son ambos opcionales. `userId` nulo es correcto (venta de mostrador sin cliente registrado). Pero `branchId` nulo significa una venta que no descuenta de ninguna sucursal, lo que rompe el cuadre de inventario. Si en la práctica todo pedido tiene sucursal, debería ser obligatorio.

Falta también un campo de fecha/hora de retiro comprometida (`pickupAt`) y de estado de pago; hoy `paymentMethod` es un `String?` libre en lugar de un enum, lo que degrada los reportes de ventas por método de pago.

### 3.7 Falta el eslabón de compras a proveedor (brecha funcional, no error)

El enum `UnitOfPurchase` (QUINTAL, ARROBA, GALÓN, CARTÓN...) existe y documenta la conversión a `BaseUnit`, pero **no hay ninguna tabla que lo use**: no existe `Supplier` ni `Purchase`/`PurchaseItem`. Consecuencias:

- `RawMaterial.costPerUnit` es un "costo promedio" que alguien debe mantener a mano, sin historial de cómo llegó a ese valor.
- No hay trazabilidad de a qué proveedor se le compró un lote de harina, ni comparación de precios.
- No hay lotes ni caducidad de materia prima (sí los hay para producto terminado). Para levadura o manteca esto puede importar.
- El costo de producción de un amasijo se puede calcular, pero no se persiste, así que un cambio de `costPerUnit` reescribe retroactivamente la rentabilidad histórica.

Esto es lo único donde yo **sí agregaría tablas** (2–3), no donde las quitaría.

### 3.8 Índices: bien cubiertos, con dos huecos

La cobertura de índices es notablemente buena (`@@index` en todas las FK de consulta frecuente, compuestos en `[type, createdAt]`, `[branchId, expiresAt]`, `[userId, isRead]`). Dos observaciones:

- `InventoryLot.@@index([availableQuantity])` en solitario es poco útil: la consulta FEFO real filtra por producto+sucursal y ordena por vencimiento. Sería mejor `@@index([productId, branchId, availableQuantity, expiresAt])`.
- `Notification` y `AuditLog` crecen sin límite y sin política de retención. Convendría particionado o purga programada.

---

## 4. ¿Se pueden reducir tablas? Análisis caso por caso

### 4.1 Redundancia real: combos en `Product` vs `ProductPresentation`

Esta es la **única duplicación conceptual del esquema**. `Product` tiene:

```
basePrice, comboQuantity, comboPrice, stockUnitLabel
```

Y `ProductPresentation` modela exactamente lo mismo, pero mejor: `name`, `unitsInStock`, `price`, `isForSale`, `isDefault`. Una presentación "3 piezas por Q1.25" es idénticamente un combo 3×1.25.

Es decir: existen **dos mecanismos de precios por cantidad**, y ambos activos, con `OrderItem` guardando snapshot de presentación pero calculando precio potencialmente por la vía del combo. Eso es el tipo de ambigüedad que produce discrepancias de centavos en cierres.

**Recomendación:** `ProductPresentation` es el modelo superior (soporta N presentaciones, no solo una). Migrar los combos existentes a presentaciones y deprecar `comboQuantity`/`comboPrice`. No elimina una tabla, elimina un camino de código duplicado — que vale más.

Falta también un `@@unique` parcial que garantice **una sola** presentación con `isDefault = true` por producto (Postgres lo permite con índice único parcial `WHERE isDefault`).

### 4.2 Candidatas discutibles en notificaciones

- `NotificationConfig` (plantillas) vs `Notification` (instancias): **separación correcta**, no fusionar. Son cardinalidades 1:N con ciclos de vida opuestos (una plantilla vive años, una notificación se lee y caduca).
- `PushSubscription` vs `TrustedDevice`: ambas representan "un dispositivo de un usuario" y ambas guardan `userAgent`. Se podría argumentar una sola tabla `UserDevice` con campos push opcionales. **No lo recomiendo:** el ciclo de vida difiere (una suscripción push se invalida por el navegador con 410 Gone; un dispositivo de confianza se invalida por decisión de seguridad) y mezclarlas obligaría a nulos condicionales.
- `AlertState` es una máquina de estados anti-spam bien aislada. Se mantiene.

### 4.3 Candidatas reales a fusión (bloque Telegram)

Es el bloque más pesado en relación a su valor de negocio: **5 tablas para un canal de notificación**.

| Tabla | Función | Veredicto |
|---|---|---|
| `TelegramLink` | Vínculo usuario ↔ chat | **Necesaria** |
| `TelegramLinkToken` | Token de un solo uso para vincular | **Necesaria** (hasheado, con expiración y revocación: bien hecho) |
| `TelegramUpdate` | Idempotencia de webhooks (`updateId` como PK) | **Necesaria** pero debería vivir en una caché con TTL (Redis) o tener purga agresiva; crece indefinidamente para nada |
| `TelegramLinkAttempt` | Rate-limit de intentos de vinculación | **Fusionable** — es el mismo patrón que `LoginAttempt`. Una tabla genérica `SecurityAttempt(kind, subject, ip, success, reason, createdAt)` cubriría ambos casos y quitaría una tabla |
| `AssistantAccess` | 1:1 con `User`, campos `enabled` + `scope` (enum con **un solo valor**) | **Fusionable** — una relación 1:1 con dos campos, uno de ellos con un único valor posible, es un caso de libro de campos que pertenecen a `User` (`assistantEnabled`, `assistantScope`). La tabla solo se justifica si se anticipa que el asistente crezca con permisos granulares |

Ahorro realista: **2 tablas** (`TelegramLinkAttempt` → fusionada con `LoginAttempt`; `AssistantAccess` → campos en `User`). Pasar de 33 a 31 tablas. Es un ahorro cosmético; si el bloque funciona, el costo de la migración probablemente supere el beneficio.

### 4.4 Lo que NO se debe fusionar (aunque tiente)

| Tentación | Por qué no |
|---|---|
| Unir `Inventory` y `RawMaterialInventory` | Tipos de unidad distintos (`Int` vs `Decimal(12,4)`), `reserved` solo aplica a producto terminado, y la materia prima no se vende. Fusionarlas obligaría a una tabla polimórfica con FKs opcionales — peor |
| Unir `Recipe` y `RecipeIngredient` | Violaría 1NF |
| Unir `Order` y `OrderItem` | Idem |
| Unir `InventoryLot` y `StockMovement` | Un movimiento puede consumir N lotes y un lote puede alimentar N movimientos: es N:M, y `InventoryLotConsumption` es la tabla puente obligatoria. Esta es precisamente la parte mejor diseñada del esquema |
| Unir `DailyClose` y `DailyCloseItem` | Cabecera/detalle clásico |
| Unir `Category` en `Product` como string | Perdería integridad referencial y el `slug` para SEO |
| Eliminar `AuditLog` | Es requisito de un negocio con múltiples empleados manipulando stock y precios |
| Eliminar `SystemConfig` | Alternativa sería hardcodear o usar env vars, ambas peores para configuración editable por el admin |

---

## 5. Evaluación de cardinalidades y relaciones

Todas las cardinalidades declaradas son coherentes con el dominio:

```
Category    1 ──< N  Product
Product     1 ──< N  ProductImage | ProductPresentation | Recipe
Product     N >──< N Branch        (vía Inventory, con unique)
Product     N >──< N Branch        (vía InventoryLot, N lotes por par)
RawMaterial N >──< N Recipe        (vía RecipeIngredient, con unique)
RawMaterial N >──< N Branch        (vía RawMaterialInventory, con unique)
Recipe      1 ──< N  ProductionLog >── 1 Branch, 1 User
StockMovement N >──< N InventoryLot (vía InventoryLotConsumption)  ← FEFO auditable
Order       1 ──< N  OrderItem >── 1 Product, 0..1 ProductPresentation
Branch      1 ──< N  DailyClose (unique por closeDate) 1 ──< N DailyCloseItem
User        1 ──< N  RefreshToken | TrustedDevice | Notification | PushSubscription
User        1 ──  1  AssistantAccess | TelegramLink
```

Puntos fuertes concretos:

1. **`StockMovement` con doble FK a `Branch`** (`FromBranch`/`ToBranch`) modela la transferencia entre sucursales en una sola fila. Elegante.
2. **`InventoryLot.sourceMovementId`** cierra el ciclo: cada lote sabe qué movimiento lo creó, y `InventoryLotConsumption` sabe qué movimientos lo consumieron. Trazabilidad completa en ambos sentidos.
3. **`InventoryLotSource.TRANSFERENCIA`** preserva la caducidad al mover stock — un detalle que muchos sistemas comerciales hacen mal.
4. **`DailyClose` con `@@unique([branchId, closeDate])`** impide dos cierres del mismo día. `DailyCloseItem` guarda `systemQty`, `countedQty`, `wasteQty`, `soldQty` y `surplusQty`: el descuadre queda documentado en lugar de corregido silenciosamente, y se enlaza a los `StockMovement` de ajuste generados.
5. **`RefreshToken` con `hashedToken`, `revokedAt`, `userAgent`, `ipAddress`** — rotación y revocación por dispositivo bien modeladas.
6. **Unidad base normalizada** (`BaseUnit` LB/ML/UNIT) con conversión desde `UnitOfPurchase` en el backend: evita el error clásico de mezclar quintales con libras en la misma columna.

---

## 6. Mejoras recomendadas, priorizadas

### Prioridad alta (integridad de datos)

1. **`CHECK` constraints por migración SQL** para stock no negativo, `reserved <= quantity`, `availableQuantity <= initialQuantity`, `StockMovement.quantity > 0`, `total = subtotal - discount`.
2. **Job de reconciliación** `Inventory.quantity` vs `SUM(InventoryLot.availableQuantity)`, reportando por `AlertState`.
3. **Deprecar `comboQuantity`/`comboPrice`** en favor de `ProductPresentation`, para tener un único camino de cálculo de precio (§4.1).
4. **Índice único parcial** para una sola `ProductPresentation.isDefault` por producto.

### Prioridad media (coherencia del modelo)

5. **Unificar políticas `onDelete`**: maestras con borrado lógico (`isActive`), débiles con `Cascade`. Añadir `isActive` a `Branch` y `Category`.
6. **`CHECK` de coherencia en `StockMovement`** según `type` (qué sucursales y qué FKs opcionales son válidas).
7. **`Order.branchId` obligatorio**; convertir `paymentMethod` a enum; añadir `pickupAt`.
8. **`@@unique([productId, name])` en `Recipe`**; `@@unique` en `Branch.name`.
9. **Índice compuesto FEFO** en `InventoryLot(productId, branchId, availableQuantity, expiresAt)`.

### Prioridad media (brecha funcional)

10. **Añadir `Supplier` + `Purchase` + `PurchaseItem`** (usando `UnitOfPurchase`, hoy huérfano) para tener historial de costos y trazabilidad de compras. Opcionalmente `RawMaterialLot` si la caducidad de insumos importa.
11. **Persistir el costo del amasijo** en `ProductionLog` (snapshot `unitCost`/`totalCost`) para que la rentabilidad histórica no se reescriba al cambiar `costPerUnit`.

### Prioridad baja (limpieza)

12. Fusionar `TelegramLinkAttempt` con `LoginAttempt` en una tabla `SecurityAttempt` genérica.
13. Mover `AssistantAccess` a campos de `User` (o mantener si se prevé crecimiento de permisos).
14. Política de retención/purga para `AuditLog`, `Notification`, `LoginAttempt` y `TelegramUpdate`.
15. Considerar mover `TelegramUpdate` (idempotencia de webhook) a una caché con TTL en lugar de Postgres.

---

## 7. Respuesta directa a la pregunta planteada

> *"En mi opinión son muchas tablas para un negocio de panadería, pero si son necesarias y están bien normalizadas, se quedan así."*

**Se quedan así.** El conteo de tablas es proporcional al alcance funcional, no inflado:

- La normalización es correcta hasta 3NF, y las desnormalizaciones existentes son snapshots históricos deliberados y bien elegidos.
- Las claves naturales están protegidas con `@@unique` donde corresponde, lo que es el principal indicador de un modelo pensado y no autogenerado.
- La parte más compleja del esquema (lotes, consumos y movimientos para FEFO con caducidad) es también la mejor resuelta, y es justamente la que no se puede simplificar sin perder trazabilidad.
- No hay tablas muertas: las 33 se usan en el código.
- El margen de reducción real es de 2 tablas (~6%), y su beneficio es cosmético frente al costo de migración.

El trabajo pendiente **no es reducir tablas, es endurecer el modelo**: mover invariantes del código a la base de datos (`CHECK`), unificar las políticas de borrado, eliminar el doble camino de precios de combo, y cerrar la brecha de compras a proveedor. Ese es el orden de valor.

---

*Informe de solo análisis. No se generó ni modificó código de aplicación.*
