# Catálogo de Diagramas de Arquitectura y UML — Panadería Svetlana

> Este directorio contiene los diagramas oficiales de arquitectura, base de datos y modelado UML del sistema **Panadería Svetlana**, generados con formato visual de alta legibilidad técnica (vectorial SVG + HTML interactivo autocontenido) y sus correspondientes documentos académicos para memoria de tesis en formato APA 7.ª edición.

---

## 📑 Documentación Académica para Memoria de Tesis

1. 👉 **[DOCUMENTACION_CONTEXTO_SISTEMA_TESIS.md](DOCUMENTACION_CONTEXTO_SISTEMA_TESIS.md)**: Especificación formal del Diagrama de Contexto del Sistema (Nivel 0), frontera del software, matriz de flujos de entrada/salida y subsistemas internos.
2. 👉 **[DOCUMENTACION_MODELO_ENTIDAD_RELACION_TESIS.md](DOCUMENTACION_MODELO_ENTIDAD_RELACION_TESIS.md)**: Especificación formal del Modelo Entidad-Relación (MER) del **Núcleo de Negocio (Core Transaccional)** con sus 18 tablas, cardinalidades y reglas operativas.
3. 👉 **[DOCUMENTACION_SOPORTE_AUDITORIA_TESIS.md](DOCUMENTACION_SOPORTE_AUDITORIA_TESIS.md)**: Especificación formal del Diagrama Relacional de **Soporte, Seguridad, Auditoría y Notificaciones**, explicando la separación por capas y las 14 tablas de infraestructura.
4. 👉 **[DOCUMENTACION_CASOS_DE_USO_TESIS.md](DOCUMENTACION_CASOS_DE_USO_TESIS.md)**: Especificación de los 6 procesos de casos de uso (CU-01 a CU-06), tablas técnicas de casos de uso, relaciones `«include»` / `«extend»`, reglas de negocio y figuras en formato APA 7.
5. 👉 **[DOCUMENTACION_DIAGRAMAS_UML_TESIS.md](DOCUMENTACION_DIAGRAMAS_UML_TESIS.md)**: Especificación técnica y académica de los 6 Diagramas UML (Clases, Secuencia, Estados, Actividades, Colaboración y Componentes), principios SOLID, patrones transaccionales ACID y topología de IA.

---

## 🌐 1. Diagrama de Contexto del Sistema (Nivel 0)

| Nombre del Diagrama | Archivo Interactivo | Render PNG (Alta Res) | Descripción General |
|---|---|---|---|
| **Contexto del Sistema (System Context)** | [DIAGRAMA_CONTEXTO_SISTEMA.html](DIAGRAMA_CONTEXTO_SISTEMA.html) | [Render Contexto](renders/DIAGRAMA_CONTEXTO_SISTEMA.png) | Delimitación perimetral del software frente a 4 perfiles de actores humanos (Cliente, Personal Sucursal, Bodega, Propietario) y 4 sistemas externos (Email, Telegram Bot/IA, PostgreSQL, Cron Jobs). |

---

## 🗄️ 2. Diagramas de Modelo de Datos (PostgreSQL / Prisma ORM)

| Nombre del Diagrama | Archivo Interactivo | Render PNG (Alta Res) | Descripción General |
|---|---|---|---|
| **MER: Dominio de Negocio (Core)** | [DIAGRAMA_ENTIDAD_RELACION.html](DIAGRAMA_ENTIDAD_RELACION.html) | [Render MER Core](renders/DIAGRAMA_ENTIDAD_RELACION.png) | 18 tablas transaccionales: Seguridad/RBAC, Catálogo, Presentaciones, Materia Prima, Amasijos, Cierre Residual Nocturno, Trazabilidad FEFO y Reservas B2C. |
| **MER: Soporte, Seguridad y Auditoría** | [DIAGRAMA_SOPORTE_SEGURIDAD_AUDITORIA.html](DIAGRAMA_SOPORTE_SEGURIDAD_AUDITORIA.html) | [Render Soporte](renders/DIAGRAMA_SOPORTE_SEGURIDAD_AUDITORIA.png) | 14 tablas de infraestructura: Sesiones JWT (`RefreshToken`), Dispositivos confiables, Anti-fuerza bruta, Auditoría no repudio (`AuditLog`), Configuración dinámica (`SystemConfig`), Web Push W3C y Telegram Webhooks. |

---

## 📑 3. Índice de Diagramas de Casos de Uso (UML 2.5)

