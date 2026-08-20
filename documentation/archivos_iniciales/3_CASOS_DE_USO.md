# CASOS DE USO - Panaderia Svetlana Smart System

> **Documento inicial/histórico:** conserva casos de POS, delivery y predicción que fueron descartados. Para el alcance vigente consultar `api/ANALISIS_ENDPOINTS.md` y `requerimientos.md`.

## INDICE DE CASOS DE USO

### MODULO CLIENTES (CU-C)
1. CU-C01: Registro de Usuario
2. CU-C02: Inicio de Sesión
3. CU-C03: Recuperación de Contraseña
4. CU-C04: Login con OAuth (Google/Facebook)
5. CU-C05: Ver Catálogo de Productos
6. CU-C06: Buscar Productos
7. CU-C07: Filtrar Productos
8. CU-C08: Ver Detalle de Producto
9. CU-C09: Agregar Producto al Carrito
10. CU-C10: Modificar Cantidad en Carrito
11. CU-C11: Eliminar Producto del Carrito
12. CU-C12: Realizar Pedido (Reserva para Recoger en Tienda)
13. CU-C13: Seleccionar Dirección de Facturación
14. CU-C14: Cancelar Pedido
15. CU-C15: Gestionar Perfil
16. CU-C16: Gestionar Direcciones
17. CU-C17: Ver Historial de Pedidos

### MODULO ADMINISTRACION (CU-A)
18. CU-A01: Gestionar Productos (CRUD)
19. CU-A02: Gestionar Categorías
20. CU-A03: Gestionar Inventario
21. CU-A04: Gestionar Ingredientes (Materia Prima)
22. CU-A05: Ver Dashboard de Ventas
23. CU-A06: Generar Reportes
24. CU-A07: Gestionar Pedidos (Reservas)
25. CU-A08: Actualizar Estado de Pedido
26. CU-A09: Gestionar Usuarios
27. CU-A10: Ver Analítica de Productos
28. CU-A11: Configurar Notificaciones

### MODULO IA (CU-IA)
29. CU-IA01: Predecir Demanda de Productos
30. CU-IA02: Generar Recomendaciones Personalizadas
31. CU-IA03: Chatbot de Atención al Cliente

---

## DETALLE DE CASOS DE USO

---

## CU-C01: Registro de Usuario

### Descripcion
El usuario nuevo se registra en el sistema para poder realizar reservas de pedidos.

### Actores
- Principal: Usuario Nuevo
- Secundario: Sistema de Email

### Precondiciones
- El usuario debe tener conexion a internet
- El email no debe estar registrado previamente

### Flujo Principal
1. Usuario accede a la pantalla de registro
2. Usuario ingresa:
   - Nombre completo
   - Email
   - Numero de telefono (opcional)
   - Contrasena
   - Confirmacion de contrasena
3. Usuario acepta terminos y condiciones
4. Sistema valida que:
   - Email tenga formato valido
   - Contrasena cumpla requisitos (minimo 8 caracteres, 1 mayuscula, 1 numero)
   - Email no exista en la BD
5. Sistema crea cuenta de usuario
6. Sistema envia email de verificacion
7. Sistema asigna rol "CUSTOMER"
8. Sistema crea carrito vacio para el usuario
9. Sistema muestra mensaje de exito
10. Sistema redirige a pagina de inicio de sesion

### Flujos Alternativos

FA1: Email ya registrado
- 4a. Sistema detecta email duplicado
- 4b. Sistema muestra error "Este email ya esta registrado"
- 4c. Sistema sugiere recuperar contrasena
- Retorna a paso 2

FA2: Contrasena no cumple requisitos
- 4a. Sistema detecta contrasena debil
- 4b. Sistema muestra requisitos no cumplidos
- Retorna a paso 2

FA3: Verificacion de Email
- Usuario recibe email
- Usuario hace clic en link de verificacion
- Sistema marca email como verificado

### Postcondiciones
- Usuario registrado en BD
- Email de verificacion enviado
- Carrito creado
- Cuenta inicia en estado activo

### Reglas de Negocio
- RN01: Contrasena debe tener minimo 8 caracteres
- RN02: Email debe ser unico
- RN03: Cuenta inicia en estado activo

---

## CU-C02: Inicio de Sesión

