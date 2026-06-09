import { PrismaClient, Role, CouponType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  await prisma.wishlistItem.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.product.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      firstName: 'Caio',
      lastName: 'Vasconcelos',
      email: 'caiovasconcelos01@live.com',
      cpf: '52998224725',
      phone: '11999990000',
      birthDate: new Date('1990-01-15'),
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.create({
    data: {
      firstName: 'Edgar',
      lastName: 'Klewert',
      email: 'edgar@email.com',
      cpf: '11144477735',
      phone: '21988887777',
      birthDate: new Date('1995-06-20'),
      password: hashedPassword,
      role: Role.CUSTOMER,
    },
  });

  console.log('✅ Usuários criados');

  // Endereços
  await prisma.address.create({
    data: {
      userId: customer.id,
      label: 'Casa',
      street: 'Rua das Flores, 123',
      complement: 'Apto 42',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01001000',
      isDefault: true,
    },
  });

  await prisma.address.create({
    data: {
      userId: customer.id,
      label: 'Trabalho',
      street: 'Av. Paulista, 1000',
      complement: 'Sala 301',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310100',
      isDefault: false,
    },
  });

  await prisma.address.create({
    data: {
      userId: admin.id,
      label: 'Casa',
      street: 'Rua Augusta, 500',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01304001',
      isDefault: true,
    },
  });

  console.log('✅ Endereços criados');

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'O Senhor dos Anéis',
        description: 'Trilogia completa de J.R.R. Tolkien em edição especial',
        price: 89.90,
        stock: 50,
        category: 'fantasia',
        image: 'https://i.imgur.com/t27Zq3t.jpeg',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Clean Code',
        description: 'Código limpo: habilidades práticas do Agile Software — Robert C. Martin',
        price: 59.90,
        stock: 25,
        category: 'tecnologia',
        image: 'https://i.imgur.com/vXotBRy.jpeg',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sapiens',
        description: 'Uma breve história da humanidade — Yuval Noah Harari',
        price: 44.90,
        stock: 10,
        category: 'historia',
        image: 'https://i.imgur.com/62Phlce.jpeg',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Design Patterns',
        description: 'Padrões de projeto: soluções reutilizáveis — GoF',
        price: 79.90,
        stock: 5,
        category: 'tecnologia',
        image: 'https://placeholder.com/design-patterns.jpg',
      },
    }),
    prisma.product.create({
      data: {
        name: '1984',
        description: 'Romance distópico clássico de George Orwell',
        price: 29.90,
        stock: 2,
        category: 'ficcao',
        image: 'https://i.imgur.com/5zapcYS.jpeg',
      },
    }),
  ]);

  console.log('✅ Produtos criados');

  await prisma.coupon.create({
    data: {
      code: 'LAPES10',
      type: CouponType.PERCENT,
      value: 10,
      minOrderValue: 50,
      expiresAt: new Date('2026-12-31'),
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'FRETE20',
      type: CouponType.FIXED,
      value: 20,
      minOrderValue: 100,
      expiresAt: new Date('2026-12-31'),
    },
  });

  console.log('✅ Cupons criados');

  await prisma.cart.create({
    data: {
      userId: customer.id,
      items: {
        create: [
          { productId: products[0].id, quantity: 2 },
          { productId: products[2].id, quantity: 1 },
        ],
      },
    },
  });

  console.log('✅ Carrinho criado');

  // Wishlist
  await prisma.wishlistItem.createMany({
    data: [
      { userId: customer.id, productId: products[1].id },  // Clean Code
      { userId: customer.id, productId: products[3].id },  // Design Patterns
    ],
  });

  console.log('✅ Favoritos criados');
  console.log('🎉 Seed finalizado!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
