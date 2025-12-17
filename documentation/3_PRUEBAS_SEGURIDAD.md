# Pruebas de Seguridad - Sistema Panadería

## 📋 Resumen de Implementación

Todas las pruebas documentadas en este archivo fueron ejecutadas exitosamente el **22 de noviembre de 2025** y están automatizadas en el archivo `api/test/auth-security.e2e-spec.ts`.

---

## 🔐 Funcionalidades de Seguridad Implementadas

### 1. Helmet - Headers de Seguridad HTTP
- Protección contra XSS, clickjacking, MIME sniffing
- Headers configurados: CSP, X-Frame-Options, HSTS

### 2. CORS Estricto
- Orígenes configurables via variable de entorno `CORS_ORIGINS`
- Advertencia en desarrollo si está completamente abierto
- Bloqueo automático en producción sin configuración

### 3. Rate Limiting
- **Global**: 100 peticiones/minuto
- **Registro**: 5 peticiones/minuto
- **Login**: 10 peticiones/minuto
- **Refresh**: 20 peticiones/minuto

### 4. Refresh Tokens con Rotación
- Tokens generados con `crypto.randomBytes` (32 bytes)
- Almacenados hasheados con bcrypt (10 rounds)
- Expiración: 7 días
- **Rotación automática**: Al usar refresh, el token anterior se revoca
- Metadata capturada: IP, User-Agent

### 5. Logout Seguro
- Revocación selectiva (token específico del dispositivo)
- Revocación global (todos los tokens del usuario)
- Marca timestamp `revokedAt` en base de datos

### 6. Access Tokens de Corta Duración
- Expiración: 15 minutos (reducido desde 7 días)
- Mejor seguridad con modelo de refresh token rotation

### 7. Logging y Auditoría
- LoggerService estructurado con contexto JSON
- Eventos auditados:
  - `auditLogin`: userId, email, IP, userAgent
  - `auditLogout`: userId
  - `auditOrderCreated`: orderId, userId, total
  - `auditStockMovement`: movementId, productId, quantity, type

### 8. Validación Mejorada
- `forbidNonWhitelisted: true` - Rechaza propiedades desconocidas en DTOs
- Swagger deshabilitado automáticamente en producción

---

## ✅ Pruebas Realizadas (22/11/2025)

### Prueba 1: Login Exitoso
**Objetivo**: Verificar que usuarios válidos pueden autenticarse

**Pasos**:
```powershell
POST http://localhost:4000/auth/login
Content-Type: application/json

{
  "email": "admin@panaderia.com",
  "password": "admin123"
}
```

**Resultado Esperado**:
- Status: 200 OK
- Response contiene:
  - `token` (JWT de acceso, válido 15 minutos)
  - `refreshToken` (token de refresco, válido 7 días)
  - `user` (datos del usuario: id, email, firstName, lastName, role)

**✅ Estado**: PASÓ - Login exitoso con tokens generados

---

### Prueba 2: Rotación de Refresh Token
**Objetivo**: Verificar que los refresh tokens rotan correctamente y el anterior se revoca

**Pasos**:
```powershell
# 1. Usar refresh token obtenido en login
POST http://localhost:4000/auth/refresh
Content-Type: application/json

{
  "refreshToken": "e331d0f60aa015f39138470e1cc5ea..."
}
```

**Resultado Esperado**:
- Status: 200 OK
- Response contiene:
  - Nuevo `token` (JWT de acceso)
  - Nuevo `refreshToken` (diferente al anterior)
  - `user` (datos del usuario)
- El refresh token anterior debe quedar revocado en BD (`revokedAt` != null)

**✅ Estado**: PASÓ - Token rotado exitosamente, nuevo par generado

---

### Prueba 3: Rechazo de Token Revocado
**Objetivo**: Verificar que tokens revocados no pueden usarse

**Pasos**:
```powershell
# Intentar usar el refresh token ANTIGUO (ya revocado)
POST http://localhost:4000/auth/refresh
Content-Type: application/json

{
  "refreshToken": "e331d0f60aa015f39138470e1cc5ea..." # Token viejo
}
```

**Resultado Esperado**:
- Status: 401 Unauthorized
- Mensaje de error apropiado

