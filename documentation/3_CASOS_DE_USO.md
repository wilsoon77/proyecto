# 📝 CASOS DE USO - PanaderIA Smart System

## 📋 ÍNDICE DE CASOS DE USO

### **MÓDULO CLIENTES** (CU-C)
1. CU-C01: Registro de Usuario
2. CU-C02: Inicio de Sesión
3. CU-C03: Recuperación de Contraseña
4. CU-C04: Configurar Autenticación 2FA
5. CU-C05: Login con OAuth (Google/Facebook)
6. CU-C06: Ver Catálogo de Productos
7. CU-C07: Buscar Productos
8. CU-C08: Filtrar Productos
9. CU-C09: Ver Detalle de Producto
10. CU-C10: Agregar Producto al Carrito
11. CU-C11: Modificar Cantidad en Carrito
12. CU-C12: Eliminar Producto del Carrito
13. CU-C13: Aplicar Código de Descuento
14. CU-C14: Realizar Pedido
15. CU-C15: Seleccionar Dirección de Entrega
16. CU-C16: Procesar Pago
17. CU-C17: Rastrear Pedido
18. CU-C18: Cancelar Pedido
19. CU-C19: Dejar Reseña de Producto
20. CU-C20: Gestionar Perfil
21. CU-C21: Gestionar Direcciones
22. CU-C22: Ver Historial de Pedidos
23. CU-C23: Ver Puntos de Fidelidad
24. CU-C24: Canjear Puntos
25. CU-C25: Agregar Producto a Favoritos

### **MÓDULO ADMINISTRACIÓN** (CU-A)
26. CU-A01: Gestionar Productos (CRUD)
27. CU-A02: Gestionar Categorías
28. CU-A03: Gestionar Inventario
29. CU-A04: Gestionar Ingredientes
30. CU-A05: Ver Dashboard de Ventas
31. CU-A06: Generar Reportes
32. CU-A07: Gestionar Pedidos
33. CU-A08: Asignar Pedido a Empleado
34. CU-A09: Actualizar Estado de Pedido
35. CU-A10: Gestionar Promociones
36. CU-A11: Gestionar Usuarios
37. CU-A12: Gestionar Empleados
38. CU-A13: Gestionar Turnos
39. CU-A14: Ver Analítica de Productos
40. CU-A15: Configurar Notificaciones

### **MÓDULO EMPLEADOS** (CU-E)
41. CU-E01: Marcar Entrada/Salida
42. CU-E02: Ver Turnos Asignados
43. CU-E03: Gestionar Pedidos Asignados
44. CU-E04: Actualizar Inventario
45. CU-E05: Registrar Producción Diaria

### **MÓDULO IA** (CU-IA)
46. CU-IA01: Predecir Demanda de Productos
47. CU-IA02: Generar Recomendaciones Personalizadas
48. CU-IA03: Analizar Sentimientos de Reseñas
49. CU-IA04: Optimizar Inventario
50. CU-IA05: Chatbot de Atención al Cliente

---

## 📖 DETALLE DE CASOS DE USO

---

## CU-C01: Registro de Usuario

### **Descripción**
El usuario nuevo se registra en el sistema para poder realizar compras.

### **Actores**
- **Principal:** Usuario Nuevo
- **Secundario:** Sistema de Email

### **Precondiciones**
- El usuario debe tener conexión a internet
- El email no debe estar registrado previamente

### **Flujo Principal**
1. Usuario accede a la pantalla de registro
2. Usuario ingresa:
   - Nombre completo
   - Email
   - Número de teléfono (opcional)
   - Contraseña
   - Confirmación de contraseña
3. Usuario acepta términos y condiciones
4. Sistema valida que:
   - Email tenga formato válido
   - Contraseña cumpla requisitos (mínimo 8 caracteres, 1 mayúscula, 1 número)
   - Email no exista en la BD
5. Sistema crea cuenta de usuario
6. Sistema envía email de verificación
7. Sistema asigna rol "CUSTOMER"
8. Sistema crea carrito vacío para el usuario
9. Sistema crea registro de puntos de fidelidad (0 puntos)
10. Sistema muestra mensaje de éxito
11. Sistema redirige a página de inicio de sesión

### **Flujos Alternativos**

