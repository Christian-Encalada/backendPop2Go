import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch, ParseIntPipe, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

/**
 * Controlador para la gestión de pedidos
 */
@ApiTags("orders")
@Controller("orders")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Crea un nuevo pedido
   * Solo los clientes pueden crear pedidos
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles("cliente")
  @ApiOperation({ summary: "Crear un nuevo pedido" })
  @ApiResponse({ status: 201, description: "Pedido creado exitosamente" })
  @ApiResponse({
    status: 400,
    description: "Datos inválidos o producto sin stock suficiente",
  })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos suficientes",
  })
  create(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    return this.ordersService.create(createOrderDto, req.user.userId);
  }

  /**
   * Obtiene todos los pedidos según los permisos del usuario
   */
  @Get()
  @ApiOperation({ summary: "Obtener todos los pedidos (según permisos)" })
  @ApiResponse({
    status: 200,
    description: "Lista de pedidos obtenida exitosamente",
  })
  @ApiResponse({ status: 401, description: "No autorizado" })
  findAll(@Req() req) {
    return this.ordersService.findAll(
      req.user.userId,
      req.user.roles,
      req.user.cityId,
    );
  }

  @Get("my-orders")
  @ApiOperation({ summary: "Obtener pedidos del usuario autenticado" })
  @ApiResponse({
    status: 200,
    description: "Lista de pedidos obtenida exitosamente",
  })
  @ApiResponse({ status: 401, description: "No autorizado" })
  findMyOrders(@Req() req) {
    return this.ordersService.findAll(
      req.user.userId,
      req.user.roles,
      req.user.cityId,
    );
  }

  /**
   * Obtiene un pedido específico por ID
   * Verifica permisos según rol del usuario
   */
  @Get(":id")
  @ApiOperation({ summary: "Obtener un pedido por ID (según permisos)" })
  @ApiParam({ name: "id", description: "ID del pedido" })
  @ApiResponse({ status: 200, description: "Pedido encontrado" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos para ver este pedido",
  })
  @ApiResponse({ status: 404, description: "Pedido no encontrado" })
  findOne(@Param("id", ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.findOne(
      id,
      req.user.userId,
      req.user.roles,
      req.user.cityId,
    );
  }

  /**
   * Actualiza el estado de un pedido
   * Diferentes roles tienen diferentes permisos
   */
  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles("admin", "superadmin", "repartidor", "cocina")
  @ApiOperation({ summary: "Actualizar el estado de un pedido" })
  @ApiParam({ name: "id", description: "ID del pedido" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        estado: {
          type: 'string',
          enum: ['nuevo', 'preparando', 'asignado', 'listo_para_recoger', 'recogido', 'en_cocina', 'aceptado_cocina', 'asignado_delivery', 'en_camino', 'entregado', 'cancelado', 'pendiente'],
          description: 'Nuevo estado del pedido'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: "Estado actualizado exitosamente" })
  @ApiResponse({
    status: 400,
    description: "Estado inválido o no se puede cambiar a ese estado",
  })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos para modificar este pedido",
  })
  @ApiResponse({ status: 404, description: "Pedido no encontrado" })
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body("estado") estado: string,
    @Req() req,
  ) {
    return this.ordersService.updateStatus(
      id,
      estado,
      req.user.userId,
      req.user.roles,
      req.user.cityId,
    );
  }

  @Patch(":id/cancel")
  @ApiOperation({ summary: "Cancelar un pedido" })
  @ApiParam({ name: "id", description: "ID del pedido" })
  @ApiResponse({ status: 200, description: "Pedido cancelado exitosamente" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos para modificar este pedido",
  })
  @ApiResponse({ status: 404, description: "Pedido no encontrado" })
  cancel(@Param("id", ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.updateStatus(
      id,
      "cancelado",
      req.user.userId,
      req.user.roles,
      req.user.cityId,
    );
  }

  /**
   * Elimina un pedido (solo para admins)
   * Los items del pedido se eliminan automáticamente
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Eliminar un pedido (solo administradores)' })
  @ApiParam({ name: 'id', description: 'ID del pedido a eliminar' })
  @ApiResponse({ status: 200, description: 'Pedido eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Solo administradores pueden eliminar pedidos' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req
  ) {
    return this.ordersService.remove(id, req.user.userId, req.user.roles);
  }

  // ========== ENDPOINTS DE COCINA ==========

  /**
   * Cocina confirma un pedido (nuevo/pendiente -> preparando)
   */
  @Patch(':id/kitchen-confirm')
  @UseGuards(RolesGuard)
  @Roles('cocina', 'admin', 'superadmin')
  @ApiOperation({ summary: 'Cocina confirma un pedido' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Pedido confirmado por cocina' })
  kitchenConfirm(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.kitchenConfirm(id, req.user.userId, req.user.cityId);
  }

  /**
   * Cocina marca pedido como listo para recoger (asignado -> listo_para_recoger)
   */
  @Patch(':id/kitchen-ready')
  @UseGuards(RolesGuard)
  @Roles('cocina', 'admin', 'superadmin')
  @ApiOperation({ summary: 'Cocina marca pedido listo para recoger' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Pedido marcado como listo para recoger' })
  kitchenMarkReady(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.kitchenMarkReady(id, req.user.userId, req.user.cityId);
  }

  // ========== ENDPOINTS DE DELIVERY ==========

  /**
   * Obtiene pedidos disponibles para delivery (en estado preparando)
   */
  @Get("delivery/available")
  @UseGuards(RolesGuard)
  @Roles("repartidor")
  @ApiOperation({ summary: "Obtener pedidos disponibles para delivery" })
  @ApiResponse({
    status: 200,
    description: "Lista de pedidos disponibles para delivery",
  })
  getAvailableForDelivery(@Req() req) {
    return this.ordersService.findAvailableForDelivery(req.user.userId, req.user.cityId);
  }

  /**
   * Delivery acepta un pedido (preparando -> asignado)
   */
  @Patch(":id/delivery-accept")
  @UseGuards(RolesGuard)
  @Roles('repartidor')
  @ApiOperation({ summary: 'Delivery acepta un pedido' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Pedido asignado al delivery' })
  deliveryAccept(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.ordersService.acceptOrder(id, req.user.userId, req.user.cityId);
  }

  /**
   * Obtiene pedidos asignados a este delivery
   */
  @Get("delivery/my-orders")
  @UseGuards(RolesGuard)
  @Roles("repartidor")
  @ApiOperation({ summary: "Obtener pedidos asignados a este delivery" })
  @ApiResponse({ status: 200, description: "Lista de pedidos del delivery" })
  getDeliveryOrders(@Req() req) {
    return this.ordersService.findAssignedForDelivery(req.user.userId);
  }

  /**
   * Delivery avanza el estado del pedido
   */
  @Patch(':id/delivery-advance')
  @UseGuards(RolesGuard)
  @Roles('repartidor')
  @ApiOperation({ summary: 'Delivery avanza el estado del pedido' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['recogido', 'en_camino', 'entregado'],
          description: 'Siguiente estado del pedido'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Estado del pedido actualizado' })
  deliveryAdvance(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'recogido' | 'en_camino' | 'entregado',
    @Req() req
  ) {
    return this.ordersService.advanceDeliveryStatus(id, status, req.user.userId, req.user.cityId);
  }
}
