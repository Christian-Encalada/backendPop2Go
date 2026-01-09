import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Put, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

/**
 * Controlador para gestión de usuarios
 * Implementa los endpoints relacionados con usuarios
 */
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Crea un nuevo usuario
   * Solo admin y superadmin pueden crear usuarios con roles específicos
   */
  @Post()
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  @ApiResponse({ status: 409, description: 'Conflicto - El correo ya está registrado' })
  create(@Body() createUserDto: CreateUserDto, @Req() req) {
    return this.usersService.create(
      createUserDto, 
      req.user.userId,
      req.user.roles
    );
  }

  /**
   * Obtiene todos los usuarios según permisos
   * Admin solo ve usuarios de su ciudad
   * Superadmin ve todos los usuarios
   */
  @Get()
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Obtener todos los usuarios (según permisos)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  findAll(@Req() req) {
    return this.usersService.findAll(
      req.user.cityId,
      req.user.roles
    );
  }

  /**
   * Obtiene un usuario específico por ID según permisos
   */
  @Get(':id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.usersService.findOne(
      id, 
      req.user.cityId,
      req.user.roles
    );
  }

  /**
   * Actualiza un usuario existente según permisos
   */
  @Put(':id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Actualizar un usuario existente' })
  @ApiParam({ name: 'id', description: 'ID del usuario a actualizar' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateUserDto: UpdateUserDto,
    @Req() req
  ) {
    return this.usersService.update(
      id, 
      updateUserDto, 
      req.user.cityId,
      req.user.roles
    );
  }

  /**
   * Elimina un usuario según permisos
   */
  @Delete(':id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario a eliminar' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.usersService.remove(
      id, 
      req.user.cityId,
      req.user.roles
    );
  }
}
