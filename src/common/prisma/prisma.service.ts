
// PRISMA SERVICE —  banco de dados

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  // Conecta banco quando o módulo inicia
  async onModuleInit() {
    await this.$connect();
    console.log('🐘 Conectado ao PostgreSQL');
  }

  // Desconecta quando módulo encerra
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🐘 Desconectado do PostgreSQL');
  }
}
