import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  private slugify(s: string): string {
    return s.toLowerCase().trim().replace(/\s+/g, '-');
  }

  @Get()
  @ApiOperation({ summary: 'Obtener categorías' })
  @ApiResponse({ status: 200, description: 'Lista de categorías' })
  async findAll() {
    const products = await this.productsService.findAll();
    const derivedMap = new Map<string, { id: number; name: string; slug: string }>();
    products.forEach(p => {
      if (p.categoria) {
        const name = p.categoria;
        const slug = this.slugify(name);
        if (!derivedMap.has(slug)) {
          const id = Array.from(slug).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
          derivedMap.set(slug, { id, name, slug });
        }
      }
    });

    const derived = Array.from(derivedMap.values());
    const persisted = (await this.categoriesService.findAll()).map(c => ({
      id: c.id_categoria,
      name: c.nombre,
      slug: this.slugify(c.nombre),
      descripcion: c.descripcion ?? undefined,
      imagen: c.imagen_url ?? undefined,
    }));
    const combined = [...persisted, ...derived];

    // Unificar por slug
    const unique = Array.from(new Map(combined.map(c => [c.slug, c])).values());
    return unique;
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
