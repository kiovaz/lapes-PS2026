import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from 'src/common/redis/redis.service';
import { StripeService } from './stripe.service';
import { OrderStatus, CouponType, Prisma } from '@prisma/client';

// ─── Helpers ───

const decimal = (v: number) => new Prisma.Decimal(v);

const mockProduct = (overrides = {}) => ({
  id: 1,
  name: 'Camiseta Preta',
  description: 'Camiseta básica',
  price: decimal(49.9),
  stock: 10,
  category: 'roupas',
  image: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockCartItem = (productOverrides = {}) => ({
  id: 1,
  cartId: 1,
  productId: 1,
  quantity: 2,
  product: mockProduct(productOverrides),
});

const mockCart = (items = [mockCartItem()]) => ({
  id: 1,
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  items,
});

const mockOrder = (overrides = {}) => ({
  id: 1,
  userId: 1,
  status: OrderStatus.PENDING,
  total: decimal(99.8),
  discount: decimal(0),
  idempotencyKey: null,
  stripePaymentIntentId: 'pi_test_123',
  couponId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    {
      id: 1,
      orderId: 1,
      productId: 1,
      quantity: 2,
      priceAtPurchase: decimal(49.9),
    },
  ],
  ...overrides,
});

// ─── Mock Factories ───

const mockPrismaService = () => ({
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  cart: {
    findUnique: jest.fn(),
  },
  cartItem: {
    deleteMany: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  coupon: {
    findUnique: jest.fn(),
  },
  couponUsage: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRawUnsafe: jest.fn(),
});

const mockRedisService = () => ({
  acquireLock: jest.fn().mockResolvedValue('mock-lock-token'),
  releaseLock: jest.fn().mockResolvedValue(true),
  delByPattern: jest.fn().mockResolvedValue(1),
});

const mockStripeService = () => ({
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_123',
    client_secret: 'pi_test_123_secret_abc',
  }),
  createRefund: jest.fn().mockResolvedValue({ id: 're_test_123' }),
  constructEvent: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: ReturnType<typeof mockPrismaService>;
  let redis: ReturnType<typeof mockRedisService>;
  let stripe: ReturnType<typeof mockStripeService>;

  beforeEach(async () => {
    prisma = mockPrismaService();
    redis = mockRedisService();
    stripe = mockStripeService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: StripeService, useValue: stripe },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  // ═══════════════════════════════════════════
  //  CHECKOUT
  // ═══════════════════════════════════════════

  describe('checkout', () => {
    it('deve criar pedido com sucesso, decrementar estoque e limpar carrinho', async () => {
      const cart = mockCart();

      prisma.cart.findUnique.mockResolvedValue(cart);
      prisma.order.findUnique.mockResolvedValue(null); // sem idempotência prévia

      // Mock da transaction — executa o callback passando o mesmo prisma mock
      prisma.$transaction.mockImplementation(async (fn: Function) => {
        // Dentro da transaction, criar mocks para tx
        const tx = {
          $queryRawUnsafe: jest.fn(),
          product: {
            findMany: jest.fn().mockResolvedValue([mockProduct()]),
            update: jest.fn(),
          },
          order: {
            create: jest.fn().mockResolvedValue(mockOrder()),
          },
          couponUsage: { create: jest.fn() },
          cartItem: { deleteMany: jest.fn() },
        };
        return fn(tx);
      });

      const result = await service.checkout(1, {});

      expect(result.order).toBeDefined();
      expect(result.order.id).toBe(1);
      expect(result.clientSecret).toBe('pi_test_123_secret_abc');
      expect(redis.acquireLock).toHaveBeenCalledWith('checkout:user:1', 30000);
      expect(redis.releaseLock).toHaveBeenCalledWith('checkout:user:1', 'mock-lock-token');
      expect(stripe.createPaymentIntent).toHaveBeenCalled();
      expect(redis.delByPattern).toHaveBeenCalledWith('products:*');
    });

    it('deve retornar pedido existente por idempotencyKey (sem criar novo)', async () => {
      const existingOrder = mockOrder({ idempotencyKey: 'key-123' });
      prisma.order.findUnique.mockResolvedValue(existingOrder);

      const result = await service.checkout(1, { idempotencyKey: 'key-123' });

      expect(result.idempotent).toBe(true);
      expect(result.order.id).toBe(existingOrder.id);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('deve rejeitar checkout com carrinho vazio', async () => {
      prisma.cart.findUnique.mockResolvedValue(mockCart([]));

      await expect(service.checkout(1, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar checkout com carrinho inexistente', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);

      await expect(service.checkout(1, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar checkout com produto soft-deleted', async () => {
      const cart = mockCart([
        mockCartItem({ deletedAt: new Date() }),
      ]);
      prisma.cart.findUnique.mockResolvedValue(cart);

      await expect(service.checkout(1, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar checkout com estoque insuficiente', async () => {
      const cart = mockCart([mockCartItem({ stock: 10 })]);
      // O item pede 2, e o produto dentro da tx só tem 1
      prisma.cart.findUnique.mockResolvedValue(cart);

      prisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          $queryRawUnsafe: jest.fn(),
          product: {
            findMany: jest
              .fn()
              .mockResolvedValue([mockProduct({ stock: 1 })]),
            update: jest.fn(),
          },
          order: { create: jest.fn() },
          couponUsage: { create: jest.fn() },
          cartItem: { deleteMany: jest.fn() },
        };
        return fn(tx);
      });

      await expect(service.checkout(1, {})).rejects.toThrow(ConflictException);
    });

    it('deve rejeitar quando lock do Redis não é obtido', async () => {
      const cart = mockCart();
      prisma.cart.findUnique.mockResolvedValue(cart);
      redis.acquireLock.mockResolvedValue(null);

      await expect(service.checkout(1, {})).rejects.toThrow(
        ConflictException,
      );
    });

    // ─── Cupons ───

    it('deve aplicar cupom percentual corretamente', async () => {
      const cart = mockCart();
      prisma.cart.findUnique.mockResolvedValue(cart);

      prisma.coupon.findUnique.mockResolvedValue({
        id: 1,
        code: 'LAPES10',
        type: CouponType.PERCENT,
        value: decimal(10),
        minOrderValue: decimal(50),
        expiresAt: new Date('2027-12-31'),
      });
      prisma.couponUsage.findUnique.mockResolvedValue(null);

      prisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          $queryRawUnsafe: jest.fn(),
          product: {
            findMany: jest.fn().mockResolvedValue([mockProduct()]),
            update: jest.fn(),
          },
          order: {
            create: jest.fn().mockResolvedValue(
              mockOrder({ discount: decimal(9.98) }),
            ),
          },
          couponUsage: { create: jest.fn() },
          cartItem: { deleteMany: jest.fn() },
        };
        return fn(tx);
      });

      const result = await service.checkout(1, { couponCode: 'LAPES10' });
      expect(result.order).toBeDefined();
    });

    it('deve rejeitar cupom expirado', async () => {
      const cart = mockCart();
      prisma.cart.findUnique.mockResolvedValue(cart);

      prisma.coupon.findUnique.mockResolvedValue({
        id: 1,
        code: 'EXPIRED',
        type: CouponType.PERCENT,
        value: decimal(10),
        minOrderValue: decimal(0),
        expiresAt: new Date('2020-01-01'),
      });

      await expect(
        service.checkout(1, { couponCode: 'EXPIRED' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar cupom já usado pelo usuário', async () => {
      const cart = mockCart();
      prisma.cart.findUnique.mockResolvedValue(cart);

      prisma.coupon.findUnique.mockResolvedValue({
        id: 1,
        code: 'USED',
        type: CouponType.FIXED,
        value: decimal(20),
        minOrderValue: decimal(0),
        expiresAt: new Date('2027-12-31'),
      });
      prisma.couponUsage.findUnique.mockResolvedValue({
        id: 1,
        couponId: 1,
        userId: 1,
      });

      await expect(
        service.checkout(1, { couponCode: 'USED' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar cupom com valor mínimo não atingido', async () => {
      const cart = mockCart([
        mockCartItem({ price: decimal(10) }),
      ]);
      prisma.cart.findUnique.mockResolvedValue(cart);

      prisma.coupon.findUnique.mockResolvedValue({
        id: 1,
        code: 'MINVALUE',
        type: CouponType.FIXED,
        value: decimal(20),
        minOrderValue: decimal(500),
        expiresAt: new Date('2027-12-31'),
      });
      prisma.couponUsage.findUnique.mockResolvedValue(null);

      await expect(
        service.checkout(1, { couponCode: 'MINVALUE' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar cupom inexistente', async () => {
      const cart = mockCart();
      prisma.cart.findUnique.mockResolvedValue(cart);
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.checkout(1, { couponCode: 'FAKE' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════
  //  CANCELAMENTO
  // ═══════════════════════════════════════════

  describe('cancel', () => {
    it('deve cancelar pedido PENDING e devolver estoque', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder());
      prisma.$transaction.mockImplementation(async (fn: Function) => fn(prisma));
      prisma.order.update.mockResolvedValue(
        mockOrder({ status: OrderStatus.CANCELLED }),
      );
      prisma.product.update.mockResolvedValue(mockProduct());

      const result = await service.cancel(1, 1, 'CUSTOMER');

      expect(result.message).toContain('cancelado');
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(stripe.createRefund).toHaveBeenCalledWith('pi_test_123');
    });

    it('deve cancelar pedido PAID e devolver estoque', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: OrderStatus.PAID }),
      );
      prisma.$transaction.mockImplementation(async (fn: Function) => fn(prisma));
      prisma.order.update.mockResolvedValue(
        mockOrder({ status: OrderStatus.CANCELLED }),
      );
      prisma.product.update.mockResolvedValue(mockProduct());

      const result = await service.cancel(1, 1, 'CUSTOMER');

      expect(result.message).toContain('cancelado');
    });

    it('deve rejeitar cancelamento de pedido SHIPPED', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: OrderStatus.SHIPPED }),
      );

      await expect(service.cancel(1, 1, 'CUSTOMER')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar cancelamento de pedido DELIVERED', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: OrderStatus.DELIVERED }),
      );

      await expect(service.cancel(1, 1, 'CUSTOMER')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar cancelamento por outro customer', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ userId: 999 }),
      );

      await expect(service.cancel(1, 1, 'CUSTOMER')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve permitir admin cancelar pedido de outro user', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ userId: 999 }),
      );
      prisma.$transaction.mockImplementation(async (fn: Function) => fn(prisma));
      prisma.order.update.mockResolvedValue(
        mockOrder({ status: OrderStatus.CANCELLED }),
      );
      prisma.product.update.mockResolvedValue(mockProduct());

      const result = await service.cancel(1, 1, 'ADMIN');

      expect(result.message).toContain('cancelado');
    });

    it('deve rejeitar cancelamento de pedido inexistente', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.cancel(1, 999, 'CUSTOMER')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ═══════════════════════════════════════════
  //  MÁQUINA DE ESTADOS
  // ═══════════════════════════════════════════

  describe('advanceStatus', () => {
    it('deve avançar PENDING → PAID', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: OrderStatus.PENDING }),
      );
      prisma.order.update.mockResolvedValue(
        mockOrder({ status: OrderStatus.PAID }),
      );

      const result = await service.advanceStatus(1, OrderStatus.PAID);
      expect(result.status).toBe(OrderStatus.PAID);
    });

    it('deve avançar PAID → SHIPPED', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: OrderStatus.PAID }),
      );
      prisma.order.update.mockResolvedValue(
        mockOrder({ status: OrderStatus.SHIPPED }),
      );

      const result = await service.advanceStatus(1, OrderStatus.SHIPPED);
      expect(result.status).toBe(OrderStatus.SHIPPED);
    });

    it('deve avançar SHIPPED → DELIVERED', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: OrderStatus.SHIPPED }),
      );
      prisma.order.update.mockResolvedValue(
        mockOrder({ status: OrderStatus.DELIVERED }),
      );

      const result = await service.advanceStatus(1, OrderStatus.DELIVERED);
      expect(result.status).toBe(OrderStatus.DELIVERED);
    });

    it('deve rejeitar transição inválida PENDING → SHIPPED', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: OrderStatus.PENDING }),
      );

      await expect(
        service.advanceStatus(1, OrderStatus.SHIPPED),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar transição inválida DELIVERED → qualquer', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: OrderStatus.DELIVERED }),
      );

      await expect(
        service.advanceStatus(1, OrderStatus.PAID),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar transição de pedido CANCELLED', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: OrderStatus.CANCELLED }),
      );

      await expect(
        service.advanceStatus(1, OrderStatus.PAID),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar pedido inexistente', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.advanceStatus(999, OrderStatus.PAID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════
  //  WEBHOOKS
  // ═══════════════════════════════════════════

  describe('handlePaymentSuccess', () => {
    it('deve marcar pedido PENDING como PAID', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder());
      prisma.order.update.mockResolvedValue(
        mockOrder({ status: OrderStatus.PAID }),
      );

      await service.handlePaymentSuccess('pi_test_123');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: OrderStatus.PAID },
      });
    });

    it('deve ignorar se pedido não está PENDING', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: OrderStatus.PAID }),
      );

      await service.handlePaymentSuccess('pi_test_123');

      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('deve ignorar se PaymentIntent não tem pedido associado', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await service.handlePaymentSuccess('pi_unknown');

      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentFailure', () => {
    it('deve cancelar pedido PENDING e devolver estoque', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder());
      prisma.$transaction.mockImplementation(async (fn: Function) => fn(prisma));
      prisma.order.update.mockResolvedValue(
        mockOrder({ status: OrderStatus.CANCELLED }),
      );
      prisma.product.update.mockResolvedValue(mockProduct());

      await service.handlePaymentFailure('pi_test_123');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('deve ignorar se pedido não está PENDING', async () => {
      prisma.order.findUnique.mockResolvedValue(
        mockOrder({ status: OrderStatus.PAID }),
      );

      await service.handlePaymentFailure('pi_test_123');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════
  //  LISTAGEM
  // ═══════════════════════════════════════════

  describe('findAll', () => {
    it('deve listar pedidos do customer (apenas os seus)', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrder()]);

      await service.findAll(1, 'CUSTOMER');

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
        }),
      );
    });

    it('deve listar todos os pedidos para admin', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrder()]);

      await service.findAll(1, 'ADMIN');

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar pedido do próprio customer', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder());

      const result = await service.findOne(1, 1, 'CUSTOMER');
      expect(result.id).toBe(1);
    });

    it('deve rejeitar acesso de outro customer', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder({ userId: 999 }));

      await expect(service.findOne(1, 1, 'CUSTOMER')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve permitir admin acessar pedido de qualquer user', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder({ userId: 999 }));

      const result = await service.findOne(1, 1, 'ADMIN');
      expect(result.id).toBe(1);
    });

    it('deve rejeitar pedido inexistente', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1, 999, 'CUSTOMER')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
