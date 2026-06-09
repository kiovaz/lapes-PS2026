import { Controller, Post, Body, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Registra um novo customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer registrado com sucesso (retorna o token JWT).',
  })
  @ApiResponse({ status: 409, description: 'Este email já está em uso.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Autentica o usuário no sistema' })
  @ApiResponse({
    status: 200,
    description: 'Login efetuado com sucesso (retorna o token JWT).',
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Retorna o perfil do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil retornado com sucesso (sem a senha).',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  getProfile(
    @CurrentUser() user: { userId: number; email: string; role: string },
  ) {
    return this.authService.getProfile(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({
    summary: 'Atualiza as informações do perfil do usuário logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso (sem a senha).',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  updateProfile(
    @CurrentUser() user: { userId: number; email: string; role: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  @ApiOperation({ summary: 'Altera a senha do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'A senha atual está incorreta.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  changePassword(
    @CurrentUser() user: { userId: number; email: string; role: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }
}
