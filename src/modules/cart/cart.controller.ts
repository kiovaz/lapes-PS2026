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

import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Retorna o carrinho do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Carrinho retornado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  getCart(@CurrentUser() user: { userId: number }) {
    return this.cartService.getCart(user.userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Adiciona um item ao carrinho' })
  @ApiResponse({ status: 201, description: 'Item adicionado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Estoque insuficiente.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  addItem(@CurrentUser() user: { userId: number }, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(user.userId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Atualiza a quantidade de um item do carrinho' })
  @ApiResponse({
    status: 200,
    description: 'Quantidade atualizada com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Estoque insuficiente.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 404, description: 'Item não encontrado no carrinho.' })
  updateItem(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.userId, id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove um item do carrinho' })
  @ApiResponse({ status: 200, description: 'Item removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 404, description: 'Item não encontrado no carrinho.' })
  removeItem(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cartService.removeItem(user.userId, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Limpa todos os itens do carrinho' })
  @ApiResponse({ status: 200, description: 'Carrinho limpo com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  clearCart(@CurrentUser() user: { userId: number }) {
    return this.cartService.clearCart(user.userId);
  }
}
