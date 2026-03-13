import { Body, Controller, Post, Get, Patch, UseGuards, Req, HttpCode, HttpStatus, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RegisterDto, LoginDto, UpdateMeDto, AuthResponseDto, UserDto, RefreshDto, OAuthCallbackDto, ResetPasswordDto } from './dto/auth.dto.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('check-captcha')
  @ApiOperation({ summary: 'Verificar si se requiere captcha', description: 'Retorna si el usuario debe completar captcha basado en intentos fallidos.' })
  @ApiQuery({ name: 'email', required: true })
  @ApiQuery({ name: 'deviceId', required: false })
  @ApiResponse({ status: 200, description: 'Estado del captcha', schema: { properties: { required: { type: 'boolean' } } } })
  async checkCaptcha(@Query('email') email: string, @Query('deviceId') deviceId: string, @Req() req: any) {
    const required = await this.auth.requiresCaptcha(email, req.ip, deviceId);
    return { required };
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registros por minuto
  @ApiOperation({ summary: 'Registro de usuario', description: 'Crea un usuario y devuelve JWT + refreshToken + perfil.' })
  @ApiResponse({ status: 201, description: 'Usuario registrado', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos', type: ErrorResponseDto })
  register(@Body() body: RegisterDto, @Req() req: any) {
    const metadata = { userAgent: req.headers['user-agent'], ip: req.ip };
    return this.auth.register(body, metadata);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 intentos de login por minuto
  @ApiOperation({ summary: 'Inicio de sesión', description: 'Autentica por email/contraseña y retorna JWT + refreshToken.' })
  @ApiResponse({ status: 200, description: 'Login exitoso', type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas', type: ErrorResponseDto })
  login(@Body() body: LoginDto, @Req() req: any) {
    const metadata = { userAgent: req.headers['user-agent'], ip: req.ip };
    return this.auth.login(body, metadata);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK) // Retornar 200 en lugar de 201
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 refresh por minuto
  @ApiOperation({ summary: 'Refrescar token', description: 'Renueva el access token usando un refresh token válido. Rota el refresh token.' })
  @ApiResponse({ status: 200, description: 'Token refrescado', schema: { properties: { token: { type: 'string' }, refreshToken: { type: 'string' } } } })
  @ApiUnauthorizedResponse({ description: 'Refresh token inválido', type: ErrorResponseDto })
  refresh(@Body() body: RefreshDto, @Req() req: any) {
    const metadata = { userAgent: req.headers['user-agent'], ip: req.ip };
    return this.auth.refresh(body.refreshToken, metadata);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión', description: 'Revoca el refresh token actual o todos los tokens del usuario.' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada', schema: { properties: { message: { type: 'string' } } } })
  logout(@Req() req: any, @Body() body?: { refreshToken?: string }) {
    return this.auth.logout(req.user?.userId, body?.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuario actual', description: 'Obtiene el perfil del usuario autenticado.' })
  @ApiResponse({ status: 200, description: 'Usuario actual', type: UserDto })
  me(@Req() req: any) {
    return this.auth.me(req.user?.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar mi perfil', description: 'Actualiza campos del usuario autenticado.' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado', type: UserDto })
  updateMe(@Req() req: any, @Body() body: UpdateMeDto) {
    return this.auth.updateMe(req.user?.userId, body);
  }

  @Post('deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar cuenta', description: 'Desactiva la cuenta del usuario autenticado y revoca todos sus tokens.' })
  @ApiResponse({ status: 200, description: 'Cuenta desactivada', schema: { properties: { id: { type: 'string' }, email: { type: 'string' }, isActive: { type: 'boolean' } } } })
  deactivate(@Req() req: any) {
    return this.auth.deactivate(req.user?.userId);
  }

  @Post('oauth-callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Callback OAuth', description: 'Procesa el callback de OAuth y retorna tokens de autenticación.' })
  @ApiResponse({ status: 200, description: 'OAuth exitoso', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Error en OAuth', type: ErrorResponseDto })
  oauthCallback(@Body() body: OAuthCallbackDto, @Req() req: any) {
    const metadata = { userAgent: req.headers['user-agent'], ip: req.ip };
    return this.auth.handleOAuthCallback(body, metadata);
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @ApiOperation({ 
    summary: 'Cambiar contraseña autenticado', 
    description: 'Actualiza la contraseña del usuario autenticado con JWT de la aplicación.' 
  })
  @ApiResponse({ status: 200, description: 'Contraseña cambiada', schema: { properties: { success: { type: 'boolean' } } } })
  @ApiBadRequestResponse({ description: 'Error al cambiar contraseña', type: ErrorResponseDto })
  resetPassword(@Req() req: any, @Body() body: ResetPasswordDto) {
    return this.auth.updatePassword(req.user?.userId, body.newPassword);
  }

  @Post('reset-password/recovery')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @ApiOperation({
    summary: 'Resetear contraseña por recuperación',
    description: 'Sincroniza la nueva contraseña en la base local usando el token temporal de recuperación de Supabase (Bearer).',
  })
  @ApiResponse({ status: 200, description: 'Contraseña reseteada', schema: { properties: { success: { type: 'boolean' } } } })
  @ApiUnauthorizedResponse({ description: 'Token de recuperación inválido o expirado', type: ErrorResponseDto })
  @ApiBadRequestResponse({ description: 'Error al resetear contraseña', type: ErrorResponseDto })
  resetPasswordFromRecovery(@Req() req: any, @Body() body: ResetPasswordDto) {
    const authorization = String(req.headers?.authorization || '');
    if (!authorization.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Token de recuperación requerido');
    }

    const recoveryAccessToken = authorization.slice(7).trim();
    if (!recoveryAccessToken) {
      throw new UnauthorizedException('Token de recuperación requerido');
    }

    return this.auth.resetPasswordWithSupabaseToken(recoveryAccessToken, body.newPassword);
  }
}
