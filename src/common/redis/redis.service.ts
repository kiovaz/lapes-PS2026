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
  // O <T> é um "generic" — permite tipar o retorno (ex: get<Product>('prod:1'))
  // Se não informar o tipo, assume que o retorno é string.
  // Retorna null se a chave não existir.
  async get<T = string>(key: string): Promise<T | null> {

    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    }
    catch {
      return value as unknown as T;
    }
  }

  // Salva um valor no Redis associado a uma chave.
  // - key: a chave (ex: "product:123")
  // - value: o valor a ser salvo (objeto, string, número, etc.)
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {

    // Se o valor já for string, usa direto; senão, converte pra JSON
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

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

  // Deleta VÁRIAS chaves que combinam com um padrão (ex: "products:*").
  // Usa SCAN em vez de KEYS porque o KEYS trava o Redis quando tem muitos dados.
  // O SCAN percorre as chaves aos poucos (de 100 em 100), sem bloquear.
  // Retorna a quantidade de chaves deletadas.
  async delByPattern(pattern: string): Promise<number> {
    // Cursor controla a posição da "varredura" — começa em '0'
    let cursor = '0';

    // Contador de chaves deletadas
    let deleted = 0;

    do {
      // SCAN retorna: [próximo cursor, array de chaves encontradas]
      // MATCH filtra pelo padrão, COUNT sugere quantas chaves verificar por iteração
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      // Se encontrou chaves nessa iteração, deleta todas de uma vez
      if (keys.length > 0) {
        await this.client.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== '0'); // Quando o cursor volta pra '0', terminou a varredura completa

    return deleted;
  }
  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('🔴 Desconectado do Redis');
  }
}
