import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { RedisModule } from 'src/common/redis/redis.module';

import { OrdersController } from './orders.controller';
import { WebhooksController } from './webhooks.controller';
import { OrdersService } from './orders.service';
import { StripeService } from './stripe.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [OrdersController, WebhooksController],
  providers: [OrdersService, StripeService],
  exports: [OrdersService],
})
export class OrdersModule {}
