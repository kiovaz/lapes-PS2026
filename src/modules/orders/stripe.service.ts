import { Injectable, Logger } from '@nestjs/common';
import Stripe = require('stripe');

@Injectable()
export class StripeService {
  private readonly stripe: InstanceType<typeof Stripe>;
  private readonly logger = new Logger(StripeService.name);

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY não definida — pagamentos desabilitados.',
      );
    }

    this.stripe = new Stripe(secretKey || '');
  }

  /**
   * @param amountCents Valor em centavos (R$149.90 → 14990)
   * @param metadata Dados extras vinculados ao pagamento
   */

  async createPaymentIntent(
    amountCents: number,
    metadata: Record<string, string>,
  ) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'brl',
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    this.logger.log(
      `PaymentIntent criado: ${paymentIntent.id} — R$${(amountCents / 100).toFixed(2)}`,
    );

    return paymentIntent;
  }

  async createRefund(paymentIntentId: string) {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    this.logger.log(
      `Refund criado para PaymentIntent ${paymentIntentId}: ${refund.id}`,
    );

    return refund;
  }

  constructEvent(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET não configurada.');
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
