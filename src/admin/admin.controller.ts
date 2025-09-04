import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

/**
 * Controlador para funcionalidades de administración
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Obtiene estadísticas para el dashboard de administración
   */
  @Get('stats')
  @Roles('admin', 'superadmin')
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
  async getPendingDeliveries(@Request() req) {
    const userRoles = req.user.roles?.map(role => role.nombre) || [];
    const userCity = req.user.id_ciudad;
    
    return this.adminService.getPendingDeliveries(userRoles, userCity);
  }
}