import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

/**
 * Servicio para la gestión de productos
 * Implementa la lógica de negocio relacionada con los productos
 */
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Crea un nuevo producto
   * @param createProductDto Datos del producto a crear
   * @returns El producto creado
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = this.productRepository.create(createProductDto);
    return this.productRepository.save(newProduct);
  }

  /**
   * Obtiene todos los productos con filtro opcional de activos
   * @param onlyActive Si es true, solo devuelve productos activos
   * @returns Lista de productos
   */
  async findAll(onlyActive: boolean = false): Promise<Product[]> {
    const options: any = {};
    
    if (onlyActive) {
      options.where = { tbl_activo: true };
    }
    
    return this.productRepository.find(options);
  }

  /**
   * Encuentra un producto específico por ID
   * @param id ID del producto a buscar
   * @returns El producto encontrado
   */
  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { tbl_id_producto: id },
    });
    
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    
    return product;
  }

  /**
   * Actualiza un producto existente
   * @param id ID del producto a actualizar
   * @param updateProductDto Datos a actualizar
   * @returns El producto actualizado
   */
  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    
    // Actualizar datos
    Object.assign(product, updateProductDto);
    
    return this.productRepository.save(product);
  }

  /**
   * Elimina un producto
   * @param id ID del producto a eliminar
   * @returns El producto eliminado
   */
  async remove(id: number): Promise<Product> {
    const product = await this.findOne(id);
    return this.productRepository.remove(product);
  }

  /**
   * Actualiza el stock de un producto
   * @param id ID del producto
   * @param quantity Cantidad a reducir (negativa) o aumentar (positiva)
   * @returns El producto con el stock actualizado
   */
  async updateStock(id: number, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    
    const newStock = product.tbl_stock + quantity;
    
    if (newStock < 0) {
      throw new BadRequestException(`No hay suficiente stock del producto ${product.tbl_nombre}`);
    }
    
    product.tbl_stock = newStock;
    return this.productRepository.save(product);
  }
} 