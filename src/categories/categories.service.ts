import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  private slugify(s: string): string {
    return s.toLowerCase().trim().replace(/\s+/g, '-');
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  async findOne(id: number): Promise<Category> {
    const cat = await this.categoryRepository.findOne({ where: { id_categoria: id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  async create(body: any): Promise<Category> {
    const nombre: string = body.name ?? body.nombre;
    if (!nombre) throw new ConflictException('El nombre es requerido');

    const exists = await this.categoryRepository.findOne({ where: { nombre } });
    if (exists) throw new ConflictException('Ya existe una categoría con este nombre');

    const entity = this.categoryRepository.create({
      nombre,
      descripcion: body.descripcion ?? null,
      imagen_url: body.imagen ?? body.imagen_url ?? null,
      icono: body.icono ?? null,
      color: body.color ?? null,
      activo: body.activo ?? true,
      orden: body.orden ?? 0,
    });
    return this.categoryRepository.save(entity);
  }

  async update(id: number, body: any): Promise<Category> {
    const cat = await this.findOne(id);
    const nombre: string | undefined = body.name ?? body.nombre;
    if (nombre) {
      // Verificar duplicado de nombre si cambia
      if (nombre !== cat.nombre) {
        const exists = await this.categoryRepository.findOne({ where: { nombre } });
        if (exists) throw new ConflictException('Ya existe una categoría con este nombre');
      }
      cat.nombre = nombre;
    }
    if (body.descripcion !== undefined) cat.descripcion = body.descripcion;
    if (body.imagen !== undefined || body.imagen_url !== undefined) {
      cat.imagen_url = body.imagen ?? body.imagen_url;
    }
    if (body.icono !== undefined) cat.icono = body.icono;
    if (body.color !== undefined) cat.color = body.color;
    if (body.activo !== undefined) cat.activo = body.activo;
    if (body.orden !== undefined) cat.orden = body.orden;
    return this.categoryRepository.save(cat);
  }

  async remove(id: number): Promise<void> {
    const cat = await this.findOne(id);
    await this.categoryRepository.remove(cat);
  }
}
