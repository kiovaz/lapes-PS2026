import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Cria um novo cupom de desconto (admin)',
    description:
      'Cria um cupom do tipo PERCENT ou FIXED. ' +
      'O código é normalizado para maiúsculas.',
  })
  @ApiResponse({ status: 201, description: 'Cupom criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Somente administradores.' })
  @ApiResponse({ status: 409, description: 'Código de cupom já existe.' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Lista todos os cupons (admin)',
    description:
      'Retorna todos os cupons com contagem de usos e pedidos vinculados.',
  })
  @ApiResponse({ status: 200, description: 'Lista de cupons retornada.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Somente administradores.' })
  findAll() {
    return this.couponsService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Detalha um cupom (admin)',
    description:
      'Retorna o cupom com lista de usuários que já utilizaram e contagem de pedidos.',
  })
  @ApiResponse({ status: 200, description: 'Cupom retornado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Somente administradores.' })
  @ApiResponse({ status: 404, description: 'Cupom não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Atualiza um cupom (admin)',
    description:
      'Atualiza campos do cupom. Todos os campos são opcionais. ' +
      'Código é normalizado para maiúsculas.',
  })
  @ApiResponse({ status: 200, description: 'Cupom atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Somente administradores.' })
  @ApiResponse({ status: 404, description: 'Cupom não encontrado.' })
  @ApiResponse({ status: 409, description: 'Código de cupom já existe.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Remove um cupom (admin)',
    description:
      'Remove permanentemente um cupom. Não é permitido remover cupons ' +
      'vinculados a pedidos existentes — altere a data de expiração para desativá-lo.',
  })
  @ApiResponse({ status: 200, description: 'Cupom removido com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Cupom vinculado a pedidos não pode ser removido.',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Somente administradores.' })
  @ApiResponse({ status: 404, description: 'Cupom não encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.remove(id);
  }

  @Post('validate')
  @ApiOperation({
    summary: 'Valida um cupom antes do checkout',
    description:
      'Verifica se o cupom existe, está dentro da validade, ainda não foi usado pelo usuário, ' +
      'e se o subtotal do carrinho atinge o valor mínimo. Retorna o desconto calculado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cupom válido. Retorna desconto e total calculados.',
  })
  @ApiResponse({
    status: 400,
    description: 'Cupom expirado, já usado, ou valor mínimo não atingido.',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 404, description: 'Cupom não encontrado.' })
  validate(
    @CurrentUser() user: { userId: number },
    @Body() dto: ValidateCouponDto,
  ) {
    return this.couponsService.validate(user.userId, dto);
  }
}