### Descripcion
Usuario registrado ingresa al sistema con sus credenciales.

### Actores
- Principal: Usuario Registrado
- Secundario: Sistema de Autenticacion

### Precondiciones
- Usuario debe estar registrado
- Usuario debe tener credenciales validas

### Flujo Principal
1. Usuario accede a pantalla de login
2. Usuario ingresa email y contrasena
3. Sistema valida credenciales
4. Sistema genera Access Token (JWT, 15 min)
5. Sistema genera Refresh Token (7 dias)
6. Sistema registra "last_login" timestamp
7. Sistema carga datos del usuario
8. Sistema carga carrito activo
9. Sistema muestra dashboard/home
10. Sistema envia notificacion de inicio de sesion

### Flujos Alternativos

FA1: Credenciales Incorrectas
- 3a. Sistema detecta credenciales invalidas
- 3b. Sistema incrementa contador de intentos fallidos
- 3c. Sistema muestra error generico "Email o contrasena incorrectos"
- 3d. SI intentos >= 5: Sistema bloquea cuenta por 15 minutos
- Retorna a paso 2

FA2: Cuenta Bloqueada
- 3a. Sistema detecta cuenta bloqueada
- 3b. Sistema muestra mensaje "Cuenta temporalmente bloqueada"
- 3c. Sistema sugiere recuperar contrasena
- Finaliza caso de uso

FA3: Email No Verificado
- 3a. Sistema detecta email_verified = false
- 3b. Sistema muestra mensaje "Verifica tu email"
- 3c. Sistema ofrece reenviar email de verificacion
- Finaliza caso de uso

### Postcondiciones
- Usuario autenticado
- Tokens generados y almacenados
- Sesion activa
- Log de actividad registrado

### Reglas de Negocio
- RN04: Access Token expira en 15 minutos
- RN05: Refresh Token expira en 7 dias
- RN06: Maximo 5 intentos fallidos antes de bloqueo
- RN07: Bloqueo temporal de 15 minutos

---

## CU-C09: Agregar Producto al Carrito

### Descripcion
Usuario agrega un producto con cantidad especifica al carrito de compras para preparar su reserva.

### Actores
- Principal: Usuario (autenticado o anonimo)

### Precondiciones
- Producto debe existir y estar activo
- Producto debe tener stock disponible

### Flujo Principal
1. Usuario visualiza producto en catalogo o detalle
2. Usuario selecciona cantidad deseada
3. Usuario hace clic en "Agregar al Carrito"
4. Sistema verifica stock disponible
5. Sistema verifica si producto ya esta en carrito
6. SI producto existe en carrito:
   - Sistema suma cantidades
7. SI producto NO existe en carrito:
   - Sistema crea nuevo item en carrito
8. Sistema actualiza total del carrito
9. Sistema muestra notificacion de exito
10. Sistema actualiza contador de carrito en navbar
11. Sistema registra evento en analytics

### Flujos Alternativos

FA1: Stock Insuficiente
- 4a. Sistema detecta stock < cantidad solicitada
- 4b. Sistema muestra error "Stock insuficiente"
- 4c. Sistema muestra stock disponible actual
- 4d. Sistema sugiere cantidad maxima disponible
- Retorna a paso 2

FA2: Producto Inactivo
- 4a. Sistema detecta producto no disponible
- 4b. Sistema muestra error "Producto no disponible"
- Finaliza caso de uso

FA3: Cantidad Excede Limite
- 2a. Usuario intenta agregar mas de 50 unidades
- 2b. Sistema limita cantidad a 50
- 2c. Sistema muestra advertencia
- Continua en paso 4

FA4: Usuario Anonimo
- 1a. Usuario no autenticado
- 1b. Sistema crea carrito temporal con session_id
- 1c. Sistema guarda en localStorage
- Continua flujo normal

### Postcondiciones
- Item agregado/actualizado en carrito
- Stock reservado temporalmente
- Evento registrado en analytics
- Total de carrito actualizado

### Reglas de Negocio
- RN08: Cantidad minima: 1 unidad
- RN09: Cantidad maxima por producto: 50 unidades
- RN10: Stock se reserva temporalmente por 30 minutos
- RN11: Carrito de usuario anonimo expira en 24 horas

---

## CU-C12: Realizar Pedido (Reserva para Recoger en Tienda)

### Descripcion
Usuario completa el proceso de reserva desde el carrito hasta la confirmacion del pedido para recoger en tienda.

### Actores
- Principal: Usuario autenticado
- Secundarios: Sistema de Email, Sistema de Notificaciones

### Precondiciones
- Usuario debe estar autenticado
- Carrito debe tener al menos 1 producto
- Productos deben tener stock disponible en la sucursal seleccionada

### Flujo Principal

PASO 1: Revision del Carrito
1. Usuario accede al carrito
2. Sistema muestra resumen de productos
3. Sistema calcula subtotal
4. Usuario puede modificar cantidades o eliminar items
5. Usuario hace clic en "Proceder a la Reserva"

PASO 2: Informacion de Sucursal y Recogida
6. Sistema muestra sucursales disponibles
7. Usuario selecciona la sucursal donde recogera el pedido
8. Usuario selecciona fecha y hora de recogida (dentro del horario operativo de la sucursal)
9. Usuario ingresa notas especiales (opcional)
10. Usuario hace clic en "Continuar"

PASO 3: Metodo de Pago y Confirmacion
11. Sistema muestra el metodo de pago unico: "Pago en efectivo al recoger en tienda". No existe cobro en línea ni pago dentro de un POS.
12. Usuario ingresa codigo de descuento (opcional)
13. Sistema calcula total final
14. Usuario hace clic en "Confirmar Reserva"

PASO 4: Procesamiento
15. Sistema valida stock nuevamente en la sucursal seleccionada
16. Sistema crea registro de pedido en BD con estado "PENDING"
17. Sistema genera numero de orden unico
18. Sistema reserva stock de productos en la sucursal
19. Sistema vacia carrito del usuario
20. Sistema envia emails:
    - Confirmacion al cliente con detalles de recogida
    - Notificacion a administradores de la sucursal
21. Sistema envia notificacion push
22. Sistema registra en logs
23. Sistema muestra pantalla de confirmacion

PASO 5: Confirmacion
24. Sistema muestra:
    - Numero de orden
    - Resumen del pedido
    - Estado de reserva (Pendiente)
    - Fecha y hora seleccionada para recoger
    - Sucursal de recogida
25. Sistema ofrece opciones:
    - Ver detalle del pedido
    - Volver al inicio

### Flujos Alternativos

FA1: Stock Insuficiente al Confirmar
- 15a. Sistema detecta stock insuficiente en la sucursal
- 15b. Sistema muestra productos sin stock
- 15c. Sistema ofrece eliminar o reducir cantidad
- Retorna a paso 1

FA2: Codigo de Descuento Invalido
- 12a. Sistema valida codigo
- 12b. Codigo no existe o expiro
- 12c. Sistema muestra error
- Retorna a paso 12

### Postcondiciones Exitosas
- Pedido de reserva creado en BD
- Stock reservado en la sucursal
- Carrito vaciado
- Emails enviados
- Logs registrados

### Reglas de Negocio
- RN12: Pedido minimo: $5.00
- RN13: Horario de recogida: De lunes a domingo de 7am a 9pm
- RN14: Numero de orden formato: ORD-YYYYMMDD-XXXX
- RN15: Pedido se puede cancelar solo si su estado es PENDING o CONFIRMED
- RN16: Las reservas no retiradas en la fecha y hora pactadas se cancelan automaticamente despues de 2 horas de retraso, liberando el stock.

---

## CU-A01: Gestionar Productos (CRUD)

### Descripcion
Administrador crea, lee, actualiza o elimina productos del catalogo general.

### Actores
- Principal: Administrador o Manager

### Precondiciones
- Usuario debe tener rol ADMIN o MANAGER
- Usuario debe estar autenticado

### Flujo Principal - CREAR PRODUCTO

1. Administrador accede a "Gestion de Productos"
2. Administrador hace clic en "Nuevo Producto"
3. Sistema muestra formulario de creacion
4. Administrador ingresa:
   - SKU (auto-generado o manual)
   - Nombre del producto
   - Categoria
   - Descripcion corta
   - Descripcion completa
   - Precio
   - Precio de costo
   - Stock inicial
   - Umbral de stock bajo
   - Peso
   - Calorias
   - Vida util (dias)
   - Requiere refrigeracion (si/no)
   - Tags
   - Alergenos
   - Informacion nutricional
