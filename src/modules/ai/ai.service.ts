import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GeminiService } from 'src/common/gemini/gemini.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { CartService } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import {
  SchemaType,
  FunctionDeclarationsTool,
  Content,
} from '@google/generative-ai';

export interface ExtractedFilters {
  category?: string;
  keywords?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly orders: OrdersService,
    private readonly cart: CartService,
    private readonly coupons: CouponsService,
  ) { }


  async smartSearch(query: string) {
    if (!this.gemini.isAvailable) {
      throw new BadRequestException(
        'Serviço de IA não está configurado. Verifique a GEMINI_API_KEY.',
      );
    }

    const categories = await this.products.getCategories();

    const systemInstruction = [
      'Você é um parser de busca de e-commerce.',
      'Seu trabalho é extrair filtros estruturados de uma busca em linguagem natural.',
      `Categorias disponíveis na loja: ${categories.join(', ')}.`,
      'Se o usuário mencionar uma categoria, use o nome EXATO da lista acima.',
      'Se não houver match exato, deixe o campo category vazio e coloque tudo em keywords.',
      'Para preços, extraia minPrice e/ou maxPrice quando mencionados.',
      'Para ordenação, use "price" para preço, "name" para nome, "createdAt" para novidades.',
      'Para ordem, use "asc" para crescente (barato/A-Z) e "desc" para decrescente (caro/Z-A).',
    ].join('\n');

    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        category: {
          type: SchemaType.STRING,
          description:
            'Categoria do produto (deve ser uma das categorias disponíveis)',
          nullable: true,
        },
        keywords: {
          type: SchemaType.STRING,
          description:
            'Palavras-chave para busca textual (nome/descrição do produto)',
          nullable: true,
        },
        minPrice: {
          type: SchemaType.NUMBER,
          description: 'Preço mínimo em reais',
          nullable: true,
        },
        maxPrice: {
          type: SchemaType.NUMBER,
          description: 'Preço máximo em reais',
          nullable: true,
        },
        sortBy: {
          type: SchemaType.STRING,
          description: 'Campo para ordenação: price, name ou createdAt',
          nullable: true,
        },
        sortOrder: {
          type: SchemaType.STRING,
          description: 'Direção da ordenação: asc ou desc',
          nullable: true,
        },
      },
    };

    const filters =
      await this.gemini.generateStructuredOutput<ExtractedFilters>(
        query,
        schema,
        systemInstruction,
      );

    this.logger.log(
      `Busca inteligente: "${query}" → filtros: ${JSON.stringify(filters)}`,
    );

    const result = await this.products.findAll({
      search: filters.keywords || undefined,
      category: filters.category || undefined,
      minPrice: filters.minPrice ?? undefined,
      maxPrice: filters.maxPrice ?? undefined,
      sortBy: (filters.sortBy as any) || 'createdAt',
      order: (filters.sortOrder as any) || 'desc',
      page: 1,
      limit: 20,
    });

    const resultObj =
      typeof result === 'object' && result !== null
        ? result
        : { data: [], meta: {} };

    return {
      query,
      interpretedFilters: filters,
      ...(resultObj as Record<string, unknown>),
    };
  }


  async chat(
    userId: number,
    message: string,
    historyItems?: { role: 'user' | 'model'; content: string }[],
  ) {
    if (!this.gemini.isAvailable) {
      throw new BadRequestException(
        'Serviço de IA não está configurado. Verifique a GEMINI_API_KEY.',
      );
    }

    const systemInstruction = [
      'Você é o assistente virtual de um e-commerce.',
      'Ajude os clientes com busca de produtos, informações de pedidos, cupons e dúvidas gerais.',
      '',
      'Regras:',
      '- Sempre responda em português brasileiro',
      '- Seja cordial, objetivo e útil',
      '- Use os dados reais da loja via function calling — NUNCA invente dados',
      '- Formate preços em R$ (ex: R$ 199,90)',
      '- Se não souber algo, diga que não tem essa informação',
      '- Quando listar produtos, mencione nome, preço e categoria',
      '- Para status de pedidos, explique o que cada status significa',
      '- Seja conciso — respostas longas cansam o usuário',
      '',
      'Status de pedidos:',
      '- PENDING = Aguardando pagamento',
      '- PAID = Pago, aguardando envio',
      '- SHIPPED = Enviado',
      '- DELIVERED = Entregue',
      '- CANCELLED = Cancelado',
    ].join('\n');

    const tools: FunctionDeclarationsTool[] = [
      {
        functionDeclarations: [
          {
            name: 'searchProducts',
            description:
              'Busca produtos no catálogo da loja com filtros opcionais.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                search: {
                  type: SchemaType.STRING,
                  description: 'Termo de busca por nome ou descrição',
                },
                category: {
                  type: SchemaType.STRING,
                  description: 'Filtrar por categoria',
                },
                minPrice: {
                  type: SchemaType.NUMBER,
                  description: 'Preço mínimo',
                },
                maxPrice: {
                  type: SchemaType.NUMBER,
                  description: 'Preço máximo',
                },
              },
            },
          },
          {
            name: 'getCategories',
            description:
              'Lista todas as categorias de produtos disponíveis na loja.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {},
            },
          },
          {
            name: 'getProductDetails',
            description: 'Retorna detalhes completos de um produto pelo ID.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                productId: {
                  type: SchemaType.NUMBER,
                  description: 'ID do produto',
                },
              },
              required: ['productId'],
            },
          },
          {
            name: 'getCart',
            description:
              'Retorna o carrinho de compras do usuário atual, com todos os itens.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {},
            },
          },
          {
            name: 'getOrders',
            description:
              'Lista todos os pedidos do usuário atual, do mais recente ao mais antigo.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {},
            },
          },
          {
            name: 'getOrderDetails',
            description:
              'Retorna detalhes completos de um pedido específico pelo ID.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                orderId: {
                  type: SchemaType.NUMBER,
                  description: 'ID do pedido',
                },
              },
              required: ['orderId'],
            },
          },
          {
            name: 'checkCoupon',
            description:
              'Verifica se um cupom de desconto existe e está válido. Retorna informações do cupom.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                code: {
                  type: SchemaType.STRING,
                  description: 'Código do cupom',
                },
              },
              required: ['code'],
            },
          },
        ],
      },
    ];

    const history: Content[] = (historyItems || []).map((item) => ({
      role: item.role,
      parts: [{ text: item.content }],
    }));
    const functionExecutor = async (
      name: string,
      args: Record<string, unknown>,
    ): Promise<unknown> => {
      switch (name) {
        case 'searchProducts':
          return this.products.findAll({
            search: (args.search as string) || undefined,
            category: (args.category as string) || undefined,
            minPrice: args.minPrice as number | undefined,
            maxPrice: args.maxPrice as number | undefined,
            page: 1,
            limit: 10,
          });

        case 'getCategories':
          return this.products.getCategories();

        case 'getProductDetails':
          return this.products.findOne(args.productId as number);

        case 'getCart':
          return this.cart.getCart(userId);

        case 'getOrders':
          return this.orders.findAll(userId, 'CUSTOMER');

        case 'getOrderDetails':
          return this.orders.findOne(
            userId,
            args.orderId as number,
            'CUSTOMER',
          );

        case 'checkCoupon': {
          const code = (args.code as string).toUpperCase().trim();
          const coupon = await this.prisma.coupon.findUnique({
            where: { code },
          });

          if (!coupon) {
            return { valid: false, message: `Cupom "${code}" não encontrado.` };
          }

          const isExpired = coupon.expiresAt < new Date();
          return {
            valid: !isExpired,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minOrderValue: coupon.minOrderValue,
            expiresAt: coupon.expiresAt,
            message: isExpired
              ? `Cupom "${code}" expirou em ${coupon.expiresAt.toISOString()}.`
              : `Cupom "${code}" válido! ${coupon.type === 'PERCENT' ? `${coupon.value}% de desconto` : `R$${coupon.value} de desconto`}.`,
          };
        }

        default:
          throw new Error(`Função "${name}" não reconhecida.`);
      }
    };
    const result = await this.gemini.chatWithFunctions(
      systemInstruction,
      history,
      message,
      tools,
      functionExecutor,
    );

    this.logger.log(
      `Chat: "${message}" → funções chamadas: [${result.functionsCalled.join(', ')}]`,
    );

    return {
      response: result.text,
      functionsCalled: result.functionsCalled,
    };
  }
}
