import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
  ParseIntPipe,
  Patch,
} from "@nestjs/common";
import { AddressesService } from "./addresses.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";

/**
 * Controlador para la gestión de direcciones
 */
@ApiTags("addresses")
@Controller("addresses")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  /**
   * Crea una nueva dirección
   */
  @Post()
  @ApiOperation({ summary: "Crear una nueva dirección" })
  @ApiResponse({ status: 201, description: "Dirección creada exitosamente" })
  @ApiResponse({ status: 400, description: "Datos inválidos" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  create(@Body() createAddressDto: CreateAddressDto, @Req() req) {
    // Crear un objeto con los datos del DTO y el ID del usuario del token
    const addressData = {
      ...createAddressDto,
      id_usuario: req.user.userId,
    };

    return this.addressesService.create(
      addressData,
      req.user.userId,
      req.user.roles,
    );
  }

  /**
   * Obtiene todas las direcciones del usuario autenticado
   * Admins y superadmins pueden ver todas las direcciones según permisos
   */
  @Get()
  @ApiOperation({
    summary: "Obtener direcciones del usuario (o todas según permisos)",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de direcciones obtenida exitosamente",
  })
  @ApiResponse({ status: 401, description: "No autorizado" })
  findAll(@Req() req) {
    return this.addressesService.findAll(
      req.user.userId,
      req.user.roles,
      req.user.cityId,
    );
  }

  /**
   * Obtiene una dirección específica por ID
   * Verifica permisos según rol del usuario
   */
  @Get(":id")
  @ApiOperation({ summary: "Obtener una dirección por ID" })
  @ApiParam({ name: "id", description: "ID de la dirección" })
  @ApiResponse({ status: 200, description: "Dirección encontrada" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos para ver esta dirección",
  })
  @ApiResponse({ status: 404, description: "Dirección no encontrada" })
  findOne(@Param("id", ParseIntPipe) id: number, @Req() req) {
    return this.addressesService.findOne(
      id,
      req.user.userId,
      req.user.roles,
      req.user.cityId,
    );
  }

  /**
   * Actualiza una dirección existente
   * Verifica permisos según rol del usuario
   */
  @Put(":id")
  @ApiOperation({ summary: "Actualizar una dirección existente" })
  @ApiParam({ name: "id", description: "ID de la dirección a actualizar" })
  @ApiResponse({
    status: 200,
    description: "Dirección actualizada exitosamente",
  })
  @ApiResponse({ status: 400, description: "Datos inválidos" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos para modificar esta dirección",
  })
  @ApiResponse({ status: 404, description: "Dirección no encontrada" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateAddressDto: UpdateAddressDto,
    @Req() req,
  ) {
    return this.addressesService.update(
      id,
      updateAddressDto,
      req.user.userId,
      req.user.roles,
      req.user.cityId,
    );
  }

  /**
   * Establece una dirección como predeterminada
   * Verifica permisos según rol del usuario
   */
  @Patch(":id/default")
  @ApiOperation({ summary: "Establecer una dirección como predeterminada" })
  @ApiParam({
    name: "id",
    description: "ID de la dirección a establecer como predeterminada",
  })
  @ApiResponse({
    status: 200,
    description: "Dirección establecida como predeterminada exitosamente",
  })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos para modificar esta dirección",
  })
  @ApiResponse({ status: 404, description: "Dirección no encontrada" })
  setDefault(@Param("id", ParseIntPipe) id: number, @Req() req) {
    return this.addressesService.setDefault(
      id,
      req.user.userId,
      req.user.roles,
      req.user.cityId,
    );
  }

  /**
   * Cambia el local asociado a una dirección específica
   * Verifica permisos según rol del usuario
   */
  @Patch(":id/store")
  @ApiOperation({ summary: "Cambiar el local asociado a una dirección" })
  @ApiParam({ name: "id", description: "ID de la dirección a actualizar" })
  @ApiResponse({
    status: 200,
    description: "Local de la dirección actualizado exitosamente",
  })
  @ApiResponse({ status: 400, description: "Datos inválidos" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos para modificar esta dirección",
  })
  @ApiResponse({ status: 404, description: "Dirección no encontrada" })
  updateStore(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { id_local: number },
    @Req() req,
  ) {
    console.log("🔄 Controller - updateStore recibido:", {
      id,
      body,
      userId: req.user?.userId,
      userRoles: req.user?.roles,
      cityId: req.user?.cityId,
    });

    return this.addressesService.updateStore(
      id,
      body.id_local,
      req.user.userId,
      req.user.roles,
      req.user.cityId,
    );
  }

  /**
   * Elimina una dirección
   * Verifica permisos según rol del usuario
   */
  @Delete(":id")
  @ApiOperation({ summary: "Eliminar una dirección" })
  @ApiParam({ name: "id", description: "ID de la dirección a eliminar" })
  @ApiResponse({ status: 200, description: "Dirección eliminada exitosamente" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({
    status: 403,
    description: "Prohibido - No tiene permisos para eliminar esta dirección",
  })
  @ApiResponse({ status: 404, description: "Dirección no encontrada" })
  remove(@Param("id", ParseIntPipe) id: number, @Req() req) {
    return this.addressesService.remove(
      id,
      req.user.userId,
      req.user.roles,
      req.user.cityId,
    );
  }
}
