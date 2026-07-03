import {
  Controller,
  Get,
  Post,
  Patch,
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

import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Checkout

  @Post('checkout')
  @ApiOperation({
    summary: 'Cria um pedido a partir do carrinho',
    description:
      'Reserva estoque atomicamente, aplica cupom, cria PaymentIntent no Stripe ' +
      'e retorna o client_secret para confirmar o pagamento no frontend.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado com sucesso. Retorna order + clientSecret.',
  })
  @ApiResponse({
    status: 400,
    description: 'Carrinho vazio ou cupom inválido.',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({
    status: 409,
    description: 'Estoque insuficiente ou checkout em andamento.',
  })
  checkout(@CurrentUser() user: { userId: number }, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(user.userId, dto);
  }

  // Listar pedidos

  @Get()
  @ApiOperation({
    summary: 'Lista pedidos do usuário (admin vê todos)',
  })
  @ApiResponse({ status: 200, description: 'Pedidos retornados com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  findAll(@CurrentUser() user: { userId: number; role: string }) {
    return this.ordersService.findAll(user.userId, user.role);
  }

  // Detalhar pedido

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um pedido' })
  @ApiResponse({ status: 200, description: 'Pedido retornado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado.' })
  findOne(
    @CurrentUser() user: { userId: number; role: string },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.findOne(user.userId, id, user.role);
  }

  // Cancelar pedido

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancela um pedido (antes de SHIPPED)',
    description:
      'Cancela o pedido e devolve o estoque. Se o pagamento já foi feito, ' +
      'um refund é processado no Stripe.',
  })
  @ApiResponse({ status: 200, description: 'Pedido cancelado com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Pedido não pode ser cancelado (já enviado/entregue).',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado.' })
  cancel(
    @CurrentUser() user: { userId: number; role: string },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.cancel(user.userId, id, user.role);
  }

  // Avançar status (Admin)

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Avança o status do pedido (somente Admin)',
    description:
      'Máquina de estados: PENDING→PAID→SHIPPED→DELIVERED. ' +
      'Cancelamento via endpoint separado.',
  })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Transição de status inválida.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Somente administradores.' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado.' })
  advanceStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.advanceStatus(id, dto.status);
  }

  // Confirmar pagamento (frontend após Stripe confirmCardPayment)

  @Patch(':id/confirm-payment')
  @ApiOperation({
    summary: 'Confirma pagamento de um pedido',
    description:
      'Chamado pelo frontend após confirmCardPayment do Stripe retornar sucesso. ' +
      'Verifica no Stripe se o pagamento foi realmente confirmado e atualiza o status para PAID.',
  })
  @ApiResponse({ status: 200, description: 'Pagamento confirmado.' })
  @ApiResponse({ status: 400, description: 'Pagamento não confirmado pelo Stripe.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado.' })
  confirmPayment(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.confirmPayment(user.userId, id);
  }
}