5. Administrador sube imagenes:
   - Imagen principal (requerida)
   - Imagenes adicionales (opcional)
6. Sistema valida:
   - SKU unico
   - Precio > 0
   - Campos requeridos completos
   - Formato de imagenes (JPG, PNG, WebP)
   - Tamano de imagen < 5MB
7. Sistema sube imagenes a Cloudinary u otro servicio de almacenamiento
8. Sistema optimiza y genera thumbnails
9. Sistema crea registro en BD
10. Sistema genera slug unico
11. Sistema registra en logs
12. Sistema muestra mensaje de exito
13. Sistema redirige a lista de productos

### Flujo Principal - EDITAR PRODUCTO

1. Administrador busca producto en lista
2. Administrador hace clic en "Editar"
3. Sistema carga datos actuales en formulario
4. Administrador modifica campos deseados
5. Sistema valida cambios
6. SI cambio de precio:
   - Sistema registra historico de precios
7. Sistema actualiza registro en BD
8. Sistema actualiza timestamp "updated_at"
9. Sistema registra cambio en logs
10. Sistema muestra mensaje de exito

### Flujo Principal - ELIMINAR PRODUCTO

1. Administrador selecciona producto
2. Administrador hace clic en "Eliminar"
3. Sistema verifica si producto tiene:
   - Pedidos activos asociados
   - Items en carritos de clientes
4. SI tiene dependencias:
   - Sistema muestra advertencia
   - Sistema sugiere desactivar en lugar de eliminar
5. Administrador confirma elminacion
6. Sistema realiza soft delete (deleted_at = now())
7. Sistema mantiene en BD para historico
8. Sistema oculta de catalogo publico
9. Sistema registra en logs

### Flujos Alternativos

FA1: SKU Duplicado
- 6a. Sistema detecta SKU existente
- 6b. Sistema muestra error
- 6c. Sistema sugiere SKU alternativo
- Retorna a paso 4

FA2: Error al Subir Imagen
- 7a. El servicio de almacenamiento falla
- 7b. Sistema muestra error
- 7c. Sistema mantiene datos en formulario
- Retorna a paso 5

FA3: Stock Negativo
- 6a. Administrador ingresa stock < 0
- 6b. Sistema rechaza valor
- 6c. Sistema muestra error
- Retorna a paso 4

### Postcondiciones
- Producto creado/actualizado/eliminado
- Imagenes subidas y optimizadas
- Logs registrados
- Cache invalidado

### Reglas de Negocio
- RN17: SKU debe ser unico
- RN18: Precio debe ser mayor a costo
- RN19: Soft delete para mantener historico
- RN20: Cambios de precio se registran en historico
- RN21: Imagenes maximo 5MB cada una
- RN22: Maximo 5 imagenes por producto
- RN23: Slug se genera automaticamente del nombre

---

## CU-A07: Gestionar Pedidos (Reservas)

### Descripcion
Administrador o personal operativo visualiza, filtra y actualiza el estado de las reservas de pedidos hechas por los clientes.

### Actores
- Principal: Administrador o Manager

### Precondiciones
- Usuario con permisos adecuados
- Usuario autenticado

### Flujo Principal

1. Usuario accede a "Gestion de Pedidos"
2. Sistema muestra panel de pedidos:
   - Vista Kanban por estados de reserva
   - Total de reservas del dia
   - Ingresos estimados
3. Usuario puede:
   - Filtrar por: Estado de Reserva, Sucursal, Fecha, Cliente
   - Buscar por numero de orden
4. Usuario selecciona una reserva
5. Sistema muestra detalles completos:
   - Informacion del cliente
   - Productos reservados
   - Sucursal y fecha/hora programada de recogida
   - Estado de pago (Pendiente de pago en caja o Pagado)
   - Timeline de estados
   - Notas del cliente y notas internas
6. Usuario puede:
   - Actualizar estado de la reserva
   - Agregar notas internas
   - Imprimir orden para preparacion
   - Registrar pago y entrega de productos
   - Cancelar reserva
7. Sistema registra todos los cambios en la bitacora de auditoria
8. Sistema envia notificaciones al cliente al cambiar estados criticos

### Actualizar Estado de Pedido

1. Usuario hace clic en "Cambiar Estado"
2. Sistema muestra transiciones de estado validas:
   - PENDING -> CONFIRMED, CANCELLED
   - CONFIRMED -> PREPARING, CANCELLED
   - PREPARING -> READY, CANCELLED
   - READY -> DELIVERED (Entregado al cliente en tienda), CANCELLED
3. Usuario selecciona nuevo estado
4. SI se selecciona CANCELLED:
   - Usuario ingresa razon de cancelacion
   - Sistema libera el stock reservado de la sucursal
5. SI se selecciona DELIVERED:
   - Sistema registra el cobro en caja
   - Sistema marca el inventario como descontado fisicamente
6. Sistema valida transicion de estado
7. Sistema actualiza registro con timestamp
8. Sistema envia notificacion de cambio de estado al cliente via email y push
9. Sistema actualiza el panel de control en tiempo real
10. Sistema registra en logs

### Flujos Alternativos

FA1: Transicion de Estado Invalida
- 6a. Usuario intenta cambio no permitido
- 6b. Sistema muestra error
- 6c. Sistema explica estados validos
- Retorna a paso 2

FA2: Reserva Ya Entregada No Se Puede Cancelar
- 3a. Usuario intenta cancelar pedido DELIVERED
- 3b. Sistema muestra error "El pedido ya fue entregado y pagado"
- Finaliza flujo alternativo

### Postcondiciones
- Estado de la reserva actualizado
- Stock modificado o liberado segun corresponda
- Notificaciones enviadas al cliente
- Logs de auditoria registrados

### Reglas de Negocio
- RN24: Transiciones de estado restringidas por flujo logico
- RN25: Cambio de estado envia notificacion automatica
- RN26: Pedidos en estado DELIVERED o CANCELLED no se pueden modificar
- RN27: Timestamp de cada cambio se registra obligatoriamente

---

## CU-IA01: Predecir Demanda de Productos

### Descripcion
El sistema de IA analiza datos historicos de ventas de producto terminado para sugerir niveles de produccion.

### Actores
- Principal: Sistema de IA
- Secundario: Administrador o Manager (visualiza los resultados)

### Precondiciones
- Debe existir al menos 30 dias de datos historicos de ventas
- Microservicio de IA activo

### Flujo Principal

1. El sistema ejecuta el modelo de prediccion automaticamente todas las noches a las 11 PM
2. El sistema recopila datos de los ultimos 90 dias de la sucursal:
   - Cantidades de productos vendidos por dia
   - Dias de la semana
   - Eventos festivos o dias no habiles
3. El sistema procesa los datos eliminando anomalias y normalizando las series temporales
4. El sistema aplica algoritmos de prediccion de series temporales
5. El sistema genera la prediccion de demanda para los próximos 7 dias
6. El sistema calcula las cantidades sugeridas de productos a hornear y las materias primas estimadas para esa produccion
7. El sistema almacena los resultados de la prediccion en la base de datos
8. El sistema envia alertas a los managers si la demanda sugerida excede la capacidad de produccion usual o si hay riesgo de desabastecimiento de materias primas
9. El manager visualiza en su panel operativo los graficos de prediccion y la tabla de produccion recomendada para el dia siguiente

### Flujos Alternativos

FA1: Datos Insuficientes
- 2a. Menos de 30 dias de historial en la base de datos
- 2b. El sistema calcula un promedio movil simple como estimacion
- 2c. El sistema marca el resultado como "Estimacion base (baja confianza)"
- Continua en paso 5

FA2: Error en el Modelo de ML
- 4a. El modelo de IA presenta fallos de ejecucion o timeout
- 4b. El sistema carga la ultima prediccion valida registrada o promedios historicos
- 4c. El sistema registra el error en los logs y notifica al administrador del sistema
- Finaliza flujo alternativo

### Postcondiciones
- Predicciones de demanda generadas y almacenadas
- Sugerencias de produccion diarias disponibles para consulta
- Logs del proceso de IA registrados

### Reglas de Negocio
- RN28: Ejecucion automatica diaria programada
- RN29: Minimo 30 dias de datos historicos
- RN30: Ajuste automatico de prediccion por dias festivos o fines de semana

---

## CU-IA02: Generar Recomendaciones Personalizadas

### Descripcion
El modulo de IA genera recomendaciones de productos en la tienda en linea basadas en las preferencias del cliente.

### Actores
- Principal: Sistema de IA
- Secundario: Cliente (visualiza las recomendaciones)

### Precondiciones
- Catalogo de productos cargado e imagenes disponibles

### Flujo Principal

1. Cliente autenticado navega por la tienda web
2. El sistema verifica si existen recomendaciones personalizadas calculadas para el usuario en cache
3. SI la cache esta activa y tiene menos de 1 hora:
   - El sistema carga los productos recomendados de la cache
4. SI la cache expiro o no existe:
   - El sistema recopila datos de navegacion y pedidos del cliente (categorias preferidas, productos mas comprados)
   - El sistema aplica algoritmos de recomendacion (filtrado colaborativo y recomendaciones basadas en contenido)
   - El sistema evalua productos con stock disponible y activos en la sucursal del cliente
   - El sistema genera una lista de 10 productos recomendados
   - El sistema guarda los resultados en cache
5. El sistema presenta al cliente los productos recomendados en secciones dedicadas: "Recomendado para ti" o "Te puede gustar"
6. El cliente visualiza y puede agregar estos productos directamente al carrito

### Flujos Alternativos

FA1: Cliente Nuevo o Anonimo (Sin Historial)
- 4a. El sistema detecta que el usuario no tiene historial o es anonimo
- 4b. El sistema genera recomendaciones basadas en los productos mas vendidos de la sucursal y promociones activas
- Continua en paso 5

FA2: Fallo de Comunicacion con Modulo de IA
- 4a. El servicio de IA no responde
- 4b. El sistema muestra por defecto productos destacados y novedades del catalogo general
- Finaliza flujo alternativo

### Postcondiciones
- Recomendaciones de productos generadas e incorporadas al frontend
- Cache del cliente actualizado
- Eventos de interaccion registrados para mejorar el modelo

### Reglas de Negocio
- RN31: La duracion de la cache de recomendaciones es de 1 hora
- RN32: Maximo 10 recomendaciones mostradas simultaneamente
- RN33: Solo se recomiendan productos con stock disponible activo en la sucursal seleccionada

---

## RESUMEN DE CASOS DE USO

### Por Modulo

| Modulo | Cantidad | Complejidad |
|--------|----------|-------------|
| Clientes | 17 | Media |
| Administracion | 11 | Alta |
| IA | 3 | Alta |
| **TOTAL** | **31** | **Alta** |

### Por Prioridad

| Prioridad | Casos de Uso | Fase Inicial |
|-----------|--------------|----------|
| Alta | 18 | Si |
| Media | 10 | Si |
| Baja | 3 | Opcional |

### Casos de Uso del Alcance Inicial

DEBE TENER (Fase 1):
1. CU-C01: Registro de Usuario
2. CU-C02: Inicio de Sesión
3. CU-C05: Ver Catálogo de Productos
4. CU-C08: Ver Detalle de Producto
5. CU-C09: Agregar Producto al Carrito
6. CU-C12: Realizar Pedido (Reserva)
7. CU-A01: Gestionar Productos (CRUD)
8. CU-A07: Gestionar Pedidos (Reservas)
9. CU-A05: Ver Dashboard de Ventas

DEBERIA TENER (Fase 2):
10. CU-C04: Login con OAuth
11. CU-C14: Cancelar Pedido
12. CU-A03: Gestionar Inventario
13. CU-A04: Gestionar Ingredientes
14. CU-IA02: Generar Recomendaciones Personalizadas

PODRIA TENER (Fase 3):
15. CU-IA01: Predecir Demanda de Productos
16. CU-IA03: Chatbot de Atención al Cliente

---

## VALIDACION Y TRAZABILIDAD

Cada caso de uso esta vinculado a:
- Requisitos funcionales
- Historias de usuario
- Tablas de base de datos
- Pantallas disenadas
- APIs necesarias
- Reglas de negocio

**Total de Casos de Uso Documentados: 31**
**Listos para implementacion**
