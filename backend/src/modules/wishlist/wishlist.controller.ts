import {
  Controller,
  Post,
  Delete,
  Get,
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

import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os produtos favoritados do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de favoritos retornada com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  findAll(
    @CurrentUser() user: { userId: number; email: string; role: string },
  ) {
    return this.wishlistService.findAll(user.userId);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Adiciona um produto aos favoritos' })
  @ApiResponse({
    status: 201,
    description: 'Produto adicionado aos favoritos.',
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  @ApiResponse({ status: 409, description: 'Produto já está nos favoritos.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  add(
    @CurrentUser() user: { userId: number; email: string; role: string },
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.add(user.userId, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove um produto dos favoritos' })
  @ApiResponse({
    status: 200,
    description: 'Produto removido dos favoritos.',
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não está nos favoritos.',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  remove(
    @CurrentUser() user: { userId: number; email: string; role: string },
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.remove(user.userId, productId);
  }

  @Get(':productId/check')
  @ApiOperation({ summary: 'Verifica se um produto está nos favoritos' })
  @ApiResponse({
    status: 200,
    description: 'Retorna { isFavorited: true/false }.',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  check(
    @CurrentUser() user: { userId: number; email: string; role: string },
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.check(user.userId, productId);
  }
}
