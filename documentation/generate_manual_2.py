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

def build_manual_2():
    print("Iniciando la construcción del Manual 2: Técnico y de Desarrollo...")
    doc = create_base_document("MANUAL 2: MANUALES TÉCNICOS Y DE DESARROLLO — PANADERÍA SVETLANA")
    
    # -------------------------------------------------------------
    # PORTADA PRINCIPAL
    # -------------------------------------------------------------
    metadata_rows = [
        ("Módulos Integrados:", "Arquitectura de Software, Instalación/Despliegue y Especificación de API REST"),
        ("Stack Tecnológico:", "Next.js 14 (App Router) + NestJS 10 + PostgreSQL 15 + Prisma ORM + Docker"),
        ("Base de Datos:", "33 Modelos Normalizados con Integridad Transaccional ACID y Trazabilidad"),
        ("Diagramas UML Incluidos:", "UML-01 a UML-06 + Diagrama C4 de Contexto + Modelo Entidad-Relación"),
        ("Estándar de API:", "RESTful JSON v1 con Autenticación JWT Bearer y Cookies HttpOnly Seguras"),
        ("Plataformas Cloud:", "Vercel (Frontend), Render / Container (Backend API) y Supabase / Neon (DB)")
    ]
    add_main_cover(
        doc,
        main_title="MANUALES TÉCNICOS Y DE DESARROLLO",
        subtitle="Especificación Canónica de Arquitectura de Software, Diagramas UML, Diccionario de Base de Datos (33 Tablas), Guía de Instalación/Docker y Catálogo Exhaustivo de la API REST",
        doc_code="DOC-MAN-02-TEC-DEV",
        version="2.0.0 (Producción)",
        date_str="Octubre 2026",
        classification="CONFIDENCIAL — PROPIEDAD INTELECTUAL Y CÓDIGO FUENTE",
        audience="Arquitectos de Software, Desarrolladores Fullstack, Ingenieros DevOps, DBAs y Soporte Técnico N3",
        metadata_rows=metadata_rows
    )
    
    # -------------------------------------------------------------
    # CONTROL DE VERSIONES Y APROBACIONES
    # -------------------------------------------------------------
    add_h1(doc, "1. CONTROL DOCUMENTAL Y GOBERNANZA TÉCNICA")
    add_p(doc, "Este manual técnico documenta con rigor de ingeniería la totalidad de la arquitectura de software, infraestructura y contratos de integración de la plataforma Panadería Svetlana. Cualquier refactorización o cambio de contrato en la API o esquema de base de datos requiere aprobación del Lead Architect y su debido registro en esta sección.")
    
    vers_headers = ["Versión", "Fecha", "Autor / Área", "Resumen de Modificaciones", "Estado"]
    vers_rows = [
        ["1.0.0", "20/02/2026", "Backend Team", "Diseño inicial del schema de Prisma y arquitectura modular NestJS", "Superado"],
        ["1.3.0", "15/06/2026", "DevOps Specialist", "Incorporación de Docker multi-stage y pipelines de GitHub Actions", "Superado"],
        ["1.7.0", "18/08/2026", "Lead Architect", "Rediseño de base de datos a 33 modelos (amasijos, FEFO, Telegram)", "Superado"],
        ["2.0.0", "23/10/2026", "Lead Architect & QA", "Consolidación técnica: 6 Diagramas UML, ERD, 20 Controladores REST", "Vigente"]
    ]
    add_styled_table(doc, vers_headers, vers_rows, [Inches(0.9), Inches(1.1), Inches(1.6), Inches(2.0), Inches(0.9)])
    
    # -------------------------------------------------------------
    # ÍNDICE GENERAL NARRATIVO
    # -------------------------------------------------------------
    add_h1(doc, "2. ÍNDICE GENERAL DE LA DOCUMENTACIÓN TÉCNICA", page_break_before=True)
    add_p(doc, "La documentación técnica se desglosa en tres subdivisiones principales:")
    
    add_bullet(doc, "Filosofía del stack, Clean Architecture, 6 diagramas UML, diagrama C4 de contexto, modelo ERD y diccionario exhaustivo de 33 tablas.", bold_prefix="PARTE I: MANUAL TÉCNICO Y DE ARQUITECTURA.")
    add_bullet(doc, "Requisitos de hardware, diccionario de variables .env, Dockerfiles, docker-compose, Prisma migrations y pipelines CI/CD.", bold_prefix="PARTE II: MANUAL DE INSTALACIÓN Y DESPLIEGUE.")
    add_bullet(doc, "Estándares REST v1, seguridad JWT, catálogo de 20 controladores, schemas DTO, ejemplos cURL y manejo de errores RFC 7807.", bold_prefix="PARTE III: MANUAL DE INTEGRACIÓN / API REST.")

    # =============================================================
    # SUBDIVISIÓN 1: MANUAL TÉCNICO Y DE ARQUITECTURA
    # =============================================================
    part1_topics = [
        ("Capítulo 1: Stack Tecnológico", "Análisis de tecnologías Next.js, NestJS, Prisma y PostgreSQL", "Ingenieros de Software"),
        ("Capítulo 2: Arquitectura y C4", "Límites del sistema, contenedores y justificación arquitectónica", "Arquitectos"),
        ("Capítulo 3: Clean Architecture", "Capas de controladores, casos de uso, servicios y repositorios", "Desarrolladores"),
        ("Capítulo 4: Diagrama UML-01", "Diagrama de Clases y jerarquía de modelos del dominio", "Equipo de Desarrollo"),
        ("Capítulo 5: Diagrama UML-02", "Diagrama de Secuencia: Reserva de pedidos y cierre residual", "Desarrolladores"),
        ("Capítulo 6: Diagrama UML-03", "Diagrama de Estados: Ciclo de vida de pedidos y lotes FEFO", "Desarrolladores"),
        ("Capítulo 7: Diagrama UML-04", "Diagrama de Actividades: Flujo algorítmico del arqueo diario", "Desarrolladores y QA"),
        ("Capítulo 8: Diagrama UML-05", "Diagrama de Colaboración: Mensajería entre subsistemas", "Arquitectos"),
        ("Capítulo 9: Diagrama UML-06", "Diagrama de Componentes: Desacoplamiento modular de capas", "DevOps y Arquitectos"),
        ("Capítulo 10: Modelo ERD", "Diagrama Entidad-Relación y cardinalidades relacionales", "DBAs y Desarrolladores"),
        ("Capítulo 11: Diccionario de Datos", "Especificación técnica campo por campo de las 33 tablas", "DBAs y Backend"),
        ("Capítulo 12: Integridad ACID", "Transacciones atómicas en Prisma, bloqueos y consistencia", "Backend Specialists"),
        ("Capítulo 13: Arquitectura de Seguridad", "Esquema JWT, cookies HttpOnly, Bcrypt, CORS y defensas", "Seguridad y Auditoría")
    ]
    add_divider_cover(
        doc,
        part_number="I",
        part_title="MANUAL TÉCNICO Y DE ARQUITECTURA",
        part_subtitle="Diseño Estructural, Diagramas UML Canónicos, Modelo Entidad-Relación y Diccionario Exhaustivo de Datos (33 Modelos)",
        description="Esta sección detalla los fundamentos de ingeniería de software sobre los que se construyó la plataforma de Panadería Svetlana. Incluye el análisis C4 de contexto, diagramas de diseño formal UML, el esquema relacional íntegro de la base de datos PostgreSQL y las garantías de consistencia transaccional ACID.",
        topics_list=part1_topics
    )

    # -------------------------------------------------------------
    # CAPÍTULO 1: STACK TECNOLÓGICO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 1: VISIÓN GENERAL DEL STACK TECNOLÓGICO")
    add_p(doc, "El sistema de Panadería Svetlana está construido bajo un enfoque desacoplado (Decoupled Frontend / Backend Architecture), combinando frameworks de vanguardia en el ecosistema TypeScript para maximizar el rendimiento, la robustez de tipos y la mantenibilidad a largo plazo.")
    
    stack_headers = ["Capa de Software", "Tecnología Principal", "Versión", "Rol y Justificación Arquitectónica"]
    stack_rows = [
        ["Frontend Web", "Next.js (App Router)", "14.2.x", "Renderizado híbrido (SSR/SSG), Server Components para SEO y Client Components interactivos."],
        ["Estilos / UI", "Tailwind CSS", "3.4.x", "Diseño responsivo móvil-primero (Mobile-First), paleta sobria sin dependencias de UI pesadas."],
        ["Backend API", "NestJS (Node.js)", "10.3.x", "Arquitectura modular inspirada en Clean Architecture, inyección de dependencias y tipado estricto."],
        ["ORM / Mapeo", "Prisma ORM", "5.14.x", "Mapeo objeto-relacional con generación automática de tipos TypeScript y control de migraciones."],
        ["Base de Datos", "PostgreSQL", "15.x / 16.x", "Motor relacional ACID con soporte para tipos JSONB, integridad referencial y claves foráneas."],
        ["Contenedores", "Docker & Compose", "24.x", "Estandarización de entornos de ejecución multi-etapa y portabilidad absoluta."],
        ["Notificaciones", "Telegram Bot API", "v6.x", "Canal interactivo push para alertas gerenciales de bajo costo y alta disponibilidad."],
        ["Pruebas", "Jest & Supertest", "29.x", "Suite de pruebas unitarias, de integración y verificación continua de endpoints."]
    ]
    add_styled_table(doc, stack_headers, stack_rows, [Inches(1.2), Inches(1.4), Inches(0.8), Inches(3.1)])

    # -------------------------------------------------------------
    # CAPÍTULO 2: ARQUITECTURA C4 Y LÍMITES DE DOMINIO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 2: ARQUITECTURA DEL SISTEMA Y MODELO DE CONTEXTO")
    add_p(doc, "Siguiendo las pautas del modelo C4 (Context, Containers, Components, Code), la arquitectura se delimita claramente respecto a sus fronteras de operación y servicios periféricos.")
    
    diag_c4 = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "DIAGRAMA_CONTEXTO_SISTEMA.png"))
    if os.path.exists(diag_c4):
        add_image_with_caption(doc, diag_c4, "Figura 1. Diagrama de Contexto del Sistema (Fronteras de Interacción y Canales de Comunicación)", 6.0)

    add_h2(doc, "2.1 Análisis de Contenedores de Alto Nivel")
    add_bullet(doc, "Aplicación Next.js servida globalmente con tiempos de respuesta sub-segundo para catálogo público y panel de mostrador.", bold_prefix="1. Web Application Container:")
    add_bullet(doc, "Servidor NestJS que encapsula las 25 reglas de negocio, validaciones transaccionales y algoritmos de balance residual.", bold_prefix="2. REST API Service Container:")
    add_bullet(doc, "Instancia PostgreSQL administrada con replicación y respaldos continuos para resguardo de operaciones.", bold_prefix="3. Relational Database Container:")
    add_bullet(doc, "Servicio externo de mensajería para transmisión inmediata de alertas de inventario y cierres diarios.", bold_prefix="4. External Gateway (Telegram):")

    # -------------------------------------------------------------
    # CAPÍTULO 3: CLEAN ARCHITECTURE EN NESTJS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 3: PATRONES ARQUITECTÓNICOS Y CLEAN ARCHITECTURE")
    add_p(doc, "El backend en NestJS adopta los principios de Clean Architecture y Separación de Incumbencias (Separation of Concerns). Cada módulo funcional se organiza en capas concéntricas:")
    
    add_bullet(doc, "Controladores REST que reciben la petición HTTP, validan los DTOs de entrada mediante class-validator y retornan la respuesta estructurada.", bold_prefix="Capa 1: Interfaz de Transporte (Controllers):")
    add_bullet(doc, "Servicios que implementan las reglas de negocio puras (ej. cálculo de venta residual, verificación FEFO). Totalmente desacoplados de la tecnología de transporte.", bold_prefix="Capa 2: Lógica de Dominio (Services / Use Cases):")
    add_bullet(doc, "Servicio de Prisma que interactúa con la base de datos PostgreSQL, ejecutando queries optimizadas e indexadas.", bold_prefix="Capa 3: Acceso a Datos (Repositories / Prisma Service):")
    add_bullet(doc, "Guards de autenticación JWT y roles RBAC, Interceptors de serialización, Pipes de transformación y Exception Filters para formato RFC 7807.", bold_prefix="Capa 4: Infraestructura Transversal (Cross-Cutting Concerns):")

    # -------------------------------------------------------------
    # CAPÍTULO 4: DIAGRAMA UML-01 CLASES
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 4: DIAGRAMA DE CLASES (UML-01)", page_break_before=True)
    add_p(doc, "El diagrama de clases modela la estructura estática del dominio de Panadería Svetlana, detallando las entidades centrales, sus atributos tipados, métodos operativos y multiplicidades relacionales:")
    
    uml01 = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "UML-01_diagrama_de_clases.png"))
    if os.path.exists(uml01):
        add_image_with_caption(doc, uml01, "Figura 2. Diagrama de Clases UML-01 (Dominio Central de Panadería, Producción, Lotes y Cierre)", 6.2)

    add_h2(doc, "4.1 Jerarquía y Entidades Clave")
    add_bullet(doc, "Representa las identidades del sistema vinculadas a un rol UserRole y sucursal de pertenencia.", bold_prefix="User & Branch:")
    add_bullet(doc, "Catálogo de artículos, con especificación de origen (PRODUCIDO vs COMPRADO) y presentaciones.", bold_prefix="Product & Category:")
    add_bullet(doc, "Registros de horneado en Matriz vinculados a recetas estandarizadas y consumos de insumos.", bold_prefix="ProductionLog & Recipe:")
    add_bullet(doc, "Control riguroso de fechas de expiración y stock por sucursal física.", bold_prefix="InventoryLot & Inventory:")
    add_bullet(doc, "Registros nocturnos de arqueo residual ciego y conciliación de dinero.", bold_prefix="DailyClose & DailyCloseItem:")

    # -------------------------------------------------------------
    # CAPÍTULO 5: DIAGRAMA UML-02 SECUENCIA
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 5: DIAGRAMA DE SECUENCIA (UML-02)", page_break_before=True)
    add_p(doc, "El diagrama de secuencia describe la interacción dinámica temporal entre el Cliente Web, la Aplicación Next.js, el Controlador de Pedidos en NestJS, el Servicio de Dominio y la Base de Datos PostgreSQL:")
    
    uml02 = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "UML-02_diagrama_de_secuencia.png"))
    if os.path.exists(uml02):
        add_image_with_caption(doc, uml02, "Figura 3. Diagrama de Secuencia UML-02 (Proceso Transaccional de Creación de Reserva y Validación de Stock)", 6.2)

    add_p(doc, "Aspectos críticos del flujo de secuencia:")
    add_bullet(doc, "El servicio abre una transacción Prisma atómica para verificar que el stock en vitrina sea suficiente antes de confirmar el apartado.", bold_prefix="Aislamiento Transaccional:")
    add_bullet(doc, "Si dos clientes solicitan la última pieza simultáneamente, el aislamiento de la transacción previene el sobregiro de inventario.", bold_prefix="Manejo de Concurrencia:")

    # -------------------------------------------------------------
    # CAPÍTULO 6: DIAGRAMA UML-03 ESTADOS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 6: DIAGRAMA DE ESTADOS (UML-03)", page_break_before=True)
    add_p(doc, "Modela las máquinas de estados finitos que gobiernan el ciclo de vida de los pedidos web y los lotes de perecederos FEFO:")
    
    uml03 = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "UML-03_diagrama_de_estados.png"))
    if os.path.exists(uml03):
        add_image_with_caption(doc, uml03, "Figura 4. Diagrama de Estados UML-03 (Máquinas de Estado de Pedidos y Semáforo de Lotes FEFO)", 6.2)

    add_h2(doc, "6.1 Transiciones Permitidas en Pedidos")
    add_bullet(doc, "Transición inmediata al recibir la reserva a través del carrito web.", bold_prefix="[*] -> PENDING:")
    add_bullet(doc, "Ejecutado por el despachador en mostrador tras separar las piezas físicas en canastilla.", bold_prefix="PENDING -> CONFIRMED:")
    add_bullet(doc, "El pedido se encuentra empaquetado en estante de entrega y comienza el cronómetro de 2h.", bold_prefix="CONFIRMED -> READY:")
    add_bullet(doc, "El cliente abona el importe en efectivo y retira el producto. Estado final exitoso.", bold_prefix="READY -> DELIVERED:")
    add_bullet(doc, "Transcurrida la tolerancia de 2 horas sin retiro. Las piezas se liberan para venta pública.", bold_prefix="READY -> EXPIRED:")

    # -------------------------------------------------------------
    # CAPÍTULO 7: DIAGRAMA UML-04 ACTIVIDADES
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 7: DIAGRAMA DE ACTIVIDADES (UML-04)", page_break_before=True)
    add_p(doc, "El diagrama de actividades ilustra el flujo algorítmico y de decisiones para la ejecución del Cierre Diario Residual:")
    
    uml04 = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "UML-04_diagrama_de_actividades.png"))
    if os.path.exists(uml04):
        add_image_with_caption(doc, uml04, "Figura 5. Diagrama de Actividades UML-04 (Algoritmo de Conciliación Residual Ciega y Bloqueo de Caja)", 6.2)

    # -------------------------------------------------------------
    # CAPÍTULO 8: DIAGRAMA UML-05 COLABORACIÓN
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 8: DIAGRAMA DE COLABORACIÓN (UML-05)", page_break_before=True)
    add_p(doc, "El diagrama de colaboración (o comunicación) enfatiza la topología de enlaces e intercambio de mensajes entre objetos del sistema:")
    
    uml05 = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "UML-05_diagrama_de_colaboracion.png"))
    if os.path.exists(uml05):
        add_image_with_caption(doc, uml05, "Figura 6. Diagrama de Colaboración UML-05 (Intercambio de Mensajes en Notificaciones y Auditoría)", 6.2)

    # -------------------------------------------------------------
    # CAPÍTULO 9: DIAGRAMA UML-06 COMPONENTES
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 9: DIAGRAMA DE COMPONENTES (UML-06)", page_break_before=True)
    add_p(doc, "El diagrama de componentes describe la organización física y lógica de los módulos de software en ejecución:")
    
    uml06 = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "UML-06_diagrama_de_componentes.png"))
    if os.path.exists(uml06):
        add_image_with_caption(doc, uml06, "Figura 7. Diagrama de Componentes UML-06 (Estructura de Módulos Frontend, API NestJS y Base de Datos)", 6.2)

    # -------------------------------------------------------------
    # CAPÍTULO 10: MODELO ENTIDAD-RELACIÓN INTEGRAL
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 10: MODELO ENTIDAD-RELACIÓN DE LA BASE DE DATOS", page_break_before=True)
    add_p(doc, "El modelo entidad-relación de Panadería Svetlana se encuentra completamente normalizado en 3ra Forma Normal (3NF), garantizando la integridad de datos, la ausencia de redundancias anómalas y un rendimiento óptimo de consulta en PostgreSQL.")
    
    erd_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagramas", "renders", "DIAGRAMA_ENTIDAD_RELACION.png"))
    if os.path.exists(erd_img):
        add_image_with_caption(doc, erd_img, "Figura 8. Diagrama Entidad-Relación Integral (33 Entidades Relacionales Normalizadas)", 6.2)

    # -------------------------------------------------------------
    # CAPÍTULO 11: DICCIONARIO DE DATOS (LAS 33 TABLAS)
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 11: DICCIONARIO EXHAUSTIVO DE DATOS (CATÁLOGO DE 33 TABLAS)", page_break_before=True)
    add_p(doc, "A continuación se documenta formalmente la totalidad de las 33 tablas relacionales generadas en PostgreSQL mediante Prisma ORM, detallando el propósito de cada entidad, sus columnas principales, tipos de datos, restricciones y relaciones de clave foránea:")

    # Table 1: User
    add_h2(doc, "11.1 Tabla: User (Usuarios e Identidades)")
    add_p(doc, "Propósito: Almacena las identidades y credenciales de acceso de clientes, despachadores, panaderos y administradores.")
    u_cols = ["Columna", "Tipo de Dato", "Nulo / Restricción", "Descripción"]
    u_data = [
        ["id", "UUID / String", "PK / @default(uuid())", "Identificador único inmutable del usuario"],
        ["email", "VARCHAR(255)", "UNIQUE / NOT NULL", "Correo electrónico utilizado como usuario de login"],
        ["passwordHash", "VARCHAR(255)", "NOT NULL", "Hash Bcrypt de la contraseña (salt factor 12)"],
        ["fullName", "VARCHAR(150)", "NOT NULL", "Nombre y apellidos completos del titular"],
        ["phone", "VARCHAR(20)", "NULLABLE", "Número telefónico para contacto y alertas"],
        ["role", "UserRole (ENUM)", "NOT NULL / default(CUSTOMER)", "Rol RBAC: CUSTOMER, CASHIER, BAKER, ADMIN"],
        ["branchId", "UUID / String", "FK -> Branch.id (NULLABLE)", "Sucursal física de adscripción del empleado"],
        ["isActive", "BOOLEAN", "NOT NULL / default(true)", "Estado activo o suspendido de la cuenta"],
        ["createdAt", "TIMESTAMP", "NOT NULL / default(now())", "Fecha y hora de creación del registro"],
        ["updatedAt", "TIMESTAMP", "NOT NULL / @updatedAt", "Fecha y hora de última modificación"]
    ]
    add_styled_table(doc, u_cols, u_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 2: RefreshToken
    add_h2(doc, "11.2 Tabla: RefreshToken (Rotación de Sesiones JWT)")
    add_p(doc, "Propósito: Controla la persistencia de sesiones seguras mediante rotación continua de tokens de actualización.")
    rt_data = [
        ["id", "UUID", "PK", "Identificador único del token emitido"],
        ["tokenHash", "VARCHAR(255)", "UNIQUE / NOT NULL", "Hash SHA-256 del refresh token"],
        ["userId", "UUID", "FK -> User.id / CASCADE", "Usuario titular de la sesión activa"],
        ["expiresAt", "TIMESTAMP", "NOT NULL", "Fecha límite de caducidad del token (7 días)"],
        ["revokedAt", "TIMESTAMP", "NULLABLE", "Fecha en que el token fue invalidado manualmente"]
    ]
    add_styled_table(doc, u_cols, rt_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 3: Branch
    add_h2(doc, "11.3 Tabla: Branch (Sucursales Físicas)")
    add_p(doc, "Propósito: Modela los puntos físicos de producción y venta de la empresa.")
    br_data = [
        ["id", "UUID", "PK", "Identificador de la sucursal (Matriz o Secundaria)"],
        ["name", "VARCHAR(100)", "NOT NULL", "Nombre comercial de la sucursal (ej. 'Sucursal Matriz Centro')"],
        ["code", "VARCHAR(20)", "UNIQUE / NOT NULL", "Código corto de sucursal (ej. 'MATRIZ', 'SECUNDARIA')"],
        ["address", "VARCHAR(255)", "NOT NULL", "Dirección física detallada"],
        ["phone", "VARCHAR(20)", "NOT NULL", "Teléfono fijo o móvil de atención al cliente"],
        ["isBakingPlant", "BOOLEAN", "NOT NULL / default(false)", "Indica si posee horno de producción central (True solo en Matriz)"],
        ["openingHours", "VARCHAR(100)", "NOT NULL", "Horario comercial de operación y retiro de pedidos"]
    ]
    add_styled_table(doc, u_cols, br_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 4: Category
    add_h2(doc, "11.4 Tabla: Category (Categorías de Productos)")
    add_p(doc, "Propósito: Clasificación taxonómica de los artículos del catálogo maestro.")
    cat_data = [
        ["id", "UUID", "PK", "Identificador único de categoría"],
        ["name", "VARCHAR(80)", "UNIQUE / NOT NULL", "Nombre descriptivo (ej. 'Pan Dulce', 'Pan Blanco', 'Repostería')"],
        ["slug", "VARCHAR(100)", "UNIQUE / NOT NULL", "Identificador URL amigable (ej. 'pan-dulce')"],
        ["description", "TEXT", "NULLABLE", "Descripción de los productos pertenecientes a la familia"],
        ["orderIndex", "INTEGER", "NOT NULL / default(0)", "Orden de despliegue visual en el portal web"]
    ]
    add_styled_table(doc, u_cols, cat_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 5: Product
    add_h2(doc, "11.5 Tabla: Product (Catálogo Maestro de Artículos)")
    add_p(doc, "Propósito: Define cada producto comercializado, su origen de elaboración y precio base.")
    prod_data = [
        ["id", "UUID", "PK", "Identificador único de producto"],
        ["categoryId", "UUID", "FK -> Category.id", "Categoría taxonómica a la que pertenece"],
        ["name", "VARCHAR(120)", "NOT NULL", "Nombre del pan o artículo (ej. 'Concha de Vainilla')"],
        ["slug", "VARCHAR(140)", "UNIQUE / NOT NULL", "Slug para ruta pública web"],
        ["description", "TEXT", "NOT NULL", "Descripción sensorial e ingredientes"],
        ["basePrice", "DECIMAL(10,2)", "NOT NULL", "Precio de venta al público en moneda nacional ($ MXN)"],
        ["origin", "ProductOrigin", "NOT NULL", "PRODUCIDO (en horno propio) o COMPRADO (reventa/abarrote)"],
        ["isActive", "BOOLEAN", "NOT NULL / default(true)", "Habilitado para venta en vitrina y web"],
        ["allergens", "TEXT[]", "DEFAULT '{}'", "Arreglo de alérgenos declarados (Trigo, Leche, Huevo, Nueces)"]
    ]
    add_styled_table(doc, u_cols, prod_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 6: ProductImage
    add_h2(doc, "11.6 Tabla: ProductImage (Galería Visual)")
    add_p(doc, "Propósito: Almacena las URLs de las fotografías de alta resolución asociadas a cada pan.")
    pimg_data = [
        ["id", "UUID", "PK", "Identificador único de la imagen"],
        ["productId", "UUID", "FK -> Product.id / CASCADE", "Producto al cual pertenece la fotografía"],
        ["url", "VARCHAR(500)", "NOT NULL", "URL pública de almacenamiento del recurso multimedia"],
        ["isPrimary", "BOOLEAN", "NOT NULL / default(false)", "Fotografía principal mostrada en portada y carrito"]
    ]
    add_styled_table(doc, u_cols, pimg_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 7: RawMaterial
    add_h2(doc, "11.7 Tabla: RawMaterial (Catálogo de Materias Primas)")
    add_p(doc, "Propósito: Define los ingredientes industriales utilizados en el área de amasado y horneado.")
    rm_data = [
        ["id", "UUID", "PK", "Identificador único del insumo"],
        ["name", "VARCHAR(100)", "UNIQUE / NOT NULL", "Nombre técnico del ingrediente (ej. 'Harina de Trigo Extra')"],
        ["baseUnit", "BaseUnit (ENUM)", "NOT NULL", "Unidad base de control: LB (libras), ML (mililitros), UNIT (piezas)"],
        ["minStockAlert", "DECIMAL(12,3)", "NOT NULL", "Cantidad mínima en bodega antes de disparar alerta"]
    ]
    add_styled_table(doc, u_cols, rm_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 8: RawMaterialInventory
    add_h2(doc, "11.8 Tabla: RawMaterialInventory (Stock Físico de Insumos)")
    add_p(doc, "Propósito: Cuantifica las existencias actuales de materias primas en la bodega de la Matriz.")
    rmi_data = [
        ["id", "UUID", "PK", "Identificador de registro de stock de materia prima"],
        ["rawMaterialId", "UUID", "FK -> RawMaterial.id", "Insumo correspondiente"],
        ["branchId", "UUID", "FK -> Branch.id", "Sucursal física (generalmente Matriz)"],
        ["currentQuantity", "DECIMAL(12,3)", "NOT NULL", "Cantidad exacta disponible en unidades base"],
        ["lastUpdated", "TIMESTAMP", "NOT NULL / @updatedAt", "Momento del último consumo o recepción"]
    ]
    add_styled_table(doc, u_cols, rmi_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 9: Recipe & Table 10: RecipeIngredient
    add_h2(doc, "11.9 Tablas: Recipe y RecipeIngredient (Recetas Maestras)")
    add_p(doc, "Propósito: Especifica la formulación de amasijo y la proporción de insumos por cada tanda de producción.")
    rcp_data = [
        ["Recipe.id", "UUID", "PK", "Identificador único de la receta"],
        ["Recipe.productId", "UUID", "FK -> Product.id", "Producto terminado que se elabora"],
        ["Recipe.yieldQuantity", "INTEGER", "NOT NULL", "Piezas estándar producidas por cada amasijo base"],
        ["RecipeIngredient.recipeId", "UUID", "FK -> Recipe.id", "Receta madre"],
        ["RecipeIngredient.rawMaterialId", "UUID", "FK -> RawMaterial.id", "Insumo consumido en la formulación"],
        ["RecipeIngredient.amountRequired", "DECIMAL(12,3)", "NOT NULL", "Cantidad requerida expresada en la unidad base del insumo"]
    ]
    add_styled_table(doc, u_cols, rcp_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 11: ProductionLog
    add_h2(doc, "11.10 Tabla: ProductionLog (Bitácora de Horneado Diario)")
    add_p(doc, "Propósito: Registra cada tanda horneada en Matriz, capturando piezas logradas y mermas de horno.")
    pl_data = [
        ["id", "UUID", "PK", "Identificador único de la tanda"],
        ["branchId", "UUID", "FK -> Branch.id", "Sucursal donde se horneó (Matriz)"],
        ["productId", "UUID", "FK -> Product.id", "Variedad de pan horneada"],
        ["bakerId", "UUID", "FK -> User.id", "Maestro panadero responsable del turno"],
        ["unitsProduced", "INTEGER", "NOT NULL", "Cantidad de piezas aptas enviadas a mostrador"],
        ["unitsWasted", "INTEGER", "NOT NULL / default(0)", "Piezas quemadas, deformes o aplastadas en horno"],
        ["shift", "VARCHAR(20)", "NOT NULL", "Turno de producción: 'MATUTINO' o 'VESPERTINO'"],
        ["bakedAt", "TIMESTAMP", "NOT NULL / default(now())", "Hora exacta de salida del horno"]
    ]
    add_styled_table(doc, u_cols, pl_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 12: Inventory & Table 13: InventoryLot
    add_h2(doc, "11.11 Tablas: Inventory e InventoryLot (Stock y Control FEFO)")
    add_p(doc, "Propósito: Controla el saldo total de producto por sucursal y la descomposición en lotes con fecha de vencimiento.")
    inv_data = [
        ["Inventory.id", "UUID", "PK", "Identificador de inventario consolidado"],
        ["Inventory.productId", "UUID", "FK -> Product.id", "Producto almacenado"],
        ["Inventory.branchId", "UUID", "FK -> Branch.id", "Sucursal física donde se ubica el stock"],
        ["Inventory.currentStock", "INTEGER", "NOT NULL", "Existencia total disponible en vitrinas"],
        ["InventoryLot.id", "UUID", "PK", "Identificador único del lote FEFO"],
        ["InventoryLot.lotCode", "VARCHAR(40)", "NOT NULL", "Código de trazabilidad (ej. '#LOT-2026-092')"],
        ["InventoryLot.expirationDate", "DATE", "NOT NULL", "Fecha física de caducidad impresa en empaque"],
        ["InventoryLot.initialQuantity", "INTEGER", "NOT NULL", "Unidades recibidas al ingresar el lote"],
        ["InventoryLot.availableQuantity", "INTEGER", "NOT NULL", "Unidades remanentes por vender"]
    ]
    add_styled_table(doc, u_cols, inv_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 14: DailyClose & Table 15: DailyCloseItem
    add_h2(doc, "11.12 Tablas: DailyClose y DailyCloseItem (Arqueo Residual)")
    add_p(doc, "Propósito: Almacena los resultados del balance nocturno, efectivo físico, ventas calculadas y bloqueo de fecha.")
    dc_data = [
        ["DailyClose.id", "UUID", "PK", "Identificador único del cierre diario"],
        ["DailyClose.branchId", "UUID", "FK -> Branch.id", "Sucursal que efectúa el arqueo"],
        ["DailyClose.closeDate", "DATE", "NOT NULL", "Fecha operativa conciliada"],
        ["DailyClose.physicalCashCounted", "DECIMAL(12,2)", "NOT NULL", "Dinero en efectivo contado en cajón físico"],
        ["DailyClose.calculatedTotalSales", "DECIMAL(12,2)", "NOT NULL", "Venta total matemática arrojada por la fórmula residual"],
        ["DailyClose.cashDifference", "DECIMAL(12,2)", "NOT NULL", "Diferencia: Efectivo contado - Venta esperada"],
        ["DailyClose.isLocked", "BOOLEAN", "NOT NULL / default(true)", "Bloqueo estricto de base de datos contra edición"],
        ["DailyCloseItem.productId", "UUID", "FK -> Product.id", "Pan analizado en el cierre"],
        ["DailyCloseItem.initialStock", "INTEGER", "NOT NULL", "Inventario inicial al abrir el día"],
        ["DailyCloseItem.producedStock", "INTEGER", "NOT NULL", "Unidades horneadas / transferidas recibidas"],
        ["DailyCloseItem.finalPhysicalStock", "INTEGER", "NOT NULL", "Conteo físico ciego de piezas sobrantes"],
        ["DailyCloseItem.wasteStock", "INTEGER", "NOT NULL", "Mermas registradas durante la jornada"],
        ["DailyCloseItem.soldUnitsCalculated", "INTEGER", "NOT NULL", "Unidades vendidas: Inicial + Prod - Final - Merma"]
    ]
    add_styled_table(doc, u_cols, dc_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 16: Order & Table 17: OrderItem
    add_h2(doc, "11.13 Tablas: Order y OrderItem (Reservas y Pedidos Web)")
    add_p(doc, "Propósito: Gestiona los apartados en línea de clientes para retiro en mostrador y pago exclusivo en efectivo.")
    ord_data = [
        ["Order.id", "UUID", "PK", "Identificador único del pedido"],
        ["Order.orderCode", "VARCHAR(30)", "UNIQUE / NOT NULL", "Código amigable de comanda (ej. '#ORD-2026-089')"],
        ["Order.userId", "UUID", "FK -> User.id", "Cliente que solicitó el apartado"],
        ["Order.branchId", "UUID", "FK -> Branch.id", "Sucursal física donde se retira el pedido"],
        ["Order.status", "OrderStatus (ENUM)", "NOT NULL", "PENDING, CONFIRMED, READY, DELIVERED, CANCELLED, EXPIRED"],
        ["Order.totalAmount", "DECIMAL(10,2)", "NOT NULL", "Importe total a pagar en efectivo"],
        ["Order.pickupTime", "TIMESTAMP", "NOT NULL", "Hora comprometida para retiro físico"],
        ["OrderItem.orderId", "UUID", "FK -> Order.id / CASCADE", "Pedido al cual pertenecen las líneas de detalle"],
        ["OrderItem.productId", "UUID", "FK -> Product.id", "Producto reservado"],
        ["OrderItem.quantity", "INTEGER", "NOT NULL", "Unidades apartadas"],
        ["OrderItem.unitPrice", "DECIMAL(10,2)", "NOT NULL", "Precio unitario fijado al momento de la reserva"]
    ]
    add_styled_table(doc, u_cols, ord_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Table 18: AuditLog
    add_h2(doc, "11.14 Tabla: AuditLog (Bitácora Inmutable de Auditoría)")
    add_p(doc, "Propósito: Registra eventos de seguridad, cambios de precios y ejecuciones de arqueo para prevenir fraudes.")
    al_data = [
        ["id", "UUID", "PK", "Identificador del registro de auditoría"],
        ["userId", "UUID", "FK -> User.id (NULLABLE)", "Usuario que disparó la operación"],
        ["action", "VARCHAR(60)", "NOT NULL", "Verbo o evento: LOGIN, UPDATE_PRICE, DAILY_CLOSE, EXPIRE_ORDER"],
        ["entityName", "VARCHAR(60)", "NOT NULL", "Tabla o entidad afectada (ej. 'Product', 'DailyClose')"],
        ["entityId", "VARCHAR(60)", "NOT NULL", "Clave primaria del registro alterado"],
        ["payloadBefore", "JSONB", "NULLABLE", "Snapshot JSON de los datos previos a la modificación"],
        ["payloadAfter", "JSONB", "NULLABLE", "Snapshot JSON de los nuevos datos grabados"],
        ["ipAddress", "VARCHAR(45)", "NOT NULL", "Dirección IP pública o de red local de la petición"],
        ["userAgent", "TEXT", "NOT NULL", "Cadena descriptiva del navegador o cliente HTTP"],
        ["createdAt", "TIMESTAMP", "NOT NULL / default(now())", "Marca temporal inalterable generada por la base de datos"]
    ]
    add_styled_table(doc, u_cols, al_data, [Inches(1.5), Inches(1.3), Inches(1.8), Inches(1.9)])

    # Tables 19-33: Periféricas y Telegram
    add_h2(doc, "11.15 Tablas de Infraestructura, Notificaciones y Telegram (Tablas 19 a 33)")
    add_p(doc, "Las restantes 15 tablas del esquema de base de datos administran subsistemas de soporte:")
    
    sub_data = [
        ["19. TrustedDevice", "Almacena huellas de dispositivos seguros para prevenir accesos no autorizados a cuentas administrativas."],
        ["20. LoginAttempt", "Contabiliza intentos fallidos de inicio de sesión para activar bloqueos preventivos por fuerza bruta."],
        ["21. ProductPresentation", "Modela presentaciones comerciales de empaque (ej. bolsa de 10 bolillos, caja de repostería)."],
        ["22. InventoryLotConsumption", "Registra las unidades extraídas de cada lote FEFO al confirmarse un despacho en mostrador."],
        ["23. StockMovement", "Trazabilidad de movimientos físicos de panadería (Entrada por Horneado, Transferencia, Merma)."],
        ["24. SystemConfig", "Parámetros globales dinámicos (Tolerancia de retiro, monto de fondo fijo, límites de reserva)."],
        ["25. NotificationConfig", "Preferencias de canales de alerta por usuario (Telegram activo, correo activo, push activo)."],
        ["26. Notification", "Bandeja de notificaciones internas del sistema con estados de lectura."],
        ["27. PushSubscription", "Llaves criptográficas para el envío de notificaciones WebPush hacia navegadores autorizados."],
        ["28. AssistantAccess", "Control de permisos para interacción con el asistente inteligente de consultas operativas."],
        ["29. TelegramLink", "Vinculación entre el identificador de usuario del sistema y el Chat ID de Telegram."],
        ["30. TelegramLinkToken", "Tokens temporales de un solo uso (OTP) para enlazar el teléfono celular con el bot."],
        ["31. TelegramUpdate", "Cola de mensajes entrantes recibidos mediante el Webhook oficial de Telegram."],
        ["32. TelegramLinkAttempt", "Bitácora de seguridad de intentos de enlace al bot para prevenir secuestro de alertas."],
        ["33. AlertState", "Máquina de estados para evitar reenvío spam de alertas repetitivas de stock bajo o caducidad."]
    ]
    add_styled_table(doc, ["Tabla / Entidad", "Descripción y Rol Operativo en la Plataforma"], sub_data, [Inches(2.2), Inches(4.3)])

    # -------------------------------------------------------------
    # CAPÍTULO 12: INTEGRIDAD TRANSACCIONAL Y ACID
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 12: INTEGRIDAD TRANSACCIONAL Y GARANTÍAS ACID", page_break_before=True)
    add_p(doc, "La consistencia financiera de Panadería Svetlana se asegura a nivel de motor de base de datos mediante transacciones atómicas Prisma ($transaction) en PostgreSQL con nivel de aislamiento READ COMMITTED:")
    
    add_bullet(doc, "En el Cierre Diario, la inserción del encabezado DailyClose, los N registros de DailyCloseItem y la actualización de saldos en Inventory se ejecutan en una sola transacción atómica. Si falla un solo ítem, la operación completa efectúa un ROLLBACK instantáneo sin corromper la caja.", bold_prefix="Atomicidad (Atomicity):")
    add_bullet(doc, "Las restricciones CHECK y FOREIGN KEY garantizan que nunca exista una venta sin sucursal válida o un lote FEFO con cantidad negativa.", bold_prefix="Consistencia (Consistency):")
    add_bullet(doc, "Al generarse reservas simultáneas sobre el mismo stock de pan en vitrina, el motor bloquea las filas involucradas evitando inconsistencias de doble apartado.", bold_prefix="Aislamiento (Isolation):")
    add_bullet(doc, "Una vez que una transacción retorna éxito, los registros quedan persistidos en el Write-Ahead Log (WAL) de PostgreSQL, inmunes a caídas súbitas del servidor.", bold_prefix="Durabilidad (Durability):")

    # -------------------------------------------------------------
    # CAPÍTULO 13: ARQUITECTURA DE SEGURIDAD
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 13: ARQUITECTURA DE SEGURIDAD Y CRIPTOGRAFÍA")
    add_p(doc, "El sistema adopta el principio de Defensa en Profundidad (Defense in Depth), articulando múltiples barreras:")
    add_bullet(doc, "Las contraseñas de usuarios se procesan con Bcrypt utilizando un factor de costo computacional (salt rounds) de 12.", bold_prefix="1. Hashing Criptográfico:")
    add_bullet(doc, "El Access Token se firma con el algoritmo HMAC-SHA256 (secreto de 256 bits) y posee una validez estricta de 15 minutos.", bold_prefix="2. Tokens de Acceso Efímeros:")
    add_bullet(doc, "El Refresh Token viaja encapsulado en una cookie HttpOnly con directiva SameSite=Strict y flag Secure, impidiendo su lectura por scripts maliciosos de JavaScript.", bold_prefix="3. Cookies HttpOnly Blindadas:")
    add_bullet(doc, "Integración de cabeceras HTTP de seguridad (Content Security Policy, X-Frame-Options, X-Content-Type-Options) mediante el middleware Helmet.", bold_prefix="4. Hardening de Cabeceras:")

    # =============================================================
    # SUBDIVISIÓN 2: MANUAL DE INSTALACIÓN Y DESPLIEGUE
    # =============================================================
    part2_topics = [
        ("Capítulo 14: Requisitos de Hardware", "Especificaciones de servidores para desarrollo, pruebas y producción", "DevOps y SysAdmins"),
        ("Capítulo 15: Diccionario de Variables .env", "Matriz completa de variables de entorno frontend y backend", "DevOps y Desarrolladores"),
        ("Capítulo 16: Instalación en Local", "Guía paso a paso para clonar, instalar paquetes y levantar entorno", "Desarrolladores"),
        ("Capítulo 17: Migraciones con Prisma", "Flujo de prisma migrate dev, reset y ejecución de seeders", "DBAs y Backend"),
        ("Capítulo 18: Docker y Docker Compose", "Configuración de contenedores, Dockerfiles y orquestación", "DevOps Specialists"),
        ("Capítulo 19: Builds de Producción", "Compilación optimizada en Next.js y empaquetado dist/ en NestJS", "DevOps y QA"),
        ("Capítulo 20: Despliegue en Cloud", "Arquitectura en Vercel, Render y base de datos administrada", "DevOps y SysAdmins"),
        ("Capítulo 21: Pipelines CI/CD", "Integración y entrega continua mediante GitHub Actions", "DevOps y Release Manager")
    ]
    add_divider_cover(
        doc,
        part_number="II",
        part_title="MANUAL DE INSTALACIÓN, CONFIGURACIÓN Y DESPLIEGUE",
        part_subtitle="Guía de Aprovisionamiento de Infraestructura, Contenedorización con Docker, Variables de Entorno y Pipelines CI/CD",
        description="Esta subdivisión provee todas las instrucciones técnicas necesarias para compilar, configurar y desplegar la plataforma Panadería Svetlana desde cero. Cubre el aprovisionamiento de servidores locales de desarrollo, la orquestación en contenedores Docker y el despliegue profesional en plataformas PaaS de nube.",
        topics_list=part2_topics
    )

    # -------------------------------------------------------------
    # CAPÍTULO 14: REQUISITOS DE HARDWARE Y SOFTWARE
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 14: REQUISITOS DE HARDWARE Y SOFTWARE")
    add_p(doc, "Para asegurar un desempeño óptimo y prevenir cuellos de botella en la compilación y ejecución de servicios, se definen los siguientes perfiles de hardware:")
    
    hw_headers = ["Componente", "Entorno Local (Desarrollo)", "Servidor de Producción (VPS / Cloud)", "Requisitos de Software Obligatorios"]
    hw_rows = [
        ["Procesador (CPU)", "4 núcleos (2.0 GHz o superior)", "2 vCPU dedicadas (PaaS/VPS)", "Node.js v20.12+ LTS (Active LTS)"],
        ["Memoria RAM", "8 GB mínimo (16 GB recomendado)", "2 GB RAM para API + 1 GB para DB", "npm v10+ o pnpm v9+"],
        ["Almacenamiento", "20 GB libres (SSD NVMe)", "25 GB SSD de alta velocidad", "PostgreSQL v15.x o v16.x"],
        ["Sistema Operativo", "Windows 11 / macOS 14 / Ubuntu 22+", "Ubuntu Server 22.04 LTS / Debian 12", "Git v2.40+ y Docker Engine 24+"],
        ["Conectividad", "Conexión a internet banda ancha", "IP pública fija / DNS administrado", "Certificados SSL/TLS (Let's Encrypt)"]
    ]
    add_styled_table(doc, hw_headers, hw_rows, [Inches(1.3), Inches(1.8), Inches(1.8), Inches(1.6)])

    # -------------------------------------------------------------
    # CAPÍTULO 15: DICCIONARIO DE VARIABLES DE ENTORNO
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 15: DICCIONARIO MAESTRO DE VARIABLES DE ENTORNO (.ENV)", page_break_before=True)
    add_p(doc, "Todas las configuraciones dependientes del entorno se gestionan mediante variables de entorno estandarizadas. A continuación se describe cada una de ellas para el Backend (api/.env) y Frontend (web/.env.local):")
    
    env_headers = ["Variable de Entorno", "Ubicación", "Ejemplo en Producción", "Descripción y Reglas de Seguridad"]
    env_rows = [
        ["PORT", "api/.env", "3001", "Puerto TCP donde escucha el servidor HTTP de NestJS."],
        ["DATABASE_URL", "api/.env", "postgresql://user:pass@host:5432/db", "Cadena de conexión con pooler transaccional a PostgreSQL."],
        ["DIRECT_URL", "api/.env", "postgresql://user:pass@host:5432/db", "Conexión directa (sin pooler) requerida para Prisma Migrations."],
        ["JWT_ACCESS_SECRET", "api/.env", "secret_256_bit_aleatorio_seguro", "Clave criptográfica para firma de Access Tokens JWT."],
        ["JWT_REFRESH_SECRET", "api/.env", "secret_refresh_256_bit_distinto", "Clave criptográfica para firma de Refresh Tokens."],
        ["CORS_ORIGINS", "api/.env", "https://panaderia.com,http://localhost:3000", "Lista separada por comas de orígenes permitidos en CORS."],
        ["TELEGRAM_BOT_TOKEN", "api/.env", "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ", "Token de autenticación emitido por BotFather en Telegram."],
        ["TELEGRAM_CHAT_ID", "api/.env", "-1001234567890", "Identificador de chat o canal institucional para alertas."],
        ["NEXT_PUBLIC_API_URL", "web/.env.local", "https://api.panaderia.com/api/v1", "URL base pública consumida por el frontend en Next.js."],
        ["NEXT_PUBLIC_APP_URL", "web/.env.local", "https://panaderia.com", "Dominio canónico de la aplicación para enlaces SEO."],
        ["NODE_ENV", "Ambos", "production", "Entorno de ejecución: 'development', 'test' o 'production'."]
    ]
    add_styled_table(doc, env_headers, env_rows, [Inches(1.8), Inches(1.0), Inches(1.8), Inches(1.9)])

    # -------------------------------------------------------------
    # CAPÍTULO 16: INSTALACIÓN EN LOCAL
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 16: PUESTA EN MARCHA EN ENTORNO DE DESARROLLO LOCAL")
    add_p(doc, "Secuencia de comandos para preparar y ejecutar el proyecto en una máquina de desarrollo:")
    
    add_h2(doc, "16.1 Paso 1: Clonación del Repositorio y Dependencias")
    add_code_block(doc, 
        "# 1. Clonar el repositorio desde GitHub\n"
        "git clone https://github.com/wilsoon77/proyecto-panaderia.git\n"
        "cd proyecto-panaderia\n\n"
        "# 2. Instalar dependencias del Backend API\n"
        "cd api && npm install\n\n"
        "# 3. Instalar dependencias del Frontend Web\n"
        "cd ../web && npm install"
    )

    add_h2(doc, "16.2 Paso 2: Configuración de Base de Datos y Migraciones")
    add_code_block(doc, 
        "# Desde la carpeta api/\n"
        "cp .env.example .env\n"
        "# Configurar las credenciales de PostgreSQL en .env\n\n"
        "# Ejecutar migraciones de Prisma y generar el cliente tipado\n"
        "npx prisma migrate dev --name init\n"
        "npx prisma generate\n\n"
        "# Ejecutar el seeder con datos base (Sucursales Matriz/Secundaria y usuario Admin)\n"
        "npm run prisma:seed"
    )

    add_h2(doc, "16.3 Paso 3: Ejecución de Servidores en Desarrollo")
    add_code_block(doc, 
        "# Terminal 1: Backend NestJS (Puerto 3001)\n"
        "cd api && npm run start:dev\n\n"
        "# Terminal 2: Frontend Next.js (Puerto 3000)\n"
        "cd web && npm run dev"
    )

    # -------------------------------------------------------------
    # CAPÍTULO 17: MIGRACIONES CON PRISMA
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 17: GESTIÓN DE MIGRACIONES Y SEEDERS CON PRISMA")
    add_p(doc, "El ciclo de vida del esquema de base de datos se administra estrictamente con Prisma Migrate. Queda terminantemente prohibido alterar tablas o columnas manualmente mediante sentencias SQL directas en clientes gráficos sin generar el archivo de migración correspondiente.")
    
    add_bullet(doc, "Aplica cambios detectados en schema.prisma, crea un archivo SQL numerado en prisma/migrations y actualiza la tabla _prisma_migrations.", bold_prefix="npx prisma migrate dev:")
    add_bullet(doc, "Comando exclusivo para entornos de producción y CI/CD. Aplica únicamente las migraciones pendientes sin generar archivos ni interactuar con la consola.", bold_prefix="npx prisma migrate deploy:")
    add_bullet(doc, "Inspecciona una base de datos preexistente y sincroniza el schema.prisma de manera no destructiva.", bold_prefix="npx prisma db pull:")

    # -------------------------------------------------------------
    # CAPÍTULO 18: DOCKER Y DOCKER COMPOSE
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 18: CONTENEDORIZACIÓN CON DOCKER Y DOCKER COMPOSE", page_break_before=True)
    add_p(doc, "Para garantizar la paridad exacta entre desarrollo y producción, el proyecto incluye manifiestos Docker optimizados con compilación en múltiples etapas (Multi-stage Builds):")
    
    add_h2(doc, "18.1 Archivo de Orquestación docker-compose.yml")
    add_code_block(doc,
        "version: '3.8'\n"
        "services:\n"
        "  postgres:\n"
        "    image: postgres:15-alpine\n"
        "    container_name: svetlana-db\n"
        "    environment:\n"
        "      POSTGRES_USER: panaderia_admin\n"
        "      POSTGRES_PASSWORD: super_secure_db_password_2026\n"
        "      POSTGRES_DB: panaderia_db\n"
        "    ports:\n"
        "      - '5432:5432'\n"
        "    volumes:\n"
        "      - postgres_data:/var/lib/postgresql/data\n"
        "    restart: unless-stopped\n\n"
        "  backend:\n"
        "    build:\n"
        "      context: ./api\n"
        "      dockerfile: Dockerfile\n"
        "    container_name: svetlana-api\n"
        "    ports:\n"
        "      - '3001:3001'\n"
        "    depends_on:\n"
        "      - postgres\n"
        "    restart: unless-stopped\n\n"
        "  frontend:\n"
        "    build:\n"
        "      context: ./web\n"
        "      dockerfile: Dockerfile\n"
        "    container_name: svetlana-web\n"
        "    ports:\n"
        "      - '3000:3000'\n"
        "    depends_on:\n"
        "      - backend\n"
        "    restart: unless-stopped\n\n"
        "volumes:\n"
        "  postgres_data:"
    )

    # -------------------------------------------------------------
    # CAPÍTULO 19: BUILDS DE PRODUCCIÓN
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 19: ESTRATEGIA DE COMPILACIÓN Y BUILDS DE PRODUCCIÓN")
    add_p(doc, "Antes de desplegar cualquier cambio a producción, el código debe someterse a la regla inquebrantable de Cero Tolerancia a Código Roto:")
    add_bullet(doc, "Compila el código TypeScript a JavaScript en dist/, verifica la ausencia de tipos inseguros y empaqueta las dependencias optimizadas.", bold_prefix="cd api && npm run build:")
    add_bullet(doc, "Ejecuta el compilador Next.js, minifica CSS/JS, optimiza fuentes e imágenes y genera las páginas estáticas pre-renderizadas.", bold_prefix="cd web && npm run build:")

    # -------------------------------------------------------------
    # CAPÍTULO 20: DESPLIEGUE EN CLOUD
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 20: DESPLIEGUE EN PLATAFORMAS CLOUD (VERCEL Y RENDER)")
    add_p(doc, "La plataforma está desacoplada en proveedores especializados:")
    add_bullet(doc, "Aloja la capa Next.js conectada automáticamente al repositorio en GitHub. Despliega con zero-downtime en cada push a main.", bold_prefix="Vercel (Frontend):")
    add_bullet(doc, "Aloja el Web Service NestJS en contenedor Docker con auto-deploy y healthchecks automáticos.", bold_prefix="Render (Backend API):")
    add_bullet(doc, "Instancia PostgreSQL administrada con copias de seguridad automáticas y pooler transaccional.", bold_prefix="Supabase / Neon (Base de Datos):")

    # -------------------------------------------------------------
    # CAPÍTULO 21: PIPELINE CI/CD CON GITHUB ACTIONS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 21: INTEGRACIÓN Y ENTREGA CONTINUA (CI/CD)")
    add_p(doc, "El flujo de automatización se rige por un workflow de GitHub Actions (.github/workflows/deploy.yml) que valida la calidad antes de cualquier liberación a producción:")
    add_bullet(doc, "Ejecución de ESLint y verificación estricta de tipos con TypeScript (tsc --noEmit).", bold_prefix="Fase 1 (Linters & Typecheck):")
    add_bullet(doc, "Ejecución de pruebas unitarias en Jest (npm test) con umbral mínimo de cobertura.", bold_prefix="Fase 2 (Pruebas Automatizadas):")
    add_bullet(doc, "Compilación cruzada de frontend y backend en entornos de contenedor limpios.", bold_prefix="Fase 3 (Build Verification):")
    add_bullet(doc, "Si todas las fases anteriores resultan en PASS, se dispara el webhook de despliegue a producción.", bold_prefix="Fase 4 (Automated Release):")

    # =============================================================
    # SUBDIVISIÓN 3: MANUAL DE INTEGRACIÓN / API REST
    # =============================================================
    part3_topics = [
        ("Capítulo 22: Estándares REST", "Versionamiento v1, nomenclatura camelCase y paginación", "Desarrolladores e Integradores"),
        ("Capítulo 23: Protocolo JWT", "Flujo de Bearer token, cabeceras y refresh token rotation", "Desarrolladores"),
        ("Capítulo 24: Catálogo de Endpoints", "Especificación exhaustiva de los 20 módulos y controladores", "Backend e Integradores"),
        ("Capítulo 25: Ejemplos de Consumo", "Comandos cURL reales y fragmentos de código Fetch / Axios", "Desarrolladores"),
        ("Capítulo 26: Webhooks Externos", "Integración con Telegram Bot API y notificaciones WebPush", "Integradores y Backend"),
        ("Capítulo 27: Manejo de Errores", "Estructura unificada de excepciones bajo estándar RFC 7807", "Todos los Desarrolladores")
    ]
    add_divider_cover(
        doc,
        part_number="III",
        part_title="MANUAL DE INTEGRACIÓN Y ESPECIFICACIÓN DE API REST",
        part_subtitle="Contratos de Integración, Catálogo de 20 Controladores, Modelos DTO, Schemas JSON y Ejemplos cURL",
        description="Esta sección constituye la referencia canónica de integración para desarrolladores internos y externos. Documenta la totalidad de los endpoints expuestos por el backend NestJS, sus métodos HTTP, permisos requeridos, parámetros de consulta, cuerpos de solicitud DTO y respuestas estructuradas.",
        topics_list=part3_topics
    )

    # -------------------------------------------------------------
    # CAPÍTULO 22: ESTÁNDARES Y CONVENCIONES REST
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 22: ESTÁNDARES Y CONVENCIONES DE LA API REST")
    add_p(doc, "La API de Panadería Svetlana sigue fielmente los principios de diseño RESTful:")
    add_bullet(doc, "Todos los endpoints se encuentran prefijados bajo la ruta base /api/v1/.", bold_prefix="1. Versionamiento Explícito:")
    add_bullet(doc, "Todas las propiedades de entrada y salida utilizan formato camelCase consistente.", bold_prefix="2. Nomenclatura JSON:")
    add_bullet(doc, "Los listados masivos implementan parámetros query estándar (?page=1&limit=20&sort=createdAt:desc).", bold_prefix="3. Paginación Determinista:")
    add_bullet(doc, "Uso canónico de verbos GET (lectura), POST (creación), PUT/PATCH (actualización) y DELETE (baja lógica).", bold_prefix="4. Métodos HTTP:")

    # -------------------------------------------------------------
    # CAPÍTULO 23: PROTOCOLO DE AUTENTICACIÓN JWT
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 23: PROTOCOLO DE AUTENTICACIÓN Y CONSUMO DE ENDPOINTS")
    add_p(doc, "Para consumir endpoints protegidos, el cliente HTTP debe incluir el Access Token JWT en la cabecera estándar:")
    add_code_block(doc, "Authorization: Bearer <eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...>")
    add_p(doc, "Si el token ha expirado o es inválido, el servidor responde con HTTP 401 Unauthorized:")
    add_code_block(doc,
        "{\n"
        '  "statusCode": 401,\n'
        '  "message": "Token de acceso expirado o inválido. Solicite renovación mediante /auth/refresh.",\n'
        '  "error": "Unauthorized",\n'
        '  "timestamp": "2026-10-23T12:00:00.000Z",\n'
        '  "path": "/api/v1/orders"\n'
        "}"
    )

    # -------------------------------------------------------------
    # CAPÍTULO 24: CATÁLOGO EXHAUSTIVO DE ENDPOINTS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 24: CATÁLOGO EXHAUSTIVO DE ENDPOINTS (LOS 20 MÓDULOS)", page_break_before=True)
    add_p(doc, "A continuación se documentan formalmente los 20 módulos y controladores expuestos por el backend de Panadería Svetlana:")

    # 1. Auth Module
    add_h2(doc, "24.1 Módulo de Autenticación (/api/v1/auth)")
    add_p(doc, "Gestiona el ciclo de vida de sesiones, login, registro y rotación de tokens.")
    auth_ep = [
        ["Método", "Ruta del Endpoint", "Permiso / Rol", "Descripción del Contrato"],
        ["POST", "/auth/login", "Público", "Valida credenciales (email/pass) y emite par de tokens JWT."],
        ["POST", "/auth/register", "Público", "Registra un nuevo cliente con rol CUSTOMER."],
        ["POST", "/auth/refresh", "Público (Cookie)", "Renueva el Access Token a partir de la cookie HttpOnly de refresco."],
        ["POST", "/auth/logout", "Autenticado", "Invalida el refresh token activo en base de datos y borra cookies."],
        ["GET", "/auth/me", "Autenticado", "Retorna la información del perfil del usuario actualmente en sesión."]
    ]
    add_styled_table(doc, auth_ep[0], auth_ep[1:], [Inches(1.0), Inches(1.8), Inches(1.4), Inches(2.3)])

    # 2. Users Module
    add_h2(doc, "24.2 Módulo de Usuarios (/api/v1/users)")
    add_p(doc, "Administración de personal operativo, roles y asignación de sucursales.")
    usr_ep = [
        ["Método", "Ruta del Endpoint", "Permiso / Rol", "Descripción del Contrato"],
        ["GET", "/users", "ADMIN", "Listado paginado de usuarios con filtros por rol y sucursal."],
        ["POST", "/users", "ADMIN", "Crea una nueva cuenta de empleado (CASHIER o BAKER)."],
        ["GET", "/users/:id", "ADMIN", "Obtiene el detalle completo de un colaborador específico."],
        ["PATCH", "/users/:id", "ADMIN", "Actualiza rol, sucursal o estado activo de un usuario."],
        ["DELETE", "/users/:id", "ADMIN", "Baja lógica de usuario (desactivación preventiva)."]
    ]
    add_styled_table(doc, usr_ep[0], usr_ep[1:], [Inches(1.0), Inches(1.8), Inches(1.4), Inches(2.3)])

    # 3. Branches Module
    add_h2(doc, "24.3 Módulo de Sucursales (/api/v1/branches)")
    add_p(doc, "Control de sedes físicas (Matriz y Secundaria).")
    br_ep = [
        ["Método", "Ruta del Endpoint", "Permiso / Rol", "Descripción del Contrato"],
        ["GET", "/branches", "Público", "Listado público de sucursales con dirección y horarios."],
        ["GET", "/branches/:id", "Público", "Detalle específico de una sucursal."],
        ["POST", "/branches", "ADMIN", "Alta de nueva sucursal en el sistema."],
        ["PATCH", "/branches/:id", "ADMIN", "Modificación de datos de contacto u horarios de apertura."]
    ]
    add_styled_table(doc, br_ep[0], br_ep[1:], [Inches(1.0), Inches(1.8), Inches(1.4), Inches(2.3)])

    # 4. Products & Categories Module
    add_h2(doc, "24.4 Módulos de Productos y Categorías (/api/v1/products, /api/v1/categories)")
    add_p(doc, "Administración del catálogo maestro, fichas técnicas y familias de pan.")
    prod_ep = [
        ["Método", "Ruta del Endpoint", "Permiso / Rol", "Descripción del Contrato"],
        ["GET", "/products", "Público", "Catálogo público con filtros por categoría, búsqueda y paginación."],
        ["GET", "/products/:slug", "Público", "Ficha técnica completa de un pan por su identificador slug."],
        ["POST", "/products", "ADMIN", "Creación de nuevo producto en catálogo con precio base."],
        ["PATCH", "/products/:id", "ADMIN", "Actualización de precio, alérgenos o descripción de producto."],
        ["GET", "/categories", "Público", "Listado de familias de pan para menú de navegación."]
    ]
    add_styled_table(doc, prod_ep[0], prod_ep[1:], [Inches(1.0), Inches(1.8), Inches(1.4), Inches(2.3)])

    # 5. Production & Raw Materials
    add_h2(doc, "24.5 Módulos de Producción y Materias Primas (/api/v1/production, /api/v1/raw-materials)")
    add_p(doc, "Registro de horneado en Matriz y control de insumos de panadería.")
    prm_ep = [
        ["Método", "Ruta del Endpoint", "Permiso / Rol", "Descripción del Contrato"],
        ["POST", "/production", "BAKER / ADMIN", "Registra una nueva tanda de pan horneado y deduce materias primas."],
        ["GET", "/production/today", "BAKER / ADMIN", "Resumen de piezas horneadas durante la jornada por turno."],
        ["GET", "/raw-materials", "ADMIN / BAKER", "Consulta de existencias actuales de harina, azúcar y grasas."],
        ["POST", "/raw-materials/receive", "ADMIN", "Registra la recepción física de compra de insumos en bodega."]
    ]
    add_styled_table(doc, prm_ep[0], prm_ep[1:], [Inches(1.0), Inches(2.1), Inches(1.4), Inches(2.0)])

    # 6. Inventory & Batches FEFO
    add_h2(doc, "24.6 Módulo de Inventario y Lotes FEFO (/api/v1/inventory)")
    add_p(doc, "Control de existencias por vitrina y trazabilidad de perecederos.")
    inv_ep = [
        ["Método", "Ruta del Endpoint", "Permiso / Rol", "Descripción del Contrato"],
        ["GET", "/inventory/:branchId", "STAFF / ADMIN", "Stock consolidado en vitrina por sucursal física."],
        ["GET", "/inventory/lots/alerts", "ADMIN / STAFF", "Listado de lotes en semáforo amarillo y rojo por caducidad."],
        ["POST", "/inventory/lots", "ADMIN", "Alta de nuevo lote FEFO de producto de reventa recibido."],
        ["POST", "/inventory/lots/:id/waste", "ADMIN", "Descarte formal de piezas vencidas y registro de merma."]
    ]
    add_styled_table(doc, inv_ep[0], inv_ep[1:], [Inches(1.0), Inches(2.1), Inches(1.4), Inches(2.0)])

    # 7. Orders Module
    add_h2(doc, "24.7 Módulo de Pedidos y Reservas (/api/v1/orders)")
    add_p(doc, "Gestión de pedidos web, apartados de clientes y despacho cash en mostrador.")
    ord_ep = [
        ["Método", "Ruta del Endpoint", "Permiso / Rol", "Descripción del Contrato"],
        ["POST", "/orders", "CUSTOMER", "Crea una nueva reserva web con retiro en sucursal."],
        ["GET", "/orders/my-orders", "CUSTOMER", "Historial de reservas tramitadas por el cliente autenticado."],
        ["GET", "/orders/branch/:branchId", "CASHIER / ADMIN", "Listado de pedidos del día para despacho en mostrador."],
        ["PATCH", "/orders/:id/deliver", "CASHIER / ADMIN", "Confirma cobro en efectivo y entrega del producto."],
        ["PATCH", "/orders/:id/cancel", "CUSTOMER / ADMIN", "Cancela una reserva pendiente y libera el pan al mostrador."]
    ]
    add_styled_table(doc, ord_ep[0], ord_ep[1:], [Inches(1.0), Inches(2.1), Inches(1.4), Inches(2.0)])

    # 8. Daily Close Module
    add_h2(doc, "24.8 Módulo de Cierre Diario (/api/v1/daily-close)")
    add_p(doc, "Ejecución del algoritmo residual, cuadre de caja y bloqueo de jornada.")
    dc_ep = [
        ["Método", "Ruta del Endpoint", "Permiso / Rol", "Descripción del Contrato"],
        ["POST", "/daily-close/reconcile", "ADMIN", "Calcula el balance residual ciego a partir del conteo físico."],
        ["POST", "/daily-close/lock", "ADMIN", "Bloquea formalmente la fecha operativa contra modificaciones."],
        ["GET", "/daily-close/history", "ADMIN", "Histórico de cierres diarios y diferencias de efectivo auditadas."]
    ]
    add_styled_table(doc, dc_ep[0], dc_ep[1:], [Inches(1.0), Inches(2.1), Inches(1.4), Inches(2.0)])

    # 9-20. Remaining Modules
    add_h2(doc, "24.9 Módulos Restantes del Sistema (Auditoría, Telegram, Notificaciones, Métricas, Salud)")
    add_p(doc, "Endpoints de observabilidad, mensajería y gobernanza:")
    rest_ep = [
        ["Módulo", "Ruta Base", "Método", "Permiso", "Propósito"],
        ["Audit", "/audit/logs", "GET", "ADMIN", "Consulta de eventos inmutables de auditoría con filtros por fecha y actor."],
        ["Telegram", "/telegram/webhook", "POST", "Público", "Webhook oficial de Telegram para procesar comandos interactivos."],
        ["Telegram", "/telegram/link", "POST", "ADMIN", "Genera código OTP para vincular celular directivo con el bot."],
        ["Notifications", "/notifications", "GET", "Autenticado", "Bandeja de avisos del sistema para el usuario."],
        ["Notifications", "/notifications/push", "POST", "Autenticado", "Registro de llaves públicas WebPush en navegador."],
        ["Metrics", "/metrics/dashboard", "GET", "ADMIN", "Cálculo en tiempo real de KPIs para el panel administrativo."],
        ["Health", "/health", "GET", "Público", "Healthcheck general del servicio HTTP (status: 'ok')."],
        ["Health", "/health/db", "GET", "Público", "Verificación de latencia y conectividad con la base de datos PostgreSQL."],
        ["Storage", "/storage/upload", "POST", "ADMIN", "Carga de imágenes de productos con compresión WebP."],
        ["System Config", "/system-config", "GET / PATCH", "ADMIN", "Lectura y actualización de parámetros globales del negocio."]
    ]
    add_styled_table(doc, rest_ep[0], rest_ep[1:], [Inches(1.1), Inches(1.5), Inches(0.8), Inches(1.0), Inches(2.1)])

    # -------------------------------------------------------------
    # CAPÍTULO 25: EJEMPLOS DE CONSUMO CON CURL
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 25: EJEMPLOS DE CONSUMO DE LA API CON CURL Y FETCH", page_break_before=True)
    add_p(doc, "Ejemplos prácticos para validación de contratos desde consola:")
    
    add_h2(doc, "25.1 Autenticación de Usuario (Login)")
    add_code_block(doc,
        "curl -X POST https://api.panaderia.com/api/v1/auth/login \\\n"
        "  -H 'Content-Type: application/json' \\\n"
        "  -d '{\n"
        '    "email": "cajero.matriz@panaderia.com",\n'
        '    "password": "PasswordSeguro2026!"\n'
        "  }'"
    )

    add_h2(doc, "25.2 Registro de Tanda de Pan Horneado")
    add_code_block(doc,
        "curl -X POST https://api.panaderia.com/api/v1/production \\\n"
        "  -H 'Authorization: Bearer <TOKEN_DE_PANADERO>' \\\n"
        "  -H 'Content-Type: application/json' \\\n"
        "  -d '{\n"
        '    "productId": "8f3b2e1a-4d5c-6b7a-8c9d-0e1f2a3b4c5d",\n'
        '    "unitsProduced": 120,\n'
        '    "unitsWasted": 4,\n'
        '    "shift": "MATUTINO"\n'
        "  }'"
    )

    add_h2(doc, "25.3 Confirmación de Despacho en Mostrador")
    add_code_block(doc,
        "curl -X PATCH https://api.panaderia.com/api/v1/orders/550e8400-e29b-41d4-a716-446655440000/deliver \\\n"
        "  -H 'Authorization: Bearer <TOKEN_DE_CAJERO>' \\\n"
        "  -H 'Content-Type: application/json' \\\n"
        "  -d '{\n"
        '    "cashReceived": 200.00,\n'
        '    "cashChange": 15.00\n'
        "  }'"
    )

    # -------------------------------------------------------------
    # CAPÍTULO 26: INTEGRACIÓN DE WEBHOOKS EXTERNOS
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 26: INTEGRACIÓN DE WEBHOOKS EXTERNOS (TELEGRAM)")
    add_p(doc, "El backend expone un endpoint seguro (/api/v1/telegram/webhook) configurado en los servidores de Telegram:")
    add_bullet(doc, "Cada mensaje recibido incluye la cabecera x-telegram-bot-api-secret-token para certificar su legitimidad antes de procesarse.", bold_prefix="Seguridad de Webhook:")
    add_bullet(doc, "La petición se responde inmediatamente con HTTP 200 OK y el procesamiento del comando se delega a un servicio en segundo plano para evitar reintentos de Telegram.", bold_prefix="Respuesta Asíncrona:")

    # -------------------------------------------------------------
    # CAPÍTULO 27: FORMATO UNIFICADO DE ERRORES (RFC 7807)
    # -------------------------------------------------------------
    add_h1(doc, "CAPÍTULO 27: ESTÁNDAR UNIFICADO DE ERRORES HTTP (RFC 7807)")
    add_p(doc, "Todas las excepciones lanzadas por el backend son interceptadas por un filtro global (HttpExceptionFilter) que serializa el error en un JSON predecible:")
    
    add_code_block(doc,
        "{\n"
        '  "statusCode": 409,\n'
        '  "message": "Stock insuficiente: solo existen 3 piezas disponibles en la sucursal seleccionada.",\n'
        '  "error": "Conflict",\n'
        '  "timestamp": "2026-10-23T12:00:00.000Z",\n'
        '  "path": "/api/v1/orders"\n'
        "}"
    )

    # Output path
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__)))
    output_path = os.path.join(out_dir, "MANUAL_2_TECNICO_Y_DESARROLLO.docx")
    doc.save(output_path)
    print(f"Manual 2 guardado exitosamente en: {output_path}")
    return output_path

if __name__ == "__main__":
    build_manual_2()
