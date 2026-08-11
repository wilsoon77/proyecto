# Presentaciones comerciales de productos

## Propósito

Una presentación representa la forma en que un producto se vende o se registra operativamente sin crear otro producto. Esto resuelve productos que tienen una unidad física base, pero se comercializan en paquetes, tiras, medias tiras, docenas u otras agrupaciones.

La fuente de verdad del modelo es `api/prisma/schema.prisma` y la implementación se encuentra en `ProductPresentation`.

## Modelo de datos

Cada `Product` conserva su inventario en una unidad física base:

- `stockUnitLabel`: nombre legible de la unidad base, por ejemplo `piezas` o `unidades`.
- `available`: stock disponible en unidades físicas base.

Cada producto puede tener varias filas relacionadas en `ProductPresentation`:

| Campo | Uso |
|---|---|
| `name` | Nombre comercial u operativo: `Media tira`, `Tira completa`, `Docena` |
| `unitsInStock` | Cuántas unidades físicas base consume una presentación |
| `price` | Precio de venta de esa presentación |
| `isForSale` | Permite elegirla en catálogo y pedidos |
| `isForProduction` | Permite usarla en el registro de producción |
| `isDefault` | Presentación de venta que aparece primero en el catálogo |
| `isActive` | Oculta la presentación sin borrar el historial |
| `sortOrder` | Orden visual |

No se crean productos duplicados para cada presentación. El inventario continúa siendo único por producto y sucursal.

## Configuración inicial: Pan Francés

La migración y el seed configuran:

| Presentación | Piezas base | Precio inicial | Venta | Producción |
|---|---:|---:|---|---|
| Tira completa | 6 | Q2.50 | Sí, predeterminada | Sí |
| Media tira | 3 | Q1.25 | Sí | Sí |

El precio y las cantidades no están fijados en la interfaz. Los valores anteriores son únicamente la configuración inicial.

## Cómo cambiar precios

1. Abrir **Administración → Productos**.
2. Editar el producto.
3. En **Presentaciones del producto**, cambiar `Precio Q` de la presentación correspondiente.
4. Guardar el producto.

El nuevo precio se usa en el catálogo, carrito, checkout y nuevos pedidos. Los pedidos existentes conservan el precio histórico guardado en `OrderItem.unitPrice`, por lo que cambiar un precio no modifica ventas anteriores.

Cambiar `price` tampoco cambia `unitsInStock` ni el inventario. Esas son configuraciones independientes.

### Regla de presentación predeterminada

Solo debe existir una presentación de venta activa predeterminada. Si no se marca ninguna, la API selecciona automáticamente la primera presentación de venta activa. Las presentaciones de venta deben tener precio.

## Flujo de venta e inventario

El cliente selecciona una presentación y el frontend envía su `presentationId` junto con la cantidad comercial.

Ejemplo: vender 3 tiras completas de Pan Francés:

```text
Cantidad comercial: 3
Presentación: Tira completa
Precio: 3 × Q2.50 = Q7.50
Reserva de inventario: 3 × 6 = 18 piezas base
```

La orden conserva ambos conceptos: la cantidad comercial y la equivalencia física. Para cancelar o entregar la orden, el backend utiliza la cantidad física almacenada en `OrderItem.quantity`, por lo que no se requiere recalcular manualmente.

Si un producto tiene una sola presentación de venta, la API puede usarla como compatibilidad cuando un cliente antiguo no envía `presentationId`. Si tiene varias, se debe seleccionar una explícitamente.

## Cierre diario

En **Administración → Cierre del día**, los productos con presentaciones muestran campos separados para cada presentación y un campo de piezas sueltas.

Ejemplo de conteo físico:

```text
Tira completa: 10
Media tira:    1
Sueltas:       2 piezas
Total físico:  10 × 6 + 1 × 3 + 2 = 65 piezas base
```

La interfaz realiza la conversión. El cierre y los movimientos de inventario se guardan en unidades físicas base para mantener consistencia con `Inventory` y `StockMovement`.

## Conteo y reconciliación de inventario

En **Administración → Inventario → Conteo**, el flujo es equivalente al cierre diario:

- Se muestran las presentaciones activas del producto.
- El usuario puede registrar tiras, medias tiras y piezas sueltas.
- La API convierte el conteo a unidades base antes de calcular `SOBRANTE` o `MERMA`.
- Las piezas reservadas siguen validándose contra el conteo físico.

Los productos sin presentaciones conservan el campo tradicional de unidades base.

## Producción

En **Administración → Producción**, una receta puede registrar el resultado usando una presentación marcada con `isForProduction`.

El sistema guarda la presentación y la cantidad comercial en `ProductionLog`, pero suma al inventario las unidades físicas equivalentes. Cuando la receta produce una cantidad fija por lata, la cantidad de presentaciones debe ser múltiplo de las presentaciones que caben en una lata:

```text
presentacionesPorLata = unitsPerTray / unitsInStock
```

Esto mantiene alineado el descuento de materia prima por receta con el producto terminado registrado.

## Combos existentes

La migración `20260811110000_add_product_presentations` convierte los productos existentes que tienen `comboQuantity` y `comboPrice` en una presentación llamada `Combo de N`. Los campos antiguos se conservan para compatibilidad, pero el catálogo y los nuevos flujos utilizan la presentación.

## Migración y despliegue

La migración agrega:

- La columna `Product.stockUnitLabel`.
- La tabla `ProductPresentation`.
- Referencias opcionales de presentación en `OrderItem` y `ProductionLog`.

En producción, después de desplegar el backend y tener configuradas las variables de Supabase:

```powershell
cd api
npm.cmd run prisma:generate
npm.cmd run prisma:deploy
```

El seed es opcional. Si se ejecuta nuevamente, restablece los precios iniciales del Pan Francés (Q2.50 y Q1.25). No debe ejecutarse después de cambiar precios manualmente, salvo que se quieran restaurar esos valores.

## Archivos relacionados

- `api/prisma/schema.prisma`
- `api/prisma/migrations/20260811110000_add_product_presentations/migration.sql`
- `api/src/products/presentation.helpers.ts`
- `web/src/lib/presentation-quantities.ts`
- `web/src/components/admin/ProductPresentationsEditor.tsx`
- `web/src/components/admin/PresentationCountFields.tsx`
