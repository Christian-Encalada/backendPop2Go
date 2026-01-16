import { Controller, Get, Post, Body, Param, Delete, UseGuards, ParseIntPipe, Put, Query, Patch } from '@nestjs/common';
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
   * Mapea un producto con su categoría
   */
  private mapProductResponse(p: any) {
    const precioNum = typeof p.precio === 'string' ? parseFloat(p.precio as any) : p.precio;
    return {
      ...p,
      id: p.id_producto,
      name: p.nombre,
      price: precioNum,
      precio: precioNum,
      stock: p.stock,
      active: p.activo,
      categoria: p.categoryRelation?.nombre || null,
      categoryRelation: undefined, // Ocultar relación interna
    };
  }

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
    return this.productsService.create(createProductDto).then(p => this.mapProductResponse(p));
  }

  /**
   * Obtiene todos los productos
   * Opcionalmente filtra solo activos
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filtrar solo productos activos' })
  @ApiQuery({ name: 'localId', required: false, type: Number, description: 'ID del local para obtener stock específico' })
  @ApiResponse({ status: 200, description: 'Lista de productos obtenida exitosamente' })
  findAll(
    @Query('active') activeStr?: any,
    @Query('localId') localId?: string
  ) {
    let active: boolean | undefined;
    if (activeStr === undefined) {
      active = undefined;
    } else if (typeof activeStr === 'string') {
      const s = activeStr.trim().toLowerCase();
      active = s === 'true' ? true : s === 'false' ? false : undefined;
    } else if (typeof activeStr === 'boolean') {
      active = activeStr;
    }

    if (localId !== undefined) {
      const id = parseInt(localId, 10);
      if (!isNaN(id)) {
        return this.productsService.findByLocal(id, active);
      }
    }
    return this.productsService.findAll(active).then(products =>
      products.map(p => this.mapProductResponse(p))
    );
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
    return this.productsService.findOne(id).then(p => this.mapProductResponse(p));
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
    return this.productsService.update(id, updateProductDto).then(p => this.mapProductResponse(p));
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

  /**
   * Obtiene el stock de un producto en un local específico
   */
  @Get(':productId/stock/:localId')
  @ApiOperation({ summary: 'Obtener stock de un producto en un local específico' })
  @ApiParam({ name: 'productId', description: 'ID del producto' })
  @ApiParam({ name: 'localId', description: 'ID del local' })
  @ApiResponse({ status: 200, description: 'Stock obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Stock no encontrado' })
  getStockLocal(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('localId', ParseIntPipe) localId: number
  ) {
    return this.productsService.getStockLocal(productId, localId);
  }

  /**
   * Actualiza el stock de un producto en un local específico
   * Solo admin y superadmin pueden actualizar stock
   */
  @Patch(':productId/stock/:localId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar stock de un producto en un local específico' })
  @ApiParam({ name: 'productId', description: 'ID del producto' })
  @ApiParam({ name: 'localId', description: 'ID del local' })
  @ApiResponse({ status: 200, description: 'Stock actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Producto o local no encontrado' })
  updateStockLocal(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('localId', ParseIntPipe) localId: number,
    @Body() body: { stock: number; precio_local?: number }
  ) {
    return this.productsService.setStockLocal(productId, localId, body.stock, body.precio_local);
  }

  /**
   * Reduce el stock de un producto en un local específico (para pedidos)
   * Solo admin y superadmin pueden reducir stock
   */
  @Patch(':productId/stock/:localId/reduce')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reducir stock de un producto en un local específico' })
  @ApiParam({ name: 'productId', description: 'ID del producto' })
  @ApiParam({ name: 'localId', description: 'ID del local' })
  @ApiResponse({ status: 200, description: 'Stock reducido exitosamente' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tiene permisos suficientes' })
  reduceStockLocal(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('localId', ParseIntPipe) localId: number,
    @Body() body: { quantity: number }
  ) {
    return this.productsService.updateStockLocal(productId, localId, -body.quantity);
  }
}
