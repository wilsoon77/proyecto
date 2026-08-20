# Plan: Cierre de Día (registro de ventas por diferencia)

> **Estado actual (2026-08-11):** El cierre diario ya está implementado. Para productos con presentaciones comerciales, el formulario permite registrar tiras, medias tiras y piezas sueltas; la API convierte el conteo a unidades base antes de ajustar `Inventory`. Este archivo conserva el plan original como referencia histórica. Para el comportamiento vigente, consultar [`PRESENTACIONES_PRODUCTO.md`](PRESENTACIONES_PRODUCTO.md) y el código de `api/src/daily-close/`.

## 1. Objetivo

Resolver el problema actual: la producción suma unidades al inventario de producto terminado (`Inventory`), pero como las ventas del día no se registran una a una, el stock de productos **crece indefinidamente** y deja de reflejar la realidad.

La solución es un flujo de **"Cierre de Día"**: al final de la jornada se cuenta lo que sobró de cada producto, y el sistema calcula lo vendido por diferencia, ajustando el inventario en una sola operación.

**Fórmula central:**

```
vendido = stockInicial + producidoHoy - merma - conteoFinal
```

Donde:
- `stockInicial` = `Inventory.quantity` al momento del cierre (ya incluye lo producido, porque `registerProduction` suma al inventario).
- En la práctica, como el inventario ya tiene sumada la producción: `vendido = Inventory.quantity - merma - conteoFinal`.

> Nota: las **alertas de materia prima no dependen de este flujo**. Siguen dependiendo únicamente de registrar la producción (`ProductionService.registerProduction`), que es lo que descuenta de `RawMaterialInventory`. Este plan solo corrige el inventario de producto terminado.

---

## 2. Lo que ya existe y se reutiliza

| Pieza existente | Uso en este plan |
|---|---|
| `StockMovementType.VENTA` | Movimiento de resta para las unidades vendidas calculadas |
| `StockMovementType.MERMA` | Movimiento de resta para pan dañado/no vendible reportado en el cierre |
| `StockMovementType.SOBRANTE` | Ajuste positivo si el conteo físico da MÁS de lo que dice el sistema |
| `StockMovement.referenceId` | Vincular todos los movimientos de un mismo cierre (ej. `CIERRE-2026-07-21-B1`) |
| `Inventory` (`@@unique([productId, branchId])`) | Fuente del stock actual por sucursal |
| `ProductionLog` / `registerProduction` | Sin cambios: sigue siendo el origen del descuento de materia prima |
| Patrón de transacción de `production.service.ts` | Mismo patrón `$rollback` atómico para el cierre |

No se necesita modificar el enum ni los modelos existentes. Solo se agrega **un modelo nuevo** y **un módulo nuevo**.

---

## 3. Cambios en el schema de Prisma

### 3.1 Nuevo modelo `DailyClose`

```prisma
model DailyClose {
  id         Int              @id @default(autoincrement())
  branch     Branch           @relation(fields: [branchId], references: [id])
  branchId   Int
  user       User             @relation(fields: [userId], references: [id])
  userId     String
  closeDate  DateTime         @db.Date   // Día que se está cerrando (permite cerrar "ayer")
  note       String?
  items      DailyCloseItem[]
  createdAt  DateTime         @default(now())

  @@unique([branchId, closeDate])  // Un solo cierre por sucursal por día
  @@index([closeDate])
}

model DailyCloseItem {
  id            Int        @id @default(autoincrement())
  dailyClose    DailyClose @relation(fields: [dailyCloseId], references: [id], onDelete: Cascade)
  dailyCloseId  Int
  product       Product    @relation(fields: [productId], references: [id])
  productId     Int
  systemQty     Int        // Lo que decía Inventory.quantity antes del cierre
  countedQty    Int        // Lo que contaron físicamente
  wasteQty      Int        @default(0)  // Merma reportada (pan quemado, dañado)
  soldQty       Int        // Calculado: systemQty - wasteQty - countedQty (o negativo → sobrante)

  @@unique([dailyCloseId, productId])
}
```

**Por qué un modelo propio y no solo `StockMovement`:** el cierre es un documento auditable ("qué se contó ese día") y permite el reporte histórico de ventas/mermas por día sin reconstruirlo desde movimientos sueltos. Los `StockMovement` siguen siendo la fuente de verdad del inventario; `DailyClose` es el comprobante.

### 3.2 Restricción clave

`@@unique([branchId, closeDate])` impide cerrar dos veces el mismo día en la misma sucursal (evita descontar ventas duplicadas).

---

## 4. Nuevo módulo `daily-close`

Estructura:

```
api/src/daily-close/
├── daily-close.module.ts
├── daily-close.controller.ts
├── daily-close.service.ts
└── dto/
    ├── create-daily-close.dto.ts
    └── daily-close-response.dto.ts
```

### 4.1 Endpoints

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/daily-close/preview?branchId=&date=` | MANAGER+ | Devuelve la lista de productos con `Inventory.quantity > 0` de la sucursal, para prellenar el formulario de conteo |
| `POST` | `/daily-close` | MANAGER+ | Ejecuta el cierre (transaccional) |
| `GET` | `/daily-close?branchId=&from=&to=` | MANAGER+ | Historial de cierres con totales (vendido, merma, sobrante por día) |
| `GET` | `/daily-close/:id` | MANAGER+ | Detalle de un cierre (items, quién lo hizo, movimientos generados) |

### 4.2 DTO de creación

```ts
// create-daily-close.dto.ts
class DailyCloseItemDto {
  @IsInt() @Min(1)
  productId: number;

