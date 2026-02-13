import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { CitiesService } from "./cities.service";
import { CreateCityDto } from "./dto/create-city.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";

/**
 * Controlador para las operaciones relacionadas con ciudades
 */
@ApiTags("cities")
@Controller("cities")
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  /**
   * Crea una nueva ciudad
   * Solo admins y superadmins pueden crear ciudades
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Crear una nueva ciudad" })
  @ApiResponse({ status: 201, description: "Ciudad creada exitosamente" })
  @ApiResponse({ status: 400, description: "Datos inválidos" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos suficientes",
  })
  @ApiResponse({ status: 409, description: "Conflicto - La ciudad ya existe" })
  create(@Body() createCityDto: CreateCityDto) {
    return this.citiesService.create(createCityDto);
  }

  /**
   * Obtiene todas las ciudades
   * Esta ruta es pública
   */
  @Get()
  @ApiOperation({ summary: "Obtener todas las ciudades" })
  @ApiResponse({
    status: 200,
    description: "Lista de ciudades obtenida exitosamente",
  })
  findAll() {
    return this.citiesService.findAll();
  }

  /**
   * Obtiene una ciudad específica por ID
   * Esta ruta es pública
   */
  @Get(":id")
  @ApiOperation({ summary: "Obtener una ciudad por ID" })
  @ApiParam({ name: "id", description: "ID de la ciudad" })
  @ApiResponse({ status: 200, description: "Ciudad encontrada" })
  @ApiResponse({ status: 404, description: "Ciudad no encontrada" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.citiesService.findOne(id);
  }

  /**
   * Actualiza una ciudad
   * Solo admins y superadmins pueden actualizar ciudades
   */
  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Actualizar una ciudad" })
  @ApiParam({ name: "id", description: "ID de la ciudad a actualizar" })
  @ApiResponse({ status: 200, description: "Ciudad actualizada exitosamente" })
  @ApiResponse({ status: 400, description: "Datos inválidos" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos suficientes",
  })
  @ApiResponse({ status: 404, description: "Ciudad no encontrada" })
  @ApiResponse({
    status: 409,
    description: "Conflicto - Ya existe una ciudad con ese nombre",
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateCityDto: CreateCityDto,
  ) {
    return this.citiesService.update(id, updateCityDto);
  }

  /**
   * Elimina una ciudad
   * Solo superadmins pueden eliminar ciudades
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("superadmin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Eliminar una ciudad" })
  @ApiParam({ name: "id", description: "ID de la ciudad a eliminar" })
  @ApiResponse({ status: 200, description: "Ciudad eliminada exitosamente" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos suficientes",
  })
  @ApiResponse({ status: 404, description: "Ciudad no encontrada" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.citiesService.remove(id);
  }
}
