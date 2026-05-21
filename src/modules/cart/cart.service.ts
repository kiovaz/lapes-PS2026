import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Obter carrinho ───

  async getCart(userId: number) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                image: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Carrinho retornado para usuário ${userId}`);
    return cart;
  }

  // ─── Adicionar item ───

  async addItem(userId: number, dto: AddToCartDto) {
    // 1 — Verifica se o produto existe e não está soft-deleted
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Produto #${dto.productId} não encontrado.`);
    }

    // 2 — Garante que o carrinho existe (lazy creation)
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // 3 — Verifica se o produto já está no carrinho
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
    });

    const desiredQuantity = existingItem
      ? existingItem.quantity + dto.quantity
      : dto.quantity;

    // 4 — Valida estoque
    if (product.stock < desiredQuantity) {
      throw new BadRequestException(
        `Estoque insuficiente para o produto "${product.name}". ` +
          `Disponível: ${product.stock}, solicitado: ${desiredQuantity}.`,
      );
    }

    // 5 — Upsert do item (cria ou incrementa)
    const item = await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      update: {
        quantity: desiredQuantity,
      },
      include: { product: true },
    });

    this.logger.log(
      `Item adicionado: produto #${dto.productId}, qty ${desiredQuantity} — usuário ${userId}`,
    );

    return item;
  }

  // ─── Atualizar quantidade ───

  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
    const item = await this.findItemOwnedByUser(userId, itemId);

    // Valida estoque para a nova quantidade
    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product || product.stock < dto.quantity) {
      throw new BadRequestException(
        `Estoque insuficiente para o produto "${product?.name ?? 'desconhecido'}". ` +
          `Disponível: ${product?.stock ?? 0}, solicitado: ${dto.quantity}.`,
      );
    }

    const updated = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
      include: { product: true },
    });

    this.logger.log(
      `Item #${itemId} atualizado para qty ${dto.quantity} — usuário ${userId}`,
    );

    return updated;
  }

  // ─── Remover item ───

  async removeItem(userId: number, itemId: number) {
    await this.findItemOwnedByUser(userId, itemId);

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    this.logger.log(`Item #${itemId} removido — usuário ${userId}`);

    return { message: 'Item removido do carrinho.' };
  }

  // ─── Limpar carrinho ───

  async clearCart(userId: number) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      return { message: 'Carrinho já está vazio.' };
    }

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    this.logger.log(`Carrinho limpo — usuário ${userId}`);

    return { message: 'Carrinho limpo com sucesso.' };
  }

  // ─── Helpers ───

  /**
   * Busca um CartItem e verifica se pertence ao carrinho do usuário.
   * Previne acesso cruzado entre usuários.
   */
  private async findItemOwnedByUser(userId: number, itemId: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException(
        `Item #${itemId} não encontrado no seu carrinho.`,
      );
    }

    return item;
  }
}
