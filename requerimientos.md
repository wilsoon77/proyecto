## 4.3 Levantamiento y Consolidacion de Requerimientos

> **Alcance vigente (agosto de 2026):** sistema operativo para catálogo, carrito y retiro en sucursal; inventario de producto terminado y materia prima; recetas, producción y cierre diario. No incluye POS, pagos en tienda, delivery, analítica predictiva ni un dashboard extenso. El único método de pago es `EFECTIVO` al retirar el pedido. La caducidad solo aplica a productos `COMPRADO` y permite varios recordatorios por lote.

En esta version se presentan unicamente los requerimientos consolidados vigentes del sistema, bajo formato estricto de ficha por requerimiento.

### 4.3.1 Requerimientos Funcionales Consolidados

|**No. de requerimiento**|RF01|
| :- | :- |
|**Nombre del requerimiento**|Autenticacion y sesiones seguras|
|**Caracteristicas**|El sistema gestiona registro, inicio de sesion, renovacion de token, cierre de sesion, OAuth y recuperacion de contrasena.|
|**Descripcion**|<p>- El sistema permite registro e inicio de sesion por credenciales.</p><p>- El sistema emite token de acceso y token de refresco con rotacion.</p><p>- El sistema permite cierre de sesion por dispositivo o global.</p><p>- El sistema soporta callback OAuth y recuperacion de contrasena.</p>|
|**Restricciones**|Requiere configuracion de variables de entorno para JWT y, para OAuth/recuperacion, configuracion de Supabase.|
|**Criterio de aceptacion**|Un usuario puede registrarse, iniciar sesion, refrescar token y cerrar sesion; el refresh token anterior queda invalidado tras la rotacion.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RF02|
| :- | :- |
|**Nombre del requerimiento**|Gestion de usuarios y roles|
|**Caracteristicas**|Permite administrar usuarios, roles y asignacion de sucursal para roles operativos.|
|**Descripcion**|<p>- El sistema permite crear, listar, editar, desactivar y reactivar usuarios.</p><p>- El sistema gestiona roles ADMIN, MANAGER, BAKER y CUSTOMER.</p><p>- Los roles operativos MANAGER y BAKER deben estar asociados a una sucursal predeterminada; MANAGER conserva alcance sobre ambas sucursales.</p>|
|**Restricciones**|Solo ADMIN puede gestionar usuarios y roles.|
|**Criterio de aceptacion**|ADMIN crea y edita un usuario operativo con sucursal asignada y el usuario queda habilitado para su modulo correspondiente.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RF03|
| :- | :- |
|**Nombre del requerimiento**|Gestion de sucursales|
|**Caracteristicas**|Permite administrar sucursales del negocio para operacion multi-sucursal.|
|**Descripcion**|<p>- El sistema permite crear, listar, editar y eliminar sucursales.</p><p>- Cada sucursal mantiene su propio inventario y operacion asociada.</p><p>- Las sucursales se utilizan en pedidos para retiro, inventario, producción, transferencias y cierres.</p>|
|**Restricciones**|Solo ADMIN puede crear, editar o eliminar sucursales.|
|**Criterio de aceptacion**|Una sucursal creada aparece en listados operativos y puede ser usada en pedidos, inventario y panel administrativo.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|(x) Beneficiario    ( ) Usuario    ( ) Desarrollador|

|**No. de requerimiento**|RF04|
| :- | :- |
|**Nombre del requerimiento**|Gestion de productos|
|**Caracteristicas**|Permite administrar catalogo de productos con SKU, precios, visibilidad y reglas de operación.|
|**Descripcion**|<p>- El sistema permite CRUD de productos.</p><p>- Cada producto define SKU, precio base, estado de visibilidad (`isActive`), disponibilidad de pedido (`isAvailable`) y origen.</p><p>- El sistema soporta presentaciones comerciales y unidades por lata para productos producidos.</p><p>- Los productos `COMPRADO` pueden activar caducidad y uno o varios días de recordatorio.</p>|
|**Restricciones**|Requiere categoria existente y SKU unico por producto.|
|**Criterio de aceptacion**|Al crear o editar un producto, este se refleja correctamente en el catalogo y en los modulos administrativos.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|(x) Beneficiario    ( ) Usuario    ( ) Desarrollador|

