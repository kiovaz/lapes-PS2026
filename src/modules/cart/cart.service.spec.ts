import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

describe('CartService', () => {
  let service: CartService;

  const mockPrisma = {
    cart: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    cartItem: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const sampleProduct = {
    id: 1,
    name: 'Camiseta Básica',
    description: 'Camiseta 100% algodão',
    price: 59.9,
    stock: 10,
    category: 'Roupas',
    image: null,
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const sampleCart = {
    id: 1,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleCartItem = {
    id: 1,
    cartId: 1,
    productId: 1,
    quantity: 2,
    cart: sampleCart,
    product: sampleProduct,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    jest.clearAllMocks();
  });

  // ─── GET CART ───

  describe('getCart', () => {
    it('deve retornar o carrinho do usuário (com lazy creation via upsert)', async () => {
      const cartWithItems = { ...sampleCart, items: [sampleCartItem] };
      mockPrisma.cart.upsert.mockResolvedValue(cartWithItems);

      const result = await service.getCart(1);

      expect(mockPrisma.cart.upsert).toHaveBeenCalledWith({
        where: { userId: 1 },
        create: { userId: 1 },
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
      expect(result.items).toHaveLength(1);
    });

    it('deve criar carrinho vazio para usuário sem carrinho', async () => {
      const emptyCart = { ...sampleCart, items: [] };
      mockPrisma.cart.upsert.mockResolvedValue(emptyCart);

      const result = await service.getCart(1);

      expect(result.items).toHaveLength(0);
    });
  });

  // ─── ADD ITEM ───

  describe('addItem', () => {
    const dto = { productId: 1, quantity: 2 };

    it('deve adicionar item novo ao carrinho', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(sampleProduct);
      mockPrisma.cart.upsert.mockResolvedValue(sampleCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null); // produto novo
      mockPrisma.cartItem.upsert.mockResolvedValue(sampleCartItem);

      const result = await service.addItem(1, dto);

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
      });
      expect(mockPrisma.cartItem.upsert).toHaveBeenCalled();
      expect(result).toEqual(sampleCartItem);
    });

    it('deve incrementar quantidade se produto já está no carrinho', async () => {
      const existingItem = { ...sampleCartItem, quantity: 3 };
      mockPrisma.product.findFirst.mockResolvedValue(sampleProduct);
      mockPrisma.cart.upsert.mockResolvedValue(sampleCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(existingItem);
      mockPrisma.cartItem.upsert.mockResolvedValue({
        ...existingItem,
        quantity: 5, // 3 + 2
      });

      const result = await service.addItem(1, dto);

      // A quantidade desejada é existingItem.quantity + dto.quantity = 5
      const upsertCall = mockPrisma.cartItem.upsert.mock.calls[0][0];
      expect(upsertCall.update.quantity).toBe(5);
      expect(result.quantity).toBe(5);
    });

    it('deve rejeitar se estoque insuficiente', async () => {
      const lowStockProduct = { ...sampleProduct, stock: 1 };
      mockPrisma.product.findFirst.mockResolvedValue(lowStockProduct);
      mockPrisma.cart.upsert.mockResolvedValue(sampleCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(service.addItem(1, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar se estoque insuficiente com item já no carrinho', async () => {
      const lowStockProduct = { ...sampleProduct, stock: 3 };
      mockPrisma.product.findFirst.mockResolvedValue(lowStockProduct);
      mockPrisma.cart.upsert.mockResolvedValue(sampleCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        ...sampleCartItem,
        quantity: 2, // 2 + 2 = 4 > 3
      });

      await expect(service.addItem(1, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar produto soft-deleted (não encontrado)', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.addItem(1, dto)).rejects.toThrow(NotFoundException);
    });

    it('deve rejeitar produto inexistente', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.addItem(1, { productId: 999, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── UPDATE ITEM ───

  describe('updateItem', () => {
    const dto = { quantity: 5 };

    it('deve atualizar a quantidade do item', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(sampleCartItem);
      mockPrisma.product.findUnique.mockResolvedValue(sampleProduct);
      mockPrisma.cartItem.update.mockResolvedValue({
        ...sampleCartItem,
        quantity: 5,
      });

      const result = await service.updateItem(1, 1, dto);

      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantity: 5 },
        include: { product: true },
      });
      expect(result.quantity).toBe(5);
    });

    it('deve rejeitar se estoque insuficiente', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(sampleCartItem);
      mockPrisma.product.findUnique.mockResolvedValue({
        ...sampleProduct,
        stock: 3,
      });

      await expect(service.updateItem(1, 1, { quantity: 5 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar se item não pertence ao usuário', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        ...sampleCartItem,
        cart: { ...sampleCart, userId: 999 }, // outro usuário
      });

      await expect(service.updateItem(1, 1, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve rejeitar se item não existe', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(service.updateItem(1, 999, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── REMOVE ITEM ───

  describe('removeItem', () => {
    it('deve remover o item do carrinho', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(sampleCartItem);
      mockPrisma.cartItem.delete.mockResolvedValue(sampleCartItem);

      const result = await service.removeItem(1, 1);

      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result.message).toBe('Item removido do carrinho.');
    });

    it('deve rejeitar se item não pertence ao usuário', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        ...sampleCartItem,
        cart: { ...sampleCart, userId: 999 },
      });

      await expect(service.removeItem(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('deve rejeitar se item não existe', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(service.removeItem(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── CLEAR CART ───

  describe('clearCart', () => {
    it('deve limpar todos os itens do carrinho', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(sampleCart);
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.clearCart(1);

      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: sampleCart.id },
      });
      expect(result.message).toBe('Carrinho limpo com sucesso.');
    });

    it('deve retornar mensagem se carrinho não existe', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      const result = await service.clearCart(1);

      expect(mockPrisma.cartItem.deleteMany).not.toHaveBeenCalled();
      expect(result.message).toBe('Carrinho já está vazio.');
    });
  });
});
