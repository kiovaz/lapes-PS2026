import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';

import { StripeService } from './stripe.service';
import { OrdersService } from './orders.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('stripe')
  @ApiExcludeEndpoint() // não aparece no Swagger público
  @ApiOperation({ summary: 'Webhook do Stripe (uso interno)' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException('Raw body ausente no request.');
    }

    let event;

    try {
      event = this.stripeService.constructEvent(rawBody, signature);
    } catch (err) {
      this.logger.error(
        `Webhook: assinatura inválida — ${(err as Error).message}`,
      );
      throw new BadRequestException('Assinatura do webhook inválida.');
    }

    this.logger.log(`Webhook recebido: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await this.ordersService.handlePaymentSuccess(paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await this.ordersService.handlePaymentFailure(paymentIntent.id);
        break;
      }

      default:
        this.logger.debug(`Webhook ignorado: ${event.type}`);
    }

    return { received: true };
  }
}