|**No. de requerimiento**|RF05|
| :- | :- |
|**Nombre del requerimiento**|Gestion de categorias|
|**Caracteristicas**|Permite organizar productos por categorias y consultar productos por categoria.|
|**Descripcion**|<p>- El sistema permite CRUD de categorias.</p><p>- Las categorias se usan para filtros de catalogo y administracion.</p><p>- El sistema permite consulta de productos vinculados por categoria.</p>|
|**Restricciones**|Una categoria no puede eliminarse si tiene productos asociados.|
|**Criterio de aceptacion**|Una categoria creada o editada aparece en filtros y listados; al consultar categoria se muestran sus productos.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    (x) Usuario    ( ) Desarrollador|

|**No. de requerimiento**|RF06|
| :- | :- |
|**Nombre del requerimiento**|Gestion de imagenes de productos|
|**Caracteristicas**|Permite subir y eliminar imagenes de productos para uso en tienda y panel admin.|
|**Descripcion**|<p>- El sistema permite cargar imagenes de producto desde el panel administrativo.</p><p>- El sistema guarda URL de imagen y posicion asociada al producto.</p><p>- El sistema permite eliminar imagenes segun permisos.</p>|
|**Restricciones**|La carga y borrado de imagenes requiere autenticacion y permisos de rol.|
|**Criterio de aceptacion**|Al subir una imagen, esta se visualiza en el producto en frontend y admin; al eliminarla deja de mostrarse.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|( ) Alto    (x) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RF07|
| :- | :- |
|**Nombre del requerimiento**|Tienda en linea y catalogo publico|
|**Caracteristicas**|Modulo publico web para explorar productos, ver detalle y preparar un pedido para retiro.|
|**Descripcion**|<p>- El sistema publica únicamente productos activos y categorías activas.</p><p>- El cliente puede buscar, filtrar y ver detalle de productos.</p><p>- El cliente puede agregar productos disponibles al carrito para continuar al checkout.</p><p>- `isActive` controla si aparece en el e-commerce; ocultarlo no lo elimina del inventario ni del cierre diario.</p>|
|**Restricciones**|Depende de que productos, categorias e imagenes esten cargados y activos.|
|**Criterio de aceptacion**|Un cliente puede navegar catalogo, aplicar filtros y armar carrito desde navegador web en desktop y movil.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|(x) Beneficiario    ( ) Usuario    ( ) Desarrollador|

|**No. de requerimiento**|RF08|
| :- | :- |
|**Nombre del requerimiento**|Reserva de pedidos en linea|
|**Caracteristicas**|Permite crear pedidos en estado pendiente con reserva de stock por sucursal.|
|**Descripcion**|<p>- El cliente confirma pedido desde checkout y se crea orden pendiente.</p><p>- El sistema reserva inventario para evitar sobreventa.</p><p>- Una reserva pendiente no confirmada expira automáticamente a las 2 horas y se cancela liberando la reserva.</p><p>- El cliente puede consultar sus pedidos y detalle.</p>|
|**Restricciones**|Requiere usuario autenticado, sucursal seleccionada, stock disponible y pago únicamente en efectivo al retirar.|
|**Criterio de aceptacion**|Al reservar pedido, la orden se guarda con numero de orden y el stock reservado se refleja en inventario.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|(x) Beneficiario    (x) Usuario    ( ) Desarrollador|

