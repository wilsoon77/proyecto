# CAPÍTULO IV: DISEÑO DE LA INTERFAZ DE USUARIO (UI/UX)
## BOSQUEJO (MAQUETACIÓN) Y PROTOTIPOS NO FUNCIONALES — PANADERÍA SVETLANA

---

# PARTE I: BOSQUEJO O MAQUETACIÓN DE PANTALLAS

La fase de **bosquejo o maquetación** define la estructura base, distribución espacial, identidad gráfica y arquitectura de información de las pantallas del sistema antes de su implementación de alta fidelidad.

---

### 1.1 Disposición del Contenido y Cuadrícula (Layout)

El diseño espacial utiliza una cuadrícula fluida (*Fluid Grid*) de 12 columnas en escritorio y 4 columnas en dispositivos móviles, con una anchura máxima de `1200px`. El flujo visual se organiza en patrón "F" para el panel operativo y patrón "Z" para el catálogo público.

**Figura 4.1**  
*Esquema de Distribución Espacial y Cuadrícula Base del Sistema*

> **[ INSERTAR AQUÍ CAPTURA DE CUADRÍCULA / LAYOUT ]**  
> *(Sugerencia: Diagrama estructural de bloques o grilla del sistema)*

*Nota.* Estructura de rejilla fluida con cabecera superior fija (64px), contenedor central modular y barra lateral izquierda para navegación. Elaboración propia (2026).

---

### 1.2 Logotipo Corporativo e Identidad Visual

El logotipo institucional se posiciona en la esquina superior izquierda (`top-left`) en escritorio (160 × 44 px) y centrado en la barra de navegación móvil (140 × 36 px), asegurando el reconocimiento inmediato de la marca y funcionando como enlace de retorno al inicio.

**Figura 4.2**  
*Logotipo Oficial y Variantes de Marca de Panadería Svetlana*

> **[ INSERTAR AQUÍ CAPTURA DEL LOGOTIPO Y VARIANTES ]**  
> *(Archivo disponible: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_19_logo_panaderia_svetlana_general.png`)*

*Nota.* Logotipo con isotipo de espiga de trigo tradicional y tipografía estilizada sobre fondos claro y oscuro. Elaboración propia (2026).

---

### 1.3 Sistema de Navegación y Menús

El sistema implementa dos modalidades de navegación según el dispositivo:
* **Escritorio (Desktop):** Menú horizontal superior para clientes y barra lateral fija izquierda (*Sidebar*) para administradores.
* **Móvil (Mobile):** Menú desplegable (*Drawer*) y barra de pestañas inferior (*TabBar*) adaptada a la zona de alcance del pulgar (**Ley de Fitts**).

**Figura 4.3**  
*Estructura de Navegación: Menú Horizontal Superior y Menú Lateral*

> **[ INSERTAR AQUÍ CAPTURA DE MENÚS Y NAVEGACIÓN ]**  
> *(Sugerencia: Captura de la barra superior pública y sidebar administrativo)*

*Nota.* Disposición de elementos de navegación con estados activo, hover y accesos a módulos operativos. Elaboración propia (2026).

---

### 1.4 Paleta de Colores y Justificación Cromática

La selección de colores responde a la psicología gastronómica y al confort visual en turnos prolongados:
* **Ámbar Dorado (`#D97706`):** Tono de pan horneado que estimula el apetito y destaca botones de acción principal (CTA).
* **Espresso Profundo (`#2B170F`):** Tipografía principal de alto contraste y sofisticación.
* **Fondo Avena (`#FAF5EE` / `#FEF9F2`):** Superficie cálida que previene el cansancio visual.
* **Tríada Operativa:** Azul Cobalto (`#2563EB` - Producción), Verde Esmeralda (`#059669` - Ventas) y Rojo (`#DC2626` - Mermas/FEFO).

**Figura 4.4**  
*Paleta Cromática Oficial y Tokens de Color del Sistema*

> **[ INSERTAR AQUÍ CAPTURA DE LA PALETA DE COLORES ]**  
> *(Sugerencia: Muestrario de colores institucionales con códigos HEX y muestras)*

*Nota.* Guía de colores primarios, secundarios, fondos neutros y semáforo operativo bajo estándar WCAG 2.1 AA. Elaboración propia (2026).

---

### 1.5 Tipografía Oficial

Se combinan dos familias tipográficas complementarias:
* **Display / Títulos:** `Playfair Display` / `Source Serif 4` (Aporta tradición y autenticidad artesanal).
* **Cuerpo y Formularios:** `Plus Jakarta Sans` (Sans-serif geométrica de alta legibilidad en pantallas retina).
* **Metadatos y Lotes:** `JetBrains Mono` (Anchura fija para códigos de lote y fórmulas matemáticas).

**Figura 4.5**  
*Jerarquía Tipográfica y Escala de Fuentes del Sistema*

> **[ INSERTAR AQUÍ CAPTURA DE LA TIPOGRAFÍA ]**  
> *(Sugerencia: Muestrario de fuentes con pesos Regular, Medium, Bold y ejemplos de uso)*

*Nota.* Escala tipográfica institucional con tamaños desde display (32px) hasta etiquetas de microdatos (11px). Elaboración propia (2026).

---

### 1.6 Muestras de Bosquejos / Maquetación (Wireframes de Baja Fidelidad)

Los siguientes bosquejos representan la arquitectura estructural de las pantallas principales del sistema en escala de grises:

#### A. Catálogo Público de Productos y Tienda (B2C)

**Figura 4.6**  
*Bosquejo de Maquetación: Catálogo Público de Productos (Versión Escritorio)*

> **[ INSERTAR AQUÍ IMAGEN DE WIREFRAME CATÁLOGO DESKTOP ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/baja_fidelidad/WF_10_catalogo_de_productos_wireframe_desktop_desktop.png`)*

*Nota.* Estructura del catálogo con buscador superior, filtros de categoría y tarjetas de productos en cuadrícula. Elaboración propia a partir de Google Stitch (2026).

**Figura 4.7**  
*Bosquejo de Maquetación: Catálogo Público de Productos (Versión Móvil)*

> **[ INSERTAR AQUÍ IMAGEN DE WIREFRAME CATÁLOGO MÓVIL ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/baja_fidelidad/WF_20_catalogo_de_productos_wireframe_movil_mobile.png`)*

*Nota.* Adaptación móvil en columna única con botones de acción táctiles y filtro desplegable. Elaboración propia a partir de Google Stitch (2026).

---

#### B. Módulo Operativo de Cierre de Día y Venta Residual

**Figura 4.8**  
*Bosquejo de Maquetación: Módulo de Cierre de Día (Versión Escritorio)*

> **[ INSERTAR AQUÍ IMAGEN DE WIREFRAME CIERRE DE DÍA DESKTOP ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/baja_fidelidad/WF_13_cierre_de_dia_wireframe_admin_panaderia_desktop.png`)*

*Nota.* Esquema de la tabla de arqueo físico nocturno con inputs por bandejas/tiras y tarjetas resumen. Elaboración propia a partir de Google Stitch (2026).

**Figura 4.9**  
*Bosquejo de Maquetación: Módulo de Cierre de Día (Versión Móvil)*

> **[ INSERTAR AQUÍ IMAGEN DE WIREFRAME CIERRE DE DÍA MÓVIL ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/baja_fidelidad/WF_16_cierre_de_dia_wireframe_movil_mobile.png`)*

*Nota.* Vista simplificada para captura rápida de sobrantes desde dispositivos móviles en mostrador. Elaboración propia a partir de Google Stitch (2026).

---

#### C. Dashboard Central de Operaciones Multi-Sucursal

**Figura 4.10**  
*Bosquejo de Maquetación: Dashboard de Operaciones (Versión Escritorio)*

> **[ INSERTAR AQUÍ IMAGEN DE WIREFRAME DASHBOARD DESKTOP ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/baja_fidelidad/WF_03_dashboard_de_operaciones_wireframe_panaderia_desktop.png`)*

*Nota.* Distribución de indicadores clave (KPIs), gráfico comparativo y accesos directos de gestión. Elaboración propia a partir de Google Stitch (2026).

**Figura 4.11**  
*Bosquejo de Maquetación: Dashboard de Operaciones (Versión Móvil)*

> **[ INSERTAR AQUÍ IMAGEN DE WIREFRAME DASHBOARD MÓVIL ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/baja_fidelidad/WF_15_dashboard_de_operaciones_wireframe_movil_mobile.png`)*

*Nota.* Adaptación responsiva con tarjetas apiladas verticalmente y selector rápido de sede física. Elaboración propia a partir de Google Stitch (2026).

---

#### D. Control de Inventario y Caducidades FEFO

**Figura 4.12**  
*Bosquejo de Maquetación: Control de Caducidades FEFO (Versión Escritorio)*

> **[ INSERTAR AQUÍ IMAGEN DE WIREFRAME INVENTARIO FEFO DESKTOP ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/baja_fidelidad/WF_19_modulo_de_inventario_y_caducidades_wireframe_admin_desktop.png`)*

*Nota.* Matriz de lotes con semáforo de vencimiento a 3 estados y botón de baja de producto. Elaboración propia a partir de Google Stitch (2026).

**Figura 4.13**  
*Bosquejo de Maquetación: Control de Caducidades FEFO (Versión Móvil)*

> **[ INSERTAR AQUÍ IMAGEN DE WIREFRAME INVENTARIO FEFO MÓVIL ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/baja_fidelidad/WF_01_inventario_y_caducidades_wireframe_movil_mobile.png`)*

*Nota.* Visualización compacta de lotes en riesgo de caducidad para revisión directa en bodega. Elaboración propia a partir de Google Stitch (2026).

---

#### E. Inicio de Sesión y Autenticación Segura (RBAC)

**Figura 4.14**  
*Bosquejo de Maquetación: Inicio de Sesión (Versión Escritorio)*

> **[ INSERTAR AQUÍ IMAGEN DE WIREFRAME LOGIN DESKTOP ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/baja_fidelidad/WF_05_login_page_wireframe_desktop.png`)*

*Nota.* Formulario centrado con campos de credenciales, botón de acceso y enlace de recuperación. Elaboración propia a partir de Google Stitch (2026).

**Figura 4.15**  
*Bosquejo de Maquetación: Inicio de Sesión (Versión Móvil)*

> **[ INSERTAR AQUÍ IMAGEN DE WIREFRAME LOGIN MÓVIL ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/baja_fidelidad/WF_02_inicio_de_sesion_wireframe_movil_mobile.png`)*

*Nota.* Formulario móvil optimizado con teclado adaptativo y área táctil accesible. Elaboración propia a partir de Google Stitch (2026).

---

# PARTE II: PROTOTIPO NO FUNCIONAL (PANTALLAS EN ALTA FIDELIDAD)

El **prototipo no funcional** constituye la muestra visual de alta fidelidad de las interfaces del sistema terminadas. Integra la paleta cromática, tipografías, bordes redondeados y datos representativos del negocio para validar la experiencia de usuario final.

---

### 2.1 Pantalla de Catálogo Público de Productos y Tienda B2C

Permite a los clientes consultar el catálogo horneado del día, verificar existencias en tiempo real por sucursal y solicitar reservas.

**Figura 4.16**  
*Prototipo No Funcional: Catálogo Público de Productos (Versión Escritorio)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO CATÁLOGO DESKTOP ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_07_catalogo_de_productos_panaderia_svetlana_replica_exacta_desktop.png`)*

*Nota.* Interfaz terminada con paleta "Artesanía de Trigo", badges de disponibilidad y drawer lateral de reserva. Elaboración propia a partir de Google Stitch (2026).

**Figura 4.17**  
*Prototipo No Funcional: Catálogo Público de Productos (Versión Móvil)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO CATÁLOGO MÓVIL ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_08_catalogo_de_productos_panaderia_svetlana_movil_mobile.png`)*

*Nota.* Experiencia móvil para clientes con selección rápida de productos y botón flotante de pedido. Elaboración propia a partir de Google Stitch (2026).

---

### 2.2 Pantalla Operativa de Cierre de Día y Venta Residual

Permite al personal operativo realizar el conteo físico nocturno de pan remanente y calcular la venta diaria por diferencia: $\text{Venta} = \text{Stock Teórico} - \text{Físico} - \text{Merma}$.

**Figura 4.18**  
*Prototipo No Funcional: Módulo Operativo de Cierre de Día (Versión Escritorio)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO CIERRE DE DÍA DESKTOP ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_02_cierre_del_dia_panel_admin_panaderia_svetlana_desktop.png`)*

*Nota.* Pantalla de arqueo físico con conversión de bandejas/tiras a unidades y cálculo automático de venta en USD. Elaboración propia a partir de Google Stitch (2026).

**Figura 4.19**  
*Prototipo No Funcional: Módulo Operativo de Cierre de Día (Versión Móvil)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO CIERRE DE DÍA MÓVIL ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_15_cierre_del_dia_movil_panel_admin_panaderia_svetlana_mobile.png`)*

*Nota.* Captura de datos en tiempo real adaptada a pantallas táctiles de operarios en mostrador. Elaboración propia a partir de Google Stitch (2026).

---

### 2.3 Pantalla de Dashboard Central de Operaciones Multi-Sucursal

Tablero de control gerencial con métricas en tiempo real de producción, ventas estimadas y mermas por sede.

**Figura 4.20**  
*Prototipo No Funcional: Dashboard Central de Operaciones (Versión Escritorio)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO DASHBOARD DESKTOP ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_13_dashboard_de_operaciones_panaderia_svetlana_desktop.png`)*

*Nota.* Panel ejecutivo con tarjetas Bento de métricas del día y gráfico de barras comparativo. Elaboración propia a partir de Google Stitch (2026).

**Figura 4.21**  
*Prototipo No Funcional: Dashboard Central de Operaciones (Versión Móvil)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO DASHBOARD MÓVIL ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_05_dashboard_de_operaciones_movil_panel_admin_panaderia_svetlana_mobile.png`)*

*Nota.* Resumen ejecutivo móvil para monitoreo remoto por parte del administrador. Elaboración propia a partir de Google Stitch (2026).

---

### 2.4 Pantalla de Control de Inventario y Caducidades FEFO

Monitorea la frescura de los lotes perecederos mediante el algoritmo *First-Expired, First-Out* y un semáforo de 3 estados.

**Figura 4.22**  
*Prototipo No Funcional: Inventario Operativo y Caducidades FEFO (Versión Escritorio)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO INVENTARIO FEFO DESKTOP ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_10_inventario_operativo_panel_admin_panaderia_svetlana_desktop.png`)*

*Nota.* Listado de lotes con semáforo preventivo (Crítico, Atención, Óptimo) y opción de baja por merma. Elaboración propia a partir de Google Stitch (2026).

**Figura 4.23**  
*Prototipo No Funcional: Inventario Operativo y Caducidades FEFO (Versión Móvil)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO INVENTARIO FEFO MÓVIL ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_20_inventario_operativo_movil_panel_admin_panaderia_svetlana_mobile.png`)*

*Nota.* Vista de inspección rápida de lotes próximos a vencer para el personal de almacén. Elaboración propia a partir de Google Stitch (2026).

---

### 2.5 Pantalla de Gestión del Catálogo de Productos

Permite la administración de productos, definición de presentaciones comerciales y precios de venta.

**Figura 4.24**  
*Prototipo No Funcional: Gestión de Productos (Versión Escritorio)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO GESTIÓN PRODUCTOS DESKTOP ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_01_gestion_de_productos_panel_admin_panaderia_svetlana_desktop.png`)*

*Nota.* Mantenimiento de catálogo con precios, factores de bandeja e interruptores de estado activo/inactivo. Elaboración propia a partir de Google Stitch (2026).

**Figura 4.25**  
*Prototipo No Funcional: Gestión de Productos (Versión Móvil)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO GESTIÓN PRODUCTOS MÓVIL ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_21_gestion_de_productos_panel_admin_movil_mobile.png`)*

*Nota.* Administración simplificada de catálogo desde dispositivos móviles. Elaboración propia a partir de Google Stitch (2026).

---

### 2.6 Pantalla de Inicio de Sesión y Autenticación Segura (RBAC)

Acceso centralizado con control de roles (`ADMIN`, `ENCARGADO`, `PANADERO`) y protección anti-fuerza bruta.

**Figura 4.26**  
*Prototipo No Funcional: Inicio de Sesión (Versión Escritorio)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO LOGIN DESKTOP ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_14_inicio_de_sesion_panaderia_svetlana_desktop.png`)*

*Nota.* Formulario de autenticación seguro con tipografía y fondos de la identidad visual de la panadería. Elaboración propia a partir de Google Stitch (2026).

**Figura 4.27**  
*Prototipo No Funcional: Inicio de Sesión (Versión Móvil)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO LOGIN MÓVIL ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_11_inicio_de_sesion_panaderia_svetlana_movil_mobile.png`)*

*Nota.* Acceso móvil con diseño minimalista para autenticación ágil en mostrador. Elaboración propia a partir de Google Stitch (2026).

---

### 2.7 Pantalla de Presentación Institucional (Landing Page)

Página principal de bienvenida con presentación de la tradición panadera, catálogo destacado y ubicación de locales.

**Figura 4.28**  
*Prototipo No Funcional: Landing Page Institucional (Versión Escritorio)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO LANDING DESKTOP ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_23_landing_page_panaderia_svetlana_desktop.png`)*

*Nota.* Página de inicio con banner Hero, cinta de atributos de calidad y vitrina de productos artesanales. Elaboración propia a partir de Google Stitch (2026).

**Figura 4.29**  
*Prototipo No Funcional: Landing Page Institucional (Versión Móvil)*

> **[ INSERTAR AQUÍ IMAGEN DE PROTOTIPO LANDING MÓVIL ]**  
> *(Archivo: `documentation/wireframes/stitch_renders/alta_fidelidad/HIFI_17_inicio_panaderia_svetlana_movil_mobile.png`)*

*Nota.* Vista móvil de la página de inicio adaptada para navegación táctil vertical continua. Elaboración propia a partir de Google Stitch (2026).

---

## 3. MATRIZ DE TRAZABILIDAD: CASOS DE USO ↔ BOSQUEJOS ↔ PROTOTIPOS

| Módulo / Función | Caso de Uso | Figura Bosquejo (Maquetación) | Figura Prototipo (Alta Fidelidad) |
| :--- | :--- | :--- | :--- |
| **Catálogo Público y Reservas** | `CU-03` | Figura 4.6 (PC) / Figura 4.7 (Móvil) | Figura 4.16 (PC) / Figura 4.17 (Móvil) |
| **Cierre de Día y Venta Residual** | `CU-01` | Figura 4.8 (PC) / Figura 4.9 (Móvil) | Figura 4.18 (PC) / Figura 4.19 (Móvil) |
| **Dashboard de Operaciones** | `CU-02`, `CU-05` | Figura 4.10 (PC) / Figura 4.11 (Móvil) | Figura 4.20 (PC) / Figura 4.21 (Móvil) |
| **Control de Caducidades FEFO** | `CU-04` | Figura 4.12 (PC) / Figura 4.13 (Móvil) | Figura 4.22 (PC) / Figura 4.23 (Móvil) |
| **Gestión de Productos** | `CU-02` | Figura 4.14 (PC) / Figura 4.15 (Móvil) | Figura 4.24 (PC) / Figura 4.25 (Móvil) |
| **Inicio de Sesión y RBAC** | `CU-06` | Figura 4.14 (PC) / Figura 4.15 (Móvil) | Figura 4.26 (PC) / Figura 4.27 (Móvil) |
| **Landing Page Institucional** | General | — | Figura 4.28 (PC) / Figura 4.29 (Móvil) |
