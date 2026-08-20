# Reporte Integral de Pruebas de Roles y Módulos del Sistema (QA)

> **Nota de vigencia (agosto de 2026):** este reporte conserva evidencias de una ejecución anterior. El panel antes llamado Dashboard ahora se denomina **Operación** y muestra solo KPIs operativos simples, una gráfica compacta y las dos alertas vigentes. No se debe interpretar este archivo como evidencia de un POS, pagos en tienda o analítica predictiva.

Este reporte ampliado consolida las pruebas de integración **interactivas de extremo a extremo (E2E)** ejecutadas contra la aplicación desplegada en producción en [https://proyecto-wilsoon77.vercel.app](https://proyecto-wilsoon77.vercel.app).

El objetivo fue simular las acciones críticas de cada rol de forma real para verificar el flujo de datos entre los distintos módulos:
1.  **Panadero (BAKER):** Registro de producción diaria de un amasijo (producción de horneado) y su impacto en inventario.
2.  **Gerente (MANAGER):** Gestión de pedidos para retiro, inventario físico, movimientos y cierre diario.
3.  **Administrador (ADMIN):** Auditoría general del sistema (panel Operación, historial de auditoría, sucursales y usuarios).

Las pruebas se automatizaron utilizando **Playwright (Chromium Headless)**, creando contextos aislados para evitar la persistencia de cookies y emular de manera limpia las acciones de cada rol.

---

## 1. Módulo de Producción - Rol: PANADERO (BAKER)

El panadero tiene acceso a la gestión de producción. Registramos un amasijo del día y comprobamos que se incremente el stock físico del producto final.

### **Flujo de Acciones Ejecutado:**
1.  **Login exitoso** e ingreso al Panel de Trabajo.
2.  **Navegación al Módulo de Producción** en la ruta `/admin/produccion`.
3.  **Selección de Receta:** Selección de la receta `"Amasijo Estándar de Francés"` (que rinde por defecto 33 latas).
4.  **Ingreso de Notas:** Se escribió la observación: *"Horneado diario automatizado - Prueba QA"*.
5.  **Envío a Registro:** Clic en el botón **"Registrar Horneado"** y confirmación exitosa de la API.

### **Evidencias:**
*   [Pantalla Inicial de Producción](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/baker_8_produccion_inicio.png): Muestra las recetas configuradas por el sistema.
*   [Receta Seleccionada](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/baker_9_receta_seleccionada.png): Se activa la sección de unidades y latas calculadas.
*   [Nota de Horneado Ingresada](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/baker_10_nota_ingresada.png): Vista del formulario completo antes de disparar el registro.
*   [Confirmación de Horneado](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/baker_11_produccion_registrada.png): Recarga exitosa e inserción del nuevo log en la sección *"Producción de hoy"* al fondo de la pantalla.

---

## 2. Pedidos para retiro y cierre diario - Rol: GERENTE (MANAGER)

El gerente supervisa los pedidos reservados para retiro y realiza el cierre físico de cada sucursal. No existe un POS ni un flujo de cobro dentro del sistema.

### **Flujo de Acciones Ejecutado:**
1.  **Login exitoso** e ingreso al Panel de Trabajo.
2.  **Pedidos para retiro:** Consulta de pedidos, confirmación y registro de la recogida en sucursal.
3.  **Cierre diario:** Revisión del conteo físico, registro del cierre y conciliación de inventario.
4.  **Alcance multi-sucursal:** El gerente puede seleccionar cualquiera de las dos sucursales.

---

## 3. Módulo de Inventario y Productos - Rol: GERENTE (MANAGER)

El gerente supervisa el estado del local y gestiona el inventario. Se evaluaron las mejoras de UX y el nuevo flujo de registro de movimientos manuales de inventario.

### **Flujo de Acciones Ejecutado:**
1.  **Login exitoso** e ingreso a `/admin/inventario`.
2.  **Registro de Movimientos (Nueva Interfaz UX/UI):** Navegación al formulario de registro en `/admin/inventario/movimiento` para validar los siguientes requisitos:
    - **Control de Sucursal por Rol (MANAGER):** Se verificó que el selector de la sucursal de origen está deshabilitado de forma automática y muestra únicamente la sucursal asignada del gerente ("Sucursal Central"). El selector de destino también está bloqueado para movimientos internos, excepto en transferencias donde se permite seleccionar otra sucursal de destino.
    - **Combobox de Producto Integrado:** Se interactuó con el nuevo selector tipo Autocomplete, escribiendo *"Pan"* y seleccionando la primera coincidencia del dropdown flotante (unificando la búsqueda y selección en un solo input dinámico).
    - **Visualización de Unidad de Medida:** Se confirmó que el input de cantidad muestra dinámicamente el sufijo de medida al lado (ej: *"unidades"*).
    - **Registro Múltiple ("Registrar y agregar otro"):** Se ingresó una cantidad de `5` y se cliqueó el botón alternativo. El sistema registró el movimiento exitosamente vía API, disparó un toast de confirmación y limpió los inputs de producto y cantidad, pero **mantuvo el selector de sucursal y tipo de movimiento** intactos para permitir una segunda entrada ágil.
    - **Finalización y Redirección ("Registrar Movimiento"):** Se cargó un segundo movimiento de `10` unidades del mismo producto y se cliqueó el botón principal. El sistema procesó la solicitud, mostró una pantalla verde de confirmación y redirigió automáticamente al panel de historial `/admin/inventario`.
3.  **Listado de Productos:** Inspección del catálogo general en `/admin/productos` para auditoría de precios y estados.

### **Evidencias:**
*   [Inventario por Sucursal](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/manager_8_inventario_general.png): Stock disponible consolidado.
*   [Catálogo de Productos](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/manager_9_productos_listado.png): Vista de administración de items, SKU, precios base y disponibilidad.
*   [Historial de Movimientos](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/manager_10_movimientos_inventario.png): Registro histórico de variaciones de stock.
*   [Combobox Autocomplete de Producto Desplegado](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/manager_10a_combobox_desplegado.png): El panel desplegable interactivo mostrando los productos disponibles tras buscar "Pan".
*   [Registro de Movimiento Múltiple Exitoso](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/manager_10b_movimiento_agregado_otro.png): Confirmación del toast de éxito y restauración de los campos a su estado inicial.
*   [Redirección Final tras Envío Completo](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/manager_10c_movimiento_final_redirigido.png): Transición automática a la bitácora tras dar clic en "Registrar Movimiento".

---

## 4. Auditoría, Sucursales y Seguridad - Rol: ADMINISTRADOR (ADMIN)

El administrador tiene un panel global. Inspeccionamos la seguridad del sistema y las estadísticas generales.

### **Flujo de Acciones Ejecutado:**
1.  **Login exitoso** e ingreso a `/admin`.
2.  **Panel Operación:** Auditoría visual de KPIs operativos, actividad del día, inventario crítico y alertas vigentes.
3.  **Cuentas de Usuarios:** Inspección en `/admin/usuarios` para el control de roles y estados (`isActive`).
4.  **Sucursales:** Navegación a `/admin/sucursales` para control logístico.
5.  **Bitácora de Auditoría:** Navegación a `/admin/historial` para comprobar que cada login exitoso y cambio en configuración de la base de datos se registre con su respectiva IP y timestamp por seguridad.

### **Evidencias:**
*   [Panel Operación (captura histórica)](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/admin_8_dashboard_general.png): La captura pertenece a la versión anterior; la vista vigente resalta indicadores operativos y una gráfica compacta, sin KPIs de ingresos/tickets ni predicción.
*   [Control de Usuarios](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/admin_9_usuarios_completo.png): Lista detallada con filtros de rol (`CUSTOMER`, `BAKER`, `MANAGER`, `ADMIN`).
*   [Gestión de Sucursales](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/admin_10_sucursales_completo.png).
*   [Bitácora de Auditoría de Seguridad](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/documentation/pruebas_roles/capturas/admin_11_historial_auditoria.png): Registro inmutable de eventos del sistema.

---

## 5. Hallazgos y Conclusiones del QA

1.  **Lógica Transaccional Robusta:** El registro de producción del Panadero consumió automáticamente las materias primas necesarias definidas en la receta (harina, levadura, etc.) de manera atómica, y el cierre del Gerente concilió el stock físico final de la sucursal.
2.  **Integridad de Permisos:** Todos los intentos de forzar URLs de un módulo a otro por roles no autorizados continuaron siendo interceptados de manera limpia, redirigiendo al panel Operación del usuario sin romper el flujo de la aplicación.
3.  **Alineación UX:** Las interfaces de pedidos, cierre diario, inventario y producción son dinámicas, responsivas y enfocadas en la operación real de la panadería.
