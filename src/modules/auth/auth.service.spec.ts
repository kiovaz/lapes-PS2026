import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = { name: 'Edgar Klewert', email: 'edgarklewert@email.com', password: '123456' };

    it('deve registrar um novo usuário e retornar token + dados do user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const createdUser = {
        id: 1,
        name: 'Edgar Klewert',
        email: 'edgarklewert@email.com',
        password: 'hashed-password',
        role: 'CUSTOMER',
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'edgarklewert@email.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Edgar Klewert',
          email: 'edgarklewert@email.com',
          password: 'hashed-password',
        },
      });

      expect(result).toEqual({
        access_token: 'fake-jwt-token',
        user: {
          id: 1,
          name: 'Edgar Klewert',
          email: 'edgarklewert@email.com',
          role: 'CUSTOMER',
        },
      });
    });

    it('deve lançar ConflictException (409) se o email já existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'edgarklewert@email.com',
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });
  describe('login', () => {
    const loginDto = { email: 'edgarklewert@email.com', password: '123456' };

    it('deve fazer login com sucesso e retornar token + dados do user', async () => {
      const existingUser = {
        id: 1,
        name: 'Edgar Klewert',
        email: 'edgarklewert@email.com',
        password: 'hashed-password',
        role: 'CUSTOMER',
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'fake-jwt-token',
        user: {
          id: 1,
          name: 'Edgar Klewert',
          email: 'edgarklewert@email.com',
          role: 'CUSTOMER',
        },
      });
    });

    it('deve lançar UnauthorizedException (401) se o email não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException (401) se a senha está incorreta', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'edgarklewert@email.com',
        password: 'hashed-password',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('deve retornar o perfil do usuário SEM o campo password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'Edgar Klewert',
        email: 'edgarklewert@email.com',
        password: 'hashed-password',
        role: 'CUSTOMER',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });

      const result = await service.getProfile(1);

      expect(result).not.toHaveProperty('password');

      expect(result).toEqual({
        id: 1,
        name: 'Edgar Klewert',
        email: 'edgarklewert@email.com',
        role: 'CUSTOMER',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
    });

    it('deve lançar UnauthorizedException (401) se o user não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(UnauthorizedException);
    });
  });
});