|**No. de requerimiento**|RF09|
| :- | :- |
|**Nombre del requerimiento**|Gestion operativa de pedidos|
|**Caracteristicas**|Permite preparar, cancelar, entregar y actualizar estado de pedidos para retiro desde panel administrativo.|
|**Descripcion**|<p>- El sistema permite cambio de estado segun flujo operativo.</p><p>- El sistema permite cancelacion con liberacion de reserva.</p><p>- El sistema permite marcar el pedido como recogido y descontar inventario fisico.</p><p>- El pago se registra conceptualmente como efectivo al momento del retiro; no existe cobro dentro de un POS.</p>|
|**Restricciones**|Las acciones dependen del rol y del estado actual del pedido.|
|**Criterio de aceptacion**|Un pedido cambia de estado correctamente y el inventario se ajusta conforme a confirmacion/cancelacion/entrega.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    (x) Usuario    ( ) Desarrollador|

|**No. de requerimiento**|RF10|
| :- | :- |
|**Nombre del requerimiento**|Cierre diario de producto terminado|
|**Caracteristicas**|Permite conciliar el conteo físico de productos terminados al final de la jornada.|
|**Descripcion**|<p>- El responsable registra unidades contadas y merma por producto y sucursal.</p><p>- El sistema calcula la venta no registrada por diferencia y ajusta el inventario.</p><p>- Los sobrantes se registran como ajuste positivo.</p><p>- Los productos que no se publican en el e-commerce también se incluyen en el cierre.</p>|
|**Restricciones**|Solo ADMIN y MANAGER pueden ejecutar el cierre; una sucursal no puede cerrarse dos veces para la misma fecha.|
|**Criterio de aceptacion**|El cierre deja el inventario igual al conteo físico, conserva el detalle auditable y bloquea nueva producción para la fecha cerrada.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    (x) Usuario    ( ) Desarrollador|

