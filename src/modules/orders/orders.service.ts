import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from 'src/common/redis/redis.service';
import { StripeService } from './stripe.service';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderStatus, Role, Prisma } from '@prisma/client';

// Transições válidas
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

const CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
];

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly stripe: StripeService,
  ) {}

  //  CHECKOUT

  async checkout(userId: number, dto: CheckoutDto) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: { items: true },
      });

      if (existing) {
        this.logger.log(
          `Idempotência: pedido #${existing.id} retornado para key "${dto.idempotencyKey}"`,
        );
        return { order: existing, clientSecret: null, idempotent: true };
      }
    }

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Carrinho está vazio.');
    }

    for (const item of cart.items) {
      if (item.product.deletedAt) {
        throw new BadRequestException(
          `Produto "${item.product.name}" não está mais disponível.`,
        );
      }
    }
    let address;
    if (dto.addressId) {
      address = await this.prisma.address.findUnique({
        where: { id: dto.addressId },
      });
      if (!address) {
        throw new NotFoundException(
          `Endereço #${dto.addressId} não encontrado.`,
        );
      }
      if (address.userId !== userId) {
        throw new ForbiddenException('Você não tem acesso a este endereço.');
      }
    } else {
      address = await this.prisma.address.findFirst({
        where: { userId, isDefault: true },
      });
    }

    if (!address) {
      throw new BadRequestException(
        'Cadastre um endereço de entrega antes de finalizar a compra.',
      );
    }

    let subtotal = new Prisma.Decimal(0);
    for (const item of cart.items) {
      subtotal = subtotal.add(item.product.price.mul(item.quantity));
    }

    let couponId: number | null = null;
    let discount = new Prisma.Decimal(0);

    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode },
      });

      if (!coupon) {
        throw new NotFoundException(
          `Cupom "${dto.couponCode}" não encontrado.`,
        );
      }

      if (coupon.expiresAt < new Date()) {
        throw new BadRequestException(
          `Cupom "${dto.couponCode}" expirou em ${coupon.expiresAt.toISOString()}.`,
        );
      }

      const alreadyUsed = await this.prisma.couponUsage.findUnique({
        where: {
          couponId_userId: { couponId: coupon.id, userId },
        },
      });

      if (alreadyUsed) {
        throw new BadRequestException(
          `Cupom "${dto.couponCode}" já foi utilizado por você.`,
        );
      }
      if (subtotal.lt(coupon.minOrderValue)) {
        throw new BadRequestException(
          `Valor mínimo do pedido para usar o cupom "${dto.couponCode}" ` +
            `é R$${coupon.minOrderValue}. Subtotal atual: R$${subtotal}.`,
        );
      }
      if (coupon.type === 'PERCENT') {
        discount = subtotal.mul(coupon.value).div(100);
      } else {
        discount = coupon.value;
      }

      if (discount.gt(subtotal)) {
        discount = subtotal;
      }

      couponId = coupon.id;
    }

    const total = subtotal.sub(discount);

    const lockKey = `checkout:user:${userId}`;
    const lockTtl = Number(process.env.CHECKOUT_LOCK_TTL_MS) || 30000;
    const lockToken = await this.redis.acquireLock(lockKey, lockTtl);
    if (!lockToken) {
      throw new ConflictException(
        'Outro checkout está em andamento. Tente novamente em alguns segundos.',
      );
    }

    try {
      // Transação atômica
      const order = await this.prisma.$transaction(
        async (tx) => {
          // Lock pessimista
          const productIds = cart.items.map((i) => i.productId);
          await tx.$queryRawUnsafe(
            `SELECT id FROM products WHERE id IN (${productIds.join(',')}) FOR UPDATE`,
          );
          const products = await tx.product.findMany({
            where: { id: { in: productIds } },
          });

          const productMap = new Map(products.map((p) => [p.id, p]));

          for (const item of cart.items) {
            const product = productMap.get(item.productId);
            if (!product || product.stock < item.quantity) {
              throw new ConflictException(
                `Estoque insuficiente para "${product?.name || 'produto removido'}". ` +
                  `Disponível: ${product?.stock ?? 0}, solicitado: ${item.quantity}.`,
              );
            }
          }
          for (const item of cart.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
          const newOrder = await tx.order.create({
            data: {
              userId,
              total,
              discount,
              couponId,
              idempotencyKey: dto.idempotencyKey || null,
              // Snapshot do endereço de entrega
              shippingStreet: address.street,
              shippingComplement: address.complement,
              shippingNeighborhood: address.neighborhood,
              shippingCity: address.city,
              shippingState: address.state,
              shippingZipCode: address.zipCode,
              items: {
                create: cart.items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  priceAtPurchase: item.product.price,
                })),
              },
            },
            include: { items: true },
          });
          if (couponId) {
            await tx.couponUsage.create({
              data: { couponId, userId },
            });
          }
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

          return newOrder;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 15000,
        },
      );

      this.logger.log(
        `Pedido #${order.id} criado — usuário ${userId} — total R$${total}`,
      );
      let clientSecret: string | null = null;

      try {
        const totalCents = Math.round(total.toNumber() * 100);
        const paymentIntent = await this.stripe.createPaymentIntent(
          totalCents,
          {
            orderId: String(order.id),
            userId: String(userId),
          },
        );
        await this.prisma.order.update({
          where: { id: order.id },
          data: { stripePaymentIntentId: paymentIntent.id },
        });

        clientSecret = paymentIntent.client_secret;
      } catch (stripeError) {
        this.logger.error(
          `Falha ao criar PaymentIntent para pedido #${order.id}`,
          stripeError,
        );
      }
      await this.redis.delByPattern('products:*');

      return { order, clientSecret };
    } finally {
      await this.redis.releaseLock(lockKey, lockToken);
    }
  }

  //  CANCELAMENTO

  async cancel(userId: number, orderId: number, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Pedido #${orderId} não encontrado.`);
    }
    if (role !== Role.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('Você não pode cancelar este pedido.');
    }

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Pedido #${orderId} não pode ser cancelado. Status atual: ${order.status}. ` +
          `Cancelamento só é permitido para pedidos ${CANCELLABLE_STATUSES.join(' ou ')}.`,
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    this.logger.log(`Pedido #${orderId} cancelado — estoque devolvido.`);

    if (order.stripePaymentIntentId) {
      try {
        await this.stripe.createRefund(order.stripePaymentIntentId);
        this.logger.log(
          `Refund processado para pedido #${orderId} (PI: ${order.stripePaymentIntentId})`,
        );
      } catch (err) {
        this.logger.error(
          `Falha ao processar refund para pedido #${orderId}`,
          err,
        );
      }
    }
    await this.redis.delByPattern('products:*');

    return { message: `Pedido #${orderId} cancelado com sucesso.` };
  }

  //  AVANÇAR STATUS (Admin)

  async advanceStatus(orderId: number, newStatus: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Pedido #${orderId} não encontrado.`);
    }
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transição inválida: ${order.status} → ${newStatus}. ` +
          `Transições permitidas de ${order.status}: ${allowed.join(', ') || 'nenhuma'}.`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { items: true },
    });

    this.logger.log(`Pedido #${orderId}: ${order.status} → ${newStatus}`);

    return updated;
  }

  //  WEBHOOK — atualizar status

  async handlePaymentSuccess(paymentIntentId: string) {
    const order = await this.prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!order) {
      this.logger.warn(
        `Webhook: PaymentIntent ${paymentIntentId} não associado a nenhum pedido.`,
      );
      return;
    }

    if (order.status !== OrderStatus.PENDING) {
      this.logger.warn(
        `Webhook: Pedido #${order.id} já não está PENDING (status: ${order.status}). Ignorando.`,
      );
      return;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID },
    });

    this.logger.log(
      `Webhook: Pedido #${order.id} marcado como PAID (PI: ${paymentIntentId})`,
    );
  }

  async handlePaymentFailure(paymentIntentId: string) {
    const order = await this.prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { items: true },
    });

    if (!order) {
      this.logger.warn(
        `Webhook: PaymentIntent ${paymentIntentId} não associado a nenhum pedido.`,
      );
      return;
    }

    if (order.status !== OrderStatus.PENDING) {
      this.logger.warn(
        `Webhook: Pedido #${order.id} já não está PENDING (status: ${order.status}). Ignorando.`,
      );
      return;
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });
    await this.redis.delByPattern('products:*');

    this.logger.log(
      `Webhook: Pedido #${order.id} CANCELADO por falha no pagamento (PI: ${paymentIntentId})`,
    );
  }

  //  LISTAGEM

  async findAll(userId: number, role: string) {
    const where = role === Role.ADMIN ? {} : { userId };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        coupon: {
          select: {
            code: true,
            type: true,
            value: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  async findOne(userId: number, orderId: number, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
              },
            },
          },
        },
        coupon: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido #${orderId} não encontrado.`);
    }

    // Customer só pode ver seus próprios pedidos
    if (role !== Role.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('Você não tem acesso a este pedido.');
    }

    return order;
  }

  //  CONFIRMAR PAGAMENTO (frontend → backend após Stripe confirmCardPayment)

  async confirmPayment(userId: number, orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Pedido #${orderId} não encontrado.`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Você não tem acesso a este pedido.');
    }

    // Já está pago
    if (order.status !== OrderStatus.PENDING) {
      return order;
    }

    if (!order.stripePaymentIntentId) {
      throw new BadRequestException(
        'Pedido não possui PaymentIntent associado.',
      );
    }

    // Verificar no Stripe se o pagamento foi realmente confirmado
    const paymentIntent = await this.stripe.retrievePaymentIntent(
      order.stripePaymentIntentId,
    );

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException(
        `Pagamento ainda não confirmado pelo Stripe. Status: ${paymentIntent.status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
      include: { items: true },
    });

    this.logger.log(
      `Pedido #${orderId} confirmado como PAID via frontend (PI: ${order.stripePaymentIntentId})`,
    );

    return updated;
  }
}
