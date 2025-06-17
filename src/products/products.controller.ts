import { Controller, Get, Post, Body, Param, Delete, UseGuards, ParseIntPipe, Put, Query, ParseBoolPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';

/**
 * Controlador para la gestión de productos
 */
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Crea un nuevo producto
   * Solo admin y superadmin pueden crear productos
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /**
   * Obtiene todos los productos
   * Opcionalmente filtra solo activos
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filtrar solo productos activos' })
  @ApiResponse({ status: 200, description: 'Lista de productos obtenida exitosamente' })
  findAll(@Query('active', new ParseBoolPipe({ optional: true })) active?: boolean) {
    return this.productsService.findAll(active);
  }

  /**
   * Obtiene un producto específico por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  /**
   * Actualiza un producto existente
   * Solo admin y superadmin pueden actualizar productos
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un producto existente' })
  @ApiParam({ name: 'id', description: 'ID del producto a actualizar' })
  @ApiResponse({ status: 200, description: 'Producto actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * Elimina un producto
   * Solo admin y superadmin pueden eliminar productos
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto a eliminar' })
  @ApiResponse({ status: 200, description: 'Producto eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
} 