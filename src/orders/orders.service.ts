import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';

/**
 * Servicio para la gestión de pedidos
 * Implementa la lógica de negocio relacionada con los pedidos
 */
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    
    private productsService: ProductsService,
    
    private dataSource: DataSource,
  ) {}

  /**
   * Crea un nuevo pedido
   * @param createOrderDto Datos del pedido a crear
   * @param userId ID del usuario que realiza el pedido
   * @returns El pedido creado
   */
  async create(createOrderDto: CreateOrderDto, userId: number): Promise<Order> {
    // Iniciar transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear el pedido
      const newOrder = this.orderRepository.create({
        id_usuario: userId,
        id_direccion: createOrderDto.id_direccion,
        estado: 'pendiente',
        total: 0, // Se calculará después
      });
      
      const savedOrder = await queryRunner.manager.save(newOrder);
      
      let total = 0;
      
      // Crear los items del pedido
      for (const item of createOrderDto.productos) {
        // Obtener producto
        const producto = await this.productsService.findOne(item.id_producto);
        
        if (!producto.activo) {
          throw new BadRequestException(`El producto ${producto.nombre} no está activo`);
        }
        
        if (producto.stock < item.cantidad) {
          throw new BadRequestException(`No hay suficiente stock del producto ${producto.nombre}`);
        }
        
        // Crear item del pedido
        const orderItem = this.orderItemRepository.create({
          id_pedido: savedOrder.id_pedido,
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: producto.precio,
        });
        
        await queryRunner.manager.save(orderItem);
        
        // Actualizar stock
        await this.productsService.updateStock(item.id_producto, -item.cantidad);
        
        // Sumar al total
        total += producto.precio * item.cantidad;
      }
      
      // Actualizar total del pedido
      savedOrder.total = total;
      await queryRunner.manager.save(savedOrder);
      
      // Confirmar transacción
      await queryRunner.commitTransaction();
      
      return savedOrder;
      
    } catch (error) {
      // Revertir transacción en caso de error
      await queryRunner.rollbackTransaction();
      throw error;
      
    } finally {
      // Liberar recursos
      await queryRunner.release();
    }
  }

  /**
   * Obtiene todos los pedidos con filtrado según permisos
   * @param userId ID del usuario (para clientes)
   * @param userRoles Roles del usuario
   * @param cityId ID de la ciudad (para admins)
   * @returns Lista de pedidos según filtros
   */
  async findAll(userId?: number, userRoles?: string[], cityId?: number): Promise<Order[]> {
    // Construir opciones de consulta según permisos
    const options: any = {
      relations: ['user', 'address', 'orderItems', 'orderItems.product'],
    };

    // Filtrar según rol
    if (userRoles?.includes('cliente')) {
      // Cliente solo ve sus propios pedidos
      options.where = { id_usuario: userId };
    } else if (userRoles?.includes('repartidor')) {
      // Repartidor solo ve los pedidos asignados a él
      options.where = { id_repartidor: userId };
    } else if (userRoles?.includes('admin') && !userRoles.includes('superadmin')) {
      // Admin ve pedidos de su ciudad
      if (cityId) {
        options.where = { user: { id_ciudad: cityId } };
      }
    }
    // Superadmin ve todos los pedidos

    return this.orderRepository.find(options);
  }

  /**
   * Encuentra un pedido específico por ID según permisos
   * @param id ID del pedido a buscar
   * @param userId ID del usuario (para clientes)
   * @param userRoles Roles del usuario
   * @param cityId ID de la ciudad (para admins)
   * @returns El pedido encontrado
   */
  async findOne(id: number, userId?: number, userRoles?: string[], cityId?: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id_pedido: id },
      relations: ['user', 'address', 'orderItems', 'orderItems.product'],
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    // Verificar permisos
    if (userRoles?.includes('cliente') && order.id_usuario !== userId) {
      throw new ForbiddenException('No tiene permiso para acceder a este pedido');
    } else if (userRoles?.includes('repartidor') && order.id_repartidor !== userId) {
      throw new ForbiddenException('No tiene permiso para acceder a este pedido');
    } else if (userRoles?.includes('admin') && !userRoles.includes('superadmin') && cityId) {
      // Verificar si el pedido es de la ciudad del admin
      if (order.user.id_ciudad !== cityId) {
        throw new ForbiddenException('No tiene permiso para acceder a este pedido');
      }
    }

    return order;
  }

  /**
   * Actualiza el estado de un pedido
   * @param id ID del pedido a actualizar
   * @param estado Nuevo estado del pedido
   * @param userId ID del usuario que realiza la actualización
   * @param userRoles Roles del usuario
   * @param cityId ID de la ciudad (para admins)
   * @returns El pedido actualizado
   */
  async updateStatus(id: number, estado: string, userId?: number, userRoles?: string[], cityId?: number): Promise<Order> {
    const order = await this.findOne(id, userId, userRoles, cityId);
    
    // Validar estado
    if (!['pendiente', 'en_camino', 'entregado', 'cancelado'].includes(estado)) {
      throw new BadRequestException('Estado inválido');
    }

    // Verificar reglas específicas según estado
    if (estado === 'cancelado' && (order.estado === 'entregado' || order.estado === 'en_camino')) {
      throw new BadRequestException('No se puede cancelar un pedido que ya está en camino o entregado');
    }

    // Si se cancela, devolver stock
    if (estado === 'cancelado' && order.estado !== 'cancelado') {
      for (const item of order.orderItems) {
        await this.productsService.updateStock(item.id_producto, item.cantidad);
      }
    }

    // Actualizar estado y guardar
    order.estado = estado;
    
    // Si está en_camino y es repartidor, asignarlo como repartidor
    if (estado === 'en_camino' && userRoles?.includes('repartidor')) {
      order.id_repartidor = userId;
    }
    
    // Si está entregado, registrar tiempo de entrega
    if (estado === 'entregado') {
      const fechaPedido = new Date(order.fecha_pedido);
      const fechaEntrega = new Date();
      const tiempoEntrega = Math.floor((fechaEntrega.getTime() - fechaPedido.getTime()) / (1000 * 60)); // Minutos
      order.tiempo_entrega = `${tiempoEntrega} minutes`;
    }
    
    return this.orderRepository.save(order);
  }
} 