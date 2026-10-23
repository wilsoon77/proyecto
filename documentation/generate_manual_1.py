import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

# Import helper
sys.path.append(os.path.dirname(__file__))
from doc_helper import (
    create_base_document, add_main_cover, add_divider_cover,
    add_h1, add_h2, add_h3, add_p, add_bullet, add_callout,
    add_styled_table, add_image_with_caption, add_screenshot_placeholder,
    add_code_block
)

def build_manual_1():
    print("Iniciando la construcción del Manual 1: Usuario y Negocio...")
    doc = create_base_document("MANUAL 1: MANUALES ORIENTADOS AL USUARIO Y NEGOCIO — PANADERÍA SVETLANA")
    
    # -------------------------------------------------------------
    # PORTADA PRINCIPAL
    # -------------------------------------------------------------
    metadata_rows = [
        ("Módulos Integrados:", "Usuario Final, Administración de Plataforma, Procesos y Procedimientos"),
        ("Arquitectura del Negocio:", "Producción Centralizada (Matriz) y Venta Híbrida en 2 Sucursales"),
        ("Política Financiera:", "Exclusivamente Efectivo (Cash-Only). Sin facturación electrónica POS"),
        ("Método de Arqueo:", "Conciliación Residual Diaria (Ventas = Inicial + Prod - Final - Mermas)"),
        ("Control de Perecederos:", "Modelo FEFO (First-Expired, First-Out) para Productos de Reventa"),
        ("Canal de Notificaciones:", "Telegram Bot API para Administradores y Maestros Panaderos")
    ]
    add_main_cover(
        doc,
        main_title="MANUALES ORIENTADOS AL USUARIO Y NEGOCIO",
        subtitle="Guía Operativa Integral de Usuario Final, Administración de Plataforma y Manual de Procedimientos Estándar (SOP) con Matriz RACI y Reglas de Negocio",
        doc_code="DOC-MAN-01-USR-NEG",
        version="2.0.0 (Producción)",
        date_str="Octubre 2026",
        classification="CONFIDENCIAL — USO INTERNO Y OPERATIVO",
        audience="Clientes Web, Despachadores de Mostrador, Maestros Panaderos, Administradores y Gerencia",
        metadata_rows=metadata_rows
    )
    
    # -------------------------------------------------------------
    # CONTROL DE VERSIONES Y APROBACIONES
    # -------------------------------------------------------------
    add_h1(doc, "1. CONTROL DOCUMENTAL Y HISTORIAL DE VERSIONES")
    add_p(doc, "El presente documento constituye la especificación canónica y el manual maestro de operación de la plataforma de Panadería Svetlana. Cualquier modificación a las políticas operativas, flujos de caja, fórmulas de balance residual o interfaces de usuario debe registrarse en la presente tabla de control antes de su liberación a producción.")
    
    vers_headers = ["Versión", "Fecha", "Autor / Rol", "Descripción del Cambio", "Estado"]
    vers_rows = [
        ["1.0.0", "15/01/2026", "Equipo de Arquitectura", "Diseño inicial de requerimientos y casos de uso operativos", "Aprobado"],
        ["1.5.0", "20/05/2026", "Líder Técnico & QA", "Incorporación de especificación FEFO y flujo de cierre ciego", "Aprobado"],
        ["1.8.0", "10/08/2026", "Administración Operativa", "Adaptación de políticas cash-only sin emisión de tickets fiscales", "Aprobado"],
        ["2.0.0", "23/10/2026", "Lead Architect & Dirección", "Manual consolidado: Usuario, Administración y 25 Reglas de Negocio", "Vigente"]
    ]
    add_styled_table(doc, vers_headers, vers_rows, [Inches(0.9), Inches(1.1), Inches(1.5), Inches(2.1), Inches(0.9)])
    
    add_h2(doc, "1.1 Marco de Aprobación Institucional")
    add_p(doc, "La validez de este manual cuenta con la ratificación formal de las partes interesadas del proyecto:")
    
    sign_headers = ["Cargo / Función", "Nombre del Titular", "Firma de Conformidad", "Fecha de Firma"]
    sign_rows = [
        ["Dirección General / Propietario", "Wilson Administrador General", "[FIRMA DIGITAL VALIDADA]", "23/10/2026"],
        ["Jefatura de Producción / Maestro Panadero", "Maestro Hornero Matriz", "[FIRMA DIGITAL VALIDADA]", "23/10/2026"],
        ["Supervisión de Mostrador y Sucursales", "Encargada Sucursal Secundaria", "[FIRMA DIGITAL VALIDADA]", "23/10/2026"],
        ["Líder de Desarrollo y Sistemas", "Lead Software Architect", "[FIRMA DIGITAL VALIDADA]", "23/10/2026"]
    ]
    add_styled_table(doc, sign_headers, sign_rows, [Inches(2.0), Inches(1.8), Inches(1.6), Inches(1.1)])
    
    # -------------------------------------------------------------
    # ÍNDICE GENERAL NARRATIVO
    # -------------------------------------------------------------
    add_h1(doc, "2. ÍNDICE GENERAL DEL DOCUMENTO", page_break_before=True)
    add_p(doc, "Este manual está estructurado en tres grandes bloques funcionales e independientes, cada uno precedido por su propia portada de sección:")
    
    add_bullet(doc, "Guía paso a paso para el cliente en tienda online, personal de mostrador y maestros panaderos.", bold_prefix="PARTE I: MANUAL DE USUARIO FINAL.")
    add_bullet(doc, "Gestión de roles RBAC, catálogo maestro, inventarios, caducidades FEFO, arqueo diario residual y bot de Telegram.", bold_prefix="PARTE II: MANUAL DE ADMINISTRACIÓN DEL SISTEMA.")
    add_bullet(doc, "Macroprocesos del negocio, 7 Procedimientos Operativos Estándar (POE), matriz RACI y catálogo de 25 reglas oficiales.", bold_prefix="PARTE III: MANUAL DE PROCESOS Y PROCEDIMIENTOS DEL NEGOCIO.")
    
    add_callout(doc, "Para la navegación ágil dentro del documento, las figuras y diagramas se encuentran debidamente indexados y rotulados bajo norma APA 7. Los espacios de captura de pantalla cuentan con parámetros de resolución y requerimientos específicos de auditoría visual.", title="CONVENCIONES DE LECTURA:", callout_type="info")

    # -------------------------------------------------------------
    # CONTEXTO DEL NEGOCIO Y VISIÓN INTEGRAL
    # -------------------------------------------------------------
    add_h1(doc, "3. CONTEXTO OPERATIVO DEL NEGOCIO Y MODELO PANADERÍA SVETLANA")
    add_p(doc, "Panadería Svetlana opera bajo un esquema artesanal tradicional en proceso de digitalización controlada, con dos puntos físicos de atención: la Sucursal Matriz (donde se concentra la planta de amasado, fermentación y horneado centralizado) y la Sucursal Secundaria (un punto de venta dependiente que recibe lotes de pan recién horneado a primera hora de la mañana y a media tarde).")
    
    add_p(doc, "Históricamente, los procesos de la panadería presentaban graves deficiencias debido al uso de cuadernos de notas, transferencias a ciegas entre sucursales, falta de detección oportuna de insumos bajos y productos de reventa caducados en anaquel, así como descuadres crónicos de caja al cierre nocturno. La implementación del presente software resuelve de manera directa esta problemática, conservando las particularidades reales del negocio:")
    
    add_bullet(doc, "No se opera con datáfonos, tarjetas bancarias ni pasarelas online de pago diferido. Toda reserva web y compra física se liquida en efectivo al momento de la entrega en mostrador.", bold_prefix="1. Modelo de Cobro Exclusivo en Efectivo (Cash-Only):")
    add_bullet(doc, "En estricto apego al régimen operativo del negocio, el sistema no emite tickets fiscales con sello digital, eliminando módulos innecesarios de facturación o integración con entidades tributarias.", bold_prefix="2. Cero Facturación Electrónica o Tickets Fiscales:")
    add_bullet(doc, "Toda la masa y bollería se elabora exclusivamente en el horno de la Matriz. La Sucursal Secundaria no posee amasadoras ni hornos de gran escala; su inventario proviene de transferencias matutinas registradas en el sistema.", bold_prefix="3. Producción Monolítica Centralizada:")
    add_bullet(doc, "Debido a la alta rotación y dinámica de despacho a granel, el cálculo de venta diaria no se basa en el registro individual de cada pieza de pan en caja, sino en la ecuación residual auditada: Ventas = Inventario Inicial + Producción del Día - Inventario Final - Mermas.", bold_prefix="4. Cierre Diario Residual Automatizado:")
    add_bullet(doc, "Los productos de reventa empaquetados (lácteos, refrescos, mermeladas) se gestionan bajo estricto control FEFO, garantizando que el primer producto en expirar sea el primero en mostrarse disponible para despacho.", bold_prefix="5. Gestión FEFO de Perecederos:")

    # Embedding diagrams
    diag_anterior = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "DIAGRAMA_CONTEXTO_SISTEMA_ANTERIOR.png"))
    if os.path.exists(diag_anterior):
        add_image_with_caption(doc, diag_anterior, "Figura 1. Diagrama de Contexto del Sistema Anterior (Procesos manuales, cuadernos y llamadas telefónicas)", 6.2)

    diag_actual = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "DIAGRAMA_CONTEXTO_SISTEMA.png"))
    if os.path.exists(diag_actual):
        add_image_with_caption(doc, diag_actual, "Figura 2. Diagrama de Contexto del Sistema Actual (Interacción digital centralizada entre actores)", 6.2)

    # =============================================================
    # SUBDIVISIÓN 1: MANUAL DE USUARIO FINAL
    # =============================================================
    part1_topics = [
        ("Módulo 1.1: Perfiles de Usuario", "Definir roles, capacidades y restricciones de los actores finales", "Clientes, Despacho, Panaderos"),
        ("Módulo 1.2: Entorno y Compatibilidad", "Requisitos de navegadores web, pantallas móviles y conectividad", "Todos los usuarios"),
        ("Módulo 1.3: Autenticación y Perfil", "Flujo de registro, login seguro, recuperación y datos personales", "Cliente Web y Personal"),
        ("Módulo 1.4: Catálogo y Navegación", "Exploración de panadería, repostería, filtros y alérgenos", "Cliente Web"),
        ("Módulo 1.5: Carrito y Reserva Online", "Armado de pedido, selección de sucursal de retiro y checkout cash", "Cliente Web"),
        ("Módulo 1.6: Seguimiento de Pedidos", "Consulta de estado de reserva (Pendiente, En Horno, Listo)", "Cliente Web"),
        ("Módulo 1.7: Despacho en Mostrador", "Búsqueda de reserva, cobro exacto en efectivo y entrega de producto", "Personal de Mostrador"),
        ("Módulo 1.8: Registro de Producción", "Captura de piezas horneadas por tanda, turno y merma de masa", "Maestro Panadero"),
        ("Módulo 1.9: Catálogo de Errores", "Guía de resolución de problemas cotidianos de usuario", "Personal Operativo"),
        ("Módulo 1.10: Preguntas Frecuentes", "Respuestas estandarizadas a dudas comunes de operación", "Todos los usuarios")
    ]
    add_divider_cover(
        doc,
        part_number="I",
        part_title="MANUAL DE USUARIO FINAL",
        part_subtitle="Guía de Interacción Operativa para Clientes Web, Personal de Mostrador y Maestros Panaderos",
        description="Esta subdivisión provee instrucciones detalladas y ergonómicas para cada rol humano que interactúa con la plataforma. Describe los flujos paso a paso de compra, despacho en mostrador, registro de tanda de pan y resolución autónoma de incidentes comunes.",
        topics_list=part1_topics
    )
    
    # -------------------------------------------------------------
    # MÓDULO 1.1: PERFILES DE USUARIO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 1: PERFILES DE USUARIO Y MATRIZ DE ACCESO")
    add_p(doc, "El sistema de Panadería Svetlana implementa un esquema de acceso estrictamente diferenciado para garantizar la seguridad de los datos de inventario y la ergonomía de la interfaz según el rol laboral de cada operador.")
    
    roles_headers = ["Identificador de Rol", "Descripción del Perfil", "Puntos de Entrada Autorizados", "Restricciones Críticas"]
    roles_rows = [
        ["CUSTOMER", "Cliente externo que navega el catálogo web y genera apartados de pan para retiro en tienda.", "Portal Web Público (/productos, /carrito, /mis-pedidos)", "Sin acceso a balances de caja, costos de insumos ni paneles de horneado."],
        ["CASHIER (Mostrador)", "Encargado de atención en sucursal matriz o secundaria. Valida pedidos web y entrega.", "Panel Mostrador (/admin/reservas, /admin/mostrador)", "No puede modificar recetas, no puede alterar precios de venta."],
        ["BAKER (Panadero)", "Maestro hornero y ayudantes de panadería ubicados en la Sucursal Matriz.", "Módulo de Producción (/admin/produccion)", "Solo registra piezas horneadas y mermas de amasado. Sin acceso a dinero físico."],
        ["ADMIN (Gerente)", "Propietarios y administradores generales con control total de la cadena.", "Todo el sistema (/admin, /reportes, /auditoria, Telegram)", "Acceso irrestricto con obligación de doble factor y registro en bitácora."]
    ]
    add_styled_table(doc, roles_headers, roles_rows, [Inches(1.5), Inches(2.2), Inches(1.5), Inches(1.3)])
    
    # -------------------------------------------------------------
    # MÓDULO 1.2: ENTORNO Y REQUISITOS DE ACCESO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 2: ENTORNO TECNOLÓGICO Y REQUISITOS DE ACCESO")
    add_p(doc, "La interfaz web de Panadería Svetlana está desarrollada como una aplicación web progresiva y responsiva (Next.js con Tailwind CSS), diseñada para funcionar fluidamente en computadoras de escritorio, tablets de punto de venta y teléfonos inteligentes personales.")
    
    add_h2(doc, "2.1 Requisitos de Navegadores Web")
    add_p(doc, "Para garantizar la correcta ejecución del carrito dinámico, validaciones en tiempo real y componentes visuales, se requiere el uso de navegadores modernos con soporte para JavaScript ES6+ y almacenamiento local (LocalStorage / SessionStorage):")
    add_bullet(doc, "Versión 115 o superior (Recomendado para computadoras de mostrador).", bold_prefix="Google Chrome / Chromium:")
    add_bullet(doc, "Versión 118 o superior en sistemas Windows y macOS.", bold_prefix="Mozilla Firefox:")
    add_bullet(doc, "Versión 16.4 o superior en dispositivos Apple iPhone / iPad.", bold_prefix="Apple Safari:")
    add_bullet(doc, "Versión 115 o superior en sistemas Windows 10 y Windows 11.", bold_prefix="Microsoft Edge:")
    
    add_h2(doc, "2.2 Conectividad y Dispositivos en Sucursales")
    add_p(doc, "En el mostrador de las sucursales se recomienda un ancho de banda mínimo de 5 Mbps simétricos para el intercambio instantáneo de reservas. En caso de micro-cortes de red, el sistema mantiene en caché local la sesión activa del usuario para evitar cierres abruptos.")

    # -------------------------------------------------------------
    # MÓDULO 1.3: AUTENTICACIÓN Y GESTIÓN DE PERFIL
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 3: MÓDULO DE AUTENTICACIÓN Y SEGURIDAD DE ACCESO")
    add_p(doc, "El acceso al sistema garantiza que únicamente los usuarios registrados puedan tramitar reservas de pan y que el personal operativo acceda a sus paneles de control exclusivos.")
    
    login_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "capturas", "login.png"))
    if os.path.exists(login_img):
        add_image_with_caption(doc, login_img, "Figura 3. Pantalla de Inicio de Sesión Unificada (Acceso para Clientes y Personal Administrativo)", 5.8)
    else:
        add_screenshot_placeholder(doc, "Inicio de Sesión", "/login", "Todos los Roles", "Campos de correo, contraseña, botón Ingresar, enlace de registro y OAuth", "Figura 3. Formulario de Autenticación")

    add_h2(doc, "3.1 Proceso de Registro para Clientes Nuevos")
    add_p(doc, "Los clientes que deseen apartar piezas especiales de panadería o repostería deben completar un formulario de registro simple:")
    add_bullet(doc, "Hacer clic en el enlace 'Crear Cuenta' o 'Registrarse' ubicado en la esquina superior derecha o en la base del formulario de login.", bold_prefix="Paso 1:")
    add_bullet(doc, "Ingresar nombre completo, número de teléfono móvil (utilizado para contacto directo en caso de retraso en retiro) y correo electrónico válido.", bold_prefix="Paso 2:")
    add_bullet(doc, "Definir una contraseña segura que cumpla con los estándares mínimos (8 caracteres, al menos una mayúscula y un número).", bold_prefix="Paso 3:")
    add_bullet(doc, "Aceptar los términos de servicio y la política de retiro en tienda física bajo modalidad de pago en efectivo.", bold_prefix="Paso 4:")
    add_bullet(doc, "Presionar 'Registrar Cuenta'. El sistema iniciará automáticamente la sesión y redirigirá al catálogo principal.", bold_prefix="Paso 5:")

    add_h2(doc, "3.2 Inicio de Sesión y Manejo de Sesión Segura")
    add_p(doc, "El ingreso al sistema utiliza tokens de acceso JWT (JSON Web Tokens) transmitidos mediante cookies HttpOnly seguras con atributo SameSite, protegiendo las credenciales frente a ataques de suplantación Cross-Site Scripting (XSS).")
    
    add_callout(doc, "Si un usuario administrativo o despachador intenta ingresar a una ruta no autorizada (por ejemplo, acceder a /admin/auditoria con rol CASHIER), el sistema denegará la petición inmediatamente con un error HTTP 403 Forbidden y redirigirá al usuario a su panel correspondiente.", title="CONTROL DE ACCESO:", callout_type="warning")

    # -------------------------------------------------------------
    # MÓDULO 1.4: CATÁLOGO DIGITAL Y BÚSQUEDA
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 4: CATÁLOGO DIGITAL DE PRODUCTOS Y NAVEGACIÓN")
    add_p(doc, "El catálogo en línea representa el escaparate digital de Panadería Svetlana, permitiendo a los clientes explorar las creaciones del día clasificadas por tipo de masa, técnica de horneado y disponibilidad.")
    
    prod_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "capturas", "productos.png"))
    if os.path.exists(prod_img):
        add_image_with_caption(doc, prod_img, "Figura 4. Catálogo Digital de Productos con Filtros de Categoría y Precios Unitarios", 6.0)
    else:
        add_screenshot_placeholder(doc, "Catálogo de Productos", "/productos", "CUSTOMER / Público", "Cuadrícula de productos, tarjetas con imagen, precio en pesos, botón de agregar y filtros", "Figura 4. Vista de Catálogo de Productos")

    add_h2(doc, "4.1 Organización de Categorías de Panadería")
    add_p(doc, "Los productos se agrupan en cuatro grandes familias para facilitar la selección rápida:")
    add_bullet(doc, "Conchas tradicionales (vainilla, chocolate), cuernos de mantequilla, orejas hojaldradas, polvorones, donas y panqués artesanales.", bold_prefix="1. Pan Dulce Tradicional:")
    add_bullet(doc, "Bolillos crujientes, teleras para tortas, pan de caja artesanal, baguettes y teleras de ajonjolí horneadas en piedra.", bold_prefix="2. Pan Blanco y de Mesa:")
    add_bullet(doc, "Pasteles de tres leches, milhojas de crema pastelera, tartaletas de frutos rojos y empanadas dulces.", bold_prefix="3. Repostería y Pastelería:")
    add_bullet(doc, "Leches pasteurizadas, bebidas saborizadas y conservas empaquetadas (sujetas a rotación FEFO).", bold_prefix="4. Productos de Reventa:")

    add_h2(doc, "4.2 Ficha Detallada del Producto")
    add_p(doc, "Al pulsar sobre cualquier tarjeta de producto, el usuario accede a su ficha técnica completa, la cual despliega: fotografía de alta calidad, precio unitario en moneda nacional ($ MXN), descripción sensorial, lista de ingredientes principales y advertencias obligatorias de alérgenos (trigo/gluten, huevo, leche, nueces).")

    # -------------------------------------------------------------
    # MÓDULO 1.5: CARRITO DE COMPRAS Y RESERVA ONLINE
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 5: CARRITO DE COMPRAS Y RESERVA DE PEDIDOS")
    add_p(doc, "A diferencia de un comercio electrónico tradicional con pasarelas bancarias externas, Panadería Svetlana emplea un modelo de Reserva Anticipada con Pago en Mostrador (Click & Collect Cash-Only). Este mecanismo garantiza al cliente que sus piezas seleccionadas estarán apartadas sin costo financiero adicional.")
    
    cu03_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "CU-03_reserva_pedidos_checkout.png"))
    if os.path.exists(cu03_img):
        add_image_with_caption(doc, cu03_img, "Figura 5. Diagrama de Caso de Uso CU-03: Flujo de Reserva de Pedidos y Checkout en Efectivo", 6.0)

    add_h2(doc, "5.1 Procedimiento de Armado de Carrito")
    add_p(doc, "Para generar una reserva de pan, el cliente ejecuta la siguiente secuencia:")
    add_bullet(doc, "Seleccionar el botón 'Agregar al Carrito' en las piezas deseadas, ajustando las unidades mediante los controles +/-.", bold_prefix="Paso 1:")
    add_bullet(doc, "Abrir el panel lateral del carrito haciendo clic en el icono de la cesta ubicado en la barra de navegación superior.", bold_prefix="Paso 2:")
    add_bullet(doc, "Verificar las cantidades de cada producto, el precio unitario y el monto subtotal calculado de manera reactiva.", bold_prefix="Paso 3:")
    add_bullet(doc, "Pulsar 'Continuar al Checkout' para pasar a la pantalla de configuración de retiro.", bold_prefix="Paso 4:")

    add_h2(doc, "5.2 Selección de Sucursal y Política de Tolerancia")
    add_p(doc, "En el checkout, el cliente debe seleccionar obligatoriamente la sucursal de retiro física:")
    add_bullet(doc, "Calle Principal #101, Col. Centro (Retiro en horario continuo de 06:00 a 21:00 hrs).", bold_prefix="Sucursal Matriz:")
    add_bullet(doc, "Avenida Las Flores #45, Col. Jardines (Retiro disponible a partir de las 08:00 hrs tras la llegada del pan).", bold_prefix="Sucursal Secundaria:")
    
    add_callout(doc, "REGLA OPERATIVA RN-08: Toda reserva generada cuenta con un tiempo de tolerancia de 2 horas a partir de la hora solicitada de retiro. Si el cliente no se presenta en dicho lapso, la reserva se marca como EXPIRADA y las piezas se reintegran al anaquel de venta general del mostrador para evitar pérdidas por merma.", title="TOLERANCIA DE RETIRO:", callout_type="rule")

    add_screenshot_placeholder(doc, "Checkout y Confirmación de Reserva", "/checkout", "CUSTOMER", "Selector de sucursal, resumen de piezas, aviso de pago en efectivo y botón Finalizar Reserva", "Figura 6. Pantalla de Checkout y Confirmación de Pedido para Retiro en Sucursal")

    # -------------------------------------------------------------
    # MÓDULO 1.6: SEGUIMIENTO DE PEDIDOS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 6: SEGUIMIENTO DE PEDIDOS Y NOTIFICACIONES")
    add_p(doc, "El cliente puede monitorear en todo momento la evolución de su reserva a través de la sección 'Mis Pedidos'. El ciclo de vida de un pedido atraviesa los siguientes estados canónicos:")
    
    stat_headers = ["Estado del Pedido", "Significado Operativo", "Acción del Negocio", "Notificación"]
    stat_rows = [
        ["PENDING (Pendiente)", "La solicitud fue recibida por el sistema pero no ha sido confirmada en tienda.", "Se verifica existencia física de pan o lote en horneado.", "Correo de confirmación inicial"],
        ["CONFIRMED (Confirmado)", "El mostrador validó la disponibilidad de las piezas apartadas.", "El personal aparta las piezas en canastilla rotulada.", "Actualización en portal web"],
        ["READY (Listo para Retiro)", "El pedido se encuentra empaquetado esperando al cliente.", "Permanece en mostrador dentro del periodo de tolerancia.", "Aviso de pedido listo para retiro"],
        ["DELIVERED (Entregado)", "El cliente acudió a la sucursal, pagó en efectivo y recibió el pan.", "Se registra el ingreso en el balance residual del día.", "Pedido cerrado en sistema"],
        ["CANCELLED (Cancelado)", "Cancelado por el cliente antes de confirmación o por falta de stock.", "Piezas liberadas inmediatamente.", "Aviso de cancelación"],
        ["EXPIRED (Expirado)", "El cliente no se presentó dentro de la ventana de 2 horas de tolerancia.", "Las piezas vuelven a la venta de mostrador general.", "Registro de incidencia de cliente"]
    ]
    add_styled_table(doc, stat_headers, stat_rows, [Inches(1.5), Inches(2.2), Inches(1.8), Inches(1.0)])

    # -------------------------------------------------------------
    # MÓDULO 1.7: DESPACHO EN MOSTRADOR Y COBRO EN EFECTIVO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 7: DESPACHO EN MOSTRADOR Y COBRO EN EFECTIVO")
    add_p(doc, "Este capítulo constituye la guía operativa diaria para el personal encargado de la atención física en el mostrador de las sucursales Matriz y Secundaria.")
    
    add_h2(doc, "7.1 Protocolo de Búsqueda y Entrega de Pedido")
    add_p(doc, "Cuando un cliente se presenta en mostrador indicando que cuenta con un pedido web, el despachador ejecuta el siguiente procedimiento:")
    add_bullet(doc, "Solicitar al cliente el código de pedido (ej. #ORD-2026-089) o el nombre registrado en la cuenta.", bold_prefix="Paso 1:")
    add_bullet(doc, "Ingresar al módulo 'Mostrador / Despacho' (/admin/reservas) y escribir el código en la barra de búsqueda reactiva.", bold_prefix="Paso 2:")
    add_bullet(doc, "Verificar en pantalla la lista de productos apartados (ej. 10 Conchas de Vainilla, 5 Cuernos) y comparar con las piezas reservadas en la canastilla física.", bold_prefix="Paso 3:")
    add_bullet(doc, "Confirmar el importe exacto a cobrar en pantalla (ej. $185.00 MXN).", bold_prefix="Paso 4:")
    add_bullet(doc, "Recibir el pago en efectivo, ingresar el monto entregado para calcular el cambio matemático, y almacenar el dinero en el cajón de mostrador.", bold_prefix="Paso 5:")
    add_bullet(doc, "Pulsar el botón 'Marcar como Entregado' en el sistema. El pedido transiciona al estado DELIVERED.", bold_prefix="Paso 6:")
    add_bullet(doc, "Hacer entrega de la bolsa de pan empaquetada al cliente, agradeciendo su compra de manera cortés.", bold_prefix="Paso 7:")

    add_callout(doc, "POLÍTICA DE COMPROBANTES: Panadería Svetlana no emite facturas con sello del SAT ni recibos fiscales impresos. No se entregan tickets de papel a menos que el cliente solicite una nota de remisión manual simple foliada.", title="AVISO FINANCIERO:", callout_type="warning")

    add_screenshot_placeholder(doc, "Módulo de Mostrador y Despacho", "/admin/reservas", "CASHIER / STAFF", "Buscador de pedidos, lista de reservas del día, botón Cobrar en Efectivo y Marcar Entregado", "Figura 7. Interfaz Operativa de Despacho y Entrega en Mostrador de Sucursal")

    # -------------------------------------------------------------
    # MÓDULO 1.8: REGISTRO DE PRODUCCIÓN PARA MAESTROS PANADEROS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 8: MÓDULO DE REGISTRO DE PRODUCCIÓN EN MATRIZ")
    add_p(doc, "Toda la masa y horneado de panadería se produce centralmente en la Sucursal Matriz. El maestro panadero debe registrar cada tanda de pan que sale del horno para alimentar el inventario diario disponible y permitir el cálculo residual exacto al cierre de turno.")
    
    cu02_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "CU-02_produccion_materia_prima.png"))
    if os.path.exists(cu02_img):
        add_image_with_caption(doc, cu02_img, "Figura 8. Diagrama de Caso de Uso CU-02: Registro de Producción de Pan y Consumo de Materia Prima", 6.0)

    add_h2(doc, "8.1 Procedimiento de Captura de Horneado")
    add_p(doc, "Al terminar cada horneada (tanda matutina de 05:00 a 08:00 hrs o vespertina de 15:00 a 18:00 hrs):")
    add_bullet(doc, "El maestro panadero o ayudante designado accede a la tableta de panadería en /admin/produccion.", bold_prefix="Paso 1:")
    add_bullet(doc, "Seleccionar el tipo de producto elaborado desde el menú desplegable (ej. Concha Tradicional).", bold_prefix="Paso 2:")
    add_bullet(doc, "Indicar la cantidad exacta de piezas obtenidas y aptas para la venta (ej. 120 unidades).", bold_prefix="Paso 3:")
    add_bullet(doc, "Registrar cualquier merma de horneado (piezas quemadas, deformes o aplastadas que no saldrán a mostrador, ej. 4 unidades).", bold_prefix="Paso 4:")
    add_bullet(doc, "Pulsar 'Guardar Tanda de Producción'. El sistema actualiza inmediatamente el inventario en mostrador y deduce proporcionalmente los insumos de harina, azúcar y manteca según la ficha técnica de la receta.", bold_prefix="Paso 5:")

    add_screenshot_placeholder(doc, "Registro de Producción Diaria", "/admin/produccion", "BAKER / ADMIN", "Selector de receta, campo de piezas horneadas, campo de mermas de horno y botón Guardar Tanda", "Figura 9. Formulario Táctil de Registro de Horneada para Maestro Panadero")

    # -------------------------------------------------------------
    # MÓDULO 1.9: CATÁLOGO DE ERRORES HABITUALES DE USUARIO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 9: CATÁLOGO DE ERRORES HABITUALES Y RESOLUCIÓN")
    add_p(doc, "A continuación se documentan los errores de operación más frecuentes que pueden experimentar los usuarios finales y el personal de mostrador, con su procedimiento de remediación inmediata:")
    
    err_headers = ["Código / Síntoma", "Mensaje en Pantalla", "Causa Operativa Raíz", "Acción de Resolución Paso a Paso"]
    err_rows = [
        ["ERR-USR-01", "Stock insuficiente para la reserva seleccionada", "El cliente solicita más piezas de las registradas en el inventario activo.", "Ajustar la cantidad de piezas deseadas al número disponible en color verde."],
        ["ERR-USR-02", "Sesión expirada o token no válido", "La cookie de sesión caducó tras un periodo prolongado de inactividad.", "Pulsar 'Cerrar Sesión' o recargar la página e iniciar sesión nuevamente."],
        ["ERR-USR-03", "No se puede seleccionar retiro en fecha pasada", "El cliente intentó fijar una hora anterior al momento actual.", "Seleccionar una hora futura dentro del horario operativo de la sucursal elegida."],
        ["ERR-USR-04", "Pedido ya marcado como entregado", "El cajero pulsó dos veces el botón de confirmación de despacho.", "Ninguna acción requerida; el sistema bloquea transacciones duplicadas."],
        ["ERR-USR-05", "Contraseña no cumple requisitos de seguridad", "La clave no contiene mayúsculas o tiene menos de 8 caracteres.", "Escribir una contraseña que combine mayúsculas, minúsculas y al menos un dígito."],
        ["ERR-USR-06", "Sucursal cerrada en el horario solicitado", "Se intentó programar entrega en domingo por la tarde o fuera de horario.", "Consultar el horario de mostrador en el pie de página y ajustar la reserva."],
        ["ERR-USR-07", "Código de pedido inexistente", "El cajero digitó erróneamente el identificador alfabético.", "Solicitar al cliente el nombre o teléfono y buscar en la lista general del día."],
        ["ERR-USR-08", "No se puede cancelar pedido en preparación", "El panadero ya apartó las piezas y el pedido está confirmado.", "El cliente debe comunicarse telefónicamente con la sucursal para cancelaciones."]
    ]
    add_styled_table(doc, err_headers, err_rows, [Inches(1.1), Inches(1.8), Inches(1.8), Inches(1.8)])

    # -------------------------------------------------------------
    # MÓDULO 1.10: PREGUNTAS FRECUENTES (FAQ)
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 10: PREGUNTAS FRECUENTES (FAQ) DE USUARIOS")
    
    add_h2(doc, "FAQ para Clientes Web")
    add_p(doc, "¿Puedo pagar mi pedido en línea con tarjeta de débito o transferencia bancaria?", bold_prefix="P1:")
    add_p(doc, "Respuesta: No. Panadería Svetlana opera bajo una política estricta de pago exclusivo en efectivo (Cash-Only). El importe total se liquida directamente en el mostrador de la sucursal seleccionada al momento de recibir el pan recién horneado.")
    
    add_p(doc, "¿Qué sucede si llego tarde a recoger mi apartado de pan?", bold_prefix="P2:")
    add_p(doc, "Respuesta: Toda reserva cuenta con 2 horas de tolerancia a partir de la hora de entrega convenida. Transcurrido ese tiempo, el sistema expira el pedido y las piezas se colocan en los estantes para su venta al público general para evitar pérdidas por merma.")

    add_p(doc, "¿Puedo pedir que me envíen el pan a domicilio?", bold_prefix="P3:")
    add_p(doc, "Respuesta: Actualmente la plataforma no ofrece servicio de entrega a domicilio ni mensajería motorizada. Todos los pedidos son bajo la modalidad de retiro personal en tienda (Click & Collect).")

    add_h2(doc, "FAQ para Personal de Mostrador y Panaderos")
    add_p(doc, "¿Cómo procedo si un cliente llega sin el código de reserva?", bold_prefix="P4:")
    add_p(doc, "Respuesta: En la pantalla de mostrador, el despachador puede ingresar el nombre del cliente o su número telefónico en el campo de filtro para localizar inmediatamente la comanda y verificar las piezas solicitadas.")

    add_p(doc, "¿Qué debo hacer si un panadero hornea piezas adicionales a las planeadas?", bold_prefix="P5:")
    add_p(doc, "Respuesta: El maestro panadero debe registrar inmediatamente la nueva tanda en /admin/produccion indicando las piezas reales obtenidas. El sistema actualizará el stock para venta inmediata en mostrador.")

    # =============================================================
    # SUBDIVISIÓN 2: MANUAL DE ADMINISTRACIÓN
    # =============================================================
    part2_topics = [
        ("Módulo 2.1: Perfil del Administrador", "Responsabilidades gerenciales y gobernanza de la plataforma", "Administradores y Gerencia"),
        ("Módulo 2.2: Gestión de Usuarios y RBAC", "Altas, bajas, asignación de roles y control de privilegios", "Administradores"),
        ("Módulo 2.3: Catálogo Maestro de Productos", "Fijación de precios, familias de pan y activación de ítems", "Administradores"),
        ("Módulo 2.4: Control de Insumos y Materias Primas", "Monitoreo de harinas, azúcares y compras en Matriz", "Gerencia y Jefe de Cocina"),
        ("Módulo 2.5: Gestión FEFO y Lotes de Reventa", "Trazabilidad de caducidades y priorización de despacho", "Administradores y Mostrador"),
        ("Módulo 2.6: Cierre Diario y Arqueo Residual", "Ecuación matemática de cierre y conciliación de efectivo", "Gerencia y Cajas"),
        ("Módulo 2.7: Dashboard y Analítica Operativa", "Interpretación de KPIs, mermas, ventas y rotación", "Dirección General"),
        ("Módulo 2.8: Configuración de Bot de Telegram", "Tokens, comandos de consulta y alertas automáticas", "Administradores Técnicos"),
        ("Módulo 2.9: Auditoría y Trazabilidad de Logs", "Inspección de eventos críticos y prevención de fraudes", "Auditoría Interna"),
        ("Módulo 2.10: Políticas de Seguridad y Datos", "Respaldos locales, gestión de contraseñas y privacidad", "Administradores")
    ]
    add_divider_cover(
        doc,
        part_number="II",
        part_title="MANUAL DE ADMINISTRACIÓN DEL SISTEMA",
        part_subtitle="Guía de Control Maestro, Gestión de Inventarios, Modelo FEFO, Arqueo Diario Residual y Auditoría",
        description="Esta sección está dirigida al personal directivo, gerencial y técnico responsable de supervisar la rentabilidad, abastecimiento y consistencia contable del negocio. Contiene las directrices para la parametrización del sistema, cierre nocturno ciego de cajas y auditoría de seguridad.",
        topics_list=part2_topics
    )

    # -------------------------------------------------------------
    # MÓDULO 2.1: PERFIL Y RESPONSABILIDADES DEL ADMINISTRADOR
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 11: PERFIL Y GOBERNANZA ADMINISTRATIVA")
    add_p(doc, "El Administrador del Sistema en Panadería Svetlana ostenta la responsabilidad máxima sobre la parametrización de la plataforma, el resguardo de la información financiera y la coordinación operativa entre las dos sucursales. Sus atribuciones incluyen:")
    add_bullet(doc, "Garantizar que todas las tandas de horneado y recepciones de insumos se encuentren al día en el sistema.", bold_prefix="Supervisión Operativa:")
    add_bullet(doc, "Verificar diariamente que el efectivo recaudado en caja coincida con la venta residual calculada por el sistema.", bold_prefix="Conciliación de Efectivo:")
    add_bullet(doc, "Monitorear semanalmente los lotes próximos a vencer de productos de reventa y aplicar descuentos o descartes.", bold_prefix="Control de Calidad FEFO:")
    add_bullet(doc, "Supervisar las notificaciones críticas enviadas a través del asistente Bot de Telegram institucional.", bold_prefix="Gestión de Contingencias:")

    # -------------------------------------------------------------
    # MÓDULO 2.2: GESTIÓN DE IDENTIDADES Y RBAC
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 12: GESTIÓN DE IDENTIDADES Y CONTROL RBAC")
    add_p(doc, "El control de acceso basado en roles (Role-Based Access Control) previene que personal operativo acceda a reportes financieros confidenciales o modifique registros históricos de producción.")
    
    cu06_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "CU-06_seguridad_rbac_multisucursal.png"))
    if os.path.exists(cu06_img):
        add_image_with_caption(doc, cu06_img, "Figura 10. Diagrama de Caso de Uso CU-06: Seguridad, Control RBAC y Separación de Sucursales", 6.0)

    add_h2(doc, "12.1 Procedimiento para Alta de Nuevo Empleado")
    add_p(doc, "Cuando se incorpora un nuevo trabajador a mostrador o panadería, el administrador procede de la siguiente forma:")
    add_bullet(doc, "Navegar a /admin/usuarios y pulsar el botón '+ Nuevo Usuario'.", bold_prefix="Paso 1:")
    add_bullet(doc, "Ingresar nombre, apellido, correo electrónico corporativo y asignar una contraseña provisoria de 10 caracteres.", bold_prefix="Paso 2:")
    add_bullet(doc, "Asignar el rol operativo correspondiente en el selector (CASHIER o BAKER).", bold_prefix="Paso 3:")
    add_bullet(doc, "Asignar la sucursal de adscripción (Matriz o Sucursal Secundaria). Un usuario asignado a la Sucursal Secundaria no podrá visualizar comanda ni inventario de la Matriz a menos que se le otorguen permisos multi-sucursal.", bold_prefix="Paso 4:")
    add_bullet(doc, "Guardar el registro y solicitar al empleado que inicie sesión para cambiar su contraseña en el primer acceso.", bold_prefix="Paso 5:")

    add_screenshot_placeholder(doc, "Gestión de Usuarios y Roles", "/admin/usuarios", "ADMIN", "Tabla de colaboradores, estado de cuenta (Activo/Inactivo), selector de roles y botón de reseteo", "Figura 11. Panel Administrativo de Gestión de Cuentas y Asignación de Roles RBAC")

    # -------------------------------------------------------------
    # MÓDULO 2.3: CATÁLOGO MAESTRO DE PRODUCTOS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 13: GESTIÓN DEL CATÁLOGO MAESTRO Y PRECIOS")
    add_p(doc, "El catálogo maestro administra los artículos comercializados por la panadería, estableciendo precios oficiales, imágenes publicitarias, descripciones e ingredientes.")
    
    add_h2(doc, "13.1 Actualización de Precios de Venta")
    add_p(doc, "Ante incrementos en el costo de los insumos (harina, manteca, azúcar), el administrador puede actualizar los precios unitarios:")
    add_bullet(doc, "Acceder a /admin/productos y filtrar por la categoría deseada.", bold_prefix="Paso 1:")
    add_bullet(doc, "Pulsar el icono de edición (lápiz) sobre el producto específico.", bold_prefix="Paso 2:")
    add_bullet(doc, "Modificar el campo 'Precio al Público ($ MXN)'. El sistema valida que sea un valor numérico positivo con máximo 2 decimales.", bold_prefix="Paso 3:")
    add_bullet(doc, "Pulsar 'Actualizar Producto'. El nuevo precio surte efecto de forma inmediata en el catálogo público y en el módulo de mostrador.", bold_prefix="Paso 4:")

    # -------------------------------------------------------------
    # MÓDULO 2.4: CONTROL DE MATERIAS PRIMAS E INSUMOS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 14: CONTROL DE INSUMOS Y MATERIAS PRIMAS EN MATRIZ")
    add_p(doc, "La producción de pan requiere un suministro ininterrumpido de ingredientes clave. Dado que en el modelo de Panadería Svetlana no se digitaliza la relación con proveedores externos (los pedidos se realizan en el momento por vía telefónica o en persona), el sistema se enfoca en registrar el nivel actual de insumos en bodega:")
    
    ins_headers = ["Insumo / Materia Prima", "Unidad de Medida", "Stock Mínimo de Alerta", "Ubicación de Almacén", "Impacto en Producción"]
    ins_rows = [
        ["Harina de Trigo Extra Fina", "Bulto de 50 kg", "10 Bultos", "Bodega Seca Matriz", "Crítico: Detiene pan dulce y blanco"],
        ["Levadura Fresca Prensada", "Caja de 1 kg", "5 Cajas", "Cámara Fría Matriz", "Crítico: Detiene fermentación de masas"],
        ["Azúcar Estándar", "Bulto de 50 kg", "4 Bultos", "Bodega Seca Matriz", "Alto: Requerido para bollería dulce"],
        ["Manteca Vegetal / Mantequilla", "Caja de 24 kg", "3 Cajas", "Bodega Seca Matriz", "Alto: Requerido para hojaldres y conchas"],
        ["Huevo Fresco de Granja", "Caja de 360 piezas", "2 Cajas", "Área de Pesaje Matriz", "Medio: Panqués y repostería fina"],
        ["Sal Yodada Industrial", "Bolsa de 25 kg", "2 Bolsas", "Bodega Seca Matriz", "Medio: Esencial para pan blanco y salado"]
    ]
    add_styled_table(doc, ins_headers, ins_rows, [Inches(1.8), Inches(1.2), Inches(1.2), Inches(1.2), Inches(1.1)])

    # -------------------------------------------------------------
    # MÓDULO 2.5: GESTIÓN DE LOTES Y CADUCIDADES MEDIANTE MODELO FEFO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 15: CONTROL DE CADUCIDADES FEFO (PRODUCTOS DE REVENTA)")
    add_p(doc, "Para los productos comercializados en mostrador que no son elaborados en el horno de la panadería (leches pasteurizadas, refrescos, mermeladas empaquetadas, cajeta y jugos), se implementa de manera rigurosa el modelo FEFO (First-Expired, First-Out: lo primero que expira es lo primero en salir).")
    
    cu04_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "CU-04_control_caducidades_fefo.png"))
    if os.path.exists(cu04_img):
        add_image_with_caption(doc, cu04_img, "Figura 12. Diagrama de Caso de Uso CU-04: Control de Caducidades FEFO y Prevención de Mermas", 6.0)

    add_h2(doc, "15.1 Registro de Lote al Recibir Mercancía")
    add_p(doc, "Al recibir un paquete de productos de reventa en sucursal:")
    add_bullet(doc, "Ingresar a /admin/lotes y presionar '+ Registrar Lote FEFO'.", bold_prefix="Paso 1:")
    add_bullet(doc, "Seleccionar el producto de reventa del listado.", bold_prefix="Paso 2:")
    add_bullet(doc, "Capturar la cantidad de unidades recibidas (ej. 24 botes de leche 1L).", bold_prefix="Paso 3:")
    add_bullet(doc, "Indicar la Fecha de Vencimiento impresa en el envase físico.", bold_prefix="Paso 4:")
    add_bullet(doc, "El sistema generará un código de lote interno (ej. #LOT-2026-092) y ordenará automáticamente la cola de despacho de modo que los productos con fecha más próxima deban colocarse al frente del anaquel físico.", bold_prefix="Paso 5:")

    add_callout(doc, "SEMÁFORO DE VENCIMIENTO FEFO: El sistema categoriza visualmente los lotes: VERDE (más de 15 días de vida útil), AMARILLO (entre 5 y 15 días, requiere exhibición prioritaria en mostrador) y ROJO (menos de 5 días, alerta crítica para promoción rápida o descarte antes de pérdida total).", title="ALERTA PREVENTIVA:", callout_type="warning")

    # -------------------------------------------------------------
    # MÓDULO 2.6: CIERRE DIARIO Y ARQUEO RESIDUAL
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 16: CIERRE DIARIO DE OPERACIONES Y ARQUEO RESIDUAL")
    add_p(doc, "El Cierre Diario de Operaciones (Daily Close) es el procedimiento financiero nuclear de Panadería Svetlana. Al no registrarse individualmente cada venta de mostrador debido al flujo vertiginoso de despacho en efectivo, el sistema calcula matemáticamente la venta total neta mediante el Balance Residual Ciego de Inventario.")
    
    cu01_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "CU-01_cierre_de_dia.png"))
    if os.path.exists(cu01_img):
        add_image_with_caption(doc, cu01_img, "Figura 13. Diagrama de Caso de Uso CU-01: Algoritmo de Cierre Diario y Conciliación de Efectivo", 6.0)

    add_h2(doc, "16.1 La Ecuación Fundamental del Balance Residual")
    add_p(doc, "El algoritmo del sistema calcula las unidades vendidas de cada producto y el importe monetario correspondiente aplicando de forma determinista la siguiente fórmula:")
    
    add_callout(doc, "VENTAS_UNIDADES = INVENTARIO_INICIAL + PRODUCCIÓN_DEL_DÍA - INVENTARIO_FINAL_FÍSICO - MERMAS_REGISTRADAS\n\nVENTAS_MONETARIAS_ESPERADAS = SUMA (VENTAS_UNIDADES × PRECIO_UNITARIO)\n\nDIFERENCIA_CAJA = EFECTIVO_FÍSICO_CONTADO - VENTAS_MONETARIAS_ESPERADAS", title="FÓRMULA MATEMÁTICA DE CONCILIACIÓN:", callout_type="rule")

    add_h2(doc, "16.2 Procedimiento de Ejecución del Cierre Nocturno")
    add_p(doc, "Al terminar la jornada (21:00 hrs en Matriz y 20:30 hrs en Sucursal Secundaria):")
    add_bullet(doc, "El personal de mostrador cuenta físicamente cada pieza de pan sobrante en las canastas y estantes (Inventario Final).", bold_prefix="Paso 1:")
    add_bullet(doc, "Pesar y registrar las mermas del día (piezas rotas o no aptas para consumo).", bold_prefix="Paso 2:")
    add_bullet(doc, "Contar todo el papel moneda y monedas en el cajón de efectivo.", bold_prefix="Paso 3:")
    add_bullet(doc, "El administrador accede a /admin/cierre-diario, captura los datos de conteo y el efectivo físico total.", bold_prefix="Paso 4:")
    add_bullet(doc, "Pulsar 'Ejecutar Conciliación y Bloqueo'. El sistema calcula la diferencia (sobrante o faltante).", bold_prefix="Paso 5:")
    add_bullet(doc, "Una vez confirmado el cierre, la fecha queda BLOQUEADA para prevenir modificaciones retroactivas maliciosas en inventarios o ventas.", bold_prefix="Paso 6:")

    add_screenshot_placeholder(doc, "Cierre Diario y Conciliación de Caja", "/admin/cierre-diario", "ADMIN / GERENCIA", "Campos de conteo físico, campo de efectivo real en caja, desglose de diferencia y botón Bloquear Jornada", "Figura 14. Pantalla de Ejecución de Cierre Diario y Conciliación Residual de Caja")

    # -------------------------------------------------------------
    # MÓDULO 2.7: DASHBOARD Y ANALÍTICA OPERATIVA
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 17: TABLERO DE CONTROL Y ANALÍTICA OPERATIVA")
    add_p(doc, "El panel de operaciones (/admin) concentra en tiempo real las métricas clave de desempeño (KPIs) del negocio, permitiendo a la dirección general tomar decisiones fundamentadas sobre volúmenes de horneado y abastecimiento.")
    
    dash_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "capturas", "dashboard.png"))
    if os.path.exists(dash_img):
        add_image_with_caption(doc, dash_img, "Figura 15. Vista General del Tablero de Control Administrativo (Dashboard de KPIs)", 6.0)

    cu07_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "CU-07_panel_operaciones_dashboard.png"))
    if os.path.exists(cu07_img):
        add_image_with_caption(doc, cu07_img, "Figura 16. Diagrama de Caso de Uso CU-07: Arquitectura de Filtros y Métricas del Panel Operativo", 6.0)

    add_h2(doc, "17.1 Indicadores Clave de Desempeño (KPIs)")
    add_p(doc, "El dashboard calcula automáticamente cuatro métricas cardinales:")
    add_bullet(doc, "Suma consolidada de ingresos por ventas de mostrador y reservas concluidas durante la jornada.", bold_prefix="1. Venta Diaria Estimada ($ MXN):")
    add_bullet(doc, "Total de reservas recibidas, clasificadas en activas, entregadas y expiradas.", bold_prefix="2. Volumen de Reservas:")
    add_bullet(doc, "Porcentaje de pan no vendido o dañado respecto a la producción total del día (Meta óptima: < 3.5%).", bold_prefix="3. Índice de Mermas:")
    add_bullet(doc, "Listado de las 5 variedades de pan con mayor velocidad de despacho (ej. Concha de Vainilla, Bolillo, Oreja).", bold_prefix="4. Productos Top de Rotación:")

    # -------------------------------------------------------------
    # MÓDULO 2.8: ASISTENTE BOT DE TELEGRAM
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 18: GESTIÓN DEL ASISTENTE BOT DE TELEGRAM")
    add_p(doc, "Para mantener informada a la dirección del negocio sin necesidad de estar frente a una computadora, el sistema cuenta con una integración nativa bidireccional con Telegram Messenger mediante la API oficial de Bots.")
    
    cu05_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "CU-05_asistente_telegram_bot.png"))
    if os.path.exists(cu05_img):
        add_image_with_caption(doc, cu05_img, "Figura 17. Diagrama de Caso de Uso CU-05: Flujo de Interacción del Bot Asistente de Telegram", 6.0)

    add_h2(doc, "18.1 Catálogo de Comandos Interactivos")
    add_p(doc, "Los usuarios administrativos autorizados en Telegram pueden enviar comandos directos al bot institucional (@SvetlanaPanaderiaBot):")
    
    bot_headers = ["Comando", "Parámetros", "Respuesta del Bot", "Nivel de Permiso Requerido"]
    bot_rows = [
        ["/start", "Ninguno", "Mensaje de bienvenida y validación de número celular del directivo.", "Público"],
        ["/resumen", "[hoy / ayer]", "Reporte sintético con venta total en efectivo, reservas y mermas.", "ADMIN"],
        ["/alertas", "Ninguno", "Lista inmediata de lotes FEFO en semáforo rojo o amarillo en sucursales.", "ADMIN / STAFF"],
        ["/inventario", "[sucursal]", "Consulta rápida del stock de pan disponible en vitrinas en tiempo real.", "ADMIN / BAKER"],
        ["/cierre", "Ninguno", "Confirmación de si ambas sucursales han completado su cierre diario.", "ADMIN"]
    ]
    add_styled_table(doc, bot_headers, bot_rows, [Inches(1.5), Inches(1.3), Inches(2.3), Inches(1.4)])

    # -------------------------------------------------------------
    # MÓDULO 2.9: AUDITORÍA Y TRAZABILIDAD
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 19: AUDITORÍA DEL SISTEMA Y TRAZABILIDAD OPERATIVA")
    add_p(doc, "Cada transacción crítica realizada en el sistema es registrada en una tabla de auditoría inmutable (AuditLog) que no puede ser purgada ni modificada desde la interfaz web.")
    
    diag_audit = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "DIAGRAMA_SOPORTE_SEGURIDAD_AUDITORIA.png"))
    if os.path.exists(diag_audit):
        add_image_with_caption(doc, diag_audit, "Figura 18. Diagrama de Soporte, Seguridad y Arquitectura de Auditoría Inmutable", 6.0)

    add_p(doc, "Los registros de auditoría almacenan la siguiente información obligatoria:")
    add_bullet(doc, "Identificador único (UUID) y nombre del usuario que ejecutó la acción.", bold_prefix="Actor:")
    add_bullet(doc, "Tipo de operación (CREACIÓN_LOTE, CIERRE_DIARIO, MODIFICACIÓN_PRECIO, CANCELACIÓN_PEDIDO).", bold_prefix="Evento:")
    add_bullet(doc, "Marca de tiempo UTC sincronizada con el servidor central.", bold_prefix="Timestamp:")
    add_bullet(doc, "Dirección IP de origen y cabecera User-Agent del navegador utilizado.", bold_prefix="Origen de Red:")
    add_bullet(doc, "Snapshot en formato JSON del estado anterior y posterior del registro modificado.", bold_prefix="Payload Diff:")

    # -------------------------------------------------------------
    # MÓDULO 2.10: POLÍTICAS DE SEGURIDAD ADMINISTRATIVA
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 20: POLÍTICAS DE SEGURIDAD Y GOBERNANZA")
    add_p(doc, "Para garantizar la integridad y confidencialidad de la plataforma, la gerencia establece las siguientes políticas obligatorias de seguridad informática:")
    add_bullet(doc, "Todo personal de mostrador y administración debe renovar su contraseña de acceso cada 90 días naturales.", bold_prefix="1. Rotación de Credenciales:")
    add_bullet(doc, "Las cuentas de empleados que dejen de prestar servicios en la panadería deben desactivarse en menos de 2 horas hábiles tras su salida.", bold_prefix="2. Baja Inmediata de Acceso:")
    add_bullet(doc, "Queda estrictamente prohibido el uso de cuentas compartidas entre despachadores del mismo turno. Cada cobro debe registrarse bajo la sesión individual del cajero responsable.", bold_prefix="3. Cuentas Nominales Intransferibles:")

    # =============================================================
    # SUBDIVISIÓN 3: MANUAL DE PROCESOS / PROCEDIMIENTOS
    # =============================================================
    part3_topics = [
        ("Módulo 3.1: Cadena de Valor", "Mapa general de macroprocesos del negocio", "Dirección y Personal"),
        ("Módulo 3.2: POE-01 Horneado Diario", "Procedimiento estándar para registro de tandas en Matriz", "Maestros Panaderos"),
        ("Módulo 3.3: POE-02 Transferencia Ciega", "Despacho y recepción de pan en Sucursal Secundaria", "Chofer y Mostrador"),
        ("Módulo 3.4: POE-03 Ciclo de Reservas", "Gestión de pedidos web, preparación y tolerancia", "Mostrador y Clientes"),
        ("Módulo 3.5: POE-04 Despacho y Cobro Cash", "Atención en ventanilla, recepción de efectivo y entrega", "Personal de Mostrador"),
        ("Módulo 3.6: POE-05 Auditoría FEFO", "Inspección de caducidades y rotación de mercancías", "Personal de Mostrador"),
        ("Módulo 3.7: POE-06 Cierre Nocturno", "Conteo físico ciego, pesaje de merma y arqueo", "Encargados de Caja"),
        ("Módulo 3.8: POE-07 Incidencias de Insumos", "Detección de faltantes y compras de emergencia", "Jefatura de Producción"),
        ("Módulo 3.9: Matriz RACI Integral", "Responsabilidad de 5 roles sobre 15 procesos clave", "Toda la Organización"),
        ("Módulo 3.10: Catálogo de Reglas RN-01 a RN-25", "Políticas oficiales de negocio codificadas e inviolables", "Toda la Organización")
    ]
    add_divider_cover(
        doc,
        part_number="III",
        part_title="MANUAL DE PROCESOS Y PROCEDIMIENTOS DEL NEGOCIO",
        part_subtitle="Procedimientos Operativos Estándar (POE), Cadena de Valor, Matriz RACI y Catálogo Oficial de 25 Reglas de Negocio",
        description="Esta subdivisión establece los Procedimientos Operativos Estándar (Standard Operating Procedures - SOP) que rigen la operación física y digital de Panadería Svetlana. Vincula formalmente cada función del software con las responsabilidades humanas, tiempos de respuesta y reglas no negociables de la empresa.",
        topics_list=part3_topics
    )

    # -------------------------------------------------------------
    # MÓDULO 3.1: CADENA DE VALOR
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 21: CADENA DE VALOR Y MACROPROCESOS DEL NEGOCIO")
    add_p(doc, "La cadena de valor de Panadería Svetlana articula cinco macroprocesos secuenciales que transforman materias primas básicas en experiencias gastronómicas tradicionales de alta calidad:")
    
    cv_headers = ["Fase de la Cadena", "Macroproceso", "Entradas Clave", "Actividades Principales", "Salidas / Valor Entregado"]
    cv_rows = [
        ["1. Abastecimiento", "Aprovisionamiento Local", "Harinas, levaduras, azúcar", "Compras directas a proveedores locales", "Insumos pesados en bodega"],
        ["2. Producción", "Elaboración en Matriz", "Recetas maestras e insumos", "Amasado, fermentación y horneado", "Pan recién horneado por tandas"],
        ["3. Distribución", "Transferencia Inter-Sucursal", "Charolas de pan recién horneado", "Transporte matutino y vespertino", "Pan disponible en Sucursal 2"],
        ["4. Comercialización", "Venta Mostrador y Web", "Pan en vitrinas y reservas", "Atención, apartado y cobro cash", "Pan entregado al cliente"],
        ["5. Control y Cierre", "Conciliación Residual", "Conteo físico y dinero en caja", "Arqueo residual y bloqueo nocturno", "Balance financiero auditado"]
    ]
    add_styled_table(doc, cv_headers, cv_rows, [Inches(1.2), Inches(1.3), Inches(1.3), Inches(1.4), Inches(1.3)])

    # -------------------------------------------------------------
    # MÓDULO 3.2: POE-01 HORNEADO DIARIO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 22: PROCEDIMIENTO OPERATIVO ESTÁNDAR POE-01: PLANIFICACIÓN Y REGISTRO DE HORNEADO")
    add_p(doc, "Objetivo: Estandarizar la captura de tandas de producción en el horno de la Sucursal Matriz, asegurando que las piezas obtenidas y las mermas de horneado queden registradas antes de su salida a venta.")
    add_p(doc, "Responsable Principal: Maestro Panadero en turno matutino (05:00 hrs) o vespertino (15:00 hrs).")
    
    add_bullet(doc, "Revisar en la pizarra de panadería la meta de piezas a elaborar según las reservas activas y la demanda proyectada.", bold_prefix="Paso 1 (Planificación):")
    add_bullet(doc, "Pesar y mezclar los insumos siguiendo la receta maestra estandarizada.", bold_prefix="Paso 2 (Amasado):")
    add_bullet(doc, "Hornear a la temperatura y tiempo prescritos para la variedad en proceso.", bold_prefix="Paso 3 (Horneado):")
    add_bullet(doc, "Inspeccionar las charolas al salir del horno; separar piezas que presenten defectos estéticos o quemaduras.", bold_prefix="Paso 4 (Control de Calidad):")
    add_bullet(doc, "Acceder a la tableta de panadería y capturar en /admin/produccion el conteo de piezas aptas y mermas.", bold_prefix="Paso 5 (Registro Digital):")
    add_bullet(doc, "Trasladar las charolas aprobadas a las canastas de exhibición para mostrador o transferencia.", bold_prefix="Paso 6 (Despacho a Vitrinas):")

    # -------------------------------------------------------------
    # MÓDULO 3.3: POE-02 TRANSFERENCIA INTER-SUCURSAL
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 23: PROCEDIMIENTO OPERATIVO ESTÁNDAR POE-02: TRANSFERENCIA INTER-SUCURSAL")
    add_p(doc, "Objetivo: Regular el traslado de pan desde la planta de horneado en Matriz hacia la Sucursal Secundaria.")
    add_p(doc, "Responsables: Encargado de Despacho en Matriz, Conductor de Reparto y Encargada de Sucursal Secundaria.")
    
    add_bullet(doc, "A las 07:15 hrs y 16:30 hrs, el encargado en Matriz prepara las charolas asignadas para la Sucursal Secundaria.", bold_prefix="Paso 1:")
    add_bullet(doc, "Cargar las charolas en el vehículo de reparto con fundas protectoras grado alimenticio.", bold_prefix="Paso 2:")
    add_bullet(doc, "El conductor traslada el pan a la Sucursal Secundaria en un tiempo estimado de 15 a 20 minutos.", bold_prefix="Paso 3:")
    add_bullet(doc, "La encargada de la Sucursal Secundaria recibe las charolas, realiza un conteo físico rápido y acomoda las piezas en las vitrinas de mostrador.", bold_prefix="Paso 4:")
    add_bullet(doc, "El lote transferido queda registrado en el inventario inicial de la sucursal para el arqueo nocturno.", bold_prefix="Paso 5:")

    # -------------------------------------------------------------
    # MÓDULO 3.4: POE-03 GESTIÓN DE RESERVAS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 24: PROCEDIMIENTO OPERATIVO ESTÁNDAR POE-03: GESTIÓN DE RESERVAS WEB")
    add_p(doc, "Objetivo: Garantizar la preparación oportuna de los pedidos en línea y la correcta aplicación del periodo de tolerancia.")
    add_p(doc, "Responsables: Cliente Web y Personal de Mostrador.")
    
    add_bullet(doc, "El sistema notifica la entrada de una nueva reserva con estatus PENDING en la pantalla de mostrador.", bold_prefix="Paso 1 (Ingreso de Pedido):")
    add_bullet(doc, "El cajero verifica que el pan solicitado esté disponible en charolas; si es así, presiona 'Confirmar Reserva'.", bold_prefix="Paso 2 (Validación):")
    add_bullet(doc, "El personal toma una bolsa de papel ecológica, introduce las piezas solicitadas y coloca una etiqueta con el código de comanda.", bold_prefix="Paso 3 (Empaquetado):")
    add_bullet(doc, "La bolsa se coloca en el estante de 'Pedidos Listos para Retiro'. El estado pasa a READY.", bold_prefix="Paso 4 (Apartado):")
    add_bullet(doc, "El temporizador de tolerancia de 2 horas inicia su cuenta regresiva.", bold_prefix="Paso 5 (Control de Tiempo):")
    add_bullet(doc, "Si el cliente se presenta: se procede con el cobro en efectivo (POE-04). Si el tiempo expira sin retiro: se presiona 'Expirar Reserva' y el pan vuelve a venta pública.", bold_prefix="Paso 6 (Resolución):")

    # -------------------------------------------------------------
    # MÓDULO 3.5: POE-04 DESPACHO Y COBRO EN EFECTIVO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 25: PROCEDIMIENTO OPERATIVO ESTÁNDAR POE-04: DESPACHO Y COBRO CASH-ONLY")
    add_p(doc, "Objetivo: Asegurar un flujo ágil de cobro físico sin generar colas en mostrador, manteniendo el cuadre estricto del cajón de efectivo.")
    add_bullet(doc, "Recibir al cliente con saludo cordial y solicitar las piezas deseadas (o el código de reserva web).", bold_prefix="Paso 1:")
    add_bullet(doc, "Colocar las piezas en pinzas higiénicas y depositarlas en la charola o bolsa de despacho.", bold_prefix="Paso 2:")
    add_bullet(doc, "Indicar en voz clara el total exacto a pagar en moneda nacional.", bold_prefix="Paso 3:")
    add_bullet(doc, "Recibir el dinero en efectivo, verificar autenticidad de billetes de alta denominación ($200, $500), depositar en cajón y entregar el cambio exacto.", bold_prefix="Paso 4:")
    add_bullet(doc, "Entregar el producto empaquetado. El despacho queda concluido sin emisión de ticket de papel.", bold_prefix="Paso 5:")

    # -------------------------------------------------------------
    # MÓDULO 3.6: POE-05 AUDITORÍA DE CADUCIDADES FEFO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 26: PROCEDIMIENTO OPERATIVO ESTÁNDAR POE-05: CONTROL DIARIO FEFO")
    add_p(doc, "Objetivo: Eliminar el riesgo de comercializar productos de reventa empaquetados caducados en los mostradores.")
    add_bullet(doc, "A las 06:30 hrs de cada mañana, el encargado de mostrador inspecciona los anaqueles de productos empaquetados.", bold_prefix="Paso 1:")
    add_bullet(doc, "Revisar las fechas de vencimiento físicas de los productos exhibidos.", bold_prefix="Paso 2:")
    add_bullet(doc, "Alinear los productos de tal manera que las fechas más próximas de caducidad queden en primera fila visible (Principio FEFO).", bold_prefix="Paso 3:")
    add_bullet(doc, "Identificar productos que se encuentren a 48 horas de su fecha de vencimiento; aplicar el descuento de liquidación rápida autorizado en sistema.", bold_prefix="Paso 4:")
    add_bullet(doc, "Si un producto alcanza su fecha de vencimiento sin haberse vendido, retirarlo inmediatamente del anaquel y registrarlo en /admin/lotes como 'Merma por Caducidad'.", bold_prefix="Paso 5:")

    # -------------------------------------------------------------
    # MÓDULO 3.7: POE-06 CIERRE NOCTURNO Y ARQUEO RESIDUAL
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 27: PROCEDIMIENTO OPERATIVO ESTÁNDAR POE-06: ARQUEO RESIDUAL DIARIO")
    add_p(doc, "Objetivo: Formalizar el balance nocturno de caja y producción, garantizando la detección inmediata de fugas de dinero o pan.")
    add_bullet(doc, "Cerrar las puertas de la sucursal al horario establecido (21:00 hrs Matriz / 20:30 hrs Secundaria).", bold_prefix="Paso 1:")
    add_bullet(doc, "Realizar el conteo ciego de cada variedad de pan restante en vitrinas, anotando las cantidades en la planilla de preconteo.", bold_prefix="Paso 2:")
    add_bullet(doc, "Pesar y registrar las mermas no aptas para venta que se acumularon durante la jornada.", bold_prefix="Paso 3:")
    add_bullet(doc, "Extraer el dinero del cajón de mostrador y separar el fondo fijo de caja ($500.00 MXN para cambio del día siguiente).", bold_prefix="Paso 4:")
    add_bullet(doc, "Contar y clasificar el efectivo restante por denominación de billetes y monedas.", bold_prefix="Paso 5:")
    add_bullet(doc, "Capturar los datos en la pantalla de Cierre Diario (/admin/cierre-diario) y presionar 'Ejecutar Conciliación'.", bold_prefix="Paso 6:")
    add_bullet(doc, "Analizar la diferencia arrojada por el sistema. Si la diferencia es mayor a ±$50.00 MXN, se debe realizar un reconteo inmediato.", bold_prefix="Paso 7:")
    add_bullet(doc, "Firmar la constancia de cierre digital y guardar el efectivo en la caja fuerte de seguridad.", bold_prefix="Paso 8:")

    # -------------------------------------------------------------
    # MÓDULO 3.8: POE-07 INCIDENCIAS DE INSUMOS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 28: PROCEDIMIENTO OPERATIVO ESTÁNDAR POE-07: INCIDENCIAS DE INSUMOS")
    add_p(doc, "Objetivo: Gestionar compras urgentes de insumos en bodega cuando los niveles alcancen el umbral de alerta crítica.")
    add_bullet(doc, "Al detectar que un insumo alcanza su stock mínimo en bodega (ej. menos de 10 bultos de harina), el panadero notifica al administrador.", bold_prefix="Paso 1:")
    add_bullet(doc, "El administrador se comunica inmediatamente con el proveedor habitual para pactar la entrega en el transcurso del día.", bold_prefix="Paso 2:")
    add_bullet(doc, "Al recibir la mercancía, el encargado verifica la calidad del grano o insumo y efectúa el pago directo en efectivo o contra-entrega.", bold_prefix="Paso 3:")
    add_bullet(doc, "Actualizar el stock disponible en /admin/materias-primas.", bold_prefix="Paso 4:")

    # -------------------------------------------------------------
    # MÓDULO 3.9: MATRIZ RACI INTEGRAL
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 29: MATRIZ DE RESPONSABILIDADES RACI INTEGRAL")
    add_p(doc, "La matriz RACI (Responsible, Accountable, Consulted, Informed) define inequívocamente el nivel de intervención de cada rol sobre los procesos fundamentales de la panadería:")
    
    raci_headers = ["Proceso Operativo / Administrativo", "Cliente (Web)", "Mostrador / Cajero", "Maestro Panadero", "Gerente / Admin", "Dirección General"]
    raci_rows = [
        ["1. Consulta de Catálogo y Precios", "R", "I", "I", "A", "I"],
        ["2. Registro y Solicitud de Reserva", "R", "I", "I", "A", "I"],
        ["3. Confirmación y Empaque de Reserva", "I", "R", "C", "A", "I"],
        ["4. Despacho y Cobro en Mostrador", "I", "R", "I", "A", "I"],
        ["5. Planificación de Masa y Receta", "I", "I", "R", "A", "I"],
        ["6. Horneado y Registro de Tanda", "I", "I", "R", "A", "I"],
        ["7. Transferencia a Sucursal Secundaria", "I", "C", "R", "A", "I"],
        ["8. Recepción de Pan en Sucursal 2", "I", "R", "I", "A", "I"],
        ["9. Recepción y Alta de Lote FEFO", "I", "C", "I", "R", "A"],
        ["10. Rotación Física FEFO en Anaquel", "I", "R", "I", "A", "I"],
        ["11. Descarte de Mermas por Caducidad", "I", "C", "I", "R", "A"],
        ["12. Conteo Ciego de Cierre Diario", "I", "R", "C", "A", "I"],
        ["13. Conciliación Residual de Caja", "I", "C", "I", "R", "A"],
        ["14. Gestión de Asistente de Telegram", "I", "I", "C", "R", "A"],
        ["15. Auditoría de Seguridad y Roles", "I", "I", "I", "R", "A"]
    ]
    add_styled_table(doc, raci_headers, raci_rows, [Inches(2.1), Inches(0.8), Inches(0.9), Inches(0.9), Inches(0.9), Inches(0.9)])
    add_p(doc, "Convenciones: [R] Responsable de ejecutar la tarea, [A] Accountable / Autoridad final que aprueba, [C] Consultado durante el proceso, [I] Informado del resultado.", italic=True)

    # -------------------------------------------------------------
    # MÓDULO 3.10: CATÁLOGO DE REGLAS DE NEGOCIO (RN-01 A RN-25)
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 30: CATÁLOGO OFICIAL DE REGLAS DE NEGOCIO (RN-01 A RN-25)")
    add_p(doc, "Las siguientes 25 reglas de negocio representan políticas mandatorias implementadas en el código fuente de la aplicación y en los procedimientos operativos cotidianos:")
    
    rn_headers = ["Identificador", "Nombre de la Regla", "Descripción Operativa / Lógica en Software", "Consecuencia en Caso de Incumplimiento"]
    rn_rows = [
        ["RN-01", "Moneda y Medio de Pago", "Toda transacción se liquida exclusivamente en moneda nacional mexicana ($ MXN) y en efectivo físico al momento de la entrega.", "Se rechaza cualquier intento de pago diferido, tarjeta o cheque."],
        ["RN-02", "Sin Comprobante Fiscal", "El sistema no emite facturas CFDI ni tickets con validez tributaria ante el SAT.", "Ningún empleado podrá generar documentos fiscales en la plataforma."],
        ["RN-03", "Centralización de Horneado", "Todo el pan dulce y de mesa se elabora en el horno de la Sucursal Matriz.", "Prohibido hornear piezas a gran escala en la Sucursal Secundaria."],
        ["RN-04", "Registro Inmediato de Tanda", "El panadero debe registrar cada horneada en /admin/produccion antes de su despacho a mostrador.", "El pan no registrado no se podrá conciliar en el arqueo diario."],
        ["RN-05", "Tolerancia de Reserva", "Toda reserva web tiene exactamente 2 horas de vigencia tras la hora pactada.", "Al cumplirse las 2 horas, el sistema marca el pedido como EXPIRED."],
        ["RN-06", "Liberación de Pan Expirado", "El pan de pedidos expirados debe colocarse inmediatamente en vitrina pública.", "Evita que el producto se vuelva merma no recuperable."],
        ["RN-07", "Priorización FEFO Estricta", "Los productos de reventa se muestran y despachan según fecha de vencimiento más próxima.", "El sistema bloquea la selección de lotes nuevos si existen lotes viejos activos."],
        ["RN-08", "Alerta Amarilla FEFO", "Lotes con entre 5 y 15 días de vida útil disparan notificación de exhibición frontal.", "El cajero debe ubicar las piezas al frente del anaquel."],
        ["RN-09", "Alerta Roja FEFO", "Lotes con menos de 5 días disparan alerta prioritaria para promoción con descuento.", "Si llega a 0 días sin venderse, se destruye y marca como merma."],
        ["RN-10", "Fórmula de Cierre Residual", "Ventas = Inventario Inicial + Producción - Inventario Final - Mermas.", "Fórmula inmutable codificada en backend; no editable manualmente."],
        ["RN-11", "Conteo Ciego en Cierre", "El cajero no conoce el monto esperado de efectivo antes de ingresar el conteo físico.", "Previene manipulación de inventarios sobrantes o faltantes."],
        ["RN-12", "Bloqueo Nocturno de Jornada", "Una vez aprobado el cierre, la fecha queda bloqueada contra edición en base de datos.", "Solo el Administrador General puede solicitar reapertura justificada."],
        ["RN-13", "Umbral de Diferencia de Caja", "Diferencias mayores a ±$50.00 MXN exigen reconteo físico de efectivo y piezas.", "El sistema genera una anotación especial en el reporte de cierre."],
        ["RN-14", "Fondo Fijo Intocable", "Cada sucursal mantiene un fondo fijo de $500.00 MXN para cambio del día siguiente.", "El fondo fijo se separa antes de cuantificar las ventas recaudadas."],
        ["RN-15", "Separación de Roles RBAC", "Un usuario con rol BAKER o CASHIER no puede acceder a balances de auditoría ni finanzas.", "El sistema retorna HTTP 403 Forbidden y audita el intento no autorizado."],
        ["RN-16", "Sesión Única Nominal", "Prohibido el uso de credenciales compartidas en los mostradores.", "Todo despacho queda firmado digitalmente con el ID del cajero activo."],
        ["RN-17", "Caducidad de Sesión JWT", "Las sesiones inactivas expiran automáticamente a los 60 minutos.", "El usuario debe autenticarse nuevamente para continuar operando."],
        ["RN-18", "Límite Máximo de Reserva", "Un cliente web puede reservar un máximo de 50 piezas por pedido diario.", "Pedidos mayores a 50 piezas requieren confirmación telefónica con gerencia."],
        ["RN-19", "Auditoría de Cambios de Precio", "Toda modificación al precio de un producto se almacena en el AuditLog.", "Registra fecha, hora, usuario y valor anterior vs nuevo."],
        ["RN-20", "Registro de Merma de Masa", "La masa no utilizada o sobrante al cierre de horneado debe pesarse en kg.", "Permite calcular la eficiencia de consumo de harina en bodega."],
        ["RN-21", "Horario de Operación Matriz", "Sucursal Matriz atiende de lunes a domingo de 06:00 a 21:00 hrs.", "Las reservas web solo pueden programarse dentro de esa ventana."],
        ["RN-22", "Horario de Operación Sucursal 2", "Sucursal Secundaria opera de lunes a sábado de 08:00 a 20:30 hrs.", "No se aceptan reservas para retiro antes de las 08:00 hrs."],
        ["RN-23", "Cancelación por el Cliente", "El cliente solo puede cancelar reservas cuando estén en estatus PENDING.", "Una vez en estado CONFIRMED o READY, debe llamar a la sucursal."],
        ["RN-24", "Notificaciones de Telegram", "Alertas de lotes vencidos y cierres diarios se transmiten por Telegram.", "El personal directivo debe mantener activa la notificación del bot."],
        ["RN-25", "Inmutabilidad de la Bitácora", "Los registros de auditoría y cierres diarios no pueden ser eliminados.", "La base de datos deniega operaciones DELETE en tablas de auditoría."]
    ]
    add_styled_table(doc, rn_headers, rn_rows, [Inches(0.8), Inches(1.5), Inches(2.5), Inches(1.7)])

    # -------------------------------------------------------------
    # CAPÍTULO 31: FICHAS TÉCNICAS Y RECETARIO ESTANDARIZADO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 31: FICHAS TÉCNICAS Y RECETARIO MAESTRO DE PRODUCCIÓN", page_break_before=True)
    add_p(doc, "La consistencia organoléptica y el rendimiento financiero de Panadería Svetlana se sustentan en el estricto apego a las fichas técnicas maestras. Cada receta define los gramajes exactos por bulto de harina de 50 kg, la temperatura de fermentación y los tiempos de horneado estandarizados:")
    
    rec_headers = ["Variedad de Pan", "Base de Harina", "Ingredientes Complementarios", "Fermentación", "Horneado (°C / min)", "Rendimiento Estándar"]
    rec_rows = [
        ["Concha Tradicional", "Harina Extra 50 kg", "Azúcar 12 kg, Manteca 10 kg, Huevo 6 kg, Levadura 1.5 kg", "90 min a 28°C", "180°C / 18 min", "750 piezas de 70g"],
        ["Bolillo Rústico", "Harina Fina 50 kg", "Sal 1 kg, Levadura 1 kg, Agua purificada 30 L, Masa madre 5 kg", "120 min con vapor", "220°C / 22 min", "600 piezas de 90g"],
        ["Cuerno de Mantequilla", "Harina Especial 50 kg", "Mantequilla pura 18 kg, Azúcar 8 kg, Leche 12 L, Levadura 1.5 kg", "60 min en frío + 60 min cámara", "190°C / 16 min", "800 piezas de 65g"],
        ["Oreja Hojaldrada", "Harina Hojaldre 50 kg", "Margarina hojaldre 22 kg, Azúcar granulada 15 kg, Sal 0.5 kg", "Reposo en mesa 45 min", "200°C / 20 min", "900 piezas de 55g"],
        ["Panqué Artesanal", "Harina Suave 50 kg", "Huevo fresco 20 kg, Mantequilla 15 kg, Azúcar 18 kg, Vainilla", "Sin fermentación (batido)", "170°C / 35 min", "120 moldes de 500g"],
        ["Pastel Tres Leches", "Harina Bizcocho 25 kg", "Huevo 15 kg, Azúcar 10 kg, Mezcla tres leches 40 L, Merengue", "Batido esponjoso", "165°C / 28 min", "50 pasteles medianos"]
    ]
    add_styled_table(doc, rec_headers, rec_rows, [Inches(1.3), Inches(1.1), Inches(1.8), Inches(1.1), Inches(1.0), Inches(1.2)])

    add_h2(doc, "31.1 Protocolo de Pesaje y Control de Mermas de Amasado")
    add_p(doc, "El pesaje de ingredientes debe realizarse en la báscula digital calibrada de la bodega seca. Queda prohibido el cálculo visual o volumétrico de harina y levadura, ya que variaciones superiores al 2% alteran la tasa de fermentación y provocan mermas críticas de pan apelmazado o con exceso de acidez.")

    # -------------------------------------------------------------
    # CAPÍTULO 32: BUENAS PRÁCTICAS DE MANUFACTURA E HIGIENE
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 32: MANUAL DE BUENAS PRÁCTICAS DE MANUFACTURA E HIGIENE (BPM)")
    add_p(doc, "En cumplimiento con la normativa sanitaria aplicable a establecimientos de panificación y repostería artesanal, se establecen las siguientes directrices obligatorias para el personal de producción y mostrador:")
    
    bpm_headers = ["Área de Operación", "Requisito Sanitario", "Frecuencia de Ejecución", "Método de Verificación"]
    bpm_rows = [
        ["Producción (Horno)", "Uso obligatorio de cofia, mandil blanco limpio y calzado antiderrapante.", "Permanente durante turno", "Inspección visual al ingreso de turno"],
        ["Mesa de Amasado", "Lavado y desinfección con solución clorada a 200 ppm antes y después de cada tanda.", "Cada cambio de masa", "Bitácora física de sanitización"],
        ["Charolas de Horneado", "Retiro de residuos carbonizados y aplicación de desmoldante vegetal apto para alimentos.", "Diario al terminar turno", "Inspección de charolas limpias"],
        ["Mostrador de Venta", "Uso exclusivo de pinzas metálicas para tomar el pan; prohibido el contacto manual directo.", "En cada despacho", "Supervisión continua por encargado"],
        ["Vitrinas de Pan", "Limpieza de vidrios y remoción de migajas y polvo acumulado en estantes.", "Dos veces al día (14:00 y 21:00)", "Checklist de limpieza de sucursal"],
        ["Lavado de Manos", "Frotado higiénico con jabón antibacterial durante al menos 30 segundos tras tocar dinero.", "Cada transición de tarea", "Estaciones de lavado abastecidas"]
    ]
    add_styled_table(doc, bpm_headers, bpm_rows, [Inches(1.3), Inches(2.2), Inches(1.4), Inches(1.6)])

    # -------------------------------------------------------------
    # CAPÍTULO 33: AUDITORÍAS Y ARQUEOS SORPRESIVOS DE CAJA
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 33: PROTOCOLO DE AUDITORÍA Y ARQUEOS SORPRESIVOS DE CAJA")
    add_p(doc, "Con el objetivo de prevenir irregularidades en el manejo de efectivo y verificar la integridad de las reservas en mostrador, la Dirección General ejecuta arqueos sorpresivos de acuerdo con el siguiente protocolo formal:")
    
    add_bullet(doc, "El auditor o gerente se presenta en mostrador sin previo aviso y solicita la suspensión momentánea del despacho al público.", bold_prefix="Paso 1 (Notificación Inmediata):")
    add_bullet(doc, "El cajero ingresa al sistema y genera un 'Corte Parcial Ciego' que registra la hora exacta de la auditoría.", bold_prefix="Paso 2 (Corte de Sistema):")
    add_bullet(doc, "Se procede al conteo minucioso de todo el efectivo presente en gaveta, separando billetes, monedas y el fondo fijo de $500.00 MXN.", bold_prefix="Paso 3 (Conteo de Efectivo):")
    add_bullet(doc, "Se coteja el número de pedidos web en estatus DELIVERED contra el dinero recaudado en mostrador.", bold_prefix="Paso 4 (Cruce de Reservas):")
    add_bullet(doc, "Se redacta el Acta de Arqueo Sorpresivo. Si la diferencia es menor a $10.00 MXN se considera aceptable por redondeo; diferencias mayores ameritan investigación administrativa.", bold_prefix="Paso 5 (Dictamen y Firma):")

    # -------------------------------------------------------------
    # CAPÍTULO 34: GESTIÓN DE COSTOS Y MÁRGENES DE CONTRIBUCIÓN
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 34: ESTRUCTURA DE COSTOS Y MÁRGENES DE CONTRIBUCIÓN")
    add_p(doc, "La rentabilidad de Panadería Svetlana se evalúa mediante el análisis del costo unitario integral por pieza de pan. La siguiente tabla desglosa la absorción de costos directos e indirectos por cada lote de 100 piezas:")
    
    cost_headers = ["Concepto de Costo", "Bolillo Rústico (100 pzs)", "Concha Tradicional (100 pzs)", "Cuerno Mantequilla (100 pzs)", "Pastel Mediano (10 pzs)"]
    cost_rows = [
        ["Materia Prima Directa (Harina, Levadura, Grasa)", "$85.00 MXN", "$140.00 MXN", "$195.00 MXN", "$320.00 MXN"],
        ["Gas LP y Consumo Térmico de Horno", "$28.00 MXN", "$35.00 MXN", "$32.00 MXN", "$60.00 MXN"],
        ["Energía Eléctrica (Amasadora y Alumbrado)", "$12.00 MXN", "$15.00 MXN", "$18.00 MXN", "$25.00 MXN"],
        ["Mano de Obra Directa de Panadero", "$45.00 MXN", "$60.00 MXN", "$75.00 MXN", "$110.00 MXN"],
        ["Empaque (Bolsas ecológicas de papel)", "$15.00 MXN", "$18.00 MXN", "$20.00 MXN", "$45.00 MXN"],
        ["COSTO TOTAL INTEGRAL", "$185.00 MXN", "$268.00 MXN", "$340.00 MXN", "$560.00 MXN"],
        ["Precio de Venta Sugerido (100 pzs)", "$350.00 MXN", "$600.00 MXN", "$800.00 MXN", "$1,400.00 MXN"],
        ["MARGEN BRUTO DE CONTRIBUCIÓN", "47.1%", "55.3%", "57.5%", "60.0%"]
    ]
    add_styled_table(doc, cost_headers, cost_rows, [Inches(2.1), Inches(1.2), Inches(1.2), Inches(1.2), Inches(1.3)])

    # -------------------------------------------------------------
    # CAPÍTULO 35: MATRIZ DE RIESGOS OPERATIVOS Y CONTINGENCIA
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 35: MATRIZ DE RIESGOS OPERATIVOS Y CONTINGENCIAS")
    add_p(doc, "Para garantizar la resiliencia del negocio frente a imprevistos en planta o puntos de venta, se definen los siguientes protocolos de respuesta rápida ante fallas críticas:")
    
    risk_headers = ["Escenario de Riesgo", "Probabilidad / Severidad", "Impacto Inmediato", "Protocolo de Acción y Contingencia"]
    risk_rows = [
        ["Falla en Quemadores de Horno Matriz", "Baja / Crítica", "Detención total de horneado en ambas sucursales", "Activar mantenimiento de emergencia y derivar horneado a horno secundario de reserva."],
        ["Corte de Suministro Eléctrico", "Media / Alta", "Amasadoras inactivas y pérdida de conexión web", "Operar mostrador bajo talonario manual y continuar fermentación artesanal en mesa."],
        ["Desabasto de Harina por Proveedor", "Baja / Alta", "Agotamiento de stock en bodega en menos de 48h", "Activar compra de emergencia con distribuidor secundario local a precio spot."],
        ["Avería en Camioneta de Reparto", "Media / Media", "Retraso en entrega a Sucursal Secundaria", "Contratar flete local express para trasladar las charolas con fundas térmicas."],
        ["Caída del Servidor Web / API", "Baja / Media", "Imposibilidad de recibir reservas online", "Mostrador opera venta directa en efectivo. Registrar inventario final en hoja de preconteo."]
    ]
    add_styled_table(doc, risk_headers, risk_rows, [Inches(1.6), Inches(1.2), Inches(1.6), Inches(2.1)])

    # -------------------------------------------------------------
    # CAPÍTULO 36: ATENCIÓN AL CLIENTE Y RESOLUCIÓN DE QUEJAS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 36: PROTOCOLO DE SERVICIO Y RESOLUCIÓN DE RECLAMOS EN MOSTRADOR", page_break_before=True)
    add_p(doc, "La reputación de Panadería Svetlana descansa en la frescura de sus productos y en un trato humano ejemplar. El personal de mostrador debe aplicar las siguientes políticas estandarizadas de atención y resolución de incidencias:")
    
    add_h2(doc, "36.1 Política de Reemplazo Inmediato por Inconformidad")
    add_p(doc, "Si un cliente manifiesta que una pieza adquirida no cumple con la frescura o cocción esperada:")
    add_bullet(doc, "Escuchar activamente al cliente sin contradecirlo ni generar confrontación.", bold_prefix="1. Escucha Empática:")
    add_bullet(doc, "Ofrecer el reemplazo inmediato de la pieza por otra de igual o similar valor de su elección, sin costo adicional.", bold_prefix="2. Reposición Inmediata:")
    add_bullet(doc, "Si no desea reemplazo, reintegrar el dinero en efectivo correspondiente a la pieza afectada de inmediato.", bold_prefix="3. Reembolso en Efectivo:")
    add_bullet(doc, "Separar la pieza devuelta e ingresarla en el registro de mermas bajo el concepto 'Devolución de Cliente'.", bold_prefix="4. Registro de Merma:")

    add_h2(doc, "36.2 Guía de Frases de Cortesía en Ventanilla")
    add_p(doc, "El personal debe saludar cordialmente al ingresar el cliente ('¡Buenos días/tardes! Bienvenido a Panadería Svetlana'), informar sobre las tandas de pan caliente recién salidas del horno y despedirse agradeciendo su preferencia con una sonrisa.")


    # Output path
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__)))
    output_path = os.path.join(out_dir, "MANUAL_1_USUARIO_Y_NEGOCIO.docx")
    doc.save(output_path)
    print(f"Manual 1 guardado exitosamente en: {output_path}")
    return output_path

if __name__ == "__main__":
    build_manual_1()
