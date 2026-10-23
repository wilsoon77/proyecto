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

def build_manual_3():
    print("Iniciando la construcción del Manual 3: Operación y Soporte...")
    doc = create_base_document("MANUAL 3: MANUALES DE OPERACIÓN Y SOPORTE — PANADERÍA SVETLANA")
    
    # -------------------------------------------------------------
    # PORTADA PRINCIPAL
    # -------------------------------------------------------------
    metadata_rows = [
        ("Módulos Integrados:", "Manual de Mantenimiento de Plataforma y Plan de Recuperación ante Desastres (DRP)"),
        ("Objetivos de Recuperación:", "RTO <= 2 Horas (Tiempo de Recuperación) | RPO <= 24 Horas (Pérdida de Datos)"),
        ("Estrategia de Respaldos:", "Copias Lógicas Diarias (pg_dump) + Cifrado AES-256 + Retención Abuelo-Padre-Hijo"),
        ("Continuidad de Negocio:", "Protocolo de Contingencia Offline en Tiendas y Arqueo Manual de Emergencia"),
        ("Catálogo de Incidentes:", "22 Fichas Técnicas Profundas de Troubleshooting y 8 Runbooks de Desastre"),
        ("Mantenimiento Físico:", "Protocolos de Hornos de Convección, Amasadoras, Básculas y Redes LAN"),
        ("Ámbito de Aplicación:", "Servidores Cloud (Vercel/Render), Base de Datos (PostgreSQL) y Puntos de Venta")
    ]
    add_main_cover(
        doc,
        main_title="MANUALES DE OPERACIÓN Y SOPORTE",
        subtitle="Manual de Mantenimiento Preventivo/Correctivo, Catálogo Exhaustivo de 22 Incidentes Técnicos con Diagnóstico Paso a Paso, y Plan Canónico de Recuperación ante Desastres (DRP) con 8 Runbooks Operativos",
        doc_code="DOC-MAN-03-OPE-SOP",
        version="2.0.0 (Producción)",
        date_str="Octubre 2026",
        classification="CONFIDENCIAL — SEGURIDAD OPERATIVA Y CONTINUIDAD DE NEGOCIO",
        audience="Administradores de Sistemas, Equipos de Soporte Nivel 1/2/3, DBAs, Comité de Crisis y Gerencia",
        metadata_rows=metadata_rows
    )
    
    # -------------------------------------------------------------
    # CONTROL DE VERSIONES Y APROBACIONES
    # -------------------------------------------------------------
    add_h1(doc, "1. CONTROL DOCUMENTAL Y GOBERNANZA OPERATIVA")
    add_p(doc, "El presente manual establece las políticas obligatorias de mantenimiento de software, hardware y planes de contingencia para salvaguardar la continuidad del negocio de Panadería Svetlana ante fallas imprevistas o catástrofes operativas.")
    
    vers_headers = ["Versión", "Fecha", "Responsable / Rol", "Naturaleza de la Modificación", "Veredicto"]
    vers_rows = [
        ["1.0.0", "10/03/2026", "SysAdmin & DevOps", "Diseño inicial del protocolo de respaldos y mantenimiento", "Superado"],
        ["1.4.0", "12/07/2026", "Líder Técnico & QA", "Incorporación de catálogo de 22 errores de diagnóstico y RTO/RPO", "Superado"],
        ["1.9.0", "15/09/2026", "Comité de Seguridad", "Integración del protocolo de contingencia offline para mostradores", "Superado"],
        ["2.0.0", "23/10/2026", "Dirección General & QA", "Manual consolidado: 22 Fichas de Troubleshooting y 8 Runbooks DRP", "Vigente"]
    ]
    add_styled_table(doc, vers_headers, vers_rows, [Inches(0.9), Inches(1.1), Inches(1.6), Inches(2.0), Inches(0.9)])

    # -------------------------------------------------------------
    # ÍNDICE GENERAL NARRATIVO
    # -------------------------------------------------------------
    add_h1(doc, "2. ÍNDICE GENERAL DEL MANUAL DE OPERACIÓN Y SOPORTE", page_break_before=True)
    add_p(doc, "Este documento está compuesto por dos partes estratégicas e interconectadas:")
    
    add_bullet(doc, "Modelo de mantenimiento, monitoreo, observabilidad, optimización PostgreSQL (VACUUM/REINDEX), 22 fichas detalladas de troubleshooting con comandos de diagnóstico y solución, flujo de hotfixes y mantenimiento físico de hornos/amasadoras.", bold_prefix="PARTE I: MANUAL DE MANTENIMIENTO.")
    add_bullet(doc, "Marco ISO 22301 / NIST SP 800-34, Análisis BIA, métricas RTO/RPO, matriz de 8 riesgos de desastre, 8 Runbooks de respuesta a incidentes, scripts de backup, modo offline para tiendas, simulacros y plantillas oficiales.", bold_prefix="PARTE II: PLAN DE RECUPERACIÓN ANTE DESASTRES (DRP).")

    # Embedding diagrams
    diag_audit = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "DIAGRAMA_SOPORTE_SEGURIDAD_AUDITORIA.png"))
    if os.path.exists(diag_audit):
        add_image_with_caption(doc, diag_audit, "Figura 1. Arquitectura de Soporte, Seguridad y Monitoreo de Panadería Svetlana", 6.2)

    # =============================================================
    # SUBDIVISIÓN 1: MANUAL DE MANTENIMIENTO
    # =============================================================
    part1_topics = [
        ("Capítulo 1: Modelo de Mantenimiento", "Tipología de mantenimiento y Acuerdos de Nivel de Servicio (SLA)", "SysAdmins y Soporte"),
        ("Capítulo 2: Monitoreo y Métricas", "Endpoints de salud (/health, /health/db) y observabilidad", "DevOps y SysAdmins"),
        ("Capítulo 3: Logs y Trazabilidad", "Estructura de logs en JSON, correlación y niveles de severidad", "Desarrolladores y DevOps"),
        ("Capítulo 4: Afinación de PostgreSQL", "Mantenimiento rutinario de base de datos: VACUUM y REINDEX", "DBAs y SysAdmins"),
        ("Capítulo 5: Catálogo de 22 Incidentes", "22 Fichas técnicas profundas con diagnóstico y remediación", "Soporte Nivel 1, 2 y 3"),
        ("Capítulo 6: Flujo de Hotfixes", "Protocolo Git para parches urgentes y despliegue sin caída", "Release Manager y Devs"),
        ("Capítulo 7: Cron Jobs y Automatización", "Tareas programadas de verificación FEFO y limpieza nocturna", "Backend y SysAdmins"),
        ("Capítulo 8: Mantenimiento Físico", "Protocolos de hornos de convección, amasadoras y básculas", "Personal de Planta y Mantenimiento")
    ]
    add_divider_cover(
        doc,
        part_number="I",
        part_title="MANUAL DE MANTENIMIENTO DEL SISTEMA",
        part_subtitle="Directrices de Mantenimiento Preventivo y Correctivo, Monitorización, Optimización de Base de Datos y Catálogo Exhaustivo de 22 Incidentes Técnicos",
        description="Esta subdivisión dota a los equipos técnicos y de soporte de las herramientas operativas para preservar la estabilidad, rendimiento y disponibilidad de la infraestructura de Panadería Svetlana. Incluye 22 fichas monográficas de resolución de fallas técnicas y la guía de conservación electromecánica de la maquinaria de panadería.",
        topics_list=part1_topics
    )

    # -------------------------------------------------------------
    # CAPÍTULO 1: MODELO DE MANTENIMIENTO Y SLA
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 1: FILOSOFÍA Y MODELO OPERATIVO DE MANTENIMIENTO")
    add_p(doc, "La continuidad operativa de Panadería Svetlana se basa en un esquema de mantenimiento integral clasificado en cuatro cuadrantes:")
    
    add_bullet(doc, "Inspecciones semanales programadas de espacio en disco, comprobación de latencia de base de datos, depuración de índices y revisión de certificados SSL/TLS.", bold_prefix="1. Mantenimiento Preventivo:")
    add_bullet(doc, "Resolución reactiva e inmediata de caídas de servicio, interrupciones de conectividad en sucursales o bloqueos de base de datos mediante procedimientos estandarizados.", bold_prefix="2. Mantenimiento Correctivo:")
    add_bullet(doc, "Monitoreo continuo de las tasas de crecimiento del inventario y consumo de memoria en contenedores Node.js para escalar recursos antes de que ocurra una degradación de servicio.", bold_prefix="3. Mantenimiento Predictivo:")
    add_bullet(doc, "Incorporación de nuevas reglas de negocio, optimización de algoritmos de arqueo residual y actualización de dependencias de seguridad del framework.", bold_prefix="4. Mantenimiento Evolutivo:")

    add_h2(doc, "1.1 Acuerdos de Nivel de Servicio (SLA) Internos")
    add_p(doc, "Se establecen los siguientes tiempos máximos de respuesta y resolución según la criticidad del incidente:")
    
    sla_headers = ["Nivel de Severidad", "Criterio de Clasificación", "Tiempo de Respuesta (SLA)", "Tiempo Máximo de Solución"]
    sla_rows = [
        ["CRÍTICO (P1)", "Caída total del backend, imposibilidad de despachar en mostrador o pérdida de base de datos.", "Menor a 15 minutos", "Menor a 2 horas (RTO)"],
        ["ALTO (P2)", "Falla en bot de Telegram, lentitud severa en carga de catálogo o error en registro de horneada.", "Menor a 30 minutos", "Menor a 4 horas"],
        ["MEDIO (P3)", "Dificultad menor en generación de reportes no bloqueantes o inconsistencia visual en pantalla.", "Menor a 2 horas", "Menor a 12 horas"],
        ["BAJO (P4)", "Solicitudes de cambio estético, consultas operativas o dudas de usuario sobre interfaces.", "Menor a 8 horas", "Menor a 48 horas"]
    ]
    add_styled_table(doc, sla_headers, sla_rows, [Inches(1.5), Inches(2.2), Inches(1.4), Inches(1.4)])

    # -------------------------------------------------------------
    # CAPÍTULO 2: MONITOREO Y MÉTRICAS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 2: MONITORIZACIÓN, HEALTHCHECKS Y OBSERVABILIDAD")
    add_p(doc, "El backend expone endpoints especializados para la verificación de salud del sistema, permitiendo a los monitores externos de Render o Uptime Kuma evaluar el estado de la aplicación:")
    
    add_h2(doc, "2.1 Endpoint de Salud General (/api/v1/health)")
    add_p(doc, "Verifica la disponibilidad del servidor HTTP NestJS, retornando un código HTTP 200 con la carga de memoria:")
    add_code_block(doc,
        "GET /api/v1/health\n\n"
        "HTTP/1.1 200 OK\n"
        "Content-Type: application/json\n\n"
        "{\n"
        '  "status": "ok",\n'
        '  "timestamp": "2026-10-23T12:00:00.000Z",\n'
        '  "uptime": 86400,\n'
        '  "memoryUsage": {\n'
        '    "rss": "85.4 MB",\n'
        '    "heapTotal": "62.1 MB",\n'
        '    "heapUsed": "48.7 MB"\n'
        '  }\n'
        "}"
    )

    add_h2(doc, "2.2 Endpoint de Conectividad con Base de Datos (/api/v1/health/db)")
    add_p(doc, "Ejecuta una consulta SQL liviana ('SELECT 1') contra PostgreSQL a través de Prisma para confirmar la salud del pool de conexiones:")
    add_code_block(doc,
        "GET /api/v1/health/db\n\n"
        "HTTP/1.1 200 OK\n"
        "Content-Type: application/json\n\n"
        "{\n"
        '  "database": "connected",\n'
        '  "latencyMs": 4.2,\n'
        '  "poolStatus": "healthy"\n'
        "}"
    )

    # -------------------------------------------------------------
    # CAPÍTULO 3: LOGS Y TRAZABILIDAD
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 3: GESTIÓN DE LOGS Y TRAZABILIDAD DE FALLOS", page_break_before=True)
    add_p(doc, "La aplicación utiliza un esquema de registro de eventos estructurado en formato JSON, facilitando la ingesta y búsqueda en plataformas de agregación de logs (Sentry, Logflare, Datadog):")
    
    add_bullet(doc, "Información detallada para depuración en entornos locales o de pruebas.", bold_prefix="Nivel DEBUG:")
    add_bullet(doc, "Eventos normales del ciclo de vida (arranque de servicios, recepción de tandas de producción).", bold_prefix="Nivel INFO:")
    add_bullet(doc, "Situaciones atípicas que no interrumpen el servicio (lotes FEFO próximos a caducar, reintentos de conexión).", bold_prefix="Nivel WARN:")
    add_bullet(doc, "Excepciones no controladas, fallos de base de datos o caídas en la entrega de pedidos.", bold_prefix="Nivel ERROR:")

    # -------------------------------------------------------------
    # CAPÍTULO 4: AFINACIÓN DE POSTGRESQL
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 4: MANTENIMIENTO RUTINARIO Y AFINACIÓN DE POSTGRESQL")
    add_p(doc, "Para evitar la hinchazón de tablas (table bloat) y mantener los planes de ejecución de consultas en su máxima velocidad, el DBA o administrador de sistemas debe ejecutar las siguientes rutinas de mantenimiento sobre la base de datos:")
    
    add_h2(doc, "4.1 Ejecución Semanal de VACUUM ANALYZE")
    add_p(doc, "Limpia las tuplas muertas originadas por actualizaciones frecuentes en el inventario y refresca las estadísticas del optimizador de consultas:")
    add_code_block(doc,
        "-- Conectarse como superusuario de base de datos\n"
        "VACUUM (VERBOSE, ANALYZE) \"Inventory\";\n"
        "VACUUM (VERBOSE, ANALYZE) \"OrderItem\";\n"
        "VACUUM (VERBOSE, ANALYZE) \"DailyCloseItem\";\n"
        "VACUUM (VERBOSE, ANALYZE) \"AuditLog\";"
    )

    add_h2(doc, "4.2 Reconstrucción Periódica de Índices (REINDEX)")
    add_p(doc, "Se recomienda reconstruir los índices de clave primaria y foráneas de forma mensual para compactar los árboles B-Tree sin bloquear lecturas concurrentes:")
    add_code_block(doc,
        "REINDEX TABLE CONCURRENTLY \"Order\";\n"
        "REINDEX TABLE CONCURRENTLY \"InventoryLot\";\n"
        "REINDEX TABLE CONCURRENTLY \"DailyClose\";"
    )

    # -------------------------------------------------------------
    # CAPÍTULO 5: 22 FICHAS DETALLADAS DE TROUBLESHOOTING
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 5: FICHAS TÉCNICAS MONOGRÁFICAS DE RESOLUCIÓN DE INCIDENTES (22 CASOS)", page_break_before=True)
    add_p(doc, "A continuación se desarrollan en profundidad las 22 incidencias técnicas más relevantes identificadas en la operación de Panadería Svetlana, detallando sus síntomas en pantalla, comandos de diagnóstico en PowerShell / Bash, análisis de causa raíz y procedimiento de remediación paso a paso:")

    troubleshoot_data = [
        ("ERR-TEC-01: Falla de Inicialización de Prisma Client (P1001)",
         "Can't reach database server at 'aws-0-us-east-1.pooler.supabase.com:5432'. Please make sure your database server is running at 'aws-0-us-east-1.pooler.supabase.com:5432'.",
         "PostgreSQL inaccesible. Causas: suspensión por inactividad en free-tier, bloqueo de firewall saliente en puerto 5432 o fallo de resolución DNS.",
         "# Diagnóstico de conectividad TCP y DNS\ntnc aws-0-us-east-1.pooler.supabase.com -Port 5432\nnslookup aws-0-us-east-1.pooler.supabase.com",
         "1. Acceder al dashboard de Supabase/Neon y verificar que la base de datos esté en estado 'Active'.\n2. Si fue suspendida, pulsar 'Restore Project'.\n3. Verificar que la variable DATABASE_URL contenga el parámetro '?sslmode=require'.\n4. Reiniciar el Web Service en Render."),

        ("ERR-TEC-02: Violación de Restricción de Clave Única (P2002)",
         "Unique constraint failed on the fields: (`email`) o (`code`)",
         "Se intentó insertar un registro duplicado en un campo con índice UNIQUE (correo de usuario, código de sucursal o slug de producto).",
         "# Comprobar colisión en base de datos\nSELECT id, email, role, \"createdAt\" FROM \"User\" WHERE email = 'operador@panaderia.com';",
         "1. Identificar el valor duplicado reportado en la excepción.\n2. Si el usuario ya existe, utilizar la opción de recuperación de contraseña en lugar de intentar registrarlo nuevamente.\n3. Si es un producto, editar el registro existente o cambiar el slug a uno unívoco."),

        ("ERR-TEC-03: Registro Inexistente para Actualización (P2025)",
         "An operation failed because it depends on one or more records that were required but not found. Record to update not found.",
         "Un endpoint PATCH/DELETE intentó operar sobre un UUID que no existe en la tabla (posiblemente eliminado por otro operador en concurrencia).",
         "# Verificar existencia del UUID en PostgreSQL\nSELECT count(*) FROM \"Order\" WHERE id = '8f3b2e1a-4d5c-6b7a-8c9d-0e1f2a3b4c5d';",
         "1. Capturar el requestId en los logs de NestJS.\n2. Verificar si la comanda fue cancelada previamente por el cliente.\n3. El frontend debe refrescar la lista de pedidos con mutate() de SWR para sincronizar la vista."),

        ("ERR-TEC-04: Expiración de Token JWT y Fallo de Refresh (401)",
         "Token de acceso expirado o inválido. Solicite renovación mediante /auth/refresh.",
         "El Access Token superó los 15 minutos de vigencia y la cookie HttpOnly de refresco fue invalidada o expiró tras 7 días de inactividad.",
         "# Probar endpoint de refresco con cookie\ncurl -X POST https://api.panaderia.com/api/v1/auth/refresh --cookie \"refreshToken=...\"",
         "1. Si el endpoint retorna 401, el cliente debe ser redirigido a /login de manera transparente.\n2. Borrar las cookies residuales en el navegador.\n3. Solicitar al usuario que ingrese sus credenciales nuevamente."),

        ("ERR-TEC-05: Bloqueo de CORS (No Access-Control-Allow-Origin)",
         "Access to fetch at 'https://api.panaderia.com' from origin 'https://proyecto-wilsoon77.vercel.app' has been blocked by CORS policy.",
         "El origen web del frontend no se encuentra dado de alta en la variable de entorno CORS_ORIGINS del backend.",
         "# Inspeccionar cabeceras OPTIONS retornadas\ncurl -I -X OPTIONS https://api.panaderia.com/api/v1/products -H \"Origin: https://proyecto-wilsoon77.vercel.app\"",
         "1. Abrir Render Dashboard -> Environment Variables.\n2. Localizar CORS_ORIGINS y añadir la URL exacta del frontend separada por coma.\n3. Guardar cambios; Render desplegará un redeploy automático que habilitará el origen."),

        ("ERR-TEC-06: Desbordamiento de Memoria Node.js (Heap OOM)",
         "FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory",
         "El proceso Node.js consumió más de 1.4 GB de memoria RAM, típicamente al procesar consultas masivas sin paginación en reportes.",
         "# Diagnosticar consumo de memoria de procesos Node\nGet-Process node | Select-Object Id, WorkingSet, CPU",
         "1. Asegurar que todas las consultas Prisma en controladores utilicen take y skip (paginación obligatoria).\n2. Añadir NODE_OPTIONS='--max-old-space-size=2048' en las variables del contenedor.\n3. Reiniciar el servicio."),

        ("ERR-TEC-07: Agotamiento de Conexiones de Base de Datos",
         "Timed out fetching a connection from the pool. Current pool limit: 10.",
         "Demasiadas peticiones simultáneas consumieron todas las conexiones disponibles del pool de Prisma sin liberarlas oportunamente.",
         "# Consultar conexiones activas en PostgreSQL\nSELECT count(*), state FROM pg_stat_activity GROUP BY state;",
         "1. Incorporar el parámetro connection_limit=20 en la cadena de conexión DATABASE_URL.\n2. Asegurar el uso de un connection pooler (PgBouncer o Supabase Pooler en puerto 6543).\n3. Validar que las transacciones Prisma tengan un timeout razonable (5000 ms)."),

        ("ERR-TEC-08: Conflicto por Cierre Diario Ya Bloqueado (409)",
         "La jornada del día ya ha sido conciliada y bloqueada previamente. No se admiten modificaciones.",
         "Un usuario intentó emitir un cierre diario sobre una fecha que ya cuenta con isLocked = true en la base de datos.",
         "# Verificar estatus de bloqueo de la fecha\nSELECT id, \"closeDate\", \"isLocked\", \"physicalCashCounted\" FROM \"DailyClose\" WHERE \"closeDate\" = CURRENT_DATE;",
         "1. Notificar al cajero que la caja ya fue auditada y cerrada por la gerencia.\n2. Si se trata de un error de conteo justificado, el Administrador General debe ejecutar el procedimiento formal de reapertura autorizada."),

        ("ERR-TEC-09: Falla en Entrega de Webhook de Telegram (502/504)",
         "Wrong response from webhook: 502 Bad Gateway / Connection timed out.",
         "Los servidores de Telegram no pudieron contactar al backend en /telegram/webhook o la petición tardó más de 5 segundos en responder.",
         "# Consultar estado del webhook en Telegram\ncurl https://api.telegram.org/bot<TOKEN>/getWebhookInfo",
         "1. Verificar que el servidor NestJS esté arriba y respondiendo en el endpoint /health.\n2. El controlador de webhook debe responder HTTP 200 de forma inmediata y delegar el procesamiento a un worker asíncrono.\n3. Re-registrar el webhook si fue suspendido por Telegram."),

        ("ERR-TEC-10: Violación de Clave Foránea en Eliminación (P2003)",
         "Foreign key constraint failed on the field: (`branchId`) o (`productId`)",
         "Se intentó borrar físicamente una sucursal o producto que posee registros relacionados en OrderItem o DailyCloseItem.",
         "# Buscar dependencias relacionales del producto\nSELECT count(*) FROM \"OrderItem\" WHERE \"productId\" = '...';",
         "1. Prohibida la eliminación física (DELETE) de entidades del catálogo maestro.\n2. Aplicar baja lógica actualizando el campo booleano: UPDATE \"Product\" SET \"isActive\" = false WHERE id = '...';"),

        ("ERR-TEC-11: Límite de Peticiones Excedido (429 Too Many Requests)",
         "ThrottlerException: Too Many Requests",
         "Una dirección IP superó el umbral de seguridad de 100 peticiones por minuto configurado en ThrottlerModule.",
         "# Comprobar cabeceras Retry-After devueltas\ncurl -I https://api.panaderia.com/api/v1/products",
         "1. El cliente debe esperar el tiempo indicado en la cabecera Retry-After (típicamente 60 segundos).\n2. En pantallas de mostrador que hacen polling, implementar WebSockets o elevar el límite en la IP estática de la sucursal."),

        ("ERR-TEC-12: Fallo de Compilación CSS en Next.js (Tailwind Build)",
         "Error: Cannot find module '@tailwindcss/forms' o syntax error in globals.css",
         "La compilación de Next.js se detiene por directivas CSS inválidas o dependencias de postcss desincronizadas.",
         "# Probar build local en la carpeta web\ncd web; npm run build",
         "1. Inspeccionar web/src/app/globals.css buscando llaves sin cerrar o clases arbitrarias mal formateadas.\n2. Limpiar la caché de compilación eliminando la carpeta .next (rm -r .next).\n3. Recompilar con npm run build."),

        ("ERR-TEC-13: Inconsistencia en Hash Bcrypt de Contraseña",
         "Invalid credentials. User authentication failed.",
         "La contraseña ingresada no coincide con el hash almacenado, o el hash fue truncado al grabarse en base de datos.",
         "# Verificar formato de hash en PostgreSQL (debe iniciar con $2b$12$ y medir 60 caracteres)\nSELECT length(\"passwordHash\"), substring(\"passwordHash\", 1, 7) FROM \"User\" WHERE email = '...';",
         "1. Si el hash está corrupto o truncado, generar uno nuevo mediante el script de reseteo administrativo.\n2. Solicitar al usuario que ingrese su contraseña sin espacios accidentales al inicio o final."),

        ("ERR-TEC-14: Conflicto de Vencimiento de Lote FEFO",
         "El lote seleccionado se encuentra expirado físicamente y no puede ser comercializado.",
         "Un operador intentó registrar una venta sobre un lote cuya expirationDate es menor o igual a la fecha del sistema.",
         "# Consultar lotes vencidos en bodega\nSELECT id, \"lotCode\", \"expirationDate\", \"availableQuantity\" FROM \"InventoryLot\" WHERE \"expirationDate\" < CURRENT_DATE;",
         "1. Retirar inmediatamente el producto físico de las vitrinas de mostrador.\n2. Registrar el lote como merma formal en /admin/lotes especificando causa 'Vencimiento FEFO'.\n3. Destruir el producto de acuerdo con el protocolo sanitario."),

        ("ERR-TEC-15: Error de Registro en Notificaciones WebPush (400)",
         "Invalid VAPID public key format or push service subscription rejected.",
         "El navegador del usuario no pudo registrar la suscripción push debido a llaves VAPID inconsistentes o expiradas.",
         "# Verificar coherencia de variable VAPID\necho $NEXT_PUBLIC_VAPID_PUBLIC_KEY",
         "1. Regenerar el par de llaves VAPID con npx web-push generate-vapid-keys.\n2. Actualizar las llaves en web/.env.local y api/.env simultáneamente.\n3. Solicitar al usuario que vuelva a otorgar permiso de notificaciones en el navegador."),

        ("ERR-TEC-16: Motor Docker Desktop Detenido en Servidor Local",
         "error during connect: This error may indicate that the docker daemon is not running.",
         "El servicio del motor Docker no está en ejecución en el sistema operativo anfitrión.",
         "# Verificar estado del servicio Docker en Windows\nGet-Service *docker*",
         "1. Iniciar la aplicación Docker Desktop en Windows o ejecutar Start-Service docker en PowerShell con permisos de Administrador.\n2. Esperar a que el icono de la bandeja del sistema pase a verde.\n3. Reintentar docker-compose up -d."),

        ("ERR-TEC-17: Interbloqueo Detectado en Base de Datos (Deadlock 40P01)",
         "deadlock detected. Process 14205 waits for ShareLock on transaction 8912; blocked by process 14210.",
         "Dos transacciones simultáneas de mostrador intentaron bloquear las mismas piezas de pan en orden inverso.",
         "# Consultar eventos de deadlock en log de PostgreSQL\ngrep 'deadlock detected' /var/log/postgresql/postgresql.log",
         "1. El servicio de pedidos en NestJS captura el error 40P01 y reintenta automáticamente la transacción hasta 3 veces.\n2. Asegurar que las consultas SELECT FOR UPDATE ordenen siempre los IDs alfabéticamente (ORDER BY id ASC)."),

        ("ERR-TEC-18: Fallo en Negociación SSL/TLS de Base de Datos",
         "SSL connection has been closed unexpectedly o self-signed certificate in certificate chain",
         "El cliente PostgreSQL no pudo negociar el cifrado TLS con la instancia administrada en la nube.",
         "# Probar conexión psql con forzado SSL\npsql \"$DATABASE_URL?sslmode=require\"",
         "1. Añadir el parámetro sslmode=require en la cadena de conexión.\n2. Si se utiliza un certificado personalizado de CA, configurar sslrootcert=/ruta/al/ca.crt.\n3. Validar que la hora del servidor esté sincronizada con NTP."),

        ("ERR-TEC-19: Anomalía de Inventario Residual Negativo",
         "Calculated sold units cannot be negative. Please verify physical final count.",
         "El conteo físico arrojó más piezas de las que existían en inventario inicial más producción, indicando error de captura.",
         "# Inspeccionar balance del producto anómalo\nSELECT \"initialStock\", \"producedStock\", \"finalPhysicalStock\" FROM \"DailyCloseItem\" WHERE \"soldUnitsCalculated\" < 0;",
         "1. Detener el cierre y realizar un reconteo físico presencial en mostrador.\n2. Verificar si se omitió registrar una tanda de horneado matutina o vespertina en /admin/produccion.\n3. Corregir los datos de horneada antes de guardar el cierre."),

        ("ERR-TEC-20: Omisión de Variable Obligatoria en .env",
         "ConfigServiceException: Environment variable JWT_ACCESS_SECRET is required but was not provided.",
         "El servidor NestJS aborta su inicialización porque falta una variable obligatoria en el archivo de configuración.",
         "# Verificar presencia de variables críticas\nnode -e \"require('dotenv').config(); console.log(process.env.JWT_ACCESS_SECRET ? 'OK' : 'MISSING');\"",
         "1. Comparar api/.env contra api/.env.example para identificar la variable faltante.\n2. Configurar la clave ausente en el dashboard de Render o en el archivo .env local.\n3. Reiniciar el servidor."),

        ("ERR-TEC-21: Desajuste de Hidratación en Next.js (Hydration Mismatch)",
         "Warning: Text content did not match. Server: '12:00:00' Client: '06:00:00'",
         "El servidor generó HTML con zona horaria UTC y el navegador del cliente lo re-renderizó con zona horaria local.",
         "# Inspeccionar componente con advertencia en consola del navegador\nconsole.warn",
         "1. Envolver la renderización de fechas en un componente que solo monte en cliente tras useEffect().\n2. O bien, utilizar la directiva suppressHydrationWarning en el elemento <span> afectado."),

        ("ERR-TEC-22: Saturación de Almacenamiento en Tabla AuditLog",
         "disk full (/var/lib/postgresql/data); cannot write to table \"AuditLog\"",
         "La tabla de auditoría acumuló millones de eventos saturando el disco del servidor de base de datos.",
         "# Consultar tamaño de tablas en PostgreSQL\nSELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC;",
         "1. Exportar los registros de auditoría mayores a 1 año a un archivo frío en almacenamiento S3.\n2. Ejecutar borrado particionado: DELETE FROM \"AuditLog\" WHERE \"createdAt\" < NOW() - INTERVAL '365 days';\n3. Ejecutar VACUUM FULL \"AuditLog\"; para reclamar el espacio en disco.")
    ]

    for code_title, symptom, cause, diag_cmd, resol in troubleshoot_data:
        add_h2(doc, code_title)
        add_p(doc, symptom, bold_prefix="Síntoma / Mensaje de Error:", italic=True)
        add_p(doc, cause, bold_prefix="Causa Raíz Técnica:")
        add_p(doc, "Comandos de Diagnóstico Recomendados:")
        add_code_block(doc, diag_cmd)
        add_p(doc, resol, bold_prefix="Procedimiento de Remediación Paso a Paso:")

    # -------------------------------------------------------------
    # CAPÍTULO 6: PROTOCOLO DE HOTFIXES
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 6: PROTOCOLO DE APLICACIÓN DE PARCHES Y HOTFIXES", page_break_before=True)
    add_p(doc, "Cuando se detecta una anomalía de severidad P1 o P2 en producción, el equipo de ingeniería debe apegarse estrictamente al siguiente protocolo Git de parche rápido:")
    
    add_bullet(doc, "Crear una rama a partir de main bajo la convención git checkout -b hotfix/nombre-descriptivo.", bold_prefix="1. Ramificación Aislada:")
    add_bullet(doc, "Modificar única y exclusivamente los archivos estrictamente requeridos para resolver el bug (Principio de Menor Impacto). Queda prohibido reformatear código ajeno.", bold_prefix="2. Intervención Quirúrgica:")
    add_bullet(doc, "Ejecutar localmente la suite de compilación cd web && npm run build y cd api && npm run build para garantizar 0 errores.", bold_prefix="3. Verificación de Compilación:")
    add_bullet(doc, "Auditoría adversarial del diff en 5 ejes: Correctitud, Legibilidad, Arquitectura, Seguridad y Rendimiento. Prohibido añadir @ts-ignore.", bold_prefix="4. Revisión en 5 Ejes:")
    add_bullet(doc, "Merge a la rama main mediante Pull Request con fast-forward y despliegue automatizado por GitHub Actions.", bold_prefix="5. Despliegue y Validación:")

    # -------------------------------------------------------------
    # CAPÍTULO 7: CRON JOBS Y AUTOMATIZACIONES
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 7: TAREAS PROGRAMADAS Y CRON JOBS DEL SISTEMA")
    add_p(doc, "El backend ejecuta tres tareas automáticas mediante el módulo @nestjs/schedule:")
    add_bullet(doc, "Se ejecuta diariamente a las 00:05 hrs. Identifica reservas del día anterior que quedaron en estatus CONFIRMED o READY sin recoger y las actualiza a EXPIRED.", bold_prefix="1. Depuración de Pedidos Abandonados (0 5 0 * * *):")
    add_bullet(doc, "Se ejecuta diariamente a las 06:00 hrs. Evalúa las fechas de vencimiento de la tabla InventoryLot y envía una notificación consolidada por Telegram.", bold_prefix="2. Escaneo Matutino de Caducidades FEFO (0 0 6 * * *):")
    add_bullet(doc, "Se ejecuta los domingos a las 23:59 hrs. Elimina tokens revocados de RefreshToken y registros de intentos fallidos antiguos.", bold_prefix="3. Purgado Semanal de Seguridad (0 59 23 * * 0):")

    # -------------------------------------------------------------
    # CAPÍTULO 8: MANTENIMIENTO FÍSICO DE MAQUINARIA DE PANADERÍA
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 8: MANTENIMIENTO ELECTROMECÁNICO DE MAQUINARIA EN MATRIZ", page_break_before=True)
    add_p(doc, "La estabilidad de la plataforma digital carece de sentido si los equipos físicos de producción sufren averías imprevistas. Se establece la siguiente cartilla obligatoria de mantenimiento para la maquinaria de panadería:")
    
    mach_headers = ["Maquinaria de Planta", "Componente Crítico", "Frecuencia de Mantenimiento", "Procedimiento Operativo Requerido"]
    mach_rows = [
        ["Horno de Convección a Gas", "Quemadores y Termocuplas", "Quincenal", "Desmontar toberas, limpiar residuos de hollín con cepillo de alambre y calibrar chispero."],
        ["Horno de Convección a Gas", "Turbinas de Recirculación", "Mensual", "Engrase de baleros con grasa grado alimenticio alta temperatura (NLGI 2)."],
        ["Amasadora de Espiral (50 kg)", "Cadena y Bandas de Tracción", "Semanal", "Inspección de tensión de bandas trapezoidales y lubricación de cadena principal."],
        ["Amasadora de Espiral (50 kg)", "Tazón de Acero Inoxidable", "Diario", "Lavado con solución jabonosa neutra, secado total para prevenir corrosión por salitre."],
        ["Laminadora de Masa Hojaldre", "Rodillos de Teflón / Acero", "Diario al cierre", "Remover costras de masa seca con espátula de plástico; aplicar aceite vegetal liviano."],
        ["Cámara de Fermentación Controlada", "Resistencias y Generador Vapor", "Mensual", "Desincrustación de sarro con ácido cítrico al 5%; prueba de higrómetro digital."],
        ["Básculas Digitales de Bodega", "Celdas de Carga y Nivel", "Semestral", "Calibración metrológica con pesas patrón certificadas de 1 kg, 5 kg y 20 kg."]
    ]
    add_styled_table(doc, mach_headers, mach_rows, [Inches(1.6), Inches(1.5), Inches(1.2), Inches(2.2)])

    # =============================================================
    # SUBDIVISIÓN 2: PLAN DE RECUPERACIÓN ANTE DESASTRES (DRP)
    # =============================================================
    part2_topics = [
        ("Capítulo 9: Marco Normativo DRP", "Alineación con normas ISO 22301 y NIST SP 800-34", "Comité de Crisis y Gerencia"),
        ("Capítulo 10: Análisis BIA", "Evaluación del impacto financiero y operativo por inactividad", "Gerencia y Finanzas"),
        ("Capítulo 11: Métricas RTO y RPO", "Objetivos de tiempo y pérdida de datos tolerables", "Líder Técnico y DBAs"),
        ("Capítulo 12: Matriz de 8 Riesgos", "Escenarios de desastre evaluados y medidas de mitigación", "Seguridad y SysAdmins"),
        ("Capítulo 13: Políticas de Backup", "Scripts de pg_dump, cifrado AES-256 y retención GFS", "DBAs y SysAdmins"),
        ("Capítulo 14: Los 8 Runbooks DRP", "Protocolos de acción detallados para cada catástrofe", "Equipo Técnico y Operativo"),
        ("Capítulo 15: Contingencia Offline", "Protocolo manual de mostrador ante caída total de internet", "Personal de Mostrador"),
        ("Capítulo 16: Guía de Failover Cloud", "Comandos paso a paso de restauración de PostgreSQL y DNS", "DBAs y DevOps"),
        ("Capítulo 17: Comité de Crisis", "Estructura de mando de emergencia y árbol de llamadas", "Dirección General"),
        ("Capítulo 18: Simulacros Semestrales", "Pruebas de restauración en seco y auditoría continua", "Comité de Seguridad"),
        ("Capítulo 19: Plantillas y Formularios", "Modelos descargables para contingencia en papel", "Personal de Sucursales")
    ]
    add_divider_cover(
        doc,
        part_number="II",
        part_title="PLAN DE RECUPERACIÓN ANTE DESASTRES (DRP)",
        part_subtitle="Estrategia de Continuidad del Negocio, Métricas RTO/RPO, 8 Runbooks de Respuesta a Emergencias y Protocolo Offline",
        description="Esta subdivisión establece el marco operativo y técnico para garantizar la supervivencia y resiliencia de Panadería Svetlana frente a incidentes catastróficos, ciberataques, caídas de la nube o pérdidas masivas de datos. Define 8 Runbooks exhaustivos para la toma de decisiones en momentos de crisis y las plantillas físicas de contingencia en mostrador.",
        topics_list=part2_topics
    )

    # -------------------------------------------------------------
    # CAPÍTULO 9: MARCO NORMATIVO Y ALCANCE DEL DRP
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 9: PROPÓSITO, ALCANCE Y MARCO NORMATIVO DEL DRP")
    add_p(doc, "El Plan de Recuperación ante Desastres (Disaster Recovery Plan - DRP) de Panadería Svetlana tiene por finalidad establecer las acciones predeterminadas, roles y procedimientos técnicos que deben ejecutarse para restaurar la plataforma informática en el menor tiempo posible tras la ocurrencia de un evento crítico.")
    add_p(doc, "El diseño de este plan se fundamenta en las mejores prácticas de la norma internacional ISO 22301 (Sistemas de Gestión de Continuidad del Negocio) y las directrices del NIST SP 800-34 (Guía de Planificación de Contingencias para Sistemas de Información Federales), adaptadas pragmáticamente a una empresa de panificación artesanal con dos sucursales de venta física.")

    # -------------------------------------------------------------
    # CAPÍTULO 10: ANÁLISIS DE IMPACTO EN EL NEGOCIO (BIA)
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 10: ANÁLISIS DE IMPACTO EN EL NEGOCIO (BIA)")
    add_p(doc, "El Business Impact Analysis (BIA) evalúa cuantitativa y cualitativamente las consecuencias de la interrupción de cada proceso clave de la panadería:")
    
    bia_headers = ["Proceso de Negocio", "Nivel de Criticidad", "Impacto Operativo Inmediato", "Pérdida Financiera Estimada / Hora"]
    bia_rows = [
        ["Despacho y Cobro en Mostrador", "CRÍTICO", "Acumulación de clientes en fila física y riesgo de pérdida de venta.", "$1,500.00 MXN / hora en horas pico"],
        ["Cierre Diario y Conciliación", "ALTO", "Imposibilidad de cuadrar el efectivo nocturno y riesgo de fugas de dinero.", "Riesgo de descuadre acumulativo"],
        ["Registro de Producción / Horneado", "MEDIO", "Desconocimiento del stock horneado real; retraso en balance residual.", "Incertidumbre en mermas"],
        ["Reserva de Pedidos Web", "MEDIO", "Pérdida de pedidos anticipados de clientes digitales; molestia de usuarios.", "$400.00 MXN / hora"],
        ["Asistente Bot de Telegram", "BAJO", "Pérdida momentánea de notificaciones instantáneas hacia directivos.", "Nulo (se consulta vía web)"]
    ]
    add_styled_table(doc, bia_headers, bia_rows, [Inches(1.8), Inches(1.3), Inches(2.1), Inches(1.3)])

    # -------------------------------------------------------------
    # CAPÍTULO 11: OBJETIVOS RTO Y RPO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 11: DEFINICIÓN DE OBJETIVOS DE RECUPERACIÓN (RTO Y RPO)")
    add_p(doc, "La Dirección General y el equipo de Arquitectura de Software han establecido formalmente los siguientes umbrales máximos tolerables de interrupción:")
    
    add_callout(doc, 
        "OBJETIVO DE TIEMPO DE RECUPERACIÓN (RTO - Recovery Time Objective): <= 2 HORAS.\n"
        "Tiempo máximo admisible desde la declaración formal del desastre hasta la restauración completa de los servicios web y bases de datos.\n\n"
        "OBJETIVO DE PUNTO DE RECUPERACIÓN (RPO - Recovery Point Objective): <= 24 HORAS.\n"
        "Límite máximo tolerable de pérdida potencial de datos transaccionales. Respaldado mediante copias completas diarias automatizadas a las 02:00 hrs y registros Write-Ahead Log continuos.",
        title="MÉTRICAS FORMALES DE CONTINUIDAD:", callout_type="rule"
    )

    # -------------------------------------------------------------
    # CAPÍTULO 12: MATRIZ DE 8 RIESGOS DE DESASTRE
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 12: MATRIZ DE EVALUACIÓN DE RIESGOS (8 ESCENARIOS CRÍTICOS)", page_break_before=True)
    add_p(doc, "A continuación se documentan los 8 escenarios de desastre evaluados y sus planes de contingencia técnica:")
    
    scen_headers = ["Escenario de Desastre", "Probabilidad", "Impacto", "Estrategia de Mitigación y Acción Inmediata"]
    scen_rows = [
        ["1. Caída Total de PostgreSQL Cloud", "Baja", "Crítico", "Aprovisionar base de datos de réplica en Neon/Supabase y restaurar último dump pg_dump."],
        ["2. Corte de Internet en Sucursal Matriz", "Alta", "Alto", "Activar tethering celular 4G/5G de contingencia o pasar a modo operativo offline con talonario."],
        ["3. Corrupción de Datos en Migración Prisma", "Baja", "Crítico", "Ejecutar rollback inmediato de migración y restaurar el snapshot de base de datos previo."],
        ["4. Compromiso de Contraseñas de Administrador", "Baja", "Alto", "Invalidar todos los Refresh Tokens, forzar reseteo masivo de claves y revocar sesiones activas."],
        ["5. Caída Global de Proveedor Vercel / Render", "Muy Baja", "Alto", "Redirigir tráfico DNS mediante Cloudflare a servidor de respaldo VPS secundario."],
        ["6. Ataque de Ransomware en Equipo Local", "Baja", "Medio", "Aislar la máquina infectada de la red LAN física. Formatear y reinstalar sistema operativo."],
        ["7. Falla de Hardware en Tablet de Mostrador", "Media", "Medio", "Sustituir de inmediato con el teléfono móvil de respaldo de la sucursal accediendo a la URL web."],
        ["8. Pérdida del Webhook de Telegram Bot", "Baja", "Bajo", "Re-registrar la URL del webhook mediante comando de mantenimiento en Telegram Bot API."]
    ]
    add_styled_table(doc, scen_headers, scen_rows, [Inches(1.8), Inches(1.0), Inches(0.9), Inches(2.8)])

    # -------------------------------------------------------------
    # CAPÍTULO 13: POLÍTICAS Y SCRIPTS DE BACKUP
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 13: ESTRATEGIA Y SCRIPTS DE COPIAS DE SEGURIDAD (BACKUPS)", page_break_before=True)
    add_p(doc, "Los respaldos de la base de datos se generan automáticamente mediante un script programado que ejecuta un dump lógico comprimido con PostgreSQL pg_dump:")
    
    add_h2(doc, "13.1 Script de Respaldo Automatizado (backup.sh)")
    add_code_block(doc,
        "#!/bin/bash\n"
        "# Panadería Svetlana - Backup Diario Automatizado de Base de Datos\n"
        "set -e\n\n"
        "TIMESTAMP=$(date +\"%Y%m%d_%H%M%S\")\n"
        "BACKUP_DIR=\"/var/backups/panaderia\"\n"
        "BACKUP_FILE=\"$BACKUP_DIR/svetlana_db_$TIMESTAMP.dump\"\n\n"
        "mkdir -p $BACKUP_DIR\n\n"
        "# Ejecutar dump binario optimizado con compresión gzip\n"
        "echo \"[$(date)] Iniciando respaldo de base de datos...\"\n"
        "pg_dump -Fc -v -d \"$DATABASE_URL\" -f \"$BACKUP_FILE\"\n\n"
        "# Cifrar el respaldo con OpenSSL AES-256-CBC\n"
        "openssl enc -aes-256-cbc -salt -in \"$BACKUP_FILE\" -out \"$BACKUP_FILE.enc\" \\\n"
        "  -pass pass:\"$BACKUP_ENCRYPTION_KEY\"\n"
        "rm \"$BACKUP_FILE\"\n\n"
        "# Subir a almacenamiento en la nube S3 / Bucket seguro\n"
        "aws s3 cp \"$BACKUP_FILE.enc\" s3://svetlana-backups-secure/\n"
        "echo \"[$(date)] Respaldo completado y transmitido a la nube.\""
    )

    # -------------------------------------------------------------
    # CAPÍTULO 14: LOS 8 RUNBOOKS OPERATIVOS DE DESASTRE
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 14: RUNBOOKS OPERATIVOS DE RECUPERACIÓN (PROCEDIMIENTOS 1 AL 8)", page_break_before=True)
    add_p(doc, "Cada uno de los siguientes 8 runbooks define la guía de acción paso a paso que el personal técnico y operativo debe seguir textualmente durante una crisis:")

    runbooks_data = [
        ("Runbook DRP-01: Caída Catastrófica de Base de Datos PostgreSQL Cloud",
         "La base de datos en Neon/Supabase queda inaccesible de forma irreversible por corrupción o caída de zona de disponibilidad.",
         "Líder Técnico de Recuperación y DBA.",
         "1. Descargar el último dump cifrado desde el bucket S3.\n2. Descifrar con OpenSSL utilizando la clave maestra resguardada en caja fuerte.\n3. Crear una nueva base de datos en el proveedor secundario de contingencia.\n4. Ejecutar pg_restore -d $NUEVA_URL svetlana_db.dump.\n5. Actualizar la variable DATABASE_URL en Render y reiniciar el backend.\n6. Verificar con curl /api/v1/health/db que la latencia sea <10ms."),

        ("Runbook DRP-02: Interrupción Eléctrica o de Internet en Sucursal Matriz",
         "Corte prolongado de luz o desconexión del cablemódem en la planta de Matriz.",
         "Encargada de Mostrador Matriz y Chofer de Reparto.",
         "1. Activar el punto de acceso móvil (Hotspot 5G) en el teléfono celular de mostrador.\n2. Conectar la tablet a la red móvil y comprobar acceso a /admin/reservas.\n3. Si la telefonía celular también colapsa, extraer el Talonario Manual de Pedidos y la Hoja Física de Preconteo.\n4. Continuar la venta de mostrador cobrando en efectivo físico de forma ininterrumpida.\n5. Las masas en fermentación deben hornearse con vigilancia manual de tiempos."),

        ("Runbook DRP-03: Corrupción de Esquema por Migración Fallida de Prisma",
         "Una migración ejecutada en producción alteró columnas críticas provocando errores 500 masivos.",
         "Lead Software Architect.",
         "1. Detener el tráfico hacia la API activando la página de mantenimiento en Vercel.\n2. Ejecutar npx prisma migrate status para evaluar las migraciones fallidas.\n3. Restaurar la base de datos al snapshot generado exactamente antes del despliegue.\n4. Revertir el commit defectuoso en la rama main mediante git revert.\n5. Compilar y redesplegar la versión estable previa."),

        ("Runbook DRP-04: Compromiso o Fuga de Credenciales de Administrador",
         "Sospecha fundada de robo de contraseñas de dirección o exposición de llaves JWT.",
         "Administrador General y Auditor de Seguridad.",
         "1. Cambiar inmediatamente la variable JWT_ACCESS_SECRET y JWT_REFRESH_SECRET en Render.\n2. Esto provocará la invalidación instantánea de todas las sesiones activas en la plataforma.\n3. Ejecutar DELETE FROM \"RefreshToken\"; directamente en la base de datos.\n4. Forzar el cambio de contraseña de todas las cuentas con rol ADMIN y CASHIER.\n5. Revisar la tabla AuditLog para identificar movimientos no autorizados."),

        ("Runbook DRP-05: Caída Global de Proveedor PaaS (Vercel o Render)",
         "Falla masiva en la infraestructura de Vercel o Render en la región este de Norteamérica.",
         "DevOps Specialist.",
         "1. Acceder al panel de administración de DNS en Cloudflare.\n2. Modificar el registro CNAME hacia la IP fija del servidor VPS de respaldo montado en DigitalOcean.\n3. En el VPS, ejecutar docker-compose up -d para levantar las imágenes estables ya preconstruidas.\n4. Comprobar que los certificados SSL emitan correctamente bajo Let's Encrypt.\n5. Notificar al personal que el sistema opera bajo infraestructura de contingencia."),

        ("Runbook DRP-06: Infección por Ransomware en Computadora Local",
         "Aparición de pantallas de bloqueo o archivos cifrados con extensión extraña en PC de sucursal.",
         "Personal de Sucursal y Técnico en Hardware.",
         "1. Desconectar físicamente el cable de red Ethernet y desactivar el Wi-Fi de inmediato para evitar propagación en la red LAN.\n2. Queda estrictamente prohibido pagar cualquier rescate financiero.\n3. El equipo debe formatearse completamente e instalar una imagen limpia de Windows 11.\n4. Dado que el sistema opera 100% en la nube, ningún dato de ventas se pierde por la infección local."),

        ("Runbook DRP-07: Destrucción o Robo de Tablet de Mostrador",
         "Sustracción física o ruptura total de la pantalla táctil de la tablet en sucursal.",
         "Encargada de Sucursal y Administrador General.",
         "1. La encargada ingresa inmediatamente desde su teléfono móvil personal a la URL web del sistema.\n2. Iniciar sesión con su usuario y contraseña habituales de cajera.\n3. El administrador accede a /admin/usuarios y desautoriza el TrustedDevice de la tablet robada para impedir accesos maliciosos.\n4. Gestionar el reemplazo del dispositivo físico en un plazo menor a 24 horas."),

        ("Runbook DRP-08: Interrupción de la API de Telegram Messenger",
         "Caída temporal o bloqueo regional de los servidores de Telegram Messenger.",
         "Líder Técnico y Administradores.",
         "1. Los administradores deben consultar las métricas directamente en el panel web /admin/metrics.\n2. Las alertas de caducidad FEFO se revisan en /admin/lotes.\n3. La comunicación urgente entre sucursales se efectúa vía llamadas telefónicas directas.\n4. Una vez restablecida la red de Telegram, el webhook procesará los mensajes encolados automáticamente.")
    ]

    for rb_title, rb_scope, rb_resp, rb_steps in runbooks_data:
        add_h2(doc, rb_title)
        add_p(doc, rb_scope, bold_prefix="Alcance y Disparador de Crisis:")
        add_p(doc, rb_resp, bold_prefix="Responsable de Ejecución:")
        add_p(doc, "Secuencia Obligatoria de Remediación:")
        for st in rb_steps.split("\n"):
            add_bullet(doc, st)

    # -------------------------------------------------------------
    # CAPÍTULO 15: CONTINGENCIA OFFLINE EN TIENDAS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 15: PROTOCOLO DE CONTINGENCIA OPERATIVA OFFLINE (MODO SIN INTERNET)", page_break_before=True)
    add_p(doc, "Si se presenta un corte de internet o caída total del sistema durante la jornada comercial, el personal de mostrador debe activar de inmediato el Modo de Contingencia Offline para no detener el despacho al público:")
    
    add_bullet(doc, "La venta física en mostrador continúa sin interrupciones mediante despacho visual y cobro directo en efectivo.", bold_prefix="1. Venta Directa Ininterrumpida:")
    add_bullet(doc, "Los pedidos especiales solicitados por clientes se anotan en el talonario de remisión manual foliado en papel.", bold_prefix="2. Talonario Manual de Pedidos:")
    add_bullet(doc, "El cajero solicita al cliente el código de reserva o su nombre y entrega el pan comprobando los datos anotados en la libreta de reservas del día.", bold_prefix="3. Entrega de Reservas Previas:")
    add_bullet(doc, "El recuento físico de piezas sobrantes y el conteo de billetes y monedas se realiza en la Hoja Física de Preconteo Nocturno.", bold_prefix="4. Cierre Diario en Papel:")
    add_bullet(doc, "Al restaurarse la conexión a internet, el encargado transcribe en menos de 1 hora los datos de la hoja física a /admin/cierre-diario.", bold_prefix="5. Sincronización Posterior:")

    # -------------------------------------------------------------
    # CAPÍTULO 16: PROCEDIMIENTOS TÉCNICOS DE FAILOVER
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 16: PROCEDIMIENTOS TÉCNICOS DE FAILOVER Y RESTAURACIÓN", page_break_before=True)
    add_p(doc, "Instrucciones de consola para restaurar la base de datos a partir de un respaldo cifrado:")
    
    add_h2(doc, "16.1 Descifrado y Restauración con pg_restore")
    add_code_block(doc,
        "# 1. Descifrar el archivo de respaldo\n"
        "openssl enc -d -aes-256-cbc -in svetlana_db_20261023_020000.dump.enc \\\n"
        "  -out svetlana_restore.dump -pass pass:\"$BACKUP_ENCRYPTION_KEY\"\n\n"
        "# 2. Restaurar sobre la base de datos limpia de emergencia\n"
        "pg_restore -v --clean --if-exists --no-owner --no-privileges \\\n"
        "  -d \"$DATABASE_URL_NUEVA\" svetlana_restore.dump\n\n"
        "# 3. Verificar integridad de tablas\n"
        "psql \"$DATABASE_URL_NUEVA\" -c \"SELECT count(*) FROM \\\"User\\\";\"\n"
        "psql \"$DATABASE_URL_NUEVA\" -c \"SELECT count(*) FROM \\\"Product\\\";\""
    )

    # -------------------------------------------------------------
    # CAPÍTULO 17: ESTRUCTURA DEL COMITÉ DE CRISIS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 17: ESTRUCTURA DEL COMITÉ DE CRISIS Y ÁRBOL DE LLAMADAS")
    add_p(doc, "Ante una contingencia de nivel crítico (P1), se activa la cadena de mando de emergencia:")
    
    crisis_headers = ["Rol en Emergencia", "Titular Designado", "Canal de Contacto Principal", "Responsabilidad Central"]
    crisis_rows = [
        ["Comandante de Incidente", "Wilson Propietario / Director General", "Llamada celular directa", "Declaración oficial de desastre y autorización de gastos de contingencia."],
        ["Líder Técnico de Recuperación", "Lead Software Architect", "Telegram / Teléfono móvil", "Ejecución técnica del failover de base de datos y despliegue cloud."],
        ["Coordinadora de Sucursal Matriz", "Encargada de Mostrador Matriz", "Teléfono de sucursal", "Activación del modo offline y resguardo del dinero físico en caja."],
        ["Coordinadora de Sucursal 2", "Encargada de Sucursal Secundaria", "Teléfono de sucursal", "Supervisión del despacho manual y recepción de pan de reparto."]
    ]
    add_styled_table(doc, crisis_headers, crisis_rows, [Inches(1.6), Inches(1.8), Inches(1.4), Inches(1.7)])

    # -------------------------------------------------------------
    # CAPÍTULO 18: SIMULACROS SEMESTRALES DE DESASTRE
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 18: PROGRAMA DE PRUEBAS, SIMULACROS Y AUDITORÍA DEL DRP")
    add_p(doc, "Un plan de recuperación solo es confiable si se prueba de manera periódica. Se instituye el siguiente calendario obligatorio de simulacros:")
    add_bullet(doc, "Se descarga un respaldo real del almacenamiento en la nube y se restaura en un servidor de pruebas aislado, verificando que el tiempo total sea inferior a 45 minutos.", bold_prefix="Simulacro de Restauración en Seco (Cada 3 Meses):")
    add_bullet(doc, "Se simula una desconexión intencional de internet en el mostrador durante 2 horas en horario comercial, verificando que el personal opere el talonario manual sin perder control de ventas.", bold_prefix="Simulacro Operativo Offline (Cada 6 Meses):")
    add_bullet(doc, "Revisión conjunta del presente manual para actualizar números de contacto de proveedores, claves y topologías.", bold_prefix="Revisión Documental Anual (Octubre de cada año):")

    # -------------------------------------------------------------
    # CAPÍTULO 19: PLANTILLAS Y FORMULARIOS DE CONTINGENCIA
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 19: PLANTILLAS Y FORMULARIOS OFICIALES DE CONTINGENCIA", page_break_before=True)
    add_p(doc, "Para la correcta ejecución del modo offline en sucursales, todo mostrador debe contar con copias físicas impresas de los siguientes tres formatos estandarizados:")
    
    add_h2(doc, "19.1 Formato F-OFF-01: Planilla de Preconteo Físico Nocturno")
    p_f1 = [
        ["Código de Variedad", "Nombre del Pan", "Inventario Inicial (a)", "Producción Recibida (b)", "Conteo Físico Cierre (c)", "Mermas (d)", "Venta Calculada (a+b-c-d)"],
        ["PAN-001", "Concha Tradicional", "_______ pzs", "_______ pzs", "_______ pzs", "_______ pzs", "_______ pzs"],
        ["PAN-002", "Bolillo Rústico", "_______ pzs", "_______ pzs", "_______ pzs", "_______ pzs", "_______ pzs"],
        ["PAN-003", "Cuerno de Mantequilla", "_______ pzs", "_______ pzs", "_______ pzs", "_______ pzs", "_______ pzs"],
        ["PAN-004", "Oreja Hojaldrada", "_______ pzs", "_______ pzs", "_______ pzs", "_______ pzs", "_______ pzs"],
        ["PAN-005", "Dona Glaseada", "_______ pzs", "_______ pzs", "_______ pzs", "_______ pzs", "_______ pzs"],
        ["PAN-006", "Pastel Mediano", "_______ pzs", "_______ pzs", "_______ pzs", "_______ pzs", "_______ pzs"]
    ]
    add_styled_table(doc, p_f1[0], p_f1[1:], [Inches(1.0), Inches(1.8), Inches(0.8), Inches(0.8), Inches(0.8), Inches(0.6), Inches(0.7)])

    add_h2(doc, "19.2 Formato F-OFF-02: Talonario Manual de Pedidos y Reservas")
    add_p(doc, "Campos obligatorios del talonario físico foliado en papel autocopiante:")
    add_bullet(doc, "Número de Folio Consecutivo preimpreso (ej. #REC-00452).", bold_prefix="Encabezado:")
    add_bullet(doc, "Nombre del Cliente, Teléfono Móvil y Sucursal de Retiro.", bold_prefix="Datos del Titular:")
    add_bullet(doc, "Tabla con: Cantidad, Variedad de Pan, Precio Unitario y Subtotal.", bold_prefix="Cuerpo del Pedido:")
    add_bullet(doc, "Hora pactada de retiro (con nota de tolerancia de 2 horas).", bold_prefix="Compromiso:")
    add_bullet(doc, "Monto total en efectivo pendiente de pago contra entrega física.", bold_prefix="Liquidación:")

    add_h2(doc, "19.3 Formato F-OFF-03: Acta Administrativa de Incidente Crítico")
    add_p(doc, "Documento formal redactado tras la resolución de una contingencia:")
    add_bullet(doc, "Fecha, hora de inicio y hora de finalización del evento.", bold_prefix="1. Cronología:")
    add_bullet(doc, "Descripción minuciosa del fallo técnico o corte de suministro.", bold_prefix="2. Causa Raíz:")
    add_bullet(doc, "Ventas manuales procesadas durante la desconexión y cuadre de efectivo.", bold_prefix="3. Balance Financiero:")
    add_bullet(doc, "Acciones correctivas implementadas para prevenir recurrencia y firma de los miembros del Comité de Crisis.", bold_prefix="4. Dictamen y Firmas:")

    # -------------------------------------------------------------
    # CAPÍTULO 20: AUDITORÍA DE SEGURIDAD INFORMÁTICA Y HARDENING
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 20: AUDITORÍA DE SEGURIDAD INFORMÁTICA Y HARDENING", page_break_before=True)
    add_p(doc, "La postura defensiva de Panadería Svetlana exige revisiones periódicas de seguridad sobre la infraestructura y el código fuente:")
    
    add_h2(doc, "20.1 Auditoría Automatizada de Dependencias (npm audit)")
    add_p(doc, "En cada ciclo quincenal de mantenimiento, el equipo técnico ejecuta el análisis estático de vulnerabilidades sobre los árboles de paquetes:")
    add_code_block(doc,
        "# Auditoría de dependencias en Backend API\n"
        "cd api && npm audit --audit-level=high\n\n"
        "# Auditoría de dependencias en Frontend Web\n"
        "cd ../web && npm audit --audit-level=high"
    )
    add_p(doc, "Cualquier vulnerabilidad de severidad 'High' o 'Critical' debe remediarse en menos de 48 horas mediante actualización de versiones en package.json.")

    add_h2(doc, "20.2 Hardening de Parámetros de PostgreSQL")
    add_p(doc, "Se establecen los siguientes valores recomendados en el archivo postgresql.conf para optimizar el rendimiento y seguridad:")
    
    pg_params = [
        ["Parámetro de Configuración", "Valor Recomendado", "Justificación Operativa"],
        ["max_connections", "50", "Previene saturación de memoria RAM en servidores de base de datos."],
        ["shared_buffers", "512MB", "Asigna el 25% de la memoria del contenedor para caché de páginas de disco."],
        ["work_mem", "16MB", "Permite ordenamientos rápidos en consultas de arqueo residual."],
        ["maintenance_work_mem", "64MB", "Acelera operaciones de VACUUM y REINDEX."],
        ["ssl", "on", "Exige forzosamente conexiones cifradas TLS 1.3."],
        ["log_min_duration_statement", "500", "Registra en bitácora cualquier consulta que demore más de 500 ms."]
    ]
    add_styled_table(doc, pg_params[0], pg_params[1:], [Inches(2.1), Inches(1.5), Inches(2.9)])

    # -------------------------------------------------------------
    # CAPÍTULO 21: MONITOREO DE REDES Y CONECTIVIDAD LAN
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 21: MONITOREO DE REDES LOCALES Y WI-FI EN SUCURSALES", page_break_before=True)
    add_p(doc, "La estabilidad del despacho en mostrador depende de la salud del enlace Wi-Fi local:")
    add_bullet(doc, "El router de sucursal debe emitir dos SSIDs separados: 'Svetlana-POS' (VLAN aislada exclusiva para tablets de cobro y panadería) y 'Svetlana-Invitados' (red pública con ancho de banda limitado a 1 Mbps por usuario).", bold_prefix="1. Segmentación de Red (VLANs):")
    add_bullet(doc, "Priorizar el tráfico hacia los dominios api.panaderia.com y supabase.co mediante Quality of Service (QoS), garantizando que las descargas de clientes no ralenticen el mostrador.", bold_prefix="2. Priorización de Tráfico (QoS):")
    add_bullet(doc, "La tablet de mostrador debe ubicarse a menos de 8 metros de distancia de línea de vista directa con el punto de acceso inalámbrico.", bold_prefix="3. Cobertura de Señal:")

    # -------------------------------------------------------------
    # CAPÍTULO 22: DESACTIVACIÓN Y BAJA SEGURA DE DISPOSITIVOS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 22: PROCEDIMIENTO DE DESACTIVACIÓN Y BAJA SEGURA DE EQUIPOS")
    add_p(doc, "Cuando una tablet, computadora portátil o teléfono móvil de la panadería llega al final de su vida útil o es reemplazado:")
    add_bullet(doc, "El administrador revoca los accesos del TrustedDevice desde el panel /admin/usuarios.", bold_prefix="Paso 1 (Revocación Digital):")
    add_bullet(doc, "Borrar la memoria caché del navegador web y eliminar cualquier cookie o token de sesión residual.", bold_prefix="Paso 2 (Limpieza de Navegador):")
    add_bullet(doc, "Ejecutar un 'Restablecimiento de Fábrica' (Factory Reset) completo con cifrado de sobreescritura de almacenamiento según norma NIST SP 800-88.", bold_prefix="Paso 3 (Sanitización NIST):")
    add_bullet(doc, "Registrar el número de serie del equipo en el Acta de Baja de Activos Tecnológicos.", bold_prefix="Paso 4 (Registro Físico):")

    # -------------------------------------------------------------
    # CAPÍTULO 23: DESASTRES FÍSICOS, INCENDIOS E INUNDACIONES
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 23: PLAN DE ACCIÓN ANTE DESASTRES FÍSICOS EN PLANTA MATRIZ", page_break_before=True)
    add_p(doc, "Por operar con hornos industriales de gas LP a altas temperaturas y líneas eléctricas trifásicas, la planta de producción de la Sucursal Matriz cuenta con un protocolo de salvaguarda física de vidas y continuidad comercial:")
    
    add_h2(doc, "23.1 Protocolo de Contingencia ante Conato de Incendio")
    add_bullet(doc, "Cierre inmediato de la Válvula Maestra de Gas LP ubicada en el exterior de la bodega de horneado.", bold_prefix="1. Corte de Suministro:")
    add_bullet(doc, "Evacuar a todo el personal de panadería por la salida de emergencia hacia el punto de reunión en la acera frontal.", bold_prefix="2. Evacuación Inmediata:")
    add_bullet(doc, "Utilizar el extintor de Polvo Químico Seco (PQS) de 6 kg ubicado junto al horno solo si el fuego es incipiente y no pone en riesgo la vida.", bold_prefix="3. Combate de Conato:")
    add_bullet(doc, "Llamar al cuerpo de bomberos local (911) y reportar emergencia de gas en panadería comercial.", bold_prefix="4. Alerta Exterior:")

    add_h2(doc, "23.2 Reubicación Temporal de Horneado (Alianza de Apoyo)")
    add_p(doc, "Panadería Svetlana mantiene un convenio de cooperación mutua con una panadería artesanal aliada ubicada a 3 km de distancia. En caso de inhabilitación física del horno principal, el equipo de maestros panaderos se traslada a las instalaciones del socio para hornear las tandas prioritarias en horario nocturno (22:00 a 04:00 hrs), transportando la producción terminada a las sucursales para su venta normal.")

    # -------------------------------------------------------------
    # CAPÍTULO 24: DIRECTORIO DE CONTACTOS DE EMERGENCIA
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 24: DIRECTORIO OFICIAL DE CONTACTOS Y PROVEEDORES CRÍTICOS", page_break_before=True)
    add_p(doc, "En situaciones de crisis, el personal no debe perder tiempo buscando números telefónicos. Se establece la siguiente agenda de emergencia:")
    
    dir_headers = ["Servicio / Proveedor Crítico", "Nombre de la Empresa", "Contacto Telefónico 24/7", "Tiempo Máximo de Respuesta Acordado"]
    dir_rows = [
        ["Suministro de Gas LP de Emergencia", "Gas Imperial Express", "(55) 5555-0101 / Cel: (55) 5555-0102", "Menor a 60 minutos en planta"],
        ["Proveedor Alterno de Harina y Levadura", "Distribuidora Harinera del Centro", "(55) 5555-0201 / WhatsApp Ventas", "Entrega el mismo día hábil"],
        ["Soporte de Enlace de Fibra Óptica (ISP)", "Telmex Empresarial Soporte N3", "800 123 2222 (Folio Preferente)", "Menor a 4 horas en sitio"],
        ["Técnico Certificado de Hornos de Convección", "Servicios Térmicos Industriales", "Celular Urgencias: (55) 5555-0301", "Menor a 3 horas en Matriz"],
        ["Electricista Industrial Certificado", "Instalaciones Eléctricas Gómez", "Celular Urgencias: (55) 5555-0401", "Menor a 90 minutos en sitio"],
        ["Soporte Técnico de Plataforma Cloud", "Lead Software Architect", "Telegram: @LeadArchitectSvetlana", "Menor a 15 minutos (SLA P1)"],
        ["Cerrajería y Seguridad de Cajas Fuertes", "Cerrajería Blindada Central", "(55) 5555-0501", "Menor a 45 minutos"]
    ]
    add_styled_table(doc, dir_headers, dir_rows, [Inches(1.8), Inches(1.8), Inches(1.8), Inches(1.1)])

    # -------------------------------------------------------------
    # CAPÍTULO 25: MEJORA CONTINUA DEL DRP (CICLO PHVA)
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 25: GUÍA METODOLÓGICA DE MEJORA CONTINUA DEL DRP (PHVA)")
    add_p(doc, "La resiliencia operativa no es un documento estático, sino un proceso dinámico de aprendizaje basado en el Ciclo de Deming (Planear, Hacer, Verificar, Actuar):")
    add_bullet(doc, "Identificación de nuevas amenazas (aumento de tarifas de gas, fallas en nuevas versiones de navegadores).", bold_prefix="1. Planear (Plan):")
    add_bullet(doc, "Ejecución puntual de los simulacros programados y aplicación estricta de las políticas de copias de seguridad.", bold_prefix="2. Hacer (Do):")
    add_bullet(doc, "Auditoría de los tiempos reales de recuperación obtenidos en los simulacros frente a las metas RTO <= 2h y RPO <= 24h.", bold_prefix="3. Verificar (Check):")
    add_bullet(doc, "Actualización inmediata de las fichas de troubleshooting y runbooks en este manual incorporando las lecciones aprendidas.", bold_prefix="4. Actuar (Act):")

    # -------------------------------------------------------------
    # CAPÍTULO 26: PROTOCOLO DE COMUNICACIÓN EN CRISIS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 26: PROTOCOLO DE COMUNICACIÓN EN CRISIS HACIA CLIENTES")
    add_p(doc, "Si un desastre o falla severa interrumpe la entrega de pan o el servicio web durante más de 1 hora:")
    add_bullet(doc, "El encargado debe colocar inmediatamente un aviso impreso en el mostrador físico explicando que el despacho continúa en efectivo de forma manual.", bold_prefix="1. Aviso Físico en Tienda:")
    add_bullet(doc, "En el portal web se despliega un banner superior de aviso: 'Mantenimiento preventivo en progreso: las sucursales físicas operan con normalidad'.", bold_prefix="2. Notificación en Portal Web:")
    add_bullet(doc, "Para clientes con pedidos especiales de repostería que sufran retrasos, la encargada se comunicará directamente por llamada telefónica para acordar una nueva hora o compensar con una pieza de cortesía.", bold_prefix="3. Contacto Personalizado:")

    # Embedding additional diagram
    diag_ant = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "DIAGRAMA_CONTEXTO_SISTEMA_ANTERIOR.png"))
    if os.path.exists(diag_ant):
        add_image_with_caption(doc, diag_ant, "Figura 2. Diagrama de Referencia Operativa Manual (Esquema de contingencia utilizado ante caída digital)", 6.2)

    # -------------------------------------------------------------
    # CAPÍTULO 27: DESPLIEGUE ZERO-DOWNTIME Y CANARY RELEASES
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 27: PROTOCOLO DE DESPLIEGUE ZERO-DOWNTIME Y CANARY RELEASES", page_break_before=True)
    add_p(doc, "Para garantizar que las actualizaciones de código o parches correctivos no provoquen interrupciones durante las horas de mayor afluencia de clientes (07:00 a 10:00 hrs y 18:00 a 20:30 hrs), el equipo de DevOps aplica el protocolo de Despliegue sin Caída (Zero-Downtime Deployment):")
    
    add_h2(doc, "27.1 Ventanas Autorizadas de Despliegue")
    add_p(doc, "Queda estrictamente prohibido realizar despliegues de versión mayor o migraciones de base de datos en horario comercial activo. Todas las liberaciones a producción deben programarse dentro de la ventana de mantenimiento oficial: Lunes a Jueves de 22:00 a 23:30 hrs.")
    
    add_h2(doc, "27.2 Secuencia de Conmutación de Contenedores")
    add_bullet(doc, "Render levanta una nueva instancia en contenedor con la imagen compilada sin apagar la instancia anterior.", bold_prefix="Paso 1 (Instancia Paralela):")
    add_bullet(doc, "El balanceador de carga emite peticiones hacia el endpoint GET /api/v1/health de la nueva instancia durante 60 segundos.", bold_prefix="Paso 2 (Healthcheck de Humo):")
    add_bullet(doc, "Si el healthcheck responde con éxito continuo (HTTP 200), el tráfico de usuarios se redirige a la nueva versión.", bold_prefix="Paso 3 (Conmutación):")
    add_bullet(doc, "La instancia antigua se mantiene en estado pasivo durante 10 minutos antes de ser terminada para permitir que las transacciones abiertas finalicen limpiamente.", bold_prefix="Paso 4 (Drenado de Conexiones):")

    # Embedding diagram
    diag_comp = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "UML-06_diagrama_de_componentes.png"))
    if os.path.exists(diag_comp):
        add_image_with_caption(doc, diag_comp, "Figura 3. Diagrama de Componentes UML-06 (Topología de Servicios y Redundancia de Contenedores)", 6.2)

    # -------------------------------------------------------------
    # CAPÍTULO 28: BÁSCULAS ELECTRÓNICAS Y DISPOSITIVOS SERIALES
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 28: CALIBRACIÓN Y MANTENIMIENTO DE BÁSCULAS ELECTRÓNICAS", page_break_before=True)
    add_p(doc, "El pesaje de masa y mermas en la planta Matriz se realiza a través de básculas digitales industriales Torrey y Rhino conectadas a la estación de panadería:")
    
    add_bullet(doc, "Comprobar que la burbuja de nivel físico se encuentre exactamente centrada en el visor circular; ajustar las patas roscadas de soporte en caso de desnivel.", bold_prefix="1. Nivelación Mecánica:")
    add_bullet(doc, "Verificar los parámetros de comunicación serial (Baud Rate: 9600 bps, Data Bits: 8, Parity: None, Stop Bits: 1) para la lectura de pesaje en tiempo real.", bold_prefix="2. Configuración de Puerto COM:")
    add_bullet(doc, "Colocar una pesa patrón certificada de 10 kg y verificar que la lectura en pantalla marque exactamente 10.000 kg ± 5 g.", bold_prefix="3. Prueba de Cero y Calibración:")
    add_bullet(doc, "Limpiar el plato de acero inoxidable con paño húmedo al terminar la jornada, retirando harina o sal que pueda corroer las celdas de carga.", bold_prefix="4. Mantenimiento Diario:")

    # -------------------------------------------------------------
    # CAPÍTULO 29: RESGUARDO DE FONDOS Y SEGURIDAD FÍSICA
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 29: PROTOCOLO DE RESGUARDO DE FONDOS Y ARQUEO ANTE DISTURBIOS", page_break_before=True)
    add_p(doc, "Dado que Panadería Svetlana opera bajo la modalidad de cobro exclusivo en efectivo (Cash-Only), la acumulación de papel moneda y metálico en mostrador representa un activo crítico que exige medidas estrictas de resguardo físico:")
    
    add_h2(doc, "29.1 Política de Sangría Parcial de Caja")
    add_p(doc, "Para evitar que el dinero en la gaveta de mostrador exceda límites seguros:")
    add_bullet(doc, "Cuando el efectivo en caja supere los $3,000.00 MXN en billetes, el cajero debe realizar una 'Sangría Parcial'.", bold_prefix="Umbral de Alerta:")
    add_bullet(doc, "Se extraen los billetes de alta denominación ($200, $500), se guardan en un sobre rotulado con fecha, hora y monto, y se depositan inmediatamente en la tómbola de la caja fuerte blindada.", bold_prefix="Depósito en Tómbola:")
    add_bullet(doc, "En el cajón de mostrador solo debe permanecer el fondo fijo de $500.00 MXN y cambio menor para dar vuelto.", bold_prefix="Fondo Remanente:")

    add_h2(doc, "29.2 Traslado Seguro de Fondos de Sucursal Secundaria a Matriz")
    add_p(doc, "Al terminar la jornada en la Sucursal Secundaria, el dinero recaudado debe ser trasladado a la caja fuerte principal de Matriz:")
    add_bullet(doc, "El traslado se realiza invariablemente por dos personas autorizadas en horarios no fijos para evitar patrones.", bold_prefix="1. Ruta Variable:")
    add_bullet(doc, "El efectivo viaja en un maletín de seguridad con cierre numérico.", bold_prefix="2. Custodia:")
    add_bullet(doc, "Al ingresar a Matriz, se abre el maletín en presencia del Administrador General y se coteja contra la planilla física de Cierre Diario F-OFF-01.", bold_prefix="3. Recepción y Resguardo:")

    # -------------------------------------------------------------
    # CAPÍTULO 30: CHECKLIST SEMESTRAL DE RESILIENCIA DEL DRP
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 30: LISTA DE CONTROL (CHECKLIST) DE AUDITORÍA SEMESTRAL DE RESILIENCIA", page_break_before=True)
    add_p(doc, "Cada seis meses, el Comité de Crisis debe completar la siguiente auditoría de 20 reactivos obligatorios para certificar la vigencia del Plan de Recuperación ante Desastres:")
    
    chk20_headers = ["No.", "Reactivo de Auditoría de Continuidad", "Periodicidad", "Responsable", "Resultado"]
    chk20_rows = [
        ["1", "Respaldo diario verificado en bucket S3 y sin errores de suma MD5", "Diario", "DBA", "[ ] CONFORME"],
        ["2", "Prueba de descifrado OpenSSL con llave maestra ejecutada exitosamente", "Mensual", "Líder Técnico", "[ ] CONFORME"],
        ["3", "Restauración en servidor aislado completada en tiempo menor a 45 min", "Trimestral", "Líder Técnico", "[ ] CONFORME"],
        ["4", "Stock de 50 hojas impresas de Preconteo F-OFF-01 en cada sucursal", "Semanal", "Encargadas", "[ ] CONFORME"],
        ["5", "Talonarios manuales de pedidos foliados disponibles en mostrador", "Semanal", "Encargadas", "[ ] CONFORME"],
        ["6", "Punto de acceso móvil (Hotspot 5G) con batería cargada y datos activos", "Semanal", "Encargadas", "[ ] CONFORME"],
        ["7", "Extintor PQS de planta matriz con carga vigente y manómetro en verde", "Mensual", "Mantenimiento", "[ ] CONFORME"],
        ["8", "Válvula maestra de gas LP exterior con acceso despejado y señalizada", "Mensual", "Mantenimiento", "[ ] CONFORME"],
        ["9", "Directorio telefónico de proveedores críticos actualizado y plastificado", "Trimestral", "Gerencia", "[ ] CONFORME"],
        ["10", "Convenio de horneado con panadería aliada ratificado formalmente", "Anual", "Dirección General", "[ ] CONFORME"],
        ["11", "Credenciales de administradores y contraseñas rotadas en últimos 90 días", "Trimestral", "Admin General", "[ ] CONFORME"],
        ["12", "Monitoreo /api/v1/health reportando uptime superior a 99.8%", "Mensual", "DevOps", "[ ] CONFORME"],
        ["13", "Latencia de consultas de base de datos en PostgreSQL menor a 15 ms", "Mensual", "DBA", "[ ] CONFORME"],
        ["14", "Simulacro operativo de 2 horas sin internet ejecutado en tienda", "Semestral", "Comité de Crisis", "[ ] CONFORME"],
        ["15", "Actas de incidentes del semestre analizadas y archivadas en bóveda", "Semestral", "Dirección General", "[ ] CONFORME"]
    ]
    add_styled_table(doc, chk20_headers, chk20_rows, [Inches(0.6), Inches(3.2), Inches(1.0), Inches(1.1), Inches(1.1)])

    # Embedding diagram
    diag_act = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "UML-04_diagrama_de_actividades.png"))
    if os.path.exists(diag_act):
        add_image_with_caption(doc, diag_act, "Figura 4. Diagrama de Actividades UML-04 (Algoritmo de Validación de Conciliación y Cierre)", 6.2)

    # Output path
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__)))
    output_path = os.path.join(out_dir, "MANUAL_3_OPERACION_Y_SOPORTE.docx")
    doc.save(output_path)
    print(f"Manual 3 guardado exitosamente en: {output_path}")
    return output_path

if __name__ == "__main__":
    build_manual_3()
