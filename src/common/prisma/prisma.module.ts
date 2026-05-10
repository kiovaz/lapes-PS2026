// PRISMA MODULE — Exporta o PrismaService pra toda a aplicação

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()   // Global
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule { }
