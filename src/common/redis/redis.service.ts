import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

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

  // Busca valor chave
  // O <T> é um "generic" que permite tipar o retorno
  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlMs) {
      const ttlSeconds = Math.ceil(ttlMs / 1000);
      await this.client.set(key, serialized, 'EX', ttlSeconds);
    } else {
      // Sem TTL = o dado fica salvo até ser deletado ou conteiner encerrar
      await this.client.set(key, serialized);
    }
  }

  // Deleta UMA key
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
  // Distributed Lock
  async acquireLock(key: string, ttlMs: number): Promise<string | null> {
    const lockKey = `lock:${key}`;
    const token = randomUUID();
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    const result = await this.client.set(
      lockKey,
      token,
      'EX',
      ttlSeconds,
      'NX',
    );
    return result === 'OK' ? token : null;
  }

  async releaseLock(key: string, token: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.client.eval(script, 1, lockKey, token);
    return result === 1;
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('🔴 Desconectado do Redis');
  }
}
