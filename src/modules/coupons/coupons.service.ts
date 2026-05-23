import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // CRUD(Admin)

  async create(dto: CreateCouponDto) {
    const code = dto.code.toUpperCase().trim();

    const existing = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ConflictException(`Cupom com código "${code}" já existe.`);
    }

    if (dto.type === 'PERCENT' && dto.value > 100) {
      throw new BadRequestException(
        'Percentual de desconto não pode ultrapassar 100%.',
      );
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        code,
        type: dto.type,
        value: dto.value,
        minOrderValue: dto.minOrderValue ?? 0,
        expiresAt: new Date(dto.expiresAt),
      },
    });

    this.logger.log(
      `Cupom criado: ${coupon.code} (${coupon.type} ${coupon.value})`,
    );

    return coupon;
  }

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { couponUsage: true, orders: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { couponUsage: true, orders: true },
        },
        couponUsage: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException(`Cupom #${id} não encontrado.`);
    }

    return coupon;
  }

  async update(id: number, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException(`Cupom #${id} não encontrado.`);
    }

    const data: Prisma.CouponUpdateInput = {};

    if (dto.code !== undefined) {
      const code = dto.code.toUpperCase().trim();

      if (code !== coupon.code) {
        const existing = await this.prisma.coupon.findUnique({
          where: { code },
        });
        if (existing) {
          throw new ConflictException(`Cupom com código "${code}" já existe.`);
        }
      }
      data.code = code;
    }

    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.minOrderValue !== undefined) data.minOrderValue = dto.minOrderValue;
    if (dto.expiresAt !== undefined) data.expiresAt = new Date(dto.expiresAt);

    const finalType = data.type ?? coupon.type;
    const finalValue =
      data.value !== undefined
        ? new Prisma.Decimal(data.value as number)
        : coupon.value;
    if (finalType === 'PERCENT' && finalValue.gt(100)) {
      throw new BadRequestException(
        'Percentual de desconto não pode ultrapassar 100%.',
      );
    }

    const updated = await this.prisma.coupon.update({
      where: { id },
      data,
    });

    this.logger.log(`Cupom #${id} atualizado: ${updated.code}`);

    return updated;
  }

  async remove(id: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!coupon) {
      throw new NotFoundException(`Cupom #${id} não encontrado.`);
    }

    if (coupon._count.orders > 0) {
      throw new BadRequestException(
        `Cupom #${id} não pode ser removido pois está vinculado a ${coupon._count.orders} pedido(s). ` +
          'Considere apenas alterar a data de expiração para desativá-lo.',
      );
    }

    await this.prisma.coupon.delete({ where: { id } });

    this.logger.log(`Cupom #${id} removido: ${coupon.code}`);

    return { message: `Cupom "${coupon.code}" removido com sucesso.` };
  }

  async validate(userId: number, dto: ValidateCouponDto) {
    const code = dto.code.toUpperCase().trim();

    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new NotFoundException(`Cupom "${code}" não encontrado.`);
    }

    if (coupon.expiresAt < new Date()) {
      throw new BadRequestException(
        `Cupom "${code}" expirou em ${coupon.expiresAt.toISOString()}.`,
      );
    }

    const alreadyUsed = await this.prisma.couponUsage.findUnique({
      where: {
        couponId_userId: { couponId: coupon.id, userId },
      },
    });

    if (alreadyUsed) {
      throw new BadRequestException(
        `Cupom "${code}" já foi utilizado por você.`,
      );
    }

    const subtotal = new Prisma.Decimal(dto.subtotal);
    if (subtotal.lt(coupon.minOrderValue)) {
      throw new BadRequestException(
        `Valor mínimo do pedido para usar o cupom "${code}" ` +
          `é R$${coupon.minOrderValue}. Subtotal atual: R$${subtotal}.`,
      );
    }

    let discount: Prisma.Decimal;
    if (coupon.type === 'PERCENT') {
      discount = subtotal.mul(coupon.value).div(100);
    } else {
      discount = coupon.value;
    }

    if (discount.gt(subtotal)) {
      discount = subtotal;
    }

    const total = subtotal.sub(discount);

    return {
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
    };
  }
}
