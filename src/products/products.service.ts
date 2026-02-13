import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { StockLocal } from './entities/stock-local.entity';
import { Category } from '../categories/entities/category.entity';
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
    @InjectRepository(StockLocal)
    private stockLocalRepository: Repository<StockLocal>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  /**
   * Crea un nuevo producto
   * @param createProductDto Datos del producto a crear
   * @returns El producto creado
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Validar que la categoría existe
    const category = await this.categoryRepository.findOne({
      where: { id_categoria: createProductDto.id_categoria }
    });

    if (!category) {
      throw new NotFoundException(`Categoría con ID ${createProductDto.id_categoria} no encontrada`);
    }

    const newProduct = this.productRepository.create(createProductDto);
    return this.productRepository.save(newProduct);
  }

  /**
   * Obtiene todos los productos con filtro opcional de activos
   * @param onlyActive Si es true, solo devuelve productos activos
   * @returns Lista de productos
   */
  async findAll(onlyActive: boolean = false): Promise<Product[]> {
    const options: any = {
      relations: ['categoryRelation'], // Incluir relación con categoría
    };
    
    if (onlyActive) {
      options.where = { activo: true };
    }
    
    return this.productRepository.find(options);
  }

  /**
   * Obtiene productos con stock por local específico
   * @param localId ID del local
   * @param onlyActive Si es true, solo devuelve productos activos
   * @returns Lista de productos con stock del local
   */
  async findByLocal(localId: number, onlyActive?: boolean, search?: string): Promise<any[]> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categoryRelation', 'categoryRelation')
      .leftJoinAndSelect('product.stockLocales', 'stockLocal', 'stockLocal.id_local = :localId', { localId })
      .leftJoinAndSelect('product.categoryRelation', 'category');

    if (onlyActive !== undefined) {
      query.andWhere('product.activo = :activo', { activo: onlyActive });
    }

    if (search?.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(product.nombre) LIKE :term OR LOWER(product.descripcion) LIKE :term OR LOWER(category.nombre) LIKE :term)',
        { term }
      );
    }

    const products = await query.getMany();

    return products.map(product => {
      const stockLocal = product.stockLocales[0];
      const precioRaw = stockLocal?.precio_local ?? product.precio;
      const precio = typeof precioRaw === 'string' ? parseFloat(precioRaw as any) : (precioRaw as number);
      return {
        ...product,
        stock: stockLocal ? stockLocal.stock : 0,
        precio,
        disponible: stockLocal ? stockLocal.activo : false,
        stockLocales: undefined
      };
    });
  }

  /**
   * Encuentra un producto específico por ID
   * @param id ID del producto a buscar
   * @returns El producto encontrado
   */
  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id_producto: id },
      relations: ['categoryRelation'], // Incluir relación con categoría
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
    
    // Si se está actualizando la categoría, validar que existe
    if (updateProductDto.id_categoria !== undefined) {
      const category = await this.categoryRepository.findOne({
        where: { id_categoria: updateProductDto.id_categoria }
      });

      if (!category) {
        throw new NotFoundException(`Categoría con ID ${updateProductDto.id_categoria} no encontrada`);
      }
    }
    
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
    
    const newStock = product.stock + quantity;
    
    if (newStock < 0) {
      throw new BadRequestException(`No hay suficiente stock del producto ${product.nombre}`);
    }
    
    product.stock = newStock;
    return this.productRepository.save(product);
  }

  /**
   * Actualiza el stock de un producto en un local específico
   * @param productId ID del producto
   * @param localId ID del local
   * @param quantity Cantidad a reducir (negativa) o aumentar (positiva)
   * @returns El stock local actualizado
   */
  async updateStockLocal(productId: number, localId: number, quantity: number): Promise<StockLocal> {
    let stockLocal = await this.stockLocalRepository.findOne({
      where: { id_producto: productId, id_local: localId }
    });

    if (!stockLocal) {
      // Si no existe, crear un nuevo registro
      stockLocal = this.stockLocalRepository.create({
        id_producto: productId,
        id_local: localId,
        stock: 0,
        activo: true
      });
    }

    const newStock = stockLocal.stock + quantity;
    
    if (newStock < 0) {
      throw new BadRequestException(`No hay suficiente stock del producto en este local`);
    }

    stockLocal.stock = newStock;
    stockLocal.fecha_actualizacion = new Date();
    
    return this.stockLocalRepository.save(stockLocal);
  }

  /**
   * Obtiene el stock de un producto en un local específico
   * @param productId ID del producto
   * @param localId ID del local
   * @returns El stock local o null si no existe
   */
  async getStockLocal(productId: number, localId: number): Promise<StockLocal | null> {
    return this.stockLocalRepository.findOne({
      where: { id_producto: productId, id_local: localId },
      relations: ['product', 'store']
    });
  }

  /**
   * Crea o actualiza el stock de un producto en un local
   * @param productId ID del producto
   * @param localId ID del local
   * @param stock Cantidad de stock
   * @param precioLocal Precio específico del local (opcional)
   * @returns El stock local creado/actualizado
   */
  async setStockLocal(productId: number, localId: number, stock: number, precioLocal?: number): Promise<StockLocal> {
    let stockLocal = await this.stockLocalRepository.findOne({
      where: { id_producto: productId, id_local: localId }
    });

    if (stock < 0) {
      throw new BadRequestException('El stock no puede ser negativo');
    }

    if (stockLocal) {
      // Actualizar existente
      stockLocal.stock = stock;
      if (precioLocal !== undefined) {
        stockLocal.precio_local = precioLocal;
      }
      stockLocal.fecha_actualizacion = new Date();
    } else {
      // Crear nuevo
      stockLocal = this.stockLocalRepository.create({
        id_producto: productId,
        id_local: localId,
        stock,
        precio_local: precioLocal,
        activo: true
      });
    }

    return this.stockLocalRepository.save(stockLocal);
  }
}