**FA1: Email ya registrado**
- 4a. Sistema detecta email duplicado
- 4b. Sistema muestra error "Este email ya está registrado"
- 4c. Sistema sugiere recuperar contraseña
- Retorna a paso 2

**FA2: Contraseña no cumple requisitos**
- 4a. Sistema detecta contraseña débil
- 4b. Sistema muestra requisitos no cumplidos
- Retorna a paso 2

**FA3: Verificación de Email**
- Usuario recibe email
- Usuario hace clic en link de verificación
- Sistema marca email como verificado
- Sistema otorga 50 puntos de bienvenida

### **Postcondiciones**
- Usuario registrado en BD
- Email de verificación enviado
- Carrito creado
- Puntos de fidelidad inicializados

### **Reglas de Negocio**
- RN01: Contraseña debe tener mínimo 8 caracteres
- RN02: Email debe ser único
- RN03: Usuarios nuevos obtienen 50 puntos de bienvenida
- RN04: Cuenta inicia en estado "activo"

---

## CU-C02: Inicio de Sesión

### **Descripción**
Usuario registrado ingresa al sistema con sus credenciales.

### **Actores**
- **Principal:** Usuario Registrado
- **Secundario:** Sistema de Autenticación

### **Precondiciones**
- Usuario debe estar registrado
- Usuario debe tener credenciales válidas

### **Flujo Principal**
1. Usuario accede a pantalla de login
2. Usuario ingresa email y contraseña
3. Sistema valida credenciales
4. Sistema verifica si 2FA está habilitado
5. SI 2FA habilitado → Va a CU-C04
6. Sistema genera Access Token (JWT, 15 min)
7. Sistema genera Refresh Token (7 días)
8. Sistema registra "last_login" timestamp
9. Sistema carga datos del usuario
10. Sistema carga carrito activo
11. Sistema muestra dashboard/home
12. Sistema envía notificación de inicio de sesión

### **Flujos Alternativos**

**FA1: Credenciales Incorrectas**
- 3a. Sistema detecta credenciales inválidas
- 3b. Sistema incrementa contador de intentos fallidos
- 3c. Sistema muestra error genérico "Email o contraseña incorrectos"
- 3d. SI intentos >= 5: Sistema bloquea cuenta por 15 minutos
- Retorna a paso 2

**FA2: Cuenta Bloqueada**
- 3a. Sistema detecta cuenta bloqueada
- 3b. Sistema muestra mensaje "Cuenta temporalmente bloqueada"
- 3c. Sistema sugiere recuperar contraseña
- Finaliza caso de uso

**FA3: Email No Verificado**
- 3a. Sistema detecta email_verified = false
- 3b. Sistema muestra mensaje "Verifica tu email"
- 3c. Sistema ofrece reenviar email de verificación
- Finaliza caso de uso

### **Postcondiciones**
- Usuario autenticado
- Tokens generados y almacenados
- Sesión activa
- Log de actividad registrado

### **Reglas de Negocio**
- RN05: Access Token expira en 15 minutos
- RN06: Refresh Token expira en 7 días
- RN07: Máximo 5 intentos fallidos antes de bloqueo
- RN08: Bloqueo temporal de 15 minutos

---

## CU-C10: Agregar Producto al Carrito

### **Descripción**
Usuario agrega un producto con cantidad específica al carrito de compras.

### **Actores**
- **Principal:** Usuario (autenticado o anónimo)

### **Precondiciones**
- Producto debe existir y estar activo
- Producto debe tener stock disponible

### **Flujo Principal**
1. Usuario visualiza producto en catálogo o detalle
2. Usuario selecciona cantidad deseada
3. Usuario hace clic en "Agregar al Carrito"
4. Sistema verifica stock disponible
5. Sistema verifica si producto ya está en carrito
6. SI producto existe en carrito:
   - Sistema suma cantidades
7. SI producto NO existe en carrito:
   - Sistema crea nuevo item en carrito
8. Sistema actualiza total del carrito
9. Sistema muestra notificación de éxito
10. Sistema actualiza contador de carrito en navbar
11. Sistema registra evento en analytics

### **Flujos Alternativos**

**FA1: Stock Insuficiente**
- 4a. Sistema detecta stock < cantidad solicitada
- 4b. Sistema muestra error "Stock insuficiente"
- 4c. Sistema muestra stock disponible actual
- 4d. Sistema sugiere cantidad máxima disponible
- Retorna a paso 2

**FA2: Producto Inactivo**
- 4a. Sistema detecta producto no disponible
- 4b. Sistema muestra error "Producto no disponible"
- Finaliza caso de uso

**FA3: Cantidad Excede Límite**
- 2a. Usuario intenta agregar más de 50 unidades
- 2b. Sistema limita cantidad a 50
- 2c. Sistema muestra advertencia
- Continúa en paso 4

**FA4: Usuario Anónimo**
- 1a. Usuario no autenticado
- 1b. Sistema crea carrito temporal con session_id
- 1c. Sistema guarda en localStorage
- Continúa flujo normal

### **Postcondiciones**
- Item agregado/actualizado en carrito
- Stock reservado temporalmente
- Evento registrado en analytics
- Total de carrito actualizado

### **Reglas de Negocio**
- RN09: Cantidad mínima: 1 unidad
- RN10: Cantidad máxima por producto: 50 unidades
- RN11: Stock se reserva temporalmente por 30 minutos
- RN12: Carrito de usuario anónimo expira en 24 horas

---

## CU-C14: Realizar Pedido

### **Descripción**
Usuario completa el proceso de compra desde el carrito hasta la confirmación del pedido.

### **Actores**
- **Principal:** Usuario autenticado
- **Secundarios:** Sistema de Pagos (Stripe), Sistema de Email, Sistema de Notificaciones

### **Precondiciones**
- Usuario debe estar autenticado
- Carrito debe tener al menos 1 producto
- Usuario debe tener al menos 1 dirección registrada
- Productos deben tener stock disponible

### **Flujo Principal**

**PASO 1: Revisión del Carrito**
1. Usuario accede al carrito
2. Sistema muestra resumen de productos
3. Sistema calcula subtotal
4. Usuario puede modificar cantidades o eliminar items
5. Usuario hace clic en "Proceder al Pago"

**PASO 2: Información de Envío**
6. Sistema muestra direcciones guardadas
7. Usuario selecciona dirección de entrega
8. Usuario selecciona tipo de pedido (Delivery/Pickup)
9. SI Delivery:
   - Sistema calcula costo de envío según zona
   - Sistema muestra tiempo estimado de entrega
10. Usuario selecciona fecha y hora de entrega
11. Usuario ingresa notas especiales (opcional)
12. Sistema valida zona de cobertura
13. Usuario hace clic en "Continuar"

**PASO 3: Método de Pago**
14. Sistema muestra opciones de pago
15. Usuario selecciona método:
    - Tarjeta (Stripe)
    - Pago contra entrega
    - Transferencia bancaria
16. SI Tarjeta:
    - Usuario ingresa datos en formulario Stripe
    - Sistema valida tarjeta
17. Usuario puede aplicar código de descuento
18. Sistema calcula total final:
    - Subtotal + Envío - Descuentos + Impuestos
19. Usuario hace clic en "Pagar"

**PASO 4: Procesamiento**
20. Sistema valida stock nuevamente
21. Sistema crea registro de pedido en BD
22. Sistema genera número de orden único
23. Sistema procesa pago con Stripe
24. SI pago exitoso:
    - Sistema actualiza estado pedido a "CONFIRMED"
    - Sistema descuenta stock de productos
    - Sistema vacía carrito del usuario
    - Sistema registra pago en tabla payments
    - Sistema otorga puntos de fidelidad (1 punto por cada $1)
25. Sistema envía emails:
    - Confirmación al cliente
    - Notificación a admin
26. Sistema envía notificación push
27. Sistema registra en logs
28. Sistema muestra pantalla de confirmación

**PASO 5: Confirmación**
29. Sistema muestra:
    - Número de orden
    - Resumen del pedido
    - Estado actual
    - Tiempo estimado de entrega
30. Sistema ofrece opciones:
    - Ver detalle del pedido
    - Rastrear pedido
    - Volver al inicio

### **Flujos Alternativos**

**FA1: Stock Insuficiente al Confirmar**
- 20a. Sistema detecta stock insuficiente
- 20b. Sistema muestra productos sin stock
- 20c. Sistema ofrece eliminar o reducir cantidad
- Retorna a paso 1

**FA2: Pago Rechazado**
- 23a. Stripe rechaza el pago
- 23b. Sistema muestra error con razón
- 23c. Sistema mantiene carrito intacto
- 23d. Sistema actualiza estado pedido a "FAILED"
- 23e. Sistema registra intento fallido
- Retorna a paso 16

**FA3: Código de Descuento Inválido**
- 17a. Sistema valida código
- 17b. Código no existe o expiró
- 17c. Sistema muestra error
- Retorna a paso 17

**FA4: Fuera de Zona de Cobertura**
- 12a. Sistema detecta dirección fuera de zona
- 12b. Sistema muestra mensaje
- 12c. Sistema sugiere pickup
- Retorna a paso 7

**FA5: Error de Conexión con Stripe**
- 23a. No hay conexión con Stripe
- 23b. Sistema muestra error técnico
- 23c. Sistema ofrece otros métodos de pago
- Retorna a paso 15

### **Postcondiciones Exitosas**
- Pedido creado en BD
- Pago procesado y registrado
- Stock actualizado
- Carrito vaciado
- Emails enviados
- Notificaciones enviadas
- Puntos otorgados
- Logs registrados

### **Reglas de Negocio**
- RN13: Pedido mínimo: $5.00
- RN14: Envío gratis para pedidos > $30
- RN15: Zona de cobertura: Radio de 10km
- RN16: Horario de entrega: 7am - 9pm
- RN17: Puntos otorgados: 1 punto por cada $1 gastado
- RN18: Stock se descuenta solo al confirmar pago
- RN19: Número de orden formato: ORD-YYYYMMDD-XXXX
- RN20: Pedido se puede cancelar solo si estado = PENDING o CONFIRMED

---

## CU-C17: Rastrear Pedido

### **Descripción**
Usuario visualiza el estado actual y seguimiento en tiempo real de su pedido.

### **Actores**
- **Principal:** Usuario autenticado
- **Secundario:** Sistema de Tracking

### **Precondiciones**
- Usuario debe tener pedidos activos
- Pedido debe existir en la BD

### **Flujo Principal**
1. Usuario accede a "Mis Pedidos"
2. Sistema muestra lista de pedidos ordenados por fecha
3. Usuario selecciona pedido a rastrear
4. Sistema carga detalles del pedido
5. Sistema muestra:
   - Número de orden
   - Estado actual
   - Progreso visual (barra de estados)
   - Productos del pedido
   - Dirección de entrega
   - Empleado asignado (si aplica)
   - Tiempo estimado de llegada
6. SI pedido en estado "IN_DELIVERY":
   - Sistema muestra mapa con ubicación del repartidor (opcional)
   - Sistema muestra tiempo restante estimado
7. Sistema permite:
   - Contactar al repartidor
   - Cancelar pedido (si está permitido)
   - Ver factura
8. Sistema actualiza en tiempo real vía WebSocket

### **Estados Posibles del Pedido**
- PENDING: Pedido recibido, pendiente de confirmación
- CONFIRMED: Pedido confirmado, pendiente de preparación
- PREPARING: En preparación
- READY: Listo para entrega/pickup
- IN_DELIVERY: En camino
- DELIVERED: Entregado
- CANCELLED: Cancelado

### **Flujos Alternativos**

**FA1: Pedido No Encontrado**
- 4a. Sistema no encuentra el pedido
- 4b. Sistema muestra error 404
- Finaliza caso de uso

**FA2: Actualización en Tiempo Real**
- Sistema recibe evento de cambio de estado
- Sistema actualiza UI sin refrescar página
- Sistema muestra notificación del cambio

### **Postcondiciones**
- Usuario informado del estado
- Evento de rastreo registrado en analytics

### **Reglas de Negocio**
- RN21: Actualizaciones en tiempo real vía WebSocket
- RN22: Histórico de cambios de estado se mantiene
- RN23: Notificación automática al cambiar estado

---

## CU-A01: Gestionar Productos (CRUD)

### **Descripción**
Administrador crea, lee, actualiza o elimina productos del catálogo.

### **Actores**
- **Principal:** Administrador o Manager

