import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';

import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = new Redis(url);

    this.client.on('connect', () => this.logger.log('🔴 Conectado ao Redis'));

    this.client.on('error', (err) => this.logger.error('Erro no Redis', err));
  }

  // Busca um valor no Redis pela chave.
  // O <T> é um "generic" — permite tipar o retorno
  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.set(key, serialized, 'EX', ttlSeconds);
    } else {
      // Sem TTL = o dado fica salvo até ser deletado manualmente
      await this.client.set(key, serialized);
    }
  }

  // Deleta UMA chave específica do Redis
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delByPattern(pattern: string): Promise<number> {
    // Cursor controla a posição da "varredura" — começa em '0'
    let cursor = '0';
    let deleted = 0;

    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.client.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== '0');

    return deleted;
  }
  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('🔴 Desconectado do Redis');
  }
}
