import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: number, productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Produto #${productId} não encontrado.`);
    }

    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      throw new ConflictException('Este produto já está nos seus favoritos.');
    }

    const item = await this.prisma.wishlistItem.create({
      data: { userId, productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            category: true,
          },
        },
      },
    });

    return item;
  }

  async remove(userId: number, productId: number) {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (!existing) {
      throw new NotFoundException('Este produto não está nos seus favoritos.');
    }

    await this.prisma.wishlistItem.delete({
      where: { id: existing.id },
    });

    return { message: 'Produto removido dos favoritos.' };
  }

  async findAll(userId: number) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            category: true,
            stock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items;
  }

  async check(userId: number, productId: number) {
    const item = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    return { isFavorited: !!item };
  }
}
