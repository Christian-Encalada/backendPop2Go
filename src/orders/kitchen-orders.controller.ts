import { Body, Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { OrdersService } from './orders.service';

/**
 * Endpoints para Cocina/Local
 * - Ver pedidos de su ciudad
 * - Confirmar pedido (nuevo -> preparando)
 * - Marcar listo para recoger (asignado -> listo_para_recoger)
 */
@ApiTags('kitchen-orders')
@Controller('kitchen/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class KitchenOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles('cocina')
  @ApiOperation({ summary: 'Listar pedidos de cocina (por ciudad del usuario)' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos' })
  list(@Req() req) {
    // Cocina ve pedidos de su ciudad (mismo filtro que admin)
    return this.ordersService.findAll(undefined, ['admin'], req.user.cityId);
  }

  @Patch(':id/confirm')
  @Roles('cocina')
  @ApiOperation({ summary: 'Confirmar pedido (nuevo/pendiente -> preparando)' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Pedido actualizado' })
  confirm(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.kitchenConfirm(id, req.user.userId, req.user.cityId);
  }

  @Patch(':id/ready')
  @Roles('cocina')
  @ApiOperation({ summary: 'Marcar pedido listo para recoger (asignado -> listo_para_recoger)' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Pedido actualizado' })
  ready(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.kitchenMarkReady(id, req.user.userId, req.user.cityId);
  }
}

