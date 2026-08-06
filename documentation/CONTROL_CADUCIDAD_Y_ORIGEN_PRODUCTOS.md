# Control de caducidad y origen de productos

## Regla de negocio

- `PRODUCIDO`: panes y productos elaborados en la panadería. Se registran por producción/receta y nunca solicitan fecha de caducidad.
- `COMPRADO`: jugos, galletas y otros productos adquiridos a proveedores. Pueden activar el control de caducidad.

La API aplica la regla aunque un cliente envíe manualmente una fecha para un producto producido.

## Configuración del producto

En `Productos > Nuevo producto` o al editar:

1. Seleccionar `Producido` o `Comprado`.
2. Si es `Comprado`, activar `Controlar fecha de caducidad` cuando corresponda.
3. Al activar el control, indicar la fecha de vencimiento del primer lote y cuántos días antes se debe avisar.
4. Al guardar, el sistema abre directamente `Inventario > Registrar movimiento > Compra` con el producto y la fecha precargados. Solo se debe seleccionar la sucursal e ingresar la cantidad para crear el lote.

La fecha se guarda en el lote inicial, no en la ficha del producto, porque cada compra posterior puede tener una fecha de vencimiento diferente.

La fecha de alerta se calcula automáticamente para cada lote: `fecha de caducidad - días configurados`.

## Registro operativo

- Producción de pan: se utiliza el flujo existente de producción; no aparece ningún campo de caducidad.
- Compra de producto comprado con control activo: desde el alta del producto se puede continuar directamente a `Inventario > Registrar movimiento > Compra`; la fecha del primer lote queda precargada y se muestra la fecha de alerta calculada.
- Venta/POS y pedidos: consumen lotes vigentes en orden FEFO (primero el que caduca antes).
- Merma: también puede retirar lotes vencidos para que el inventario no quede bloqueado.
- Transferencias: conservan la fecha de caducidad del lote entre sucursales.

## Alertas y consulta

La tarea diaria revisa los lotes con existencia a las 07:00 usando `STORE_TIMEZONE` y genera una alerta por lote cuando entra en el período configurado o ya está vencido. También se puede ejecutar `Revisar alertas` desde `Inventario > Caducidades`.

La pantalla permite filtrar por sucursal, vencidos, próximos a vencer y lotes sin fecha. Los productos producidos no se muestran porque no requieren caducidad.

## Persistencia y migración

La migración `20260804120000_add_product_expiration_lots` agrega:

- configuración de caducidad en `Product`;
- `InventoryLot` para conservar entradas y fechas;
- `InventoryLotConsumption` para auditar consumos;
- el tipo de alerta `PRODUCT_EXPIRY`.

El inventario positivo existente se conserva como lote `APERTURA` sin inventar fechas. Si posteriormente se activa el control para un producto comprado existente, se debe registrar una compra con fecha para las nuevas entradas.

En API, después de instalar dependencias:

```bash
npm run prisma:generate
npm run prisma:deploy
npm run seed
```

`seed` agrega las configuraciones `inventory.expiration_warning` e `inventory.expired_stock`. Debe ejecutarse una vez en el entorno que ya tenga la migración aplicada para que las notificaciones queden habilitadas.
