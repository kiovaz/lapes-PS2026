import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RedisService } from 'src/common/redis/redis.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { createHash } from 'crypto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) { }

  // Admin

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({ data: dto });

    await this.invalidateListCache();
    this.logger.log(`Produto criado: ${product.id}`);

    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.ensureExists(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
    });

    await this.invalidateListCache();
    await this.redis.del(`products:detail:${id}`);
    this.logger.log(`Produto atualizado: ${id}`);

    return product;
  }

  async remove(id: number) {
    await this.ensureExists(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.invalidateListCache();
    await this.redis.del(`products:detail:${id}`);
    this.logger.log(`Produto removido (soft delete): ${id}`);

    return product;
  }

  // Público

  async findAll(filters: FilterProductsDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const sortBy = filters.sortBy || 'createdAt';
    const order = filters.order || 'desc';
    const skip = (page - 1) * limit;

    const cacheKey = `products:list:${this.hashFilters(filters)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    // Monta o where
    const where: Record<string, unknown> = { deletedAt: null };

    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined)
        (where.price as Record<string, unknown>).gte = filters.minPrice;
      if (filters.maxPrice !== undefined)
        (where.price as Record<string, unknown>).lte = filters.maxPrice;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
    const listTtlMs = Number(process.env.CACHE_PRODUCTS_LIST_TTL_MS) || 600_000;
    await this.redis.set(cacheKey, result, listTtlMs);
    this.logger.debug(`Cache MISS → populado: ${cacheKey}`);

    return result;
  }

  async findOne(id: number) {
    const cacheKey = `products:detail:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Produto #${id} não encontrado.`);
    }

    const detailTtlMs = Number(process.env.CACHE_PRODUCTS_DETAIL_TTL_MS) || 900_000;
    await this.redis.set(cacheKey, product, detailTtlMs);
    this.logger.debug(`Cache MISS → populado: ${cacheKey}`);

    return product;
  }

  // Helpers

  private async ensureExists(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Produto #${id} não encontrado.`);
    }

    return product;
  }

  private async invalidateListCache() {
    const deleted = await this.redis.delByPattern('products:list:*');
    if (deleted > 0)
      this.logger.debug(`Cache invalidado: ${deleted} chave(s) de lista`);
  }

  private hashFilters(filters: FilterProductsDto): string {
    const sorted = JSON.stringify(filters, Object.keys(filters).sort());
    return createHash('md5').update(sorted).digest('hex');
  }
}
