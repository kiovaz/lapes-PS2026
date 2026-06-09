import { Module } from '@nestjs/common';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';

import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { CartModule } from '../cart/cart.module';
import { CouponsModule } from '../coupons/coupons.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ProductsModule,
    OrdersModule,
    CartModule,
    CouponsModule,
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule { }
