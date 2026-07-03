import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo endereço' })
  @ApiResponse({ status: 201, description: 'Endereço criado com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou limite de endereços atingido.',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  create(
    @CurrentUser() user: { userId: number },
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os endereços do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Endereços retornados com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  findAll(@CurrentUser() user: { userId: number }) {
    return this.addressesService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um endereço' })
  @ApiResponse({ status: 200, description: 'Endereço retornado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado.' })
  findOne(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addressesService.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um endereço' })
  @ApiResponse({ status: 200, description: 'Endereço atualizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado.' })
  update(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um endereço' })
  @ApiResponse({ status: 200, description: 'Endereço removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado.' })
  remove(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addressesService.remove(user.userId, id);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Define um endereço como padrão' })
  @ApiResponse({ status: 200, description: 'Endereço definido como padrão.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado.' })
  setDefault(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addressesService.setDefault(user.userId, id);
  }
}
