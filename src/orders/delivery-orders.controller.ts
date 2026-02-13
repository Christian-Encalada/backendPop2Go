import { Controller, Get, Post, Param, ParseIntPipe, Req, UseGuards, Body, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { OrdersService } from './orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/users.entity';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

/**
 * Endpoints específicos para repartidores (delivery)
 * - Ver pedidos disponibles por ciudad
 * - Aceptar un pedido (asignación atómica)
 * - Avanzar el estado del pedido en el flujo de entrega
 */
@ApiTags('delivery-orders')
@Controller('delivery/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DeliveryOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get('available')
  @Roles('repartidor')
  @ApiOperation({ summary: 'Pedidos disponibles para aceptar (por ciudad del repartidor)' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos disponibles' })
  getAvailable(@Req() req) {
    return this.ordersService.findAvailableForDelivery(req.user.userId, req.user.cityId);
  }

  @Get('assigned')
  @Roles('repartidor')
  @ApiOperation({ summary: 'Pedidos asignados al repartidor autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos asignados' })
  getAssigned(@Req() req) {
    return this.ordersService.findAssignedForDelivery(req.user.userId);
  }

  @Post(':id/accept')
  @Roles('repartidor')
  @ApiOperation({ summary: 'Aceptar un pedido disponible (lo asigna al repartidor)' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Pedido aceptado y asignado' })
  accept(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.acceptOrder(id, req.user.userId, req.user.cityId);
  }

  @Post(':id/picked-up')
  @Roles('repartidor')
  @ApiOperation({ summary: 'Marcar pedido como recogido en el local' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Pedido actualizado' })
  pickedUp(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.advanceDeliveryStatus(id, 'recogido', req.user.userId, req.user.cityId);
  }

  @Post(':id/on-the-way')
  @Roles('repartidor')
  @ApiOperation({ summary: 'Marcar pedido como en camino al cliente' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Pedido actualizado' })
  onTheWay(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.advanceDeliveryStatus(id, 'en_camino', req.user.userId, req.user.cityId);
  }

  @Post(':id/delivered')
  @Roles('repartidor')
  @ApiOperation({ summary: 'Marcar pedido como entregado' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Pedido actualizado' })
  delivered(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.advanceDeliveryStatus(id, 'entregado', req.user.userId, req.user.cityId);
  }

  @Post('register-push-token')
  @Roles('repartidor')
  @ApiOperation({ summary: 'Registrar token de push notifications' })
  @ApiBody({ type: RegisterPushTokenDto })
  @ApiResponse({ status: 200, description: 'Token registrado' })
  async registerPushToken(@Body() dto: RegisterPushTokenDto, @Req() req) {
    await this.notificationsService.registerPushToken(req.user.userId, dto.token);
    return { message: 'Token registrado exitosamente' };
  }

  @Patch('toggle-working')
  @Roles('repartidor')
  @ApiOperation({ summary: 'Activar/desactivar estado de trabajo (recibir pedidos)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        is_working: { type: 'boolean', description: 'true para activar, false para desactivar' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  async toggleWorking(@Body('is_working') isWorking: boolean, @Req() req) {
    await this.userRepository.update(
      { id_usuario: req.user.userId },
      { is_working: isWorking },
    );
    return { message: `Estado de trabajo actualizado: ${isWorking ? 'Activo' : 'Inactivo'}`, is_working: isWorking };
  }

  @Get('working-status')
  @Roles('repartidor')
  @ApiOperation({ summary: 'Obtener estado actual de trabajo' })
  @ApiResponse({ status: 200, description: 'Estado de trabajo' })
  async getWorkingStatus(@Req() req) {
    const user = await this.userRepository.findOne({
      where: { id_usuario: req.user.userId },
      select: ['is_working', 'expo_push_token'],
    });
    return {
      is_working: user?.is_working || false,
      has_push_token: !!user?.expo_push_token,
    };
  }
}