  @IsInt() @Min(0)
  countedQty: number;   // Lo que quedó físicamente

  @IsInt() @Min(0) @IsOptional()
  wasteQty?: number;    // Merma (default 0)
}

class CreateDailyCloseDto {
  @IsInt()
  branchId: number;

  @IsDateString()
  closeDate: string;    // Permite registrar el cierre de "ayer" si se olvidó

  @IsOptional() @IsString() @MaxLength(500)
  note?: string;

  @ValidateNested({ each: true }) @ArrayMinSize(1)
  items: DailyCloseItemDto[];
}
```

### 4.3 Lógica del `POST /daily-close` (transacción única)

Dentro de un `prisma.$transaction`:

1. **Validar duplicado:** si ya existe `DailyClose` para `(branchId, closeDate)` → `409 Conflict` con mensaje claro ("Ya existe un cierre para esta fecha").
2. **Validar fecha:** `closeDate` no puede ser futura ni mayor a N días atrás (configurable, sugerido: 3 días).
3. **Cargar inventarios** de todos los `productId` del DTO en **una sola consulta** (`findMany` con `in`) — evitar N+1.
4. Por cada item:
   - `systemQty = inventory.quantity`
   - `soldQty = systemQty - wasteQty - countedQty`
   - **Caso normal (`soldQty > 0`):** crear `StockMovement` tipo `VENTA` por `soldQty`, y si `wasteQty > 0` otro tipo `MERMA`.
   - **Caso sobrante (`soldQty < 0`):** contaron más de lo que dice el sistema. Crear `StockMovement` tipo `SOBRANTE` por el excedente y guardar `soldQty = 0` en el item, con el excedente reflejado. No bloquear el cierre — registrar y continuar (es un error de conteo previo, no del cierre actual).
   - **Caso sin ventas (`soldQty === 0` y `wasteQty === 0`):** no crear movimientos, solo el item (documenta que se contó).
   - Actualizar `Inventory.quantity = countedQty` (el conteo físico manda — el inventario queda alineado con la realidad).
   - Todos los movimientos con `referenceId = "CIERRE-{closeDate}-B{branchId}"` y `userId` del solicitante.
5. Crear `DailyClose` + `DailyCloseItem[]`.
6. Registrar en auditoría (mismo patrón que producción).

**Validación de scope:** solo `ADMIN` y `MANAGER` pueden ejecutar el cierre. `MANAGER` puede seleccionar cualquiera de las dos sucursales; `ADMIN` conserva alcance global.

### 4.4 Respuesta del endpoint

```json
{
  "id": 12,
  "closeDate": "2026-07-21",
  "branchId": 1,
  "summary": {
    "totalSold": 950,
    "totalWaste": 23,
    "totalSurplus": 0,
    "productsClosed": 8
  },
  "items": [
    { "product": "Pan francés", "systemQty": 1188, "countedQty": 215, "wasteQty": 23, "soldQty": 950 }
  ]
}
```

---

## 5. Ajuste al flujo de producción (mínimo)

Para el caso "no registraron la producción durante el día y la cargan en la noche junto con el cierre":

- Agregar campo opcional `producedAt?: string` (`@IsDateString`) al DTO de `registerProduction`, con validación de no-futuro y máximo N días atrás.
- El descuento de materia prima y las alertas funcionan igual; solo cambia la fecha del `ProductionLog` para que los reportes por día sean correctos.

**Orden recomendado en la UI:** primero registrar la(s) producción(es) del día, después el cierre. El `preview` del cierre ya mostrará el stock con la producción incluida.

---

## 6. Casos borde a cubrir

| Caso | Comportamiento |
|---|---|
| Cierre duplicado (misma sucursal + fecha) | `409 Conflict`, no se ejecuta nada |
| `countedQty + wasteQty > systemQty` | Se registra `SOBRANTE` por la diferencia; el inventario queda = conteo físico |
| Producto con `reserved > 0` (pedidos pendientes) | Advertir en el `preview` y validar que `countedQty >= reserved`, o descontar reservados del cálculo — decidir en implementación |
| Producto olvidado en el conteo | No se ajusta (queda con stock del sistema); el `preview` prellenado minimiza este caso |
| Registro retroactivo (> N días) | `400 Bad Request` con mensaje claro |
| Concurrencia (dos cierres simultáneos) | El `@@unique([branchId, closeDate])` + transacción lo previene a nivel BD |

---

## 7. Reporte derivado (valor agregado)

Con `DailyClose` acumulado, el endpoint de historial permite sin esfuerzo extra:

- Ventas por producto por día (para saber qué hornear más/menos).
- Merma por día (detectar sobreproducción: si la merma sube, están horneando de más).
- Comparativo producción vs. venta (eficiencia).

Esto es información que la panadería hoy no tiene y sale "gratis" del mismo flujo.

---

## 8. Orden de implementación sugerido

1. Migración Prisma: modelos `DailyClose` y `DailyCloseItem`.
2. `daily-close.service.ts` con la transacción del cierre + tests de los casos borde.
3. `daily-close.controller.ts` + DTOs + guards de rol/sucursal.
4. `GET /daily-close/preview` para prellenar el formulario.
5. Campo `producedAt` retroactivo en producción.
6. Endpoints de historial y detalle.
7. UI: formulario de cierre (tabla prellenada con productos y campo "quedaron X").
