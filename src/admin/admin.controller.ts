import { Controller, Get, UseGuards, Request, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

/**
 * Controlador para funcionalidades de administración
 */
@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Obtiene estadísticas para el dashboard de administración
   */
  @Get('stats')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard de administración' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  async getDashboardStats(@Request() req) {
    const userRoles = req.user.roles?.map(role => role.nombre) || [];
    const userCity = req.user.id_ciudad;
    
    return this.adminService.getDashboardStats(userRoles, userCity);
  }

  /**
   * Obtiene lista de repartidores pendientes de aprobación
   */
  @Get('pending-deliveries')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Obtener lista de repartidores pendientes de aprobación' })
  @ApiResponse({ status: 200, description: 'Lista de repartidores pendientes obtenida exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  async getPendingDeliveries(@Request() req) {
    const userRoles = req.user.roles?.map(role => role.nombre) || [];
    const userCity = req.user.id_ciudad;
    
    return this.adminService.getPendingDeliveries(userRoles, userCity);
  }

  /**
   * Aprueba un repartidor pendiente
   */
  @Patch('deliveries/:id/approve')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Aprobar un repartidor pendiente' })
  @ApiParam({ name: 'id', description: 'ID del repartidor a aprobar' })
  @ApiResponse({ status: 200, description: 'Repartidor aprobado exitosamente' })
  @ApiResponse({ status: 400, description: 'El repartidor ya está aprobado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Repartidor no encontrado' })
  async approveDelivery(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userRoles = req.user.roles?.map(role => role.nombre) || [];
    const userCity = req.user.id_ciudad;
    
    return this.adminService.approveDelivery(id, userRoles, userCity);
  }

  /**
   * Rechaza un repartidor pendiente
   */
  @Patch('deliveries/:id/reject')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Rechazar un repartidor pendiente' })
  @ApiParam({ name: 'id', description: 'ID del repartidor a rechazar' })
  @ApiResponse({ status: 200, description: 'Repartidor rechazado exitosamente' })
  @ApiResponse({ status: 400, description: 'El repartidor ya está rechazado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Repartidor no encontrado' })
  async rejectDelivery(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userRoles = req.user.roles?.map(role => role.nombre) || [];
    const userCity = req.user.id_ciudad;
    
    return this.adminService.rejectDelivery(id, userRoles, userCity);
  }
}