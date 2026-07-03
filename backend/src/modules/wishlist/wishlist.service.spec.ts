import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

const decimal = (v: number) => new Prisma.Decimal(v);

const mockProduct = (overrides = {}) => ({
  id: 1,
  name: 'O Senhor dos Anéis',
  description: 'Trilogia completa de J.R.R. Tolkien',
  price: decimal(89.9),
  stock: 50,
  category: 'fantasia',
  image: 'https://placeholder.com/senhor-dos-aneis.jpg',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockWishlistItem = (overrides = {}) => ({
  id: 1,
  userId: 1,
  productId: 1,
  createdAt: new Date(),
  product: {
    id: 1,
    name: 'O Senhor dos Anéis',
    price: decimal(89.9),
    image: 'https://placeholder.com/senhor-dos-aneis.jpg',
    category: 'fantasia',
  },
  ...overrides,
});

describe('WishlistService', () => {
  let service: WishlistService;

  const mockPrisma = {
    product: {
      findFirst: jest.fn(),
    },
    wishlistItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);

    jest.clearAllMocks();
  });

  describe('add', () => {
    it('deve adicionar produto aos favoritos', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct());
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(null);
      mockPrisma.wishlistItem.create.mockResolvedValue(mockWishlistItem());

      const result = await service.add(1, 1);

      expect(result.productId).toBe(1);
      expect(mockPrisma.wishlistItem.create).toHaveBeenCalledWith({
        data: { userId: 1, productId: 1 },
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
    });

    it('deve rejeitar produto inexistente', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.add(1, 999)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.wishlistItem.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar produto soft-deleted', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null); // findFirst com deletedAt: null retorna null para soft-deleted

      await expect(service.add(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('deve rejeitar produto já favoritado', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct());
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(mockWishlistItem());

      await expect(service.add(1, 1)).rejects.toThrow(ConflictException);
      expect(mockPrisma.wishlistItem.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve remover produto dos favoritos', async () => {
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(mockWishlistItem());
      mockPrisma.wishlistItem.delete.mockResolvedValue(mockWishlistItem());

      const result = await service.remove(1, 1);

      expect(result.message).toContain('removido');
      expect(mockPrisma.wishlistItem.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('deve rejeitar remoção de produto não favoritado', async () => {
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(null);

      await expect(service.remove(1, 999)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.wishlistItem.delete).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os favoritos do usuário', async () => {
      const items = [
        mockWishlistItem(),
        mockWishlistItem({ id: 2, productId: 2 }),
      ];
      mockPrisma.wishlistItem.findMany.mockResolvedValue(items);

      const result = await service.findAll(1);

      expect(result).toHaveLength(2);
      expect(mockPrisma.wishlistItem.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
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
    });

    it('deve retornar lista vazia se não há favoritos', async () => {
      mockPrisma.wishlistItem.findMany.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('check', () => {
    it('deve retornar isFavorited: true quando produto está na wishlist', async () => {
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(mockWishlistItem());

      const result = await service.check(1, 1);

      expect(result.isFavorited).toBe(true);
    });

    it('deve retornar isFavorited: false quando produto não está na wishlist', async () => {
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(null);

      const result = await service.check(1, 999);

      expect(result.isFavorited).toBe(false);
    });
  });
});
