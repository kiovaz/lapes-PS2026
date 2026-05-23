import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CouponType, Prisma } from '@prisma/client';


const decimal = (v: number) => new Prisma.Decimal(v);

const mockCoupon = (overrides = {}) => ({
  id: 1,
  code: 'LAPES10',
  type: CouponType.PERCENT,
  value: decimal(10),
  minOrderValue: decimal(50),
  expiresAt: new Date('2027-12-31'),
  createdAt: new Date(),
  ...overrides,
});


const mockPrismaService = () => ({
  coupon: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  couponUsage: {
    findUnique: jest.fn(),
  },
});

describe('CouponsService', () => {
  let service: CouponsService;
  let prisma: ReturnType<typeof mockPrismaService>;

  beforeEach(async () => {
    prisma = mockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });


  describe('create', () => {
    it('deve criar cupom percentual com sucesso', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);
      prisma.coupon.create.mockResolvedValue(mockCoupon());

      const result = await service.create({
        code: 'lapes10',
        type: CouponType.PERCENT,
        value: 10,
        minOrderValue: 50,
        expiresAt: '2027-12-31T00:00:00.000Z',
      });

      expect(result.code).toBe('LAPES10');
      expect(prisma.coupon.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'LAPES10',
          type: CouponType.PERCENT,
          value: 10,
          minOrderValue: 50,
        }),
      });
    });

    it('deve criar cupom de valor fixo com sucesso', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);
      prisma.coupon.create.mockResolvedValue(
        mockCoupon({ code: 'FRETE20', type: CouponType.FIXED, value: decimal(20) }),
      );

      const result = await service.create({
        code: 'frete20',
        type: CouponType.FIXED,
        value: 20,
        expiresAt: '2027-12-31T00:00:00.000Z',
      });

      expect(result.code).toBe('FRETE20');
    });

    it('deve rejeitar cupom com código duplicado', async () => {
      prisma.coupon.findUnique.mockResolvedValue(mockCoupon());

      await expect(
        service.create({
          code: 'LAPES10',
          type: CouponType.PERCENT,
          value: 10,
          expiresAt: '2027-12-31T00:00:00.000Z',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve rejeitar percentual maior que 100', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          code: 'BIG',
          type: CouponType.PERCENT,
          value: 150,
          expiresAt: '2027-12-31T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });


  describe('findAll', () => {
    it('deve retornar todos os cupons', async () => {
      prisma.coupon.findMany.mockResolvedValue([mockCoupon()]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(prisma.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });



  describe('findOne', () => {
    it('deve retornar cupom por id', async () => {
      prisma.coupon.findUnique.mockResolvedValue(mockCoupon());

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
    });

    it('deve rejeitar cupom inexistente', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });



  describe('update', () => {
    it('deve atualizar valor do cupom', async () => {
      prisma.coupon.findUnique.mockResolvedValue(mockCoupon());
      prisma.coupon.update.mockResolvedValue(
        mockCoupon({ value: decimal(15) }),
      );

      const result = await service.update(1, { value: 15 });

      expect(result.value).toEqual(decimal(15));
    });

    it('deve atualizar código com normalização para UPPER', async () => {
      prisma.coupon.findUnique
        .mockResolvedValueOnce(mockCoupon()) // findOne check
        .mockResolvedValueOnce(null); // uniqueness check
      prisma.coupon.update.mockResolvedValue(
        mockCoupon({ code: 'NEWCODE' }),
      );

      const result = await service.update(1, { code: 'newcode' });

      expect(result.code).toBe('NEWCODE');
    });

    it('deve rejeitar update de código duplicado', async () => {
      prisma.coupon.findUnique
        .mockResolvedValueOnce(mockCoupon()) // findOne check
        .mockResolvedValueOnce(mockCoupon({ id: 2, code: 'TAKEN' })); // uniqueness check

      await expect(
        service.update(1, { code: 'TAKEN' }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve rejeitar cupom inexistente', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { value: 5 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve rejeitar percentual > 100 ao atualizar', async () => {
      prisma.coupon.findUnique.mockResolvedValue(mockCoupon());

      await expect(
        service.update(1, { value: 150 }),
      ).rejects.toThrow(BadRequestException);
    });
  });


  describe('remove', () => {
    it('deve remover cupom sem pedidos vinculados', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...mockCoupon(),
        _count: { orders: 0 },
      });
      prisma.coupon.delete.mockResolvedValue(mockCoupon());

      const result = await service.remove(1);

      expect(result.message).toContain('removido');
      expect(prisma.coupon.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('deve rejeitar remoção de cupom com pedidos vinculados', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...mockCoupon(),
        _count: { orders: 3 },
      });

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar remoção de cupom inexistente', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });


  describe('validate', () => {
    it('deve validar cupom percentual com sucesso', async () => {
      prisma.coupon.findUnique.mockResolvedValue(mockCoupon());
      prisma.couponUsage.findUnique.mockResolvedValue(null);

      const result = await service.validate(1, {
        code: 'LAPES10',
        subtotal: 100,
      });

      expect(result.valid).toBe(true);
      expect(result.discount).toBe('10.00');
      expect(result.total).toBe('90.00');
    });

    it('deve validar cupom de valor fixo com sucesso', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        mockCoupon({
          type: CouponType.FIXED,
          value: decimal(25),
          minOrderValue: decimal(0),
        }),
      );
      prisma.couponUsage.findUnique.mockResolvedValue(null);

      const result = await service.validate(1, {
        code: 'FRETE20',
        subtotal: 100,
      });

      expect(result.valid).toBe(true);
      expect(result.discount).toBe('25.00');
      expect(result.total).toBe('75.00');
    });

    it('deve limitar desconto ao subtotal (desconto > subtotal)', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        mockCoupon({
          type: CouponType.FIXED,
          value: decimal(200),
          minOrderValue: decimal(0),
        }),
      );
      prisma.couponUsage.findUnique.mockResolvedValue(null);

      const result = await service.validate(1, {
        code: 'BIG',
        subtotal: 50,
      });

      expect(result.valid).toBe(true);
      expect(result.discount).toBe('50.00');
      expect(result.total).toBe('0.00');
    });

    it('deve rejeitar cupom inexistente', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.validate(1, { code: 'FAKE', subtotal: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve rejeitar cupom expirado', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        mockCoupon({ expiresAt: new Date('2020-01-01') }),
      );

      await expect(
        service.validate(1, { code: 'LAPES10', subtotal: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar cupom já usado pelo usuário', async () => {
      prisma.coupon.findUnique.mockResolvedValue(mockCoupon());
      prisma.couponUsage.findUnique.mockResolvedValue({
        id: 1,
        couponId: 1,
        userId: 1,
      });

      await expect(
        service.validate(1, { code: 'LAPES10', subtotal: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar cupom com valor mínimo não atingido', async () => {
      prisma.coupon.findUnique.mockResolvedValue(
        mockCoupon({ minOrderValue: decimal(500) }),
      );
      prisma.couponUsage.findUnique.mockResolvedValue(null);

      await expect(
        service.validate(1, { code: 'LAPES10', subtotal: 100 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
