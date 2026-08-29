# Guía de Diseño, Branding e Identidad Visual — Panadería Svetlana

> Documento oficial de especificaciones de diseño, identidad visual, paleta cromática, tipografías, componentes UI y directrices de experiencia de usuario (UX) para el proyecto **Panadería Svetlana**.

---

## 1. Identidad de Marca y Concepto

- **Nombre Comercial**: Panadería Svetlana
- **Giro de Negocio**: Panadería tradicional y artesanal guatemalteca (pan dulce, pan salado, pan francés, galletas y bollería horneada a diario).
- **Ubicación Principal**: Chimaltenango, Guatemala (Sucursal Central y Sucursal Secundaria).
- **Correo Oficial de Contacto**: `panaderiasvetlana@gmail.com`
- **Tono de Comunicación**: Cálido, cercano, tradicional, artesanal y confiable.
- **Enfoque Visual**: *"Warm Bakery & Clean Craft"* — estética de obrador cálido (tonos crema, avena, mantequilla y masa) con acabados modernos, limpios y libres de elementos superfluos o distractores.

---

## 2. Paleta de Colores Oficial

### 2.1 Colores Principales de Marca (Brand Core)

| Color | Nombre / Uso | Hex | HSL / Tailwind | Muestra |
|---|---|---|---|:---:|
| **Ámbar Dorado** | Botones primarios, acentos activos, badges y llamadas a la acción (CTA) | `#D97706` | `hsl(34 92% 46%)` / `amber-600` | 🟨 |
| **Ámbar Oscuro** | Hover de botones primarios y textos de énfasis secundario | `#B45309` | `hsl(34 92% 38%)` / `amber-700` | 🟧 |
| **Espresso Profundo** | Tipografía principal, tarjetas oscuras de alto impacto, headers premium | `#2B170F` | `hsl(24 25% 12%)` / `stone-900 warm` | 🟫 |
| **Tostado Artesanal (Crust)** | Subtítulos, etiquetas en mayúsculas, iconos y bordes de acento | `#8C522B` | `hsl(25 55% 32%)` | 🟫 |
| **Caramelo Suave** | Badges de alerta suave y acentos secundarios | `#9E4D1A` | `hsl(25 70% 36%)` | 🟫 |

---

### 2.2 Fondos y Superficies (Surfaces & Backgrounds)

| Superficie | Uso Principal | Hex | Descripción |
|---|---|---|---|
| **Fondo Global (Warm Canvas)** | Fondo base de todo el sitio público y panel admin | `#FAF5EE` | Tono avena suave que elimina el deslumbramiento del blanco puro |
| **Lino Cálido (Warm Linen)** | Tarjetas Bento suaves, dropdowns y barras de estado | `#FAF0E6` | Contenedor acogedor para métricas y destacados |
| **Crema / Avena (Oat Cream)** | Tarjetas secundarias, franjas separadoras y banners | `#F3E9DC` | Base de contraste medio |
| **Blanco Puro (Card Surface)** | Tarjetas interactivas de catálogo, modales y formularios | `#FFFFFF` | Contraste nítido para lectura de datos y productos |
| **Café Tostado (Deep Roast)** | Footer y cinta de movimiento infinito (Marquee) | `#2B170F` / `#24140D` | Base sólida y elegante para cierre de página |

---

### 2.3 Bordes y Divisores (Borders & Dividers)

| Token | Hex | Aplicación |
|---|---|---|
| **Borde Suave** | `#E8DCCB` | Líneas divisorias de tablas, headers, footers y separación de secciones |
| **Borde Interactivo** | `#DECDBB` | Bordes de inputs de formularios, tarjetas con hover y selectores |
| **Borde de Énfasis** | `#ECCDB5` | Contenedor de alertas cálidas y tarjetas de materias primas |

---

### 2.4 Tríada Semántica Operativa (Dashboard & Métricas)

Diseñada con **máximo contraste visual y semántico** para la toma de decisiones inmediata en cocina, mostrador y gerencia:

| Métrica | Color | Hex | Fondo Badge | Significado Operativo |
|---|---|---|---|---|
| **🔵 Producción (Horneado)** | Azul Cobalto | `#2563EB` | `#EFF6FF` (Border `#BFDBFE`) | Volumen de entrada generado en el horno / amasijo |
| **🟢 Ventas (Despacho)** | Verde Esmeralda | `#059669` | `#ECFDF5` (Border `#A7F3D0`) | Salida comercial positiva / producto colocado |
| **🔴 Mermas (Desperdicio)** | Rojo Carmesí | `#DC2626` | `#FEF2F2` (Border `#FECACA`) | Producto no vendido o descartado / alerta a mitigar |

---

## 🔤 3. Tipografía

