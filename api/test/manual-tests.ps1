# Script de Pruebas Manuales - Sistema de Seguridad
# Ejecutar desde: api/test/
# Requiere: Servidor corriendo en http://localhost:4000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRUEBAS DE SEGURIDAD - PANADERÍA API  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:4000"
$testEmail = "admin@panaderia.com"
$testPassword = "admin123"

# Test 1: Login
Write-Host "[TEST 1] Login con credenciales válidas" -ForegroundColor Yellow
$body = @{email=$testEmail; password=$testPassword} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $body -ContentType 'application/json'
    Write-Host "✓ PASÓ - Tokens generados" -ForegroundColor Green
    Write-Host "  Access Token: $($response.token.Substring(0,30))..." -ForegroundColor Gray
    Write-Host "  Refresh Token: $($response.refreshToken.Substring(0,30))..." -ForegroundColor Gray
    $global:accessToken = $response.token
    $global:refreshToken = $response.refreshToken
} catch {
    Write-Host "✗ FALLÓ - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Refresh Token
Write-Host "[TEST 2] Refresh token rotation" -ForegroundColor Yellow
$body = @{refreshToken=$global:refreshToken} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method POST -Body $body -ContentType 'application/json'
    Write-Host "✓ PASÓ - Nuevos tokens generados" -ForegroundColor Green
    $global:oldRefreshToken = $global:refreshToken
    $global:accessToken = $response.token
    $global:refreshToken = $response.refreshToken
} catch {
    Write-Host "✗ FALLÓ - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Token revocado
Write-Host "[TEST 3] Verificar revocación de token anterior" -ForegroundColor Yellow
$body = @{refreshToken=$global:oldRefreshToken} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method POST -Body $body -ContentType 'application/json'
    Write-Host "✗ FALLÓ - Token viejo no fue revocado" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ PASÓ - Token revocado correctamente (401)" -ForegroundColor Green
    } else {
        Write-Host "✗ FALLÓ - Error inesperado: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Rate Limiting
Write-Host "[TEST 4] Rate Limiting - 10 intentos de login" -ForegroundColor Yellow
$blocked = 0
$allowed = 0
$body = @{email=$testEmail; password=$testPassword} | ConvertTo-Json

for ($i = 1; $i -le 11; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $body -ContentType 'application/json' -ErrorAction Stop
        $allowed++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            $blocked++
        }
    }
}

if ($blocked -gt 0) {
    Write-Host "✓ PASÓ - Rate limiting activo" -ForegroundColor Green
    Write-Host "  Permitidos: $allowed | Bloqueados: $blocked" -ForegroundColor Gray
} else {
    Write-Host "✗ FALLÓ - No se activó rate limiting" -ForegroundColor Red
}
Write-Host ""

# Test 5: Logout
Write-Host "[TEST 5] Logout y revocación" -ForegroundColor Yellow
Write-Host "Esperando 65 segundos para reset de rate limit..." -ForegroundColor Gray
Start-Sleep -Seconds 65

# Obtener nuevo token primero
$body = @{email=$testEmail; password=$testPassword} | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $body -ContentType 'application/json'
$tokenToRevoke = $loginResponse.refreshToken
$accessToken = $loginResponse.token

# Hacer logout
$body = @{refreshToken=$tokenToRevoke} | ConvertTo-Json
$headers = @{Authorization="Bearer $accessToken"}
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method POST -Body $body -ContentType 'application/json' -Headers $headers
    Write-Host "✓ Logout exitoso: $($response.message)" -ForegroundColor Green
    
    # Verificar revocación
    $testBody = @{refreshToken=$tokenToRevoke} | ConvertTo-Json
    try {
        $testResponse = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method POST -Body $testBody -ContentType 'application/json'
        Write-Host "✗ FALLÓ - Token no fue revocado" -ForegroundColor Red
    } catch {
        Write-Host "✓ PASÓ - Token revocado correctamente" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ FALLÓ - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Validación de DTOs
Write-Host "[TEST 6] Validación forbidNonWhitelisted" -ForegroundColor Yellow
$body = @{
    email=$testEmail
    password=$testPassword
    maliciousField="should be rejected"
} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $body -ContentType 'application/json'
    Write-Host "✗ FALLÓ - Propiedad maliciosa no fue rechazada" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✓ PASÓ - Propiedad no permitida rechazada (400)" -ForegroundColor Green
    } else {
        Write-Host "✗ FALLÓ - Error inesperado: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
Write-Host ""

# Resumen
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRUEBAS COMPLETADAS                   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para pruebas automatizadas completas, ejecuta:" -ForegroundColor Yellow
Write-Host "  npm run test:e2e" -ForegroundColor White
Write-Host ""
