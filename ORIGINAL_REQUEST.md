# Original User Request

## Initial Request — 2026-07-09T03:10:43Z

Refactorizar y mejorar la experiencia de usuario (UI/UX) del módulo de registro de movimientos de inventario en el panel de administración web, optimizando la selección de productos, manejo de sucursales, unidades de medida y flujos de registro múltiple, sin alterar la lógica de negocio del backend.

Working directory: c:\Users\wilso\Documents\FrameworksrProjects\React\proyecto-panaderia
Integrity mode: demo

## Requirements

### R1. Selector de Producto Integrado (Combobox)
Reemplazar el sistema actual (buscador de texto separado y select nativo) por un componente tipo Combobox / Autocomplete integrado. Debe permitir buscar y seleccionar el producto en un único elemento interactivo, usando componentes existentes basados en Tailwind y Radix/shadcn/ui.

### R2. Control de Sucursales según Rol del Usuario
Autoseleccionar y bloquear la sucursal correspondiente si el usuario autenticado tiene el rol `MANAGER` (a menos que el movimiento sea una transferencia). Si el rol es `ADMIN`, permitir la selección libre de cualquier sucursal.

### R3. Visualización Dinámica de Unidades de Medida
Mostrar claramente al lado del input de cantidad la unidad de medida del producto seleccionado (ej: unidades, libras, latas, etc.) para contextualizar al usuario y evitar errores de registro.

### R4. Flujo de Registro Múltiple y Prevención de Redirección Forzada
Añadir la opción de registrar un movimiento y continuar ingresando otro (ej. mediante un botón "Registrar y agregar otro"), limpiando los campos del producto y cantidad, pero manteniendo la sucursal y el tipo de movimiento seleccionados para evitar tener que salir y volver a entrar al módulo.

### R5. Verificación de Integridad con Playwright
Actualizar e integrar las nuevas pantallas y elementos en el script de pruebas automatizadas [test-integration-roles.mjs](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/web/test-integration-roles.mjs). Ejecutar el script completo para validar que no se rompan las interfaces de ningún rol operativo (BAKER, MANAGER, ADMIN).

## Acceptance Criteria

### Interfaz de Usuario (UI/UX)
- [ ] La selección del producto se realiza en un Combobox que unifica la búsqueda y selección, sin requerir clics en un select nativo separado.
- [ ] Si un `MANAGER` abre el formulario, su sucursal asignada se autoselecciona y el select de sucursal correspondiente queda deshabilitado (excepto para transferencias).
- [ ] El input de cantidad muestra dinámicamente la unidad del producto elegido (ej: "unidades", "libras").
- [ ] Existe un botón alternativo "Registrar y agregar otro" que guarda el movimiento y mantiene al usuario en el formulario con la sucursal y tipo de movimiento seleccionados intactos.

### Funcionalidad y Seguridad
- [ ] Los movimientos manuales de inventario se guardan correctamente en el backend y se reflejan en la base de datos.
- [ ] No se permite omitir validaciones requeridas del backend.

### Verificación y Calidad
- [ ] El script de Playwright [test-integration-roles.mjs](file:///c:/Users/wilso/Documents/FrameworksrProjects/React/proyecto-panaderia/web/test-integration-roles.mjs) se ejecuta con éxito de principio a fin, validando todos los roles operativos.
- [ ] Las capturas de pantalla tomadas durante el test automatizado demuestran visualmente que la nueva interfaz de inventario se renderiza de forma óptima sin desalineaciones.