**✅ Estado**: PASÓ - Token revocado correctamente rechazado con 401

---

### Prueba 4: Rate Limiting en Login
**Objetivo**: Verificar que el rate limiting bloquea exceso de peticiones

**Pasos**:
```powershell
# Realizar 11 peticiones de login rápidamente
for ($i = 1; $i -le 11; $i++) {
  POST http://localhost:4000/auth/login
  Body: {"email":"admin@panaderia.com","password":"admin123"}
}
```

**Resultado Esperado**:
- Primeras 9 peticiones: 200 OK
- Peticiones 10-11: 429 Too Many Requests
- Header `Retry-After` presente en respuestas 429

**✅ Estado**: PASÓ - Rate limiting activado en intento 10
- **Aceptadas**: 9 peticiones
- **Bloqueadas**: 2 peticiones (429)

---

### Prueba 5: Logout con Revocación
**Objetivo**: Verificar que logout revoca el refresh token correctamente

**Pasos**:
```powershell
# 1. Hacer logout
POST http://localhost:4000/auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refreshToken": "13a25a69d278cf510d764ab781f453..."
}

# 2. Intentar usar el token después de logout
POST http://localhost:4000/auth/refresh
Content-Type: application/json

{
  "refreshToken": "13a25a69d278cf510d764ab781f453..."
}
```

**Resultado Esperado**:
- Logout: 200 OK, `{"message": "Sesión cerrada"}`
- Intento de refresh posterior: 401 Unauthorized

**✅ Estado**: PASÓ - Token revocado exitosamente tras logout

---

## 🔧 Fix Aplicado Durante Pruebas

### Problema: `bcrypt.compare is not a function`
**Causa**: Import ESM incompatible en `auth.service.ts`

**Solución Aplicada**:
```typescript
// ❌ Antes (no funcionaba)
import * as bcrypt from 'bcryptjs';

// ✅ Después (funcionando)
import bcryptjs from 'bcryptjs';
const bcrypt = bcryptjs.default || bcryptjs;
```

---

## 🧪 Tests Automatizados

Los tests automatizados están en:
```
api/test/auth-security.e2e-spec.ts
```

### Ejecutar Tests
```bash
cd api
npm run test:e2e
```

### Cobertura de Tests
- ✅ Login exitoso con credenciales válidas
- ✅ Login fallido con credenciales inválidas
- ✅ Refresh token rotation (nuevo par generado)
- ✅ Rechazo de refresh token revocado
- ✅ Rate limiting en endpoint de login
- ✅ Rate limiting en endpoint de registro
- ✅ Rate limiting en endpoint de refresh
- ✅ Logout revoca refresh token específico
- ✅ Logout global revoca todos los tokens del usuario
- ✅ Token expirado no puede usarse para refresh

---

## 📊 Configuración de Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| Global (todos) | 100 | 60 segundos |
| POST /auth/register | 5 | 60 segundos |
| POST /auth/login | 10 | 60 segundos |
| POST /auth/refresh | 20 | 60 segundos |

---

## 🔒 Configuración de Tokens

| Token Type | Duración | Almacenamiento |
|------------|----------|----------------|
| Access Token (JWT) | 15 minutos | Client-side (memoria/sessionStorage) |
| Refresh Token | 7 días | Base de datos (hasheado con bcrypt) |

---

## 📝 Variables de Entorno Requeridas

```env
# Seguridad
JWT_SECRET=your-secret-key-here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Opcional
NODE_ENV=production
SWAGGER_ENABLED=false  # Solo en producción si necesitas Swagger
```

---

## 🎯 Próximos Pasos (Opcional)

- [ ] Integrar logging en OrdersService y StockMovementsService
- [ ] Implementar detección de refresh token reuse attacks
- [ ] Agregar rate limiting dinámico basado en IP sospechosas
- [ ] Configurar alertas para eventos de seguridad
- [ ] Implementar 2FA para usuarios ADMIN (opcional para negocio pequeño)

---

## 📚 Referencias

- [NestJS Helmet Documentation](https://docs.nestjs.com/security/helmet)
- [NestJS Throttler](https://docs.nestjs.com/security/rate-limiting)
- [OWASP Refresh Token Best Practices](https://owasp.org/www-project-api-security/)
