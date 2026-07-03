import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from './common/prisma/prisma.service';
import { RedisService } from './common/redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Verifica a saúde da aplicação e suas dependências',
  })
  @ApiResponse({
    status: 200,
    description: 'Todos os serviços estão saudáveis.',
  })
  @ApiResponse({
    status: 503,
    description: 'Um ou mais serviços estão indisponíveis.',
  })
  async check() {
    const result = {
      status: 'ok' as 'ok' | 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: { status: 'up' as string },
        redis: { status: 'up' as string },
      },
    };

    // Verifica PostgreSQL
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      result.services.database.status = 'down';
      result.status = 'degraded';
    }

    // Verifica Redis
    try {
      const testKey = 'health:ping';
      await this.redis.set(testKey, 'pong', 5000);
      const value = await this.redis.get(testKey);
      if (value !== 'pong') {
        throw new Error('Redis read/write check failed');
      }
    } catch {
      result.services.redis.status = 'down';
      result.status = 'degraded';
    }

    return result;
  }
}
