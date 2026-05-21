import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { LoggerMiddleware } from './common/logger/logger.middleware';

// Módulos de domínio
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
// import { OrdersModule } from './modules/orders/orders.module';
// import { CouponsModule } from './modules/coupons/coupons.module';

@Module({
  imports: [
    // RATE LIMITING
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // janela de 60 segundos
        limit: 30, // máximo 30 requisições por janela
      },
    ]),

    // PRISMA + REDIS
    PrismaModule,
    RedisModule,

    // MÓDULOS DE DOMÍNIO
    AuthModule,
    ProductsModule,
    CartModule,
    // OrdersModule,
    // CouponsModule,
  ],
})
export class AppModule implements NestModule {
  // apply o logger em TODAS as rotas
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
