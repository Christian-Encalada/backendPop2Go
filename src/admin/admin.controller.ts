import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Param,
  ParseIntPipe, Post, Body, Delete,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { AdminService } from "./admin.service";
import { AdminChatbotService } from "./admin-chatbot.service";
import { UsersService } from '../users/users.service';
import { AdminChatDto } from "./dto/admin-chat.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";

/**
 * Controlador para funcionalidades de administración
 */
@ApiTags("admin")
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminChatbotService: AdminChatbotService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Obtiene estadísticas para el dashboard de administración
   */
  @Get("stats")
  @Roles("admin", "superadmin")
  @ApiOperation({
    summary: "Obtener estadísticas del dashboard de administración",
  })
  @ApiResponse({
    status: 200,
    description: "Estadísticas obtenidas exitosamente",
  })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos suficientes",
  })
  async getDashboardStats(@Request() req) {
    const userRoles = req.user.roles || [];
    const userCity = req.user.cityId;

    return this.adminService.getDashboardStats(userRoles, userCity);
  }

  /**
   * Obtiene lista de repartidores pendientes de aprobación
   */
  @Get("pending-deliveries")
  @Roles("admin", "superadmin")
  @ApiOperation({
    summary: "Obtener lista de repartidores pendientes de aprobación",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de repartidores pendientes obtenida exitosamente",
  })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos suficientes",
  })
  async getPendingDeliveries(@Request() req) {
    const userRoles = req.user.roles || [];
    const userCity = req.user.cityId;

    return this.adminService.getPendingDeliveries(userRoles, userCity);
  }

  @Get("deliveries")
  @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Obtener lista de repartidores" })
  @ApiResponse({
    status: 200,
    description: "Lista de repartidores obtenida exitosamente",
  })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos suficientes",
  })
  async getAllDeliveries(@Request() req) {
    const userRoles = req.user.roles || [];
    const userCity = req.user.cityId;

    return this.adminService.getAllDeliveries(userRoles, userCity);
  }

  /**
   * Aprueba un repartidor pendiente
   */
  @Patch("deliveries/:id/approve")
  @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Aprobar un repartidor pendiente" })
  @ApiParam({ name: "id", description: "ID del repartidor a aprobar" })
  @ApiResponse({ status: 200, description: "Repartidor aprobado exitosamente" })
  @ApiResponse({ status: 400, description: "El repartidor ya está aprobado" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos suficientes",
  })
  @ApiResponse({ status: 404, description: "Repartidor no encontrado" })
  async approveDelivery(@Param("id", ParseIntPipe) id: number, @Request() req) {
    const userRoles = req.user.roles || [];
    const userCity = req.user.cityId;

    return this.adminService.approveDelivery(id, userRoles, userCity);
  }

  /**
   * Rechaza un repartidor pendiente
   */
  @Patch("deliveries/:id/reject")
  @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Rechazar un repartidor pendiente" })
  @ApiParam({ name: "id", description: "ID del repartidor a rechazar" })
  @ApiResponse({
    status: 200,
    description: "Repartidor rechazado exitosamente",
  })
  @ApiResponse({ status: 400, description: "El repartidor ya está rechazado" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos suficientes",
  })
  @ApiResponse({ status: 404, description: "Repartidor no encontrado" })
  async rejectDelivery(@Param("id", ParseIntPipe) id: number, @Request() req) {
    const userRoles = req.user.roles || [];
    const userCity = req.user.cityId;

    return this.adminService.rejectDelivery(id, userRoles, userCity);
  }

  @Patch("deliveries/:id/deactivate")
  @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Desactivar un repartidor" })
  @ApiParam({ name: "id", description: "ID del repartidor a desactivar" })
  @ApiResponse({
    status: 200,
    description: "Repartidor desactivado exitosamente",
  })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos suficientes",
  })
  @ApiResponse({ status: 404, description: "Repartidor no encontrado" })
  async deactivateDelivery(
    @Param("id", ParseIntPipe) id: number,
    @Request() req,
  ) {
    const userRoles = req.user.roles || [];
    const userCity = req.user.cityId;

    return this.adminService.deactivateDelivery(id, userRoles, userCity);
  }

  /**
   * Crear usuario (cocina, delivery, admin, etc.)
   */
  @Post('users')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'El correo ya está registrado' })
  async createUser(@Body() body: any, @Request() req) {
    const { nombre, email, telefono, password, roles } = body;
    
    // Mapear campos del frontend al DTO del backend
    const createUserDto = {
      nombre,
      correo: email,
      contrasena: password,
      telefono,
      id_ciudad: req.user.cityId, // Usar la ciudad del admin
      roles: roles || ['cliente'],
    };

    return this.usersService.create(
      createUserDto,
      req.user.userId,
      req.user.roles
    );
  }

  /**
   * Obtener usuarios (con filtro opcional por rol)
   */
  @Get('users')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Obtener usuarios filtrados por rol' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async getUsers(@Request() req) {
    const userRoles = req.user.roles || [];
    const userCity = req.user.cityId;
    
    return this.usersService.findAll(userCity, userRoles);
  }

  /**
   * Activar/desactivar usuario
   */
  @Patch('users/:id/toggle-status')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Activar o desactivar un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Estado del usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async toggleUserStatus(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.usersService.toggleStatus(id, req.user.roles, req.user.cityId);
  }

  /**
   * Eliminar usuario
   */
  @Delete('users/:id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario a eliminar' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.usersService.remove(id, req.user.roles, req.user.cityId);
  }

  @Post("chatbot/ask")
  @Roles("admin", "superadmin")
  @ApiOperation({
    summary:
      "Consultar al asistente RAG de administracion (solo logica de negocio)",
  })
  @ApiBody({ type: AdminChatDto })
  @ApiResponse({
    status: 200,
    description: "Respuesta del asistente de administracion",
  })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos suficientes",
  })
  async askChatbot(@Body() body: AdminChatDto, @Request() req) {
    return this.adminChatbotService.ask(
      body.question,
      req.user.roles || [],
      req.user.cityId,
    );
  }
}
