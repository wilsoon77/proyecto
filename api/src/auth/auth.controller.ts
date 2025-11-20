import { Body, Controller, Post, Get, Patch, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RegisterDto, LoginDto, UpdateMeDto, AuthResponseDto, UserDto } from './dto/auth.dto.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registro de usuario', description: 'Crea un usuario y devuelve JWT + perfil.' })
  @ApiResponse({ status: 201, description: 'Usuario registrado', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos', type: ErrorResponseDto })
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Inicio de sesión', description: 'Autentica por email/contraseña y retorna JWT.' })
  @ApiResponse({ status: 200, description: 'Login exitoso', type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas', type: ErrorResponseDto })
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
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
  @ApiOperation({ summary: 'Desactivar cuenta', description: 'Desactiva la cuenta del usuario autenticado.' })
  @ApiResponse({ status: 200, description: 'Cuenta desactivada', schema: { properties: { id: { type: 'string' }, email: { type: 'string' }, isActive: { type: 'boolean' } } } })
  deactivate(@Req() req: any) {
    return this.auth.deactivate(req.user?.userId);
  }
}