El sistema tipográfico combina una **fuente display serif** (tradición, panadería europea y artesanal) con una **fuente sans-serif geométrica humanista** (claridad técnica y legibilidad móvil):

```
┌─────────────────────────────────────────────────────────────┐
│  Playfair Display  ──  Títulos, H1/H2, Precios & Branding   │
│  Plus Jakarta Sans ──  Texto corrido, Botones, Tablas & UI  │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Fuente Display (Títulos & Identidad)
- **Familia**: `Playfair Display`, Georgia, serif (`font-display` / `font-serif`).
- **Pesos**: Regular (400), SemiBold (600), Bold (700).
- **Usos**:
  - Encabezados principales de página (H1, H2, H3).
  - Títulos de productos en catálogo y modales.
  - Valores destacados de KPIs en Dashboard.
  - Citas de marca y lemas de tradición.

### 3.2 Fuente de Interfaz (Cuerpo & Componentes)
- **Familia**: `Plus Jakarta Sans`, system-ui, -apple-system, sans-serif (`font-sans`).
- **Pesos**: Normal (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800).
- **Usos**:
  - Párrafos descriptivos y textos de ayuda.
  - Botones, inputs, dropdowns y formularios.
  - Tablas administrativas y listados de pedidos.
  - Badges y micro-etiquetas en mayúsculas con espaciado (`tracking-[0.14em]`).

---

## 4. Logotipo y Recursos Gráficos

### 4.1 Logotipo Oficial SVG
- **Ruta**: `/images/logo-panaderia.svg`
- **Formato**: Gráfico vectorial escalable (SVG nativo).
- **Proporción**: ~16:9 (`viewBox="0 0 1376 768"`).
- **Composición**: Tipografía serifada estilizada con detalles de espigas doradas en crema (`#FEECCC`) y trazos en tinta negra con fondo transparente/blanco.
- **Escalas Recomendadas**:
  - **Header Web Público**: `h-10 w-36 sm:h-12 sm:w-44`
  - **Sidebar Panel Admin**: `h-14 w-48 sm:h-16 sm:w-52`
  - **Header Móvil**: `h-9 w-32` a `h-10 w-36`
  - **Footer Global**: `h-12 w-44 sm:h-14 sm:w-48`

### 4.2 Iconografía (Lucide Icons)
- **Suministro / Harina**: `Wheat`
- **Horno / Calidad**: `Flame`
- **Producción**: `Factory`
- **Control / Turno**: `ClipboardCheck` / `CalendarClock`
- **Sucursal**: `Store` / `MapPin` / `Building2`
- **Tendencias**: `TrendingUp` / `BarChart3`

---

## 5. Componentes y Patrones UI Característicos

### 5.1 Marquee Infinito (Cinta de Atributos)
- Cinta horizontal con desplazamiento continuo infinito (`animate-marquee`).
- Muestra las fortalezas de la marca: *Masa Madre Tradicional • 2 Horneadas Diarias • Ingredientes Naturales • Recetas de Antaño*.
- Fondo cálido tostado con tipografía dorada o crema suave.

### 5.2 Selector de Sucursal Omnipresente
- **Desktop**: Dropdown interactivo en la cabecera superior con estado activo y dirección.
- **Móvil**: Botón táctil visible en la cabecera y selector dedicado dentro del Drawer de navegación.

### 5.3 Formulario de Contacto Inteligente (`mailto:`)
- Conexión directa a **`panaderiasvetlana@gmail.com`**.
- Al presionar *"Enviar mensaje"*, se genera automáticamente la URL `mailto:` con el asunto formateado (`[Panadería Svetlana] <Asunto>`) y el cuerpo estructurado con el nombre, correo y mensaje del cliente listo para despacho sin intermediarios.

### 5.4 Panel Admin Bento & Limpio
- Estructura modular sin saturación visual.
- Pestañas de estado rápido (*Todos / Activos / Ocultos* en productos; *Pendientes / Preparando / Listas* en órdenes).
- Semáforo de **Tasa de Merma** para balancear el amasijo diario en 1 segundo.

---

## 6. Directrices de Responsividad y Accesibilidad

1. **Mobile-First**: Toda vista cuenta con contenedor adaptable (tarjetas táctiles en celular y tablas paginadas en escritorio).
2. **Área Táctil (Touch Targets)**: Botones y selectores con altura mínima de **44px** a **48px** (`touch-tactile`).
3. **Contraste de Color (WCAG AA)**: Todo texto sobre fondo crema `#FAF5EE` utiliza tonos `#2B170F` o `#8C522B` con ratio de contraste superior a 4.5:1.
4. **Carga Rápida**: Ausencia de imágenes pesadas o decoraciones innecesarias en pantallas de autenticación (Login y Registro).