|**No. de requerimiento**|RF11|
| :- | :- |
|**Nombre del requerimiento**|Inventario de producto terminado por sucursal|
|**Caracteristicas**|Controla stock fisico, stock reservado y stock disponible por producto y sucursal.|
|**Descripcion**|<p>- El sistema lista inventario por producto y sucursal.</p><p>- El sistema calcula disponible como cantidad menos reservado.</p><p>- El sistema permite consulta de bajo stock por umbral.</p>|
|**Restricciones**|Requiere consistencia con movimientos de inventario y pedidos.|
|**Criterio de aceptacion**|El inventario muestra cantidades consistentes con pedidos reservados, entregas y movimientos registrados.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RF12|
| :- | :- |
|**Nombre del requerimiento**|Movimientos de inventario|
|**Caracteristicas**|Registra movimientos de inventario con reglas por tipo de operacion.|
|**Descripcion**|<p>- El sistema soporta movimientos: COMPRA, PRODUCCION, TRANSFERENCIA, MERMA, PERDIDA_ROBO, SOBRANTE y VENTA.</p><p>- Cada tipo aplica aumentos o disminuciones segun origen y destino.</p><p>- El sistema conserva historial paginado de movimientos.</p>|
|**Restricciones**|Cantidad debe ser positiva y sucursales de origen/destino son obligatorias segun tipo de movimiento.|
|**Criterio de aceptacion**|Al crear un movimiento valido, el inventario se actualiza segun reglas del tipo y queda registro historico consultable.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RF13|
| :- | :- |
|**Nombre del requerimiento**|Gestion de materia prima|
|**Caracteristicas**|Permite administrar insumos base con unidad normalizada y umbral minimo.|
|**Descripcion**|<p>- El sistema permite crear, editar y consultar materias primas.</p><p>- Cada materia prima define unidad base (LB, ML o UNIT).</p><p>- El sistema muestra inventario de materia prima por sucursal.</p>|
|**Restricciones**|Solo roles autorizados pueden administrar materia prima.|
|**Criterio de aceptacion**|Una materia prima creada aparece en inventario y puede utilizarse en recetas de produccion.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RF14|
| :- | :- |
|**Nombre del requerimiento**|Registro de compras de materia prima con conversion|
|**Caracteristicas**|Convierte unidades de compra comerciales a unidad base para inventario consistente.|
|**Descripcion**|<p>- El sistema registra compras en unidad comercial (quintal, arroba, libra, litro, galon, carton, unidad).</p><p>- El sistema convierte automaticamente la compra a unidad base.</p><p>- El sistema incrementa inventario de materia prima en la sucursal destino.</p>|
|**Restricciones**|La unidad comercial debe ser compatible con las conversiones definidas por el sistema.|
|**Criterio de aceptacion**|Una compra registrada incrementa el inventario de materia prima con la cantidad convertida correctamente a unidad base.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RF15|
| :- | :- |
|**Nombre del requerimiento**|Gestion de recetas por amasijo|
|**Caracteristicas**|Permite definir recetas de produccion por amasijo con ingredientes y rendimiento esperado.|
|**Descripcion**|<p>- El sistema permite crear, consultar, editar y desactivar recetas.</p><p>- Cada receta se asocia a un producto producido y define ingredientes con cantidad.</p><p>- La receta define latas estandar para referencia operativa.</p>|
|**Restricciones**|Solo ADMIN y MANAGER pueden crear o editar recetas.|
|**Criterio de aceptacion**|Una receta valida queda disponible para ser usada en el registro de produccion diaria.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RF16|
| :- | :- |
|**Nombre del requerimiento**|Produccion diaria transaccional|
|**Caracteristicas**|Registra produccion diaria con consumo de insumos y aumento de producto terminado en una operacion atomica.|
|**Descripcion**|<p>- El sistema registra horneado por receta y latas producidas.</p><p>- El sistema descuenta materia prima de inventario.</p><p>- El sistema incrementa producto terminado y registra movimiento PRODUCCION.</p><p>- La operacion se ejecuta con transaccion para evitar inconsistencias.</p>|
|**Restricciones**|Requiere receta activa, stock suficiente de materia prima y usuario con rol operativo autorizado.|
|**Criterio de aceptacion**|Si falta insumo se revierte todo; si la produccion es valida se registra log y se actualizan ambos inventarios correctamente.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RF17|
| :- | :- |
|**Nombre del requerimiento**|Panel Operación multi-sucursal|
|**Caracteristicas**|Muestra un resumen sencillo de la operación diaria y sus alertas principales.|
|**Descripcion**|<p>- El panel muestra saludo contextual, hora, KPIs operativos simples y una gráfica compacta.</p><p>- El panel resume inventario, producción, cierres, pedidos para retiro y alertas activas.</p><p>- ADMIN y MANAGER pueden consultar la vista global; MANAGER puede ver ambas sucursales.</p><p>- No se calculan pronósticos ni analíticas predictivas.</p>|
|**Restricciones**|La vista debe mantenerse enfocada en la operación y no sustituye el detalle de cada módulo.|
|**Criterio de aceptacion**|El panel presenta información consistente con los módulos operativos, con una lectura rápida y sin métricas no solicitadas.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|(x) Beneficiario    ( ) Usuario    ( ) Desarrollador|

|**No. de requerimiento**|RF18|
| :- | :- |
|**Nombre del requerimiento**|Auditoria de acciones del sistema|
|**Caracteristicas**|Registra eventos criticos del sistema para trazabilidad administrativa.|
|**Descripcion**|<p>- El sistema registra acciones sobre entidades criticas (crear, actualizar, eliminar, login, logout y cambios relevantes).</p><p>- El sistema permite consultar historial con filtros y detalle.</p><p>- El historial conserva usuario, accion, entidad y fecha.</p>|
|**Restricciones**|Solo ADMIN puede acceder al modulo completo de historial de auditoria.|
|**Criterio de aceptacion**|Un evento administrativo ejecutado aparece en el historial con sus datos de trazabilidad y puede filtrarse para analisis.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RF19|
| :- | :- |
|**Nombre del requerimiento**|Automatización de alertas operativas|
|**Caracteristicas**|El sistema genera las dos alertas automáticas esenciales para la operación, visibles según el rol y la sucursal.|
|**Descripcion**|<p>- El sistema alerta cuando una materia prima llega o cae por debajo de su mínimo.</p><p>- El sistema alerta cuando un lote comprado entra en cada período de caducidad configurado.</p><p>- Un producto comprado puede tener varios recordatorios, por ejemplo 30, 15 y 3 días antes.</p><p>- Los lotes vencidos no se borran ni generan una alerta nueva; permanecen disponibles para registrar una merma.</p><p>- MANAGER y ADMIN reciben la información de ambas sucursales.</p>|
|**Restricciones**|Requiere autenticacion del usuario con rol para recibir las alertas operativas.|
|**Criterio de aceptacion**|Cuando una materia prima cruza su mínimo o un lote comprado cruza uno de sus recordatorios, la alerta aparece una sola vez por condición y puede enviarse a los dueños por los canales configurados.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    (x) Usuario    ( ) Desarrollador|

|**No. de requerimiento**|RF20|
| :- | :- |
|**Nombre del requerimiento**|Asistente con IA|
|**Caracteristicas**|El sistema contará con un asistente impulsado por IA para responder consultas operativas a traves de lenguaje natural por Telegram.|
|**Descripcion**|<p>- El usuario autorizado podrá consultar inventario de producto terminado.</p><p>- Podrá consultar materias primas y sus existencias.</p><p>- Podrá consultar producción registrada.</p><p>- Podrá consultar cierres del día.</p><p>- El asistente será de solo lectura: no registra cambios y no consulta ventas ni pedidos como módulos independientes.</p>|
|**Restricciones**|Requiere autenticacion del usuario con rol para acceder al asistente operativo.|
|**Criterio de aceptacion**|Que un usuario ADMIN/MANAGER autorizado pregunte por cualquiera de las cuatro áreas permitidas y reciba una respuesta coherente con los datos del sistema y limitada a sus sucursales autorizadas.|
|**Tipo**|(x) Funcional    ( ) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|
### 4.3.2 Requerimientos No Funcionales Consolidados

|**No. de requerimiento**|RNF01|
| :- | :- |
|**Nombre del requerimiento**|Usabilidad operativa|
|**Caracteristicas**|La interfaz debe ser clara para personal operativo con bajo nivel tecnico.|
|**Descripcion**|<p>- Las tareas frecuentes (pedido para retiro, inventario, producción y cierre) deben ser directas y comprensibles.</p><p>- Los textos y acciones deben ser consistentes en toda la aplicacion.</p><p>- Debe minimizarse la cantidad de pasos para tareas diarias.</p>|
|**Restricciones**|Se debe priorizar claridad funcional sobre complejidad visual.|
|**Criterio de aceptacion**|Usuarios operativos completan tareas principales sin apoyo tecnico continuo tras una induccion corta.|
|**Tipo**|( ) Funcional    (x) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|(x) Beneficiario    ( ) Usuario    ( ) Desarrollador|

|**No. de requerimiento**|RNF02|
| :- | :- |
|**Nombre del requerimiento**|Compatibilidad web|
|**Caracteristicas**|El sistema debe funcionar en navegadores modernos de escritorio y movil.|
|**Descripcion**|<p>- El sistema debe operar en entornos Windows y Android por navegador.</p><p>- La interfaz debe ser responsive para pantallas de telefono y computadora.</p><p>- Debe mantenerse consistencia de funcionalidades entre dispositivos.</p>|
|**Restricciones**|El acceso es via web, sin dependencia de aplicacion nativa.|
|**Criterio de aceptacion**|Flujos principales operan sin errores funcionales en Chrome y Firefox en desktop y movil.|
|**Tipo**|( ) Funcional    (x) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RNF03|
| :- | :- |
|**Nombre del requerimiento**|Seguridad de acceso|
|**Caracteristicas**|El sistema protege endpoints y vistas con autenticacion y autorizacion por rol.|
|**Descripcion**|<p>- El acceso a recursos protegidos requiere token valido.</p><p>- Los permisos de acceso se controlan por rol.</p><p>- El sistema debe evitar acceso no autorizado a datos sensibles.</p>|
|**Restricciones**|Depende de correcta configuracion de guards y politicas de roles.|
|**Criterio de aceptacion**|Solicitudes sin credenciales o con rol incorrecto reciben respuesta de rechazo (401/403).|
|**Tipo**|( ) Funcional    (x) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RNF04|
| :- | :- |
|**Nombre del requerimiento**|Seguridad de sesion y antiabuso|
|**Caracteristicas**|El sistema debe mitigar abuso de autenticacion y proteger sesiones.|
|**Descripcion**|<p>- Los refresh tokens deben rotarse e invalidarse correctamente.</p><p>- El sistema debe aplicar limitacion de tasa en endpoints sensibles.</p><p>- El sistema debe usar captcha adaptativo segun intentos fallidos.</p>|
|**Restricciones**|Requiere configuracion de politicas de throttling y trazabilidad de intentos de login.|
|**Criterio de aceptacion**|Tras intentos excesivos se limita acceso y los tokens previos no pueden reutilizarse luego de rotacion/logout.|
|**Tipo**|( ) Funcional    (x) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RNF05|
| :- | :- |
|**Nombre del requerimiento**|Integridad transaccional|
|**Caracteristicas**|Las operaciones criticas deben ejecutarse de forma atomica y consistente.|
|**Descripcion**|<p>- Produccion y movimientos criticos deben ejecutarse en transaccion.</p><p>- No deben existir actualizaciones parciales de inventario.</p><p>- Ante error, la operacion debe revertirse completamente.</p>|
|**Restricciones**|Requiere manejo transaccional estricto en servicios de negocio.|
|**Criterio de aceptacion**|Si una operacion critica falla a mitad, no quedan cambios parciales en inventarios ni registros inconsistentes.|
|**Tipo**|( ) Funcional    (x) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RNF06|
| :- | :- |
|**Nombre del requerimiento**|Rendimiento operativo|
|**Caracteristicas**|El sistema debe responder en tiempos adecuados para operacion diaria.|
|**Descripcion**|<p>- Los listados deben usar paginacion para evitar sobrecarga.</p><p>- Las consultas frecuentes deben apoyarse en indices adecuados.</p><p>- Los flujos de pedido, inventario y producción no deben generar espera excesiva en uso normal.</p>|
|**Restricciones**|El rendimiento final depende tambien de red, infraestructura y volumen de datos.|
|**Criterio de aceptacion**|En operacion normal, consultas y operaciones principales se ejecutan con fluidez sin bloquear el trabajo del usuario.|
|**Tipo**|( ) Funcional    (x) No Funcional|
|**Prioridad**|( ) Alto    (x) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RNF07|
| :- | :- |
|**Nombre del requerimiento**|Disponibilidad y observabilidad|
|**Caracteristicas**|El sistema debe proveer mecanismos de monitoreo de estado y errores.|
|**Descripcion**|<p>- El sistema debe exponer endpoint de salud.</p><p>- El sistema debe exponer metricas para monitoreo operativo.</p><p>- El sistema debe capturar errores para diagnostico en produccion.</p>|
|**Restricciones**|Requiere configuracion de servicios de monitoreo y politicas de acceso a metricas.|
|**Criterio de aceptacion**|Se puede verificar salud del sistema y revisar metricas/errores para detectar incidentes operativos.|
|**Tipo**|( ) Funcional    (x) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RNF08|
| :- | :- |
|**Nombre del requerimiento**|Trazabilidad y auditoria|
|**Caracteristicas**|El sistema debe mantener rastro historico de acciones criticas.|
|**Descripcion**|<p>- Cada accion relevante debe registrar actor, entidad, accion y fecha.</p><p>- El historial debe poder consultarse con filtros.</p><p>- Debe existir detalle para analisis de cambios.</p>|
|**Restricciones**|Se limita consulta completa de auditoria a perfiles administrativos autorizados.|
|**Criterio de aceptacion**|Una accion critica ejecutada se refleja en auditoria y puede encontrarse por filtros de entidad/accion/usuario/fecha.|
|**Tipo**|( ) Funcional    (x) No Funcional|
|**Prioridad**|(x) Alto    ( ) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RNF09|
| :- | :- |
|**Nombre del requerimiento**|Mantenibilidad|
|**Caracteristicas**|El sistema debe permitir evolucion y soporte por terceros sin rehacer arquitectura.|
|**Descripcion**|<p>- El backend debe mantener organizacion modular por dominio.</p><p>- La logica de negocio debe estar desacoplada de controladores.</p><p>- El proyecto debe conservar documentacion tecnica y convenciones.</p>|
|**Restricciones**|La deuda tecnica y la falta de documentacion reducen la mantenibilidad.|
|**Criterio de aceptacion**|Un desarrollador externo puede identificar modulos, responsabilidades y puntos de extension en tiempo razonable.|
|**Tipo**|( ) Funcional    (x) No Funcional|
|**Prioridad**|( ) Alto    (x) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RNF10|
| :- | :- |
|**Nombre del requerimiento**|Portabilidad de despliegue|
|**Caracteristicas**|El sistema debe poder ejecutarse en distintos entornos mediante configuracion externa.|
|**Descripcion**|<p>- API y Web deben operar con variables de entorno.</p><p>- Deben evitarse configuraciones fijas en codigo para entornos especificos.</p><p>- El sistema debe soportar despliegue local y en nube.</p>|
|**Restricciones**|La portabilidad depende de documentar y completar variables requeridas por entorno.|
|**Criterio de aceptacion**|El sistema puede desplegarse en un entorno nuevo configurando variables y sin cambios estructurales de codigo.|
|**Tipo**|( ) Funcional    (x) No Funcional|
|**Prioridad**|( ) Alto    (x) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|

