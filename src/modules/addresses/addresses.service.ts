import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

const MAX_ADDRESSES_PER_USER = 5;

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: number, dto: CreateAddressDto) {
    const count = await this.prisma.address.count({ where: { userId } });

    if (count >= MAX_ADDRESSES_PER_USER) {
      throw new BadRequestException(
        `Você pode cadastrar no máximo ${MAX_ADDRESSES_PER_USER} endereços.`,
      );
    }

    const isFirstAddress = count === 0;
    const isDefault = dto.isDefault ?? isFirstAddress;

    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        label: dto.label ?? 'Casa',
        street: dto.street,
        complement: dto.complement,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        isDefault,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(userId: number, addressId: number) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException(`Endereço #${addressId} não encontrado.`);
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('Você não tem acesso a este endereço.');
    }

    return address;
  }

  async update(userId: number, addressId: number, dto: UpdateAddressDto) {
    const address = await this.findOne(userId, addressId);

    if (dto.isDefault === true) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: address.id },
      data: dto,
    });
  }

  async remove(userId: number, addressId: number) {
    const address = await this.findOne(userId, addressId);

    await this.prisma.address.delete({ where: { id: address.id } });

    if (address.isDefault) {
      const nextAddress = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      if (nextAddress) {
        await this.prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: `Endereço #${addressId} removido com sucesso.` };
  }

  async setDefault(userId: number, addressId: number) {
    await this.findOne(userId, addressId);

    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }
}
