# Analítica predictiva de demanda basada en historial

> **OBSOLETO:** Este módulo fue retirado del alcance operativo en agosto de 2026. Se conserva únicamente como referencia histórica; no forma parte de la aplicación actual ni de la base de datos. El panel Operación conserva solo indicadores operativos simples y una gráfica compacta.

## 1. Propósito

El sistema incorpora un módulo de analítica para estimar la demanda futura de cada producto por sucursal y convertir esa estimación en una recomendación de producción.

La funcionalidad responde a dos formas de operación de la panadería:

1. Registrar las ventas durante el día mediante pedidos o POS.
2. Registrar al final del día las ventas que no fueron ingresadas individualmente mediante el cierre diario.

Ambos flujos son compatibles y opcionales. La panadería puede utilizar POS, cierre diario o una combinación de ambos sin perder la capacidad de generar alertas y recomendaciones basadas en el historial.

La implementación actual es **analítica predictiva estadística**. No utiliza un modelo de inteligencia artificial generativa, un LLM ni un servicio externo de machine learning. El algoritmo es determinista, explicable y puede ser reemplazado posteriormente por un modelo más avanzado sin cambiar la interfaz del sistema.

## 2. Flujo general

~~~mermaid
flowchart LR
  A[Pedidos finalizados y POS] --> C[Reconciliación de demanda]
  B[Cierre diario: venta residual] --> C
  P[Producción y merma] --> D[Historial diario DemandDaily]
  C --> D
  D --> H[Historial por sucursal, producto y día operativo]
  H --> F[WMA_WEEKDAY_V1]
  F --> I[Pronóstico de próximos días abiertos]
  I --> R[Stock de seguridad e inventario disponible]
  R --> S[Producción recomendada]
  R --> M[Riesgo de receta y materia prima]
~~~

## 3. Fuentes de datos

### 3.1 Pedidos y POS

Solo se consideran ventas de pedidos en estados finalizados:

- `DELIVERED`
- `PICKED_UP`

El POS utiliza la misma entidad `Order`, diferenciándose mediante `shippingMethod = POS`. Esto permite consolidar pedidos en línea y ventas presenciales en una sola fuente histórica.

### 3.2 Cierre diario

`DailyCloseItem.soldQty` representa la venta residual calculada durante el cierre: productos vendidos que no fueron registrados mediante un pedido o POS.

No se vuelve a sumar una venta POS como si fuera una venta de cierre completa. El desglose se conserva en:

~~~text
orderQty       -> pedidos finalizados y POS
dailyCloseQty  -> venta residual del cierre
totalDemandQty -> orderQty + dailyCloseQty
~~~

La reconciliación está implementada en `demand-reconciliation.ts` y clasifica la calidad de la información como:

- `COMBINED`: existen pedidos/POS y cierre residual.
- `ORDER`: solo existen pedidos/POS.
- `DAILY_CLOSE`: solo existe cierre residual.
- `OPERATIONAL_ONLY`: hubo producción o merma, pero no una venta registrada.
- `NO_DATA`: no existe información operativa para ese producto y día.

### 3.3 Producción y merma

La producción y la merma se almacenan en el historial para análisis y drill-down. No se suman automáticamente como demanda vendida, porque producir un producto no significa necesariamente que se haya vendido.

## 4. Modelo histórico

`DemandDaily` es un read model diario con la siguiente granularidad:

~~~text
sucursal + producto + fecha de negocio
~~~

Conserva:

- Demanda total.
- Pedidos/POS.
- Venta residual del cierre.
- Producción.
- Merma.
- Calidad del dato.
- Desglose de fuentes.
- Indicador de stockout histórico.

La fecha de negocio utiliza la zona horaria configurada en `STORE_TIMEZONE`. Para la panadería se recomienda:

~~~env
STORE_TIMEZONE=America/Guatemala
~~~

## 5. Calendario operativo

El historial y el pronóstico respetan los días en que la tienda abre. Por defecto, la panadería opera de lunes a sábado y domingo no participa en el cálculo.

~~~env
# Domingo=0, lunes=1, ..., sábado=6
STORE_OPERATING_DAYS=1,2,3,4,5,6
~~~

Ejemplos:

~~~env
# Lunes a viernes
STORE_OPERATING_DAYS=1,2,3,4,5

# Todos los días
STORE_OPERATING_DAYS=0,1,2,3,4,5,6
~~~

El horizonte predeterminado de 7 días representa 7 días operativos, no 7 días calendario. Si el cálculo se ejecuta un sábado, la primera fecha proyectada será el lunes.

La configuración se utiliza en:

- Sincronización del historial.
- Series del dashboard y drill-down.
- Fechas futuras del pronóstico.
- Backtesting.

Si se modifica en Render, es necesario reiniciar o volver a desplegar la API.

## 6. Algoritmo WMA_WEEKDAY_V1

El servicio utiliza una ventana histórica de hasta 90 días calendario, filtrada por los días operativos de la tienda.

### 6.1 Promedio reciente ponderado

Se toman los últimos 7 valores disponibles. Los valores más recientes tienen mayor peso:

~~~text
WMA = (q1*1 + q2*2 + ... + q7*7) / (1 + 2 + ... + 7)
~~~

Esto permite que cambios recientes tengan más influencia que ventas antiguas.

### 6.2 Componente por día de la semana

Para pronosticar una fecha, se buscan hasta las últimas 8 observaciones del mismo día de la semana. Por ejemplo, para un lunes se buscan lunes anteriores.

El modelo completo se activa cuando se cumplen ambas condiciones:

- Al menos 30 observaciones históricas.
- Al menos 2 observaciones del mismo día de la semana objetivo.

La predicción se calcula así:

~~~text
predicción = 40% promedio reciente ponderado
           + 60% promedio del mismo día de la semana
~~~

El método se identifica como:

~~~text
WMA_WEEKDAY
~~~

### 6.3 Fallback para poco historial

El fallback no inventa datos ni genera valores aleatorios. Es una estrategia más simple para que el sistema pueda operar durante las primeras semanas.

Cuando no se cumplen las condiciones del modelo semanal, se utiliza el promedio simple de los últimos 7 valores disponibles —o de todos los valores si existen menos de 7—.

Ejemplo:

~~~text
Historial reciente: 4, 5, 6
Fallback: (4 + 5 + 6) / 3 = 5 unidades
~~~

El método se identifica como:

~~~text
MOVING_AVERAGE_FALLBACK
~~~

Si el calculador recibe un arreglo vacío, devuelve:

~~~text
predictedQty = 0
lowerBound   = 0
upperBound   = 0
confidence   = 0
method       = NO_HISTORY
~~~

## 7. Incertidumbre y confianza

El sistema no devuelve únicamente un número puntual. También calcula un intervalo:

~~~text
incertidumbre = max(desviación estándar histórica,
                    predicción * 15%)

lowerBound = max(0, predicción - incertidumbre)
upperBound = max(0, predicción + incertidumbre)
~~~

La confianza considera:

- Cobertura histórica respecto de 90 días.
- Variabilidad de las cantidades.
- Penalización cuando la demanda es irregular.

Interpretación práctica:

- Pocos datos: confianza baja.
- Ventas muy variables: intervalo más amplio.
- Historial constante y suficiente: confianza mayor.

Durante las primeras semanas la confianza no debe utilizarse como garantía de exactitud. Es una señal de calidad del pronóstico, no una probabilidad matemática de que el valor sea correcto.

## 8. Recomendación de producción

El pronóstico se combina con inventario y stock de seguridad.

~~~text
stockDisponible = cantidadEnInventario - cantidadReservada
stockSeguridad   = ceil(predicción * 10%)

necesario = max(
  0,
  ceil(predicción + stockSeguridad - stockDisponible)
)
~~~

Si el producto tiene `unitsPerTray`, el sistema convierte las unidades necesarias a bandejas completas:

~~~text
bandejasRecomendadas = ceil(necesario / unitsPerTray)
producciónRecomendada = bandejasRecomendadas * unitsPerTray
~~~

El inventario se simula de forma secuencial durante el horizonte para evitar recomendar la misma producción varias veces para fechas consecutivas.

La recomendación es informativa. El sistema no crea automáticamente un registro de producción ni descuenta materia prima solo por calcular el pronóstico.

## 9. Riesgo de materia prima

Cuando existe una recomendación de producción, se consulta la receta activa del producto y la materia prima disponible.

Estados posibles:

- `OK`: la materia prima disponible cubre la producción recomendada.
- `RISK`: existe faltante de una o más materias primas.
- `NO_RECIPE`: el producto no tiene receta activa.

Este riesgo se muestra en el reporte y puede generar la notificación configurada como `forecast.risk`.

## 10. API implementada

### Analítica histórica

~~~text
GET  /analytics/overview
GET  /analytics/drilldown
GET  /analytics/products/:productId/demand
POST /analytics/sync?from=YYYY-MM-DD&to=YYYY-MM-DD&branchId=1
~~~

### Pronósticos

~~~text
GET  /predictions
GET  /predictions/:runId
GET  /predictions/backtest?days=14&branchId=1
POST /predictions/run?horizonDays=7&branchId=1
~~~

Todos los endpoints están protegidos por autenticación, roles y alcance de sucursal. La pantalla operativa está disponible en `/admin/reportes`; el dashboard principal muestra un resumen de cobertura, predicción y riesgos.

## 11. Ejecución automática

`ForecastScheduler` genera el pronóstico cada noche a las 23:00 en la zona horaria de la tienda.

También es posible ejecutarlo manualmente desde el reporte administrativo o mediante `POST /predictions/run`.

Si una ejecución falla:

- Se marca el `ForecastRun` como `FAILED`.
- Se registra el mensaje de error.
- Se conserva la última ejecución exitosa para no dejar el dashboard sin información.

## 12. Interfaz y drill-down

El módulo está disponible en:

~~~text
/admin/reportes
~~~

El dashboard principal muestra un resumen de cobertura, producción recomendada para el siguiente día operativo y cantidad de riesgos.

El reporte permite navegar por niveles:

~~~text
global -> sucursal -> día -> producto -> fuente
~~~

También muestra:

- Ventas reales.
- Producción y merma.
- Serie histórica y serie pronosticada.
- Límites inferior y superior.
- Confianza y método utilizado.
- Desglose de pedidos/POS y cierre diario.
- Recomendaciones de producción.
- Riesgo de receta y materia prima.

## 13. Backtesting

El endpoint de backtesting compara la predicción histórica contra la demanda real de los últimos 7 a 30 días operativos.

Métricas disponibles:

- `MAE`: error absoluto medio en unidades.
- `WAPE`: error absoluto ponderado por la demanda real.

El backtesting con pocos datos sirve como diagnóstico técnico, pero no como evidencia suficiente de precisión. Se recomienda empezar a evaluarlo formalmente después de 30 días operativos y tomar decisiones con mayor confianza después de 60–90 días.

## 14. Qué esperar durante las pruebas

| Historial real | Método esperado | Interpretación |
|---|---|---|
| Sin historial | `NO_HISTORY` | El sistema devuelve cero y no tiene base para estimar. |
| 1–29 observaciones | `MOVING_AVERAGE_FALLBACK` | Usa el comportamiento reciente; la confianza debe ser limitada. |
| 30+ observaciones y 2 muestras del día objetivo | `WMA_WEEKDAY` | Empieza a considerar diferencias entre lunes, sábado, etc. |
| Demanda muy irregular | Cualquiera | El intervalo debe ampliarse y la confianza reducirse. |

Pruebas recomendadas:

1. Registrar una venta POS y verificar `sourceBreakdown.orders`.
2. Registrar una venta residual en el cierre y verificar `dailyCloseResidual`.
3. Confirmar que la misma venta no se cuente dos veces.
4. Ejecutar la sincronización histórica.
5. Ejecutar un pronóstico de 7 días operativos.
6. Confirmar que domingo no aparezca para la configuración lunes–sábado.
7. Registrar inventario y reservas para verificar la recomendación de producción.
8. Ejecutar backtesting cuando exista suficiente historial.

## 15. Limitaciones actuales

La primera versión es una línea base explicable y no contempla todavía:

- Machine learning o redes neuronales.
- Promociones, feriados o eventos especiales.
- Clima o factores externos.
- Predicción por hora.
- Snapshots históricos completos de inventario para detectar stockout real. Actualmente `stockout` se conserva como campo, pero no se alimenta con snapshots históricos.
- Selección automática entre varios modelos.
- Ajuste de hiperparámetros por producto.

Además, el read model crea filas para productos activos en cada día operativo. Un día con cantidad cero puede representar una venta real de cero o ausencia de registro. `dataQuality` permite observar esa diferencia operativa, pero el calculador actual recibe la cantidad y puede interpretar ambos casos como cero. Con pocos datos, esto puede reducir el promedio y hacer que la confianza parezca más alta de lo que realmente corresponde. Es una mejora pendiente para una versión posterior.

## 16. Archivos principales

Backend:

- `api/src/analytics/demand-history.service.ts`: sincronización del historial.
- `api/src/analytics/demand-reconciliation.ts`: conciliación de fuentes.
- `api/src/analytics/analytics.service.ts`: overview y drill-down.
- `api/src/forecast/forecast-calculator.ts`: algoritmo estadístico y métricas.
- `api/src/forecast/forecast.service.ts`: generación, recomendaciones y backtesting.
- `api/src/forecast/forecast.scheduler.ts`: ejecución nocturna.
- `api/src/common/time/business-date.ts`: zona horaria y calendario operativo.
- `api/prisma/schema.prisma`: modelos `DemandDaily`, `ForecastRun` y `ForecastItem`.

Frontend:

- `web/src/app/admin/reportes/page.tsx`: dashboard analítico y drill-down.
- `web/src/components/admin/AnalyticsPreview.tsx`: resumen en el dashboard principal.
- `web/src/lib/api/analytics.ts`: cliente de analítica y pronósticos.

## 17. Despliegue

El proyecto utiliza npm y `package-lock.json`.

~~~bash
cd api
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run build

cd ../web
npm ci
npm run build
~~~

En Render deben estar configurados `DATABASE_URL` y `DIRECT_URL` antes de ejecutar `npm run prisma:deploy`. Las variables `STORE_TIMEZONE` y `STORE_OPERATING_DAYS` deben configurarse en el mismo servicio de la API.

## 18. Validación automatizada

Las pruebas unitarias cubren:

- Conciliación de pedidos y cierre diario.
- Calendario operativo y exclusión de domingo.
- Fallback con historial corto.
- Modelo semanal.
- Cálculo de WAPE.
- Servicios existentes de inventario, producción, pedidos y autenticación.

La validación funcional final debe realizarse con datos reales o representativos de la panadería, especialmente ventas de lunes a sábado, cierres diarios, inventario reservado y recetas activas.
