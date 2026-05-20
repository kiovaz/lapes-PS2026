import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from 'src/common/redis/redis.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockPrisma = {
    product: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
  };

  const sampleProduct = {
    id: 1,
    name: 'Camiseta Básica',
    description: 'Camiseta 100% algodão',
    price: 59.9,
    stock: 100,
    category: 'Roupas',
    image: null,
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);

    jest.clearAllMocks();
  });

  // CREATE

  describe('create', () => {
    const dto = {
      name: 'Camiseta Básica',
      description: 'Camiseta 100% algodão',
      price: 59.9,
      stock: 100,
      category: 'Roupas',
    };

    it('deve criar um produto e invalidar o cache de lista', async () => {
      mockPrisma.product.create.mockResolvedValue({
        id: 1,
        ...dto,
        deletedAt: null,
      });
      mockRedis.delByPattern.mockResolvedValue(0);

      const result = await service.create(dto);

      expect(mockPrisma.product.create).toHaveBeenCalledWith({ data: dto });
      expect(mockRedis.delByPattern).toHaveBeenCalledWith('products:list:*');
      expect(result).toHaveProperty('id', 1);
    });
  });

  // FIND ALL

  describe('findAll', () => {
    it('deve retornar do cache se existir (cache HIT)', async () => {
      const cachedResult = {
        data: [sampleProduct],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      mockRedis.get.mockResolvedValue(cachedResult);

      const result = await service.findAll({});

      expect(mockRedis.get).toHaveBeenCalled();
      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('deve consultar o DB e popular cache se não existe (cache MISS)', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.product.findMany.mockResolvedValue([sampleProduct]);
      mockPrisma.product.count.mockResolvedValue(1);
      mockRedis.set.mockResolvedValue(undefined);

      const result = await service.findAll({});

      expect(mockPrisma.product.findMany).toHaveBeenCalled();
      expect(mockPrisma.product.count).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
      expect(result).toEqual({
        data: [sampleProduct],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });

    it('deve aplicar filtro de category', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ category: 'Roupas' });

      const whereArg = mockPrisma.product.findMany.mock.calls[0][0].where;
      expect(whereArg.category).toBe('Roupas');
      expect(whereArg.deletedAt).toBeNull();
    });

    it('deve aplicar filtros de preço (minPrice e maxPrice)', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ minPrice: 30, maxPrice: 100 });

      const whereArg = mockPrisma.product.findMany.mock.calls[0][0].where;
      expect(whereArg.price).toEqual({ gte: 30, lte: 100 });
    });

    it('deve aplicar busca por nome (search)', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ search: 'camiseta' });

      const whereArg = mockPrisma.product.findMany.mock.calls[0][0].where;
      expect(whereArg.name).toEqual({
        contains: 'camiseta',
        mode: 'insensitive',
      });
    });

    it('deve aplicar paginação (page + limit) e retornar meta com totalPages', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.product.findMany.mockResolvedValue([sampleProduct]);
      mockPrisma.product.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 5 });

      const callArgs = mockPrisma.product.findMany.mock.calls[0][0];
      expect(callArgs.skip).toBe(5);
      expect(callArgs.take).toBe(5);

      expect(result).toEqual({
        data: [sampleProduct],
        meta: { total: 25, page: 2, limit: 5, totalPages: 5 },
      });
    });
  });

  // FIND ONE

  describe('findOne', () => {
    it('deve retornar do cache se existir', async () => {
      mockRedis.get.mockResolvedValue(sampleProduct);

      const result = await service.findOne(1);

      expect(mockRedis.get).toHaveBeenCalledWith('products:detail:1');
      expect(mockPrisma.product.findFirst).not.toHaveBeenCalled();
      expect(result).toEqual(sampleProduct);
    });

    it('deve consultar o DB e popular cache se não está em cache', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.product.findFirst.mockResolvedValue(sampleProduct);

      const result = await service.findOne(1);

      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
      });
      expect(mockRedis.set).toHaveBeenCalledWith(
        'products:detail:1',
        sampleProduct,
        120,
      );
      expect(result).toEqual(sampleProduct);
    });

    it('deve lançar NotFoundException para ID inexistente', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException para produto soft-deleted', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.product.findFirst.mockResolvedValue(null); // deletedAt != null → findFirst com deletedAt: null retorna null

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  // UPDATE

  describe('update', () => {
    const updateDto = { name: 'Camiseta Premium' };

    it('deve atualizar campos e invalidar cache (lista + detalhe)', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(sampleProduct);
      mockPrisma.product.update.mockResolvedValue({
        ...sampleProduct,
        ...updateDto,
      });
      mockRedis.delByPattern.mockResolvedValue(2);
      mockRedis.del.mockResolvedValue(undefined);

      const result = await service.update(1, updateDto);

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
      expect(mockRedis.delByPattern).toHaveBeenCalledWith('products:list:*');
      expect(mockRedis.del).toHaveBeenCalledWith('products:detail:1');
      expect(result.name).toBe('Camiseta Premium');
    });

    it('deve lançar NotFoundException para produto soft-deleted', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });
  });

  // REMOVE

  describe('remove', () => {
    it('deve marcar deletedAt e invalidar cache', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(sampleProduct);
      mockPrisma.product.update.mockResolvedValue({
        ...sampleProduct,
        deletedAt: new Date(),
      });
      mockRedis.delByPattern.mockResolvedValue(3);
      mockRedis.del.mockResolvedValue(undefined);

      const result = await service.remove(1);

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockRedis.delByPattern).toHaveBeenCalledWith('products:list:*');
      expect(mockRedis.del).toHaveBeenCalledWith('products:detail:1');
      expect(result.deletedAt).toBeDefined();
    });

    it('deve lançar NotFoundException se o produto não existe', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });
  });
});
