import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { GeminiModule } from './common/gemini/gemini.module';
import { LoggerMiddleware } from './common/logger/logger.middleware';
import { HealthController } from './health.controller';

// Módulos de domínio
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    // RATE LIMITING
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // janela de 60 segundos
        limit: 30, // máximo 30 requisições por janela
      },
    ]),

    // PRISMA + REDIS + GEMINI
    PrismaModule,
    RedisModule,
    GeminiModule,
    // MÓDULOS DE DOMÍNIO
    AuthModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    CouponsModule,
    AddressesModule,
    WishlistModule,
    AiModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  // apply o logger em TODAS as rotas
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
