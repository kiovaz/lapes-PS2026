// SEED dados de exemplo
// Rodar: npm run prisma:seed

import { PrismaClient, Role, CouponType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // === LIMPAR DADOS EXISTENTES ===
  await prisma.couponUsage.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // === USUARIOS ===
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@lapes.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: 'João Cliente',
      email: 'joao@email.com',
      password: hashedPassword,
      role: Role.CUSTOMER,
    },
  });

  console.log('✅ Usuários criados');

  // === PRODUTOS ===
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Camiseta Preta',
        description: 'Camiseta básica 100% algodão',
        price: 49.90,
        stock: 50,
        category: 'roupas',
        image: 'https://placeholder.com/camiseta.jpg',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Boné Azul',
        description: 'Boné aba reta ajustável',
        price: 29.90,
        stock: 25,
        category: 'acessorios',
        image: 'https://placeholder.com/bone.jpg',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Tênis Branco',
        description: 'Tênis casual confortável',
        price: 199.90,
        stock: 10,
        category: 'calcados',
        image: 'https://placeholder.com/tenis.jpg',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Mochila Notebook',
        description: 'Mochila impermeável para notebook 15 polegadas',
        price: 149.90,
        stock: 5,
        category: 'acessorios',
        image: 'https://placeholder.com/mochila.jpg',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Calça Jeans',
        description: 'Calça jeans slim fit',
        price: 119.90,
        stock: 2,
        category: 'roupas',
        image: 'https://placeholder.com/calca.jpg',
      },
    }),
  ]);

  console.log('✅ Produtos criados');

  // === CUPONS ===
  await prisma.coupon.create({
    data: {
      code: 'LAPES10',
      type: CouponType.PERCENT,
      value: 10,                           // 10% de desconto
      minOrderValue: 50,                   // pedido minimo de R$50
      expiresAt: new Date('2026-12-31'),
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'FRETE20',
      type: CouponType.FIXED,
      value: 20,                           // R$20 de desconto
      minOrderValue: 100,                  // pedido minimo de R$100
      expiresAt: new Date('2026-12-31'),
    },
  });

  console.log('✅ Cupons criados');

  // === CARRINHO DO JOAO ===
  await prisma.cart.create({
    data: {
      userId: customer.id,
      items: {
        create: [
          { productId: products[0].id, quantity: 2 },  // 2 camisetas
          { productId: products[2].id, quantity: 1 },  // 1 tênis
        ],
      },
    },
  });

  console.log('✅ Carrinho criado');
  console.log('🎉 Seed finalizado!');
  console.log('');
  console.log('📧 Admin:    admin@lapes.com / 123456');
  console.log('📧 Customer: joao@email.com  / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