| ID | Nombre del Proceso | Archivo Interactivo | Render PNG (Alta Res) | Actores Principales | Casos de Uso Clave |
|---|---|---|---|---|---|
| **CU-01** | **Cierre de Día y Venta Residual** | [CU-01_cierre_de_dia.html](CU-01_cierre_de_dia.html) | [Render CU-01](renders/CU-01_cierre_de_dia.png) | Encargado Sucursal (`MANAGER`/`ADMIN`), Motor PostgreSQL | Conteo físico nocturno, deducción de mermas, cálculo automático de venta por diferencia, transacción ACID en `Inventory`. |
| **CU-02** | **Producción Diaria y Materia Prima** | [CU-02_produccion_materia_prima.html](CU-02_produccion_materia_prima.html) | [Render CU-02](renders/CU-02_produccion_materia_prima.png) | Maestro Panadero (`BAKER`), Encargado, Control de Stock | Registro de amasijos, escalado de recetas, deducción en unidades base (`BaseUnit`), alertas de stock crítico. |
| **CU-03** | **Reserva de Pedidos (Checkout)** | [CU-03_reserva_pedidos_checkout.html](CU-03_reserva_pedidos_checkout.html) | [Render CU-03](renders/CU-03_reserva_pedidos_checkout.png) | Cliente (`CUSTOMER`), Encargado Mostrador, Servicio Email | Exploración de catálogo con combos, selección de sucursal y franja de retiro, confirmación (`PENDING`), despacho (`PICKED_UP`). |
| **CU-04** | **Control de Caducidades (FEFO)** | [CU-04_control_caducidades_fefo.html](CU-04_control_caducidades_fefo.html) | [Render CU-04](renders/CU-04_control_caducidades_fefo.png) | Encargado Bodega, Cron Job Diario, `InventoryLot` | Creación de lotes con fecha de vencimiento, semáforo preventivo (7 días), consumo por método FEFO, bajas por merma. |
| **CU-05** | **Asistente Gerencial vía Telegram** | [CU-05_asistente_telegram_bot.html](CU-05_asistente_telegram_bot.html) | [Render CU-05](renders/CU-05_asistente_telegram_bot.png) | Dueño (`ADMIN`), Webhook Telegram, Motor IA | Autenticación OTP de chat privado, consultas en lenguaje natural (*Tool Calling*), alertas push de cierre de turno. |
| **CU-06** | **Seguridad y Control Multi-Sucursal** | [CU-06_seguridad_rbac_multisucursal.html](CU-06_seguridad_rbac_multisucursal.html) | [Render CU-06](renders/CU-06_seguridad_rbac_multisucursal.png) | Usuario / Cliente, Super Admin, Guards NestJS | Autenticación JWT + Refresh Tokens, asignación de roles RBAC, aislamiento de datos con `BranchScopeGuard`. |

---

## 🏗️ 4. Índice de Diagramas UML (Estructurales y Comportamiento)

| Código | Tipo de Diagrama UML | Archivo Interactivo | Render PNG (Alta Res) | Dimensión | Aspecto Clave Modelado |
|---|---|---|---|---|---|
| **UML-01** | **Diagrama de Clases** | [UML-01_diagrama_de_clases.html](UML-01_diagrama_de_clases.html) | [Render UML-01](renders/UML-01_diagrama_de_clases.png) | Estructural | Inyección de dependencias en NestJS, Controllers, Servicios, DTOs con `class-validator` y `PrismaService.$transaction()`. |
| **UML-02** | **Diagrama de Secuencia** | [UML-02_diagrama_de_secuencia.html](UML-02_diagrama_de_secuencia.html) | [Render UML-02](renders/UML-02_diagrama_de_secuencia.png) | Comportamiento | Flujo temporal cronológico del Cierre de Día, cálculo de venta residual y bloque interactivo transaccional ACID. |
| **UML-03** | **Diagrama de Estados** | [UML-03_diagrama_de_estados.html](UML-03_diagrama_de_estados.html) | [Render UML-03](renders/UML-03_diagrama_de_estados.png) | Comportamiento | Máquina de estados para pedidos B2C (`OrderStatus`) y semáforo preventivo de frescura para lotes de inventario (FEFO). |
| **UML-04** | **Diagrama de Actividades** | [UML-04_diagrama_de_actividades.html](UML-04_diagrama_de_actividades.html) | [Render UML-04](renders/UML-04_diagrama_de_actividades.png) | Comportamiento | Swimlanes para Maestro Panadero, Backend NestJS y Postgres: escalado de recetas, bifurcación por quiebre y descuento en `BaseUnit`. |
| **UML-05** | **Diagrama de Colaboración** | [UML-05_diagrama_de_colaboracion.html](UML-05_diagrama_de_colaboracion.html) | [Render UML-05](renders/UML-05_diagrama_de_colaboracion.png) | Comportamiento | Topología de objetos y mensajes numerados en tiempo de ejecución: Asistente IA, Google Gemini Pro 1.5 y Telegram Webhook. |
| **UML-06** | **Diagrama de Componentes** | [UML-06_diagrama_de_componentes.html](UML-06_diagrama_de_componentes.html) | [Render UML-06](renders/UML-06_diagrama_de_componentes.png) | Estructural | Arquitectura de 4 capas: Frontend SPA (Next.js 14), Backend Modular (NestJS), Persistencia (Prisma/PG) y Servicios Cloud Externos. |

---

## 🎨 Especificaciones de Visualización
- **Formato:** Archivos HTML autocontenidos con gráficos vectoriales SVG embebidos y capturas PNG 2x en `/renders`.
- **Contraste y Accesibilidad:** Fondos limpios (`#F8FAFC` / `#FFFFFF`), textos en azul pizarra oscuro (`#0F172A`), bordes definidos y máscaras de texto en conectores para máxima nitidez en impresión, presentaciones y sustentaciones académicas.
- **Compatibilidad:** Renderizables directamente en cualquier navegador web moderno, exportables a PDF o insertables en reportes técnicos.
