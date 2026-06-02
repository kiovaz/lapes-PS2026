import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    const emailExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (emailExists) {
      throw new ConflictException('Este email já está em uso.');
    }

    const cpfExists = await this.prisma.user.findUnique({
      where: { cpf: dto.cpf },
    });

    if (cpfExists) {
      throw new ConflictException('Este CPF já está cadastrado.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const newUser = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        cpf: dto.cpf,
        phone: dto.phone,
        birthDate: new Date(dto.birthDate),
        password: hashedPassword,
      },
    });

    return this.generateToken(newUser);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.generateToken(user);
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-var
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      fullName: `${user.firstName} ${user.lastName}`,
    };
  }

  private generateToken(user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    password: string;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      },
    };
  }
}
