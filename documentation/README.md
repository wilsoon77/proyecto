# INDICE DE DOCUMENTACION - Panaderia Svetlana Smart System

## Guia de Navegacion

Bienvenido a la documentación completa del proyecto **Panaderia Svetlana Smart System**. Esta carpeta contiene la planificación técnica, diseños y documentación funcional.

> **Nota:** La fuente de verdad técnica del proyecto es el código. Los documentos de planificación original (diseño de BD, pantallas, casos de uso, estructura) reflejan el diseño inicial y han sido parcialmente implementados/modificados. Consultar siempre `api/prisma/schema.prisma` para el schema real de la BD.

---

## Documentos Disponibles

### **1. Diseno de Base de Datos**
**Archivo:** `1_DISEÑO_BASE_DATOS.md`

**Contenido:**
- Diseño SQL original (planificación inicial, Noviembre 2025)
- Incluye disclaimer de rediseño (Marzo 2026)
- El diseño actual con 16 modelos Prisma está en `api/prisma/schema.prisma`

**Estado:** Documento de referencia histórica. El schema Prisma es la fuente de verdad.

---

### **2. Diseno de Pantallas**
**Archivo:** `2_DISEÑO_PANTALLAS.md`

**Contenido:**
- Sistema de diseño (colores, tipografía)
- Wireframes ASCII de pantallas principales
- Componentes reutilizables propuestos
- Responsive breakpoints

**Estado:** Referencia de diseño. Muchas pantallas ya implementadas en el frontend.

---

### **3. Pruebas de Seguridad**
**Archivo:** `3_PRUEBAS_SEGURIDAD.md`

**Contenido:**
- Documentación de pruebas realizadas (22/11/2025)
- Tests de autenticación, rate limiting, tokens
- Configuración de Helmet, CORS, Throttler

**Estado:** Implementado. Las configuraciones de seguridad están activas en producción.

---

### **4. Casos de Uso**
**Archivo:** `3_CASOS_DE_USO.md`

**Contenido:**
- 31 Casos de uso
- 3 Módulos: Clientes, Admin, IA
- Flujos principales y alternativos
- 33 Reglas de negocio

**Estado:** Referencia funcional. Parcialmente implementado en el sistema actual.

---

### **5. Estructura del Proyecto**
**Archivo:** `4_ESTRUCTURA_PROYECTO.md`

**Contenido:**
- Arquitectura propuesta originalmente (apps/, packages/, infrastructure/)
- La estructura real del proyecto es diferente — ver `README.md` de `api/` y `web/`

**Estado:** Documento de referencia histórica. La estructura real es:
```
proyecto-panaderia/
├── api/          # NestJS Backend (no apps/api/)
├── web/          # Next.js Frontend (no apps/web/)
└── documentation/
```

---

### **6. Manual de Desarrollo Web**
**Archivo:** `5_MANUAL_DESARROLLO_WEB.md`

**Contenido:**
- Estado del proyecto web y tecnologías
- Roadmap de desarrollo

**Estado:** Desactualizado desde Noviembre 2025. Ver `web/README.md` para estado actual.

---

## Documentos en la Raíz

### **context.md** (Recomendado)
Contexto arquitectónico actualizado del proyecto. **Punto de partida recomendado.**
- Reglas de negocio clave
- Lógica de producción (amasijos/latas)
- Estado actual del proyecto (Marzo 2026)

### **README.md**
README principal con stack, configuración y desarrollo local.

### **GUIA_DESPLIEGUE.md**
Guía paso a paso de despliegue: Vercel (Web), Render (API), Supabase (DB), Appwrite (Storage).

### **PLANIFICACION_PROYECTO.md**
Planificación original del proyecto (alcance amplio). Algunas tecnologías propuestas no se implementaron (MongoDB, Redis, React Native, IA, etc.).

### **PLAN_DE_INICIO.md**
Guía original de inicio del proyecto. La mayoría de los pasos ya fueron completados.

### **TESTING.md**
Guía rápida de pruebas de seguridad.

---

## Estadísticas del Proyecto (Marzo 2026)

### **Base de Datos (Prisma)**
- **Modelos:** 16
- **Enums:** 7
- **Migraciones:** 10
- **Base:** PostgreSQL en Supabase

### **Backend (NestJS)**
- **Módulos:** 19
- **Endpoints:** 44+
- **Seguridad:** Helmet, CORS, Rate Limiting, JWT, bcrypt, hCaptcha

### **Frontend (Next.js 16)**
- **Páginas/Rutas:** 22+
- **Componentes UI:** 11
- **Componentes Layout:** 3
- **Hooks:** 5
- **Contexts:** 3
- **Servicios API:** 15

---

## Cómo Usar Esta Documentación

### **Para entender el proyecto:**
1. Lee `context.md` (reglas de negocio y estado actual)
2. Revisa `README.md` (stack y setup)

### **Para implementar una feature:**
1. Consulta `context.md` para reglas de negocio
2. Revisa el schema en `api/prisma/schema.prisma`
3. Lee los casos de uso relevantes en `3_CASOS_DE_USO.md`

### **Para desplegar:**
1. Sigue `GUIA_DESPLIEGUE.md`

---

## Referencia Rápida

| Necesito... | Abro... |
|-------------|---------|
| Entender el proyecto | `context.md` |
| Configurar desarrollo local | `README.md` (raíz) |
| Ver el schema de BD | `api/prisma/schema.prisma` |
| Entender un flujo de usuario | `documentation/3_CASOS_DE_USO.md` |
| Desplegar a producción | `GUIA_DESPLIEGUE.md` |
| Ejecutar tests de seguridad | `TESTING.md` |
| Ver diseño original de pantallas | `documentation/2_DISEÑO_PANTALLAS.md` |

---

**Nota:** Esta documentación es un documento vivo. Los documentos de planificación (1-5) reflejan el diseño original; el código es la fuente de verdad.

**Última actualización:** 23 de Marzo de 2026
