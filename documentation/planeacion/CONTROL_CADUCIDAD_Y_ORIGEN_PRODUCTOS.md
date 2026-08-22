# Control de caducidad y origen de productos

## Regla de negocio

- `PRODUCIDO`: panes y productos elaborados en la panadería. Se registran por producción/receta y nunca solicitan fecha de caducidad.
- `COMPRADO`: jugos, galletas y otros productos adquiridos a proveedores. Pueden activar el control de caducidad.

La API aplica la regla aunque un cliente envíe manualmente una fecha para un producto producido.

## Configuración del producto

En `Productos > Nuevo producto` o al editar:

1. Seleccionar `Producido` o `Comprado`.
2. Si es `Comprado`, activar `Controlar fecha de caducidad` cuando corresponda.
3. Al activar el control, indicar la fecha de vencimiento del primer lote y uno o varios días de anticipación separados por comas (por ejemplo, `30, 15, 3`).
4. Al guardar, el sistema abre directamente `Inventario > Registrar movimiento > Compra` con el producto y la fecha precargados. Solo se debe seleccionar la sucursal e ingresar la cantidad para crear el lote.

La fecha se guarda en el lote inicial, no en la ficha del producto, porque cada compra posterior puede tener una fecha de vencimiento diferente.

Para cada lote se calculan los recordatorios automáticamente: `fecha de caducidad - cada día configurado`. `InventoryLot.alertAt` conserva la primera fecha como referencia; las demás fechas se evalúan en el escáner diario. Si se ajusta una fecha distinta para un lote, esa fecha reemplaza los recordatorios del producto para ese lote; al enviar `alertAt: null` se restauran los recordatorios configurados en la ficha del producto.

## Registro operativo

- Producción de pan: se utiliza el flujo existente de producción; no aparece ningún campo de caducidad.
- Compra de producto comprado con control activo: desde el alta del producto se puede continuar directamente a `Inventario > Registrar movimiento > Compra`; la fecha del primer lote queda precargada y se muestra la fecha de alerta calculada.
- Retiro de pedidos y movimientos `VENTA`: consumen lotes vigentes en orden FEFO (primero el que caduca antes).
- Venta, reserva y transferencia: nunca utilizan lotes vencidos. El catálogo y el campo `available` excluyen esas unidades aunque el total físico todavía las conserve.
- Merma: también puede retirar lotes vencidos para que el inventario no quede bloqueado; el sistema consume primero esos lotes vencidos.
- Transferencias: conservan la fecha de caducidad del lote entre sucursales.

## Alertas y consulta

La tarea diaria revisa los lotes con existencia a las 07:00 usando `STORE_TIMEZONE` y genera una alerta por cada recordatorio configurado cuando llega su fecha. Los lotes vencidos no generan una alerta nueva ni se eliminan automáticamente: permanecen visibles para registrar una `MERMA`, que es la operación que descuenta su cantidad física. Mientras no se registre esa merma, `Inventory.quantity` conserva el total físico, pero el catálogo, las reservas, las ventas y las transferencias lo tratan como no vendible. También se puede ejecutar `Revisar alertas` desde `Inventario > Caducidades`.

La pantalla permite filtrar por sucursal, vencidos, próximos a vencer y lotes sin fecha. Los productos producidos no se muestran porque no requieren caducidad.

## Persistencia y migración

Las migraciones `20260804120000_add_product_expiration_lots` y `20260817110000_cash_only_and_multiple_expiration_reminders` agregan:

- configuración de caducidad en `Product.expirationAlertDays` como lista de días;
- `InventoryLot` para conservar entradas y fechas;
- `InventoryLotConsumption` para auditar consumos;
- el tipo de alerta `PRODUCT_EXPIRY` y eliminan el estado legado `PRODUCT_LOW` junto con configuraciones de notificación fuera de las dos reglas vigentes.

El inventario positivo existente se conserva como lote `APERTURA` sin inventar fechas. Si posteriormente se activa el control para un producto comprado existente, se debe registrar una compra con fecha para las nuevas entradas.

En API, después de instalar dependencias:

```bash
npm run prisma:generate
npm run prisma:deploy
npm run seed
```

`seed` conserva únicamente las configuraciones `inventory.raw_material_low` e `inventory.expiration_warning`. Debe ejecutarse una vez en el entorno que ya tenga las migraciones aplicadas para que las notificaciones queden habilitadas.