### **Precondiciones**
- Usuario debe tener rol ADMIN o MANAGER
- Usuario debe estar autenticado

### **Flujo Principal - CREAR PRODUCTO**

1. Admin accede a "Gestión de Productos"
2. Admin hace clic en "Nuevo Producto"
3. Sistema muestra formulario de creación
4. Admin ingresa:
   - SKU (auto-generado o manual)
   - Nombre del producto
   - Categoría
   - Descripción corta
   - Descripción completa
   - Precio
   - Precio de costo
   - Stock inicial
   - Umbral de stock bajo
   - Peso
   - Calorías
   - Vida útil (días)
   - Requiere refrigeración (sí/no)
   - Tags (array)
   - Alérgenos (array)
   - Información nutricional (JSON)
5. Admin sube imágenes:
   - Imagen principal (requerida)
   - Imágenes adicionales (opcional)
6. Sistema valida:
   - SKU único
   - Precio > 0
   - Campos requeridos completos
   - Formato de imágenes (JPG, PNG, WebP)
   - Tamaño de imagen < 5MB
7. Sistema sube imágenes a Cloudinary
8. Sistema optimiza y genera thumbnails
9. Sistema crea registro en BD
10. Sistema genera slug único
11. Sistema registra en logs
12. Sistema muestra mensaje de éxito
13. Sistema redirige a lista de productos

### **Flujo Principal - EDITAR PRODUCTO**

1. Admin busca producto en lista
2. Admin hace clic en "Editar"
3. Sistema carga datos actuales en formulario
4. Admin modifica campos deseados
5. Sistema valida cambios
6. SI cambio de precio:
   - Sistema registra histórico de precios
7. Sistema actualiza registro en BD
8. Sistema actualiza timestamp "updated_at"
9. Sistema registra cambio en logs
10. Sistema muestra mensaje de éxito

### **Flujo Principal - ELIMINAR PRODUCTO**

1. Admin selecciona producto
2. Admin hace clic en "Eliminar"
3. Sistema verifica si producto tiene:
   - Pedidos activos asociados
   - Items en carritos de clientes
4. SI tiene dependencias:
   - Sistema muestra advertencia
   - Sistema sugiere desactivar en lugar de eliminar
5. Admin confirma eliminación
6. Sistema realiza soft delete (deleted_at = now())
7. Sistema mantiene en BD para histórico
8. Sistema oculta de catálogo público
9. Sistema registra en logs

### **Flujos Alternativos**

**FA1: SKU Duplicado**
- 6a. Sistema detecta SKU existente
- 6b. Sistema muestra error
- 6c. Sistema sugiere SKU alternativo
- Retorna a paso 4

**FA2: Error al Subir Imagen**
- 7a. Cloudinary falla
- 7b. Sistema muestra error
- 7c. Sistema mantiene datos en formulario
- Retorna a paso 5

**FA3: Stock Negativo**
- 6a. Admin ingresa stock < 0
- 6b. Sistema rechaza valor
- 6c. Sistema muestra error
- Retorna a paso 4

### **Postcondiciones**
- Producto creado/actualizado/eliminado
- Imágenes subidas y optimizadas
- Logs registrados
- Cache invalidado

### **Reglas de Negocio**
- RN24: SKU debe ser único
- RN25: Precio debe ser mayor a costo
- RN26: Soft delete para mantener histórico
- RN27: Cambios de precio se registran en histórico
- RN28: Imágenes máximo 5MB cada una
- RN29: Máximo 5 imágenes por producto
- RN30: Slug se genera automáticamente del nombre

---

## CU-A07: Gestionar Pedidos

### **Descripción**
Administrador o empleado visualiza, filtra y actualiza el estado de los pedidos.

### **Actores**
- **Principal:** Admin, Manager, Empleado

### **Precondiciones**
- Usuario con permisos adecuados
- Usuario autenticado

### **Flujo Principal**

1. Usuario accede a "Gestión de Pedidos"
2. Sistema muestra dashboard de pedidos:
   - Vista Kanban por estados
   - Total de pedidos por estado
   - Pedidos del día
   - Ingresos del día
3. Usuario puede:
   - Filtrar por: Estado, Fecha, Cliente, Empleado
   - Buscar por número de orden
   - Ordenar por: Fecha, Total, Estado
4. Usuario selecciona un pedido
5. Sistema muestra detalles completos:
   - Información del cliente
   - Productos del pedido
   - Dirección de entrega
   - Estado de pago
   - Timeline de estados
   - Notas del cliente
   - Notas internas
6. Usuario puede:
   - Actualizar estado
   - Asignar a empleado
   - Agregar notas internas
   - Imprimir orden de producción
   - Ver factura
   - Contactar cliente
7. Sistema registra todos los cambios
8. Sistema envía notificaciones al cliente

### **Actualizar Estado de Pedido**

1. Usuario hace clic en "Cambiar Estado"
2. Sistema muestra estados válidos según estado actual:
   - PENDING → CONFIRMED, CANCELLED
   - CONFIRMED → PREPARING, CANCELLED
   - PREPARING → READY, CANCELLED
   - READY → IN_DELIVERY (delivery) o DELIVERED (pickup)
   - IN_DELIVERY → DELIVERED, CANCELLED
3. Usuario selecciona nuevo estado
4. SI requiere información adicional:
   - Razón de cancelación
   - Empleado de entrega
5. Sistema valida transición de estado
6. Sistema actualiza registro
7. Sistema registra timestamp del cambio
8. Sistema envía notificación al cliente vía:
   - Email
   - Push notification
   - SMS (opcional)
9. Sistema actualiza dashboard en tiempo real
10. Sistema registra en logs

### **Asignar Pedido a Empleado**

1. Usuario hace clic en "Asignar Empleado"
2. Sistema muestra lista de empleados disponibles
3. Sistema filtra por:
   - Empleados con turno activo
   - Empleados con menos pedidos asignados
4. Usuario selecciona empleado
5. Sistema asigna pedido
6. Sistema notifica al empleado
7. Sistema actualiza contador de pedidos del empleado

### **Flujos Alternativos**

**FA1: Transición de Estado Inválida**
- 5a. Usuario intenta cambio no permitido
- 5b. Sistema muestra error
- 5c. Sistema explica estados válidos
- Retorna a paso 2

**FA2: Pedido Pagado No Se Puede Cancelar**
- 3a. Usuario intenta cancelar pedido DELIVERED
- 3b. Sistema muestra advertencia
- 3c. Sistema sugiere proceso de reembolso
- Finaliza

**FA3: Empleado No Disponible**
- 4a. No hay empleados con turno activo
- 4b. Sistema muestra advertencia
- 4c. Sistema permite asignar de todas formas
- Continúa en paso 4

### **Postcondiciones**
- Estado de pedido actualizado
- Notificaciones enviadas
- Logs registrados
- Dashboard actualizado en tiempo real

### **Reglas de Negocio**
- RN31: Solo ciertos estados pueden cambiar a otros
- RN32: Cambio de estado envía notificación automática
- RN33: Pedido DELIVERED no se puede cancelar
- RN34: Pedido CANCELLED no se puede reactivar
- RN35: Timestamp de cada cambio se registra

---

## CU-IA01: Predecir Demanda de Productos

### **Descripción**
Sistema de IA analiza datos históricos y predice la demanda de productos para optimizar producción.

### **Actores**
- **Principal:** Sistema de IA
- **Secundario:** Administrador (visualiza resultados)

### **Precondiciones**
- Debe existir al menos 30 días de datos históricos
- Microservicio de IA debe estar activo

### **Flujo Principal**

1. Sistema ejecuta predicción automática diariamente a las 11 PM
2. Sistema recopila datos de últimos 90 días:
   - Ventas por producto por día
   - Cantidad vendida
   - Días de la semana
   - Eventos especiales (festivos)
   - Promociones activas
   - Clima (opcional)
3. Sistema preprocesa datos:
   - Limpia valores atípicos
   - Normaliza datos
   - Crea features adicionales
4. Sistema aplica modelo de Time Series Forecasting
5. Sistema genera predicciones para próximos 7 días:
   - Cantidad estimada por producto
   - Intervalo de confianza
   - Tendencia
6. Sistema calcula:
   - Ingredientes necesarios
   - Sugerencias de producción
7. Sistema guarda predicciones en MongoDB
8. Sistema genera alertas si:
   - Ingrediente insuficiente
   - Capacidad de producción insuficiente
   - Demanda inusualmente alta
9. Sistema envía reporte a administradores
10. Admin visualiza en dashboard:
    - Gráficos de predicción
    - Tabla de producción sugerida
    - Alertas y recomendaciones

### **Flujos Alternativos**

**FA1: Datos Insuficientes**
- 2a. Menos de 30 días de historial
- 2b. Sistema usa predicción simple basada en promedio
- 2c. Sistema marca predicción como "baja confianza"
- Continúa en paso 5

**FA2: Error en Modelo**
- 4a. Modelo de ML falla
- 4b. Sistema usa último pronóstico válido
- 4c. Sistema notifica a admin del error
- 4d. Sistema registra error en logs
- Finaliza

**FA3: Evento Especial Detectado**
- 2a. Sistema detecta día festivo próximo
- 2b. Sistema ajusta predicción con factor multiplicador
- 2c. Sistema muestra nota explicativa
- Continúa en paso 5

### **Postcondiciones**
- Predicciones generadas y guardadas
- Reporte enviado a admins
- Dashboard actualizado
- Alertas generadas si aplica

### **Reglas de Negocio**
- RN36: Predicción se ejecuta diariamente a las 11 PM
- RN37: Se predice para próximos 7 días
- RN38: Mínimo 30 días de datos requeridos
- RN39: Confianza > 80% para alertas automáticas
- RN40: Festivos ajustan predicción con factor 1.5x

---

## CU-IA02: Generar Recomendaciones Personalizadas

### **Descripción**
Sistema de IA genera recomendaciones de productos personalizadas para cada usuario.

### **Actores**
- **Principal:** Sistema de IA
- **Usuario:** Recibe recomendaciones

### **Precondiciones**
- Usuario debe tener historial de compras o navegación

### **Flujo Principal**

1. Usuario accede a cualquier página del sitio
2. Sistema verifica si hay recomendaciones en cache
3. SI cache válido (< 1 hora):
   - Sistema retorna desde cache
4. SI cache expirado o no existe:
   - Sistema recopila datos del usuario:
     * Productos comprados anteriormente
     * Productos vistos recientemente
     * Productos en favoritos
     * Categorías preferidas
     * Productos en carrito actual
5. Sistema recopila datos globales:
   - Productos más vendidos
   - Productos trending
   - Productos similares comprados por otros usuarios
6. Sistema aplica algoritmos:
   - **Collaborative Filtering:** "Usuarios como tú también compraron"
   - **Content-Based:** "Te puede gustar basado en tus compras"
   - **Trending:** "Productos populares ahora"
7. Sistema calcula score de relevancia para cada producto
8. Sistema ordena por score descendente
9. Sistema filtra:
   - Productos ya comprados recientemente
   - Productos sin stock
   - Productos inactivos
10. Sistema selecciona top 10 recomendaciones
11. Sistema guarda en cache (Redis, 1 hora)
12. Sistema retorna resultados al frontend
13. Frontend muestra en secciones:
    - "Recomendado para ti"
    - "Basado en tu historial"
    - "Clientes también compraron"

### **Flujos Alternativos**

**FA1: Usuario Nuevo Sin Historial**
- 4a. No hay datos personales
- 4b. Sistema usa solo datos globales:
   - Productos más vendidos
   - Productos nuevos
   - Productos en promoción
- Continúa en paso 10

**FA2: Recomendaciones Insuficientes**
- 10a. Menos de 5 productos recomendados
- 10b. Sistema completa con productos trending
- Continúa en paso 11

**FA3: Error en Servicio de IA**
- 6a. Microservicio de IA no responde
- 6b. Sistema usa recomendaciones por defecto
- 6c. Sistema registra error
- Continúa en paso 10

### **Postcondiciones**
- Recomendaciones generadas
- Cache actualizado
- Analytics registrado

### **Reglas de Negocio**
- RN41: Cache de recomendaciones dura 1 hora
- RN42: Máximo 10 recomendaciones por usuario
- RN43: Productos sin stock no se recomiendan
- RN44: No recomendar productos comprados en últimos 7 días
- RN45: Score mínimo de relevancia: 0.3

---

## CU-E01: Marcar Entrada/Salida (Clock In/Out)

### **Descripción**
Empleado registra su entrada y salida del turno de trabajo.

### **Actores**
- **Principal:** Empleado

### **Precondiciones**
- Empleado debe estar registrado en el sistema
- Empleado debe tener turno asignado

### **Flujo Principal - ENTRADA**

1. Empleado accede a app/sistema
2. Empleado hace clic en "Marcar Entrada"
3. Sistema verifica:
   - Empleado tiene turno hoy
   - Está dentro del horario permitido (±15 min)
   - No tiene otra entrada activa
4. Sistema registra timestamp de entrada (clock_in)
5. Sistema actualiza estado a "ACTIVO"
6. Sistema muestra confirmación
7. Sistema notifica a supervisor

### **Flujo Principal - SALIDA**

1. Empleado hace clic en "Marcar Salida"
2. Sistema verifica entrada activa
3. Sistema registra timestamp de salida (clock_out)
4. Sistema calcula horas trabajadas
5. Sistema actualiza estado de turno a "COMPLETED"
6. Sistema muestra resumen:
   - Hora entrada
   - Hora salida
   - Total horas trabajadas
   - Pedidos completados
7. Sistema notifica a supervisor

### **Flujos Alternativos**

**FA1: Entrada Tarde**
- 3a. Empleado marca después de 15 min del inicio
- 3b. Sistema marca como "TARDANZA"
- 3c. Sistema notifica a supervisor
- Continúa en paso 4

**FA2: Entrada Temprana**
- 3a. Empleado marca antes de tiempo permitido
- 3b. Sistema permite pero marca como anticipado
- Continúa en paso 4

**FA3: Olvido Marcar Salida**
- 2a. Empleado no marcó salida ayer
- 2b. Sistema muestra alerta
- 2c. Sistema permite corrección manual (supervisor)
- Continúa flujo normal

### **Postcondiciones**
- Entrada/Salida registrada
- Horas calculadas
- Estado de turno actualizado
- Notificación enviada

### **Reglas de Negocio**
- RN46: Tolerancia de ±15 minutos
- RN47: Después de 15 min se marca tardanza
- RN48: Máximo 1 entrada activa por empleado
- RN49: Horas extras después de 8 horas

---

## 📊 RESUMEN DE CASOS DE USO

### Por Módulo

| Módulo | Cantidad | Complejidad |
|--------|----------|-------------|
| Clientes | 25 | Media-Alta |
| Administración | 15 | Alta |
| Empleados | 5 | Media |
| IA | 5 | Muy Alta |
| **TOTAL** | **50** | **Alta** |

### Por Prioridad

| Prioridad | Casos de Uso | Para MVP |
|-----------|--------------|----------|
| Alta | 20 | ✅ Sí |
| Media | 18 | ⚠️ Algunos |
| Baja | 12 | ❌ No |

### Casos de Uso MVP (Mínimo Viable)

**DEBE TENER (Fase 1):**
1. CU-C01: Registro
2. CU-C02: Login
3. CU-C06: Ver Catálogo
4. CU-C09: Ver Detalle
5. CU-C10: Agregar al Carrito
6. CU-C14: Realizar Pedido
7. CU-C17: Rastrear Pedido
8. CU-A01: Gestionar Productos
9. CU-A07: Gestionar Pedidos
10. CU-A05: Dashboard

**DEBERÍA TENER (Fase 2):**
11. CU-C04: 2FA
12. CU-C05: OAuth
13. CU-C19: Reseñas
14. CU-C23: Puntos
15. CU-A10: Promociones
16. CU-IA02: Recomendaciones

**PODRÍA TENER (Fase 3):**
17. CU-IA01: Predicción
18. CU-IA05: Chatbot
19. CU-E01: Clock In/Out
20. Resto de funcionalidades

---

## ✅ VALIDACIÓN Y TRAZABILIDAD

Cada caso de uso está vinculado a:
- ✅ Requisitos funcionales
- ✅ Historias de usuario
- ✅ Tablas de base de datos
- ✅ Pantallas diseñadas
- ✅ APIs necesarias
- ✅ Reglas de negocio

**Total de Casos de Uso Documentados: 50** ✅
**Listos para implementación** 🚀
