# Guia Rapida de Pruebas de Seguridad

> **Nota de ejecución:** los resultados documentados aquí son históricos. Las pruebas e2e requieren una base PostgreSQL/Supabase de pruebas accesible y con las migraciones actuales aplicadas; las pruebas unitarias de dominio pueden ejecutarse sin conexión a Supabase. El método de pago vigente es `EFECTIVO` y el alcance operativo no incluye POS.

## Inicio Rapido

### 1. Ejecutar Tests Automatizados (Recomendado)

```powershell
cd api
npm run test:e2e
```

Esto ejecutará todos los tests de seguridad automáticamente (15 tests).

### 2. Ejecutar Pruebas Manuales

```powershell
# Asegúrate que el servidor esté corriendo
cd api
npm run dev

# En otra terminal
cd api/test
.\manual-tests.ps1
```

---

## Cobertura de Tests

### Tests Automatizados (`auth-security.e2e-spec.ts`)

| Categoría | Tests | Descripción |
|-----------|-------|-------------|
| **Autenticación** | 3 | Login válido/inválido, usuarios inexistentes |
| **Refresh Tokens** | 3 | Rotación, revocación, validación |
| **Rate Limiting** | 2 | Límites de login (10/min) y registro (5/min) |
| **Logout** | 3 | Revocación selectiva/global, autenticación |
| **Validación DTOs** | 2 | forbidNonWhitelisted en login/registro |
| **Metadata** | 1 | IP y User-Agent en tokens |
| **Expiración** | 1 | Tokens expirados |
| **TOTAL** | **15** | |

---

## Checklist de Seguridad

Estas funcionalidades fueron probadas y están funcionando:

- [x] **Helmet** - Headers de seguridad HTTP
- [x] **CORS Estricto** - Orígenes configurables via env
- [x] **Rate Limiting**
  - [x] Global: 100 req/min
  - [x] Login: 10 req/min
  - [x] Registro: 5 req/min
  - [x] Refresh: 20 req/min
- [x] **Refresh Tokens**
  - [x] Generación segura (crypto.randomBytes)
  - [x] Almacenamiento mediante SHA-256 del token opaco (con compatibilidad legacy)
  - [x] Rotación automática
  - [x] Expiración 7 días
- [x] **Access Tokens**
  - [x] JWT firmado
  - [x] Expiración 15 minutos
- [x] **Logout**
  - [x] Revocación selectiva
  - [x] Revocación global
- [x] **Validación**
  - [x] forbidNonWhitelisted activo
  - [x] DTOs validados
- [x] **Logging**
  - [x] Audit trail (login, logout, orders, stock)
  - [x] Contexto estructurado (JSON)
- [x] **Swagger**
  - [x] Deshabilitado en producción

---

## Resultados de Pruebas (22/11/2025)

### Todas las pruebas pasaron exitosamente

**Login**
- ✓ Tokens generados correctamente
- ✓ Credenciales inválidas rechazadas

**Refresh Token Rotation**
- ✓ Nuevo par de tokens generado
- ✓ Token anterior revocado
- ✓ Intento con token viejo → 401 Unauthorized

**Rate Limiting**
- ✓ Bloqueó en intento 10/11 de login
- ✓ Respuesta 429 Too Many Requests
- ✓ 9 aceptadas, 2 bloqueadas

**Logout**
- ✓ Token revocado exitosamente
- ✓ Refresh posterior → 401 Unauthorized

**Validación**
- ✓ Campos no permitidos rechazados con 400

---

## Fix Aplicado

Problema: `bcrypt.compare is not a function`

Solución:
```typescript
// En auth.service.ts
import bcryptjs from 'bcryptjs';
const bcrypt = bcryptjs.default || bcryptjs;
```

---

## Documentacion Completa

- **Detalle de pruebas:** `documentation/3_PRUEBAS_SEGURIDAD.md`
- **Tests automatizados:** `api/test/auth-security.e2e-spec.ts`
- **README de tests:** `api/test/README.md`
- **Script manual:** `api/test/manual-tests.ps1`

---

## Proximos Pasos

Para integrar en CI/CD:

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd api && npm install
      - run: cd api && npm run test:e2e
```

---

## Tips

- **Rate limiting tests:** Espera 61 segundos entre ejecuciones
- **Base de datos:** Los tests usan tu BD configurada en `.env`
- **Limpieza:** Los tests limpian automáticamente datos de prueba
- **Debug:** Usa `--verbose` para ver más detalles

```bash
npx jest -c jest.config.cjs --verbose
```
