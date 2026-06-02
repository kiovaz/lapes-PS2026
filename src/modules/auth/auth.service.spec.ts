import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

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

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao@email.com',
      cpf: '11144477735',
      phone: '21988887777',
      birthDate: '1995-06-20',
      password: '123456',
    };

    it('deve registrar um novo usuário e retornar token + dados do user', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const createdUser = {
        id: 1,
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao@email.com',
        cpf: '11144477735',
        phone: '21988887777',
        birthDate: new Date('1995-06-20'),
        password: 'hashed-password',
        role: 'CUSTOMER',
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'joao@email.com' },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { cpf: '11144477735' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao@email.com',
          cpf: '11144477735',
          phone: '21988887777',
          birthDate: new Date('1995-06-20'),
          password: 'hashed-password',
        },
      });

      expect(result).toEqual({
        access_token: 'fake-jwt-token',
        user: {
          id: 1,
          firstName: 'João',
          lastName: 'Silva',
          fullName: 'João Silva',
          email: 'joao@email.com',
          role: 'CUSTOMER',
        },
      });
    });

    it('deve lançar ConflictException (409) se o email já existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'joao@email.com',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException (409) se o CPF já existe', async () => {
      // Email não existe, mas CPF já existe
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: 2, cpf: '11144477735' }); // cpf check

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'joao@email.com', password: '123456' };

    it('deve fazer login com sucesso e retornar token + dados do user', async () => {
      const existingUser = {
        id: 1,
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao@email.com',
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
          firstName: 'João',
          lastName: 'Silva',
          fullName: 'João Silva',
          email: 'joao@email.com',
          role: 'CUSTOMER',
        },
      });
    });

    it('deve lançar UnauthorizedException (401) se o email não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException (401) se a senha está incorreta', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'joao@email.com',
        password: 'hashed-password',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('deve retornar o perfil do usuário SEM o campo password e COM fullName', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao@email.com',
        cpf: '11144477735',
        phone: '21988887777',
        birthDate: new Date('1995-06-20'),
        password: 'hashed-password',
        role: 'CUSTOMER',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });

      const result = await service.getProfile(1);

      expect(result).not.toHaveProperty('password');
      expect(result.fullName).toBe('João Silva');

      expect(result).toEqual({
        id: 1,
        firstName: 'João',
        lastName: 'Silva',
        fullName: 'João Silva',
        email: 'joao@email.com',
        cpf: '11144477735',
        phone: '21988887777',
        birthDate: new Date('1995-06-20'),
        role: 'CUSTOMER',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
    });

    it('deve lançar UnauthorizedException (401) se o user não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
