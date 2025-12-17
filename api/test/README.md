# Tests de Seguridad - Panadería API

Este directorio contiene tests end-to-end (e2e) que validan las funcionalidades de seguridad implementadas.

## 📋 Tests Implementados

### `auth-security.e2e-spec.ts`

Suite completa de tests de seguridad para el sistema de autenticación:

#### 1. Autenticación (Login)
- ✅ Login exitoso con credenciales válidas
- ✅ Rechazo de credenciales inválidas
- ✅ Rechazo de usuarios inexistentes

#### 2. Rotación de Refresh Tokens
- ✅ Generación de nuevo par de tokens
- ✅ Revocación automática del token anterior
- ✅ Rechazo de tokens inválidos
- ✅ Validación de DTOs (refresh token requerido)

#### 3. Rate Limiting
- ✅ Bloqueo después de 10 intentos de login/min
- ✅ Bloqueo después de 5 intentos de registro/min
- ✅ Respuesta HTTP 429 (Too Many Requests)

#### 4. Logout y Revocación
- ✅ Revocación de token específico (logout en un dispositivo)
- ✅ Revocación global (logout en todos los dispositivos)
- ✅ Verificación de autenticación requerida

#### 5. Validación de DTOs
- ✅ Rechazo de propiedades no permitidas (forbidNonWhitelisted)
- ✅ Protección contra inyección de campos maliciosos

#### 6. Metadata de Tokens
- ✅ Almacenamiento de IP y User-Agent
- ✅ Trazabilidad de sesiones

#### 7. Expiración
- ✅ Rechazo de tokens expirados

## 🚀 Ejecutar Tests

### Prerrequisitos
```bash
cd api
npm install
```

### Ejecutar todos los tests
```bash
npm run test:e2e
```

### Ejecutar tests específicos
```bash
# Solo tests de autenticación
npx jest -c jest.config.cjs --testNamePattern="Autenticación"

# Solo tests de rate limiting
npx jest -c jest.config.cjs --testNamePattern="Rate Limiting"

# Solo tests de logout
npx jest -c jest.config.cjs --testNamePattern="logout"
```

### Ejecutar con cobertura
```bash
npx jest -c jest.config.cjs --coverage
```

### Modo watch (desarrollo)
```bash
npx jest -c jest.config.cjs --watch
```

## ⚙️ Configuración

Los tests utilizan:
- **Jest**: Framework de testing
- **Supertest**: Peticiones HTTP para e2e
- **@nestjs/testing**: Módulo de testing de NestJS
- **Base de datos**: Misma configuración que desarrollo (lee .env)

### Variables de Entorno

Asegúrate de tener un archivo `.env` con:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="tu-secret-key"
CORS_ORIGINS="http://localhost:3000"
```

## 📊 Resultados Esperados

Todos los tests deben pasar:

```
PASS  test/auth-security.e2e-spec.ts
  Auth Security (e2e)
    POST /auth/login - Autenticación
      ✓ debe autenticar usuario válido y retornar tokens (XXX ms)
      ✓ debe rechazar credenciales inválidas (XXX ms)
      ✓ debe rechazar usuario inexistente (XXX ms)
    POST /auth/refresh - Rotación de Tokens
      ✓ debe generar nuevo par de tokens y revocar el anterior (XXX ms)
      ✓ debe rechazar refresh token inválido (XXX ms)
      ✓ debe rechazar refresh token vacío (XXX ms)
    Rate Limiting - Protección contra fuerza bruta
      ✓ debe bloquear después de 10 intentos de login en 1 minuto (XXX ms)
      ✓ debe bloquear después de 5 intentos de registro en 1 minuto (XXX ms)
    POST /auth/logout - Revocación de Tokens
      ✓ debe revocar refresh token específico (XXX ms)
      ✓ debe revocar todos los tokens si no se especifica refreshToken (XXX ms)
      ✓ debe requerir autenticación para logout (XXX ms)
    Validación de DTOs - forbidNonWhitelisted
      ✓ debe rechazar propiedades no permitidas en login (XXX ms)
      ✓ debe rechazar propiedades no permitidas en registro (XXX ms)
    Metadata de Refresh Tokens
      ✓ debe almacenar IP y User-Agent en refresh token (XXX ms)
    Expiración de Tokens
      ✓ debe rechazar refresh token expirado (XXX ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

## 🐛 Troubleshooting

### Error: Cannot connect to database
- Verifica que PostgreSQL/Supabase esté accesible
- Revisa la variable `DATABASE_URL` en `.env`

### Tests de rate limiting fallan intermitentemente
- Los tests de rate limiting esperan 61 segundos entre ejecuciones
- Asegúrate de no ejecutar múltiples veces seguidas

### Error: bcrypt.compare is not a function
- Verifica que `auth.service.ts` use el import correcto:
```typescript
import bcryptjs from 'bcryptjs';
const bcrypt = bcryptjs.default || bcryptjs;
```

## 📝 Notas

- **Usuarios de prueba**: Los tests crean y limpian automáticamente datos de prueba
- **Aislamiento**: Cada test tiene su propio setup/teardown
- **Timeouts**: Algunos tests (rate limiting) tienen timeouts extendidos
- **Base de datos**: No uses la BD de producción para tests

## 🔄 CI/CD

Para integrar en pipeline:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd api && npm install
      - run: cd api && npm run test:e2e
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

## 📚 Referencias

- [Jest Documentation](https://jestjs.io/)
- [Supertest](https://github.com/visionmedia/supertest)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
