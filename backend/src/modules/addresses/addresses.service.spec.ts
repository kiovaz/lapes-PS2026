import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

const mockAddress = (overrides = {}) => ({
  id: 1,
  userId: 1,
  label: 'Casa',
  street: 'Rua das Flores, 123',
  complement: 'Apto 42',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01001000',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AddressesService', () => {
  let service: AddressesService;

  const mockPrisma = {
    address: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      street: 'Rua das Flores, 123',
      complement: 'Apto 42',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01001000',
    };

    it('deve criar endereço com isDefault=true quando é o primeiro', async () => {
      mockPrisma.address.count.mockResolvedValue(0);
      mockPrisma.address.create.mockResolvedValue(
        mockAddress({ isDefault: true }),
      );

      const result = await service.create(1, createDto);

      expect(result.isDefault).toBe(true);
      expect(mockPrisma.address.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          isDefault: true,
        }),
      });
    });

    it('deve criar endereço com isDefault=false quando já existem outros', async () => {
      mockPrisma.address.count.mockResolvedValue(1);
      mockPrisma.address.create.mockResolvedValue(
        mockAddress({ id: 2, isDefault: false }),
      );

      const result = await service.create(1, createDto);

      expect(result.isDefault).toBe(false);
    });

    it('deve desmarcar outros defaults ao criar com isDefault=true', async () => {
      mockPrisma.address.count.mockResolvedValue(1);
      mockPrisma.address.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.address.create.mockResolvedValue(
        mockAddress({ id: 2, isDefault: true }),
      );

      await service.create(1, { ...createDto, isDefault: true });

      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, isDefault: true },
        data: { isDefault: false },
      });
    });

    it('deve rejeitar quando atingir limite de 5 endereços', async () => {
      mockPrisma.address.count.mockResolvedValue(5);

      await expect(service.create(1, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os endereços do usuário ordenados', async () => {
      mockPrisma.address.findMany.mockResolvedValue([mockAddress()]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(1);
      expect(mockPrisma.address.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar endereço do próprio usuário', async () => {
      mockPrisma.address.findUnique.mockResolvedValue(mockAddress());

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
    });

    it('deve rejeitar acesso a endereço de outro usuário', async () => {
      mockPrisma.address.findUnique.mockResolvedValue(
        mockAddress({ userId: 999 }),
      );

      await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('deve rejeitar endereço inexistente', async () => {
      mockPrisma.address.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve remover endereço e promover outro para default', async () => {
      mockPrisma.address.findUnique.mockResolvedValue(
        mockAddress({ isDefault: true }),
      );
      mockPrisma.address.delete.mockResolvedValue(mockAddress());
      mockPrisma.address.findFirst.mockResolvedValue(
        mockAddress({ id: 2, isDefault: false }),
      );
      mockPrisma.address.update.mockResolvedValue(
        mockAddress({ id: 2, isDefault: true }),
      );

      const result = await service.remove(1, 1);

      expect(result.message).toContain('removido');
      expect(mockPrisma.address.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { isDefault: true },
      });
    });

    it('deve remover endereço não-default sem promover ninguém', async () => {
      mockPrisma.address.findUnique.mockResolvedValue(
        mockAddress({ isDefault: false }),
      );
      mockPrisma.address.delete.mockResolvedValue(mockAddress());

      await service.remove(1, 1);

      expect(mockPrisma.address.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('setDefault', () => {
    it('deve definir endereço como padrão e desmarcar os outros', async () => {
      mockPrisma.address.findUnique.mockResolvedValue(
        mockAddress({ id: 2, isDefault: false }),
      );
      mockPrisma.address.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.address.update.mockResolvedValue(
        mockAddress({ id: 2, isDefault: true }),
      );

      const result = await service.setDefault(1, 2);

      expect(result.isDefault).toBe(true);
      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, isDefault: true },
        data: { isDefault: false },
      });
    });
  });
});
