import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { AdminService } from "./admin.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";

@ApiTags("delivery")
@Controller("delivery")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DeliveryController {
  constructor(private readonly adminService: AdminService) {}

  @Get("pending")
  @Roles("admin", "superadmin")
  @ApiOperation({
    summary: "Obtener lista de solicitudes de repartidor pendientes",
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getPending(@Request() req) {
    const userRoles = req.user.roles || [];
    const userCity = req.user.cityId;
    return this.adminService.getPendingDeliveries(userRoles, userCity);
  }

  @Get("all")
  @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Obtener lista de repartidores" })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getAll(@Request() req) {
    const userRoles = req.user.roles || [];
    const userCity = req.user.cityId;
    return this.adminService.getAllDeliveries(userRoles, userCity);
  }

  @Post(":id/approve")
  @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Aprobar repartidor" })
  @ApiParam({ name: "id" })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  approve(@Param("id", ParseIntPipe) id: number, @Request() req) {
    const userRoles = req.user.roles || [];
    const userCity = req.user.cityId;
    return this.adminService.approveDelivery(id, userRoles, userCity);
  }

  @Post(":id/reject")
  @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Rechazar repartidor" })
  @ApiParam({ name: "id" })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  reject(@Param("id", ParseIntPipe) id: number, @Request() req) {
    const userRoles = req.user.roles || [];
    const userCity = req.user.cityId;
    return this.adminService.rejectDelivery(id, userRoles, userCity);
  }

  @Post(":id/deactivate")
  @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Desactivar repartidor" })
  @ApiParam({ name: "id" })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  deactivate(@Param("id", ParseIntPipe) id: number, @Request() req) {
    const userRoles = req.user.roles || [];
    const userCity = req.user.cityId;
    return this.adminService.deactivateDelivery(id, userRoles, userCity);
  }
}
