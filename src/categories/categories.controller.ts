import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  private slugify(s: string): string {
    return s.toLowerCase().trim().replace(/\s+/g, '-');
  }

  @Get()
  @ApiOperation({ summary: 'Obtener categorías' })
  @ApiResponse({ status: 200, description: 'Lista de categorías' })
  async findAll() {
    // Solo devolver categorías reales de la base de datos
    const categories = await this.categoriesService.findAll();
    return categories.map(c => ({
      id: c.id_categoria,
      name: c.nombre,
      slug: this.slugify(c.nombre),
      descripcion: c.descripcion ?? undefined,
      imagen: c.imagen_url ?? undefined,
      icono: c.icono ?? undefined,
      color: c.color ?? undefined,
      activo: c.activo ?? true,
      orden: c.orden ?? 0,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiResponse({ status: 200 })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const cat = await this.categoriesService.findOne(id);
    return {
      id: cat.id_categoria,
      name: cat.nombre,
      slug: this.slugify(cat.nombre),
      descripcion: cat.descripcion ?? undefined,
      imagen: cat.imagen_url ?? undefined,
      icono: cat.icono ?? undefined,
      color: cat.color ?? undefined,
      activo: cat.activo ?? true,
      orden: cat.orden ?? 0,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Crear categoría' })
  @ApiResponse({ status: 201 })
  async create(@Body() body: any) {
    const cat = await this.categoriesService.create(body);
    return {
      id: cat.id_categoria,
      name: cat.nombre,
      slug: this.slugify(cat.nombre),
      descripcion: cat.descripcion ?? undefined,
      imagen: cat.imagen_url ?? undefined,
      icono: cat.icono ?? undefined,
      color: cat.color ?? undefined,
      activo: cat.activo ?? true,
      orden: cat.orden ?? 0,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiResponse({ status: 200 })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const cat = await this.categoriesService.update(id, body);
    return {
      id: cat.id_categoria,
      name: cat.nombre,
      slug: this.slugify(cat.nombre),
      descripcion: cat.descripcion ?? undefined,
      imagen: cat.imagen_url ?? undefined,
      icono: cat.icono ?? undefined,
      color: cat.color ?? undefined,
      activo: cat.activo ?? true,
      orden: cat.orden ?? 0,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.remove(id);
    return { deleted: true };
  }
}