|**No. de requerimiento**|RNF11|
| :- | :- |
|**Nombre del requerimiento**|Costo de operacion sostenible|
|**Caracteristicas**|La operacion basica debe priorizar tecnologias abiertas y planes de bajo costo.|
|**Descripcion**|<p>- El sistema debe poder operar en configuraciones base con servicios de costo controlado.</p><p>- Debe minimizarse dependencia de licencias empresariales obligatorias para funciones esenciales.</p><p>- Costos avanzados deben justificarse por valor de negocio.</p>|
|**Restricciones**|Algunas integraciones en produccion pueden requerir costos de proveedor externo.|
|**Criterio de aceptacion**|La operacion basica del sistema puede mantenerse sin costos prohibitivos para el negocio objetivo.|
|**Tipo**|( ) Funcional    (x) No Funcional|
|**Prioridad**|( ) Alto    (x) Medio    ( ) Bajo|
|**Sugerido por:**|(x) Beneficiario    ( ) Usuario    ( ) Desarrollador|

|**No. de requerimiento**|RNF12|
| :- | :- |
|**Nombre del requerimiento**|Calidad y pruebas|
|**Caracteristicas**|El sistema debe incorporar validaciones y pruebas para modulos criticos.|
|**Descripcion**|<p>- Los modulos sensibles deben cubrirse con pruebas automatizadas.</p><p>- Deben existir pruebas e2e para flujos de seguridad y operaciones criticas.</p><p>- El codigo debe mantener validacion de datos de entrada y manejo de errores.</p>|
|**Restricciones**|La cobertura total depende del tiempo de desarrollo y prioridad funcional del sprint.|
|**Criterio de aceptacion**|Las suites de prueba de modulos criticos ejecutan correctamente y detectan regresiones en cambios relevantes.|
|**Tipo**|( ) Funcional    (x) No Funcional|
|**Prioridad**|( ) Alto    (x) Medio    ( ) Bajo|
|**Sugerido por:**|( ) Beneficiario    ( ) Usuario    (x) Desarrollador|
