import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';
import { AddressesService } from '../addresses/addresses.service';

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
    
    private addressesService: AddressesService,
    
    private dataSource: DataSource,
  ) {}

  /**
   * Crea un nuevo pedido
   * @param createOrderDto Datos del pedido a crear
   * @param userId ID del usuario que realiza el pedido
   * @returns El pedido creado
   */
  async create(createOrderDto: CreateOrderDto, userId: number): Promise<Order> {
    // Validar que la dirección existe y pertenece al usuario
    try {
      await this.addressesService.findOne(createOrderDto.id_direccion, userId, ['cliente']);
    } catch (error) {
      throw new BadRequestException('La dirección especificada no existe o no te pertenece');
    }

    // Iniciar transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear el pedido
      const newOrder = this.orderRepository.create({
        id_usuario: userId,
        id_direccion: createOrderDto.id_direccion,
        estado: 'en_cocina',
        total: 0, // Se calculará después
        metodo_pago: createOrderDto.metodo_pago,
        monto_efectivo: createOrderDto.monto_efectivo,
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
    } else if (userRoles?.includes('cocina')) {
      // Cocina ve pedidos pendientes y en_cocina
      options.where = [
        { estado: 'pendiente' },
        { estado: 'en_cocina' },
      ];
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
  /**
   * Estados válidos del flujo de pedidos
   */
  private readonly VALID_STATES = [
    'pendiente', 'en_cocina', 'aceptado_cocina', 
    'asignado_delivery', 'en_camino', 'entregado', 'cancelado'
  ];

  async updateStatus(id: number, estado: string, userId?: number, userRoles?: string[], cityId?: number): Promise<Order> {
    // Para cocina y repartidor, buscar el pedido sin restricciones de propiedad
    let order: Order;
    if (userRoles?.includes('cocina') || userRoles?.includes('repartidor')) {
      order = await this.orderRepository.findOne({
        where: { id_pedido: id },
        relations: ['user', 'address', 'orderItems', 'orderItems.product'],
      });
      if (!order) throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    } else {
      order = await this.findOne(id, userId, userRoles, cityId);
    }
    
    // Validar estado
    if (!this.VALID_STATES.includes(estado)) {
      throw new BadRequestException('Estado inválido');
    }

    // Verificar reglas específicas según estado
    if (estado === 'cancelado' && ['entregado', 'en_camino'].includes(order.estado)) {
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
    
    // Cocina acepta el pedido
    if (estado === 'aceptado_cocina') {
      order.fecha_aceptado_cocina = new Date();
    }

    // Delivery acepta el pedido
    if (estado === 'asignado_delivery' && userRoles?.includes('repartidor')) {
      order.id_repartidor = userId;
      order.fecha_asignado_delivery = new Date();
    }
    
    // Si está en_camino y es repartidor, asignarlo como repartidor
    if (estado === 'en_camino' && userRoles?.includes('repartidor')) {
      order.id_repartidor = userId;
    }
    
    // Si está entregado, registrar tiempo de entrega
    if (estado === 'entregado') {
      const fechaPedido = new Date(order.fecha_pedido);
      const fechaEntrega = new Date();
      const tiempoEntrega = Math.floor((fechaEntrega.getTime() - fechaPedido.getTime()) / (1000 * 60));
      order.tiempo_entrega = `${tiempoEntrega} minutes`;
    }
    
    return this.orderRepository.save(order);
  }

  /**
   * Obtiene pedidos pendientes para cocina (estado 'pendiente' o 'en_cocina')
   */
  async findKitchenOrders(cityId?: number): Promise<Order[]> {
    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .where('order.estado IN (:...estados)', { estados: ['pendiente', 'en_cocina'] })
      .orderBy('order.fecha_pedido', 'ASC');

    if (cityId) {
      query.andWhere('user.id_ciudad = :cityId', { cityId });
    }

    return query.getMany();
  }

  /**
   * Cocina acepta un pedido - cambia de pendiente/en_cocina a aceptado_cocina
   */
  async kitchenAcceptOrder(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id_pedido: orderId },
      relations: ['user', 'address', 'orderItems', 'orderItems.product'],
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${orderId} no encontrado`);
    }

    if (!['pendiente', 'en_cocina'].includes(order.estado)) {
      throw new BadRequestException('Este pedido no puede ser aceptado por cocina');
    }

    order.estado = 'aceptado_cocina';
    order.fecha_aceptado_cocina = new Date();
    return this.orderRepository.save(order);
  }

  /**
   * Obtiene pedidos disponibles para delivery (estado 'aceptado_cocina')
   */
  async findAvailableForDelivery(cityId?: number): Promise<Order[]> {
    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .where('order.estado = :estado', { estado: 'aceptado_cocina' })
      .andWhere('order.id_repartidor IS NULL')
      .orderBy('order.fecha_pedido', 'ASC');

    if (cityId) {
      query.andWhere('user.id_ciudad = :cityId', { cityId });
    }

    return query.getMany();
  }

  /**
   * Delivery acepta un pedido
   */
  async deliveryAcceptOrder(orderId: number, deliveryUserId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id_pedido: orderId },
      relations: ['user', 'address', 'orderItems', 'orderItems.product'],
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${orderId} no encontrado`);
    }

    if (order.estado !== 'aceptado_cocina') {
      throw new BadRequestException('Este pedido no está disponible para delivery');
    }

    if (order.id_repartidor) {
      throw new BadRequestException('Este pedido ya fue asignado a otro repartidor');
    }

    order.estado = 'asignado_delivery';
    order.id_repartidor = deliveryUserId;
    order.fecha_asignado_delivery = new Date();
    return this.orderRepository.save(order);
  }

  /**
   * Obtiene pedidos asignados a un delivery específico
   */
  async findDeliveryOrders(deliveryUserId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { id_repartidor: deliveryUserId },
      relations: ['user', 'address', 'orderItems', 'orderItems.product'],
      order: { fecha_pedido: 'DESC' },
    });
  }
}