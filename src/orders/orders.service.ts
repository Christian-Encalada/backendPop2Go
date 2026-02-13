import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException, ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { CreateOrderDto } from "./dto/create-order.dto";
import { ProductsService } from "../products/products.service";
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/users.entity';
import { AddressesService } from "../addresses/addresses.service";

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

    @InjectRepository(User)
    private userRepository: Repository<User>,
    
    private productsService: ProductsService,
    
    private notificationsService: NotificationsService,

    private addressesService: AddressesService,

    private dataSource: DataSource,
  ) {}

  // Estados soportados (backend)
  private readonly allowedStatuses = [
    'nuevo', // creado por el cliente, esperando confirmación de cocina/local
    'preparando', // cocina confirma y comienza preparación
    'asignado', // delivery acepta y va al local
    'listo_para_recoger', // cocina marca listo para pickup
    'recogido', // delivery recogió en local
    'en_camino', // delivery va al cliente
    'entregado', // entregado al cliente
    'cancelado',
    // legacy (para no romper datos viejos)
    'pendiente', // se trata como "nuevo"
  ] as const;

  /**
   * Crea un nuevo pedido
   * @param createOrderDto Datos del pedido a crear
   * @param userId ID del usuario que realiza el pedido
   * @returns El pedido creado
   */
  async create(createOrderDto: CreateOrderDto, userId: number): Promise<Order> {
    // Validar que la dirección existe y pertenece al usuario
    try {
      await this.addressesService.findOne(createOrderDto.id_direccion, userId, [
        "cliente",
      ]);
    } catch (error) {
      throw new BadRequestException(
        "La dirección especificada no existe o no te pertenece",
      );
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
        estado: 'nuevo',
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
          throw new BadRequestException(
            `El producto ${producto.nombre} no está activo`,
          );
        }

        if (producto.stock < item.cantidad) {
          throw new BadRequestException(
            `No hay suficiente stock del producto ${producto.nombre}`,
          );
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
        await this.productsService.updateStock(
          item.id_producto,
          -item.cantidad,
        );

        // Sumar al total
        total += producto.precio * item.cantidad;
      }

      // Actualizar total del pedido
      savedOrder.total = total;
      await queryRunner.manager.save(savedOrder);

      // Confirmar transacción
      await queryRunner.commitTransaction();

      // NOTA: en este nuevo flujo NO notificamos a deliveries aquí.
      // Primero cocina debe confirmar el pedido (estado -> preparando).
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
  async findAll(
    userId?: number,
    userRoles?: string[],
    cityId?: number,
  ): Promise<Order[]> {
    // Construir opciones de consulta según permisos
    const options: any = {
      relations: [
        'user',
        'address',
        'address.store',
        'address.store.city',
        'deliveryPerson',
        'orderItems',
        'orderItems.product',
      ],
    };

    // Filtrar según rol
    if (userRoles?.includes("cliente")) {
      // Cliente solo ve sus propios pedidos
      options.where = { id_usuario: userId };
    } else if (userRoles?.includes("cocina")) {
      // Cocina ve pedidos pendientes y en_cocina
      options.where = [{ estado: "pendiente" }, { estado: "en_cocina" }];
    } else if (userRoles?.includes("repartidor")) {
      // Repartidor solo ve los pedidos asignados a él
      options.where = { id_repartidor: userId };
    } else if (
      userRoles?.includes("admin") &&
      !userRoles.includes("superadmin")
    ) {
      // Admin ve pedidos de su ciudad
      if (cityId) {
        // Importante: la ciudad del pedido la define el local (store) asociado a la dirección
        options.where = { address: { store: { id_ciudad: cityId } } };
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
  async findOne(
    id: number,
    userId?: number,
    userRoles?: string[],
    cityId?: number,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id_pedido: id },
      relations: [
        'user',
        'address',
        'address.store',
        'address.store.city',
        'deliveryPerson',
        'orderItems',
        'orderItems.product',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    // Verificar permisos
    if (userRoles?.includes("cliente") && order.id_usuario !== userId) {
      throw new ForbiddenException(
        "No tiene permiso para acceder a este pedido",
      );
    } else if (
      userRoles?.includes("repartidor") &&
      order.id_repartidor !== userId
    ) {
      throw new ForbiddenException(
        "No tiene permiso para acceder a este pedido",
      );
    } else if (
      userRoles?.includes("admin") &&
      !userRoles.includes("superadmin") &&
      cityId
    ) {
      // Verificar si el pedido es de la ciudad del admin
      if (order.user.id_ciudad !== cityId) {
        throw new ForbiddenException(
          "No tiene permiso para acceder a este pedido",
        );
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
    "pendiente",
    "en_cocina",
    "aceptado_cocina",
    "asignado_delivery",
    "en_camino",
    "entregado",
    "cancelado",
  ];

  async updateStatus(
    id: number,
    estado: string,
    userId?: number,
    userRoles?: string[],
    cityId?: number,
  ): Promise<Order> {
    // Para cocina y repartidor, buscar el pedido sin restricciones de propiedad
    let order: Order;
    if (userRoles?.includes("cocina") || userRoles?.includes("repartidor")) {
      order = await this.orderRepository.findOne({
        where: { id_pedido: id },
        relations: ["user", "address", "orderItems", "orderItems.product"],
      });
      if (!order)
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    } else {
      order = await this.findOne(id, userId, userRoles, cityId);
    }

    // Validar estado
    if (!this.allowedStatuses.includes(estado as any)) {
      throw new BadRequestException('Estado inválido');
    }

    // Verificar reglas específicas según estado
    if (
      estado === "cancelado" &&
      ["entregado", "en_camino"].includes(order.estado)
    ) {
      throw new BadRequestException(
        "No se puede cancelar un pedido que ya está en camino o entregado",
      );
    }

    // Si se cancela, devolver stock
    if (estado === "cancelado" && order.estado !== "cancelado") {
      for (const item of order.orderItems) {
        await this.productsService.updateStock(item.id_producto, item.cantidad);
      }
    }

    // Actualizar estado y guardar
    order.estado = estado;

    // Cocina acepta el pedido
    if (estado === "aceptado_cocina") {
      order.fecha_aceptado_cocina = new Date();
    }

    // Delivery acepta el pedido
    if (estado === "asignado_delivery" && userRoles?.includes("repartidor")) {
      order.id_repartidor = userId;
      order.fecha_asignado_delivery = new Date();
    }

    // Si está en_camino y es repartidor, asignarlo como repartidor
    if (estado === "en_camino" && userRoles?.includes("repartidor")) {
      order.id_repartidor = userId;
    }

    // Si está entregado, registrar tiempo de entrega
    if (estado === "entregado") {
      const fechaPedido = new Date(order.fecha_pedido);
      const fechaEntrega = new Date();
      const tiempoEntrega = Math.floor(
        (fechaEntrega.getTime() - fechaPedido.getTime()) / (1000 * 60),
      );
      order.tiempo_entrega = `${tiempoEntrega} minutes`;
    }

    return this.orderRepository.save(order);
  }

  /**
   * Pedidos disponibles para repartidores (por ciudad del repartidor)
   * - No asignados (id_repartidor null)
   * - En estado "preparando" (listos para ser aceptados)
   */
  async findAvailableForDelivery(deliveryUserId: number, deliveryCityId: number): Promise<Order[]> {
    // Validar que sea delivery aprobado (para evitar cuentas sin verificar)
    const deliveryUser = await this.userRepository.findOne({ where: { id_usuario: deliveryUserId }, relations: ['roles'] });
    if (!deliveryUser) throw new NotFoundException('Repartidor no encontrado');
    if (deliveryUser.delivery_status !== 'approved') {
      throw new ForbiddenException('Tu cuenta de repartidor aún no está aprobada');
    }

    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('address.store', 'store')
      .leftJoinAndSelect('store.city', 'city')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .where('order.id_repartidor IS NULL')
      .andWhere('order.estado IN (:...statuses)', { statuses: ['preparando'] })
      .andWhere('store.id_ciudad = :cityId', { cityId: deliveryCityId })
      .orderBy('order.fecha_pedido', 'DESC')
      .getMany();
  }

  /**
   * Pedidos asignados a un repartidor
   */
  async findAssignedForDelivery(deliveryUserId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { id_repartidor: deliveryUserId },
      relations: [
        'user',
        'address',
        'address.store',
        'address.store.city',
        'deliveryPerson',
        'orderItems',
        'orderItems.product',
      ],
      order: { fecha_pedido: 'DESC' } as any,
    });
  }

  /**
   * Aceptar un pedido: asignación atómica para evitar doble-aceptación.
   * Transición: preparando/pendiente -> asignado, set id_repartidor
   */
  async acceptOrder(orderId: number, deliveryUserId: number, deliveryCityId: number): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock pessimista para evitar que 2 repartidores acepten al mismo tiempo
      // Primero bloquear solo la orden (sin JOINs para evitar error de PostgreSQL)
      const order = await queryRunner.manager
        .createQueryBuilder(Order, 'order')
        .setLock('pessimistic_write')
        .where('order.id_pedido = :orderId', { orderId })
        .getOne();

      if (!order) throw new NotFoundException(`Pedido con ID ${orderId} no encontrado`);
      if (order.id_repartidor) throw new ConflictException('Este pedido ya fue aceptado por otro repartidor');

      // Solo se puede aceptar cuando cocina ya confirmó (preparando)
      if (!['preparando', 'pendiente'].includes(order.estado)) {
        throw new BadRequestException('Este pedido no está disponible para aceptar');
      }

      order.id_repartidor = deliveryUserId;
      order.estado = 'asignado';
      const saved = await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      // devolver con relaciones para el frontend
      return this.findOne(saved.id_pedido, deliveryUserId, ['repartidor'], deliveryCityId);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Avanzar estado del pedido por el repartidor asignado
   * Transiciones válidas:
   * - asignado -> recogido
   * - recogido -> en_camino
   * - en_camino -> entregado
   */
  async advanceDeliveryStatus(
    orderId: number,
    nextStatus: 'recogido' | 'en_camino' | 'entregado',
    deliveryUserId: number,
    deliveryCityId: number,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id_pedido: orderId },
      relations: ['address', 'address.store', 'orderItems'],
    });

    if (!order) throw new NotFoundException(`Pedido con ID ${orderId} no encontrado`);

    const storeCityId = (order as any).address?.store?.id_ciudad;
    if (storeCityId && storeCityId !== deliveryCityId) {
      throw new ForbiddenException('Este pedido no pertenece a tu ciudad');
    }

    if (order.id_repartidor !== deliveryUserId) {
      throw new ForbiddenException('No tienes permiso para actualizar este pedido');
    }

    // Reglas:
    // - asignado -> NO puede pasar directo a recogido; primero cocina debe marcar listo_para_recoger
    // - listo_para_recoger -> recogido (delivery)
    // - recogido -> en_camino
    // - en_camino -> entregado
    const transitionOk =
      (order.estado === 'listo_para_recoger' && nextStatus === 'recogido') ||
      (order.estado === 'recogido' && nextStatus === 'en_camino') ||
      (order.estado === 'en_camino' && nextStatus === 'entregado');

    if (!transitionOk) {
      throw new BadRequestException(`Transición inválida: ${order.estado} -> ${nextStatus}`);
    }

    order.estado = nextStatus;

    // Si está entregado, registrar tiempo de entrega
    if (nextStatus === 'entregado') {
      const fechaPedido = new Date(order.fecha_pedido);
      const fechaEntrega = new Date();
      const tiempoEntrega = Math.floor((fechaEntrega.getTime() - fechaPedido.getTime()) / (1000 * 60)); // Minutos
      order.tiempo_entrega = `${tiempoEntrega} minutes`;
    }

    await this.orderRepository.save(order);
    return this.findOne(orderId, deliveryUserId, ['repartidor'], deliveryCityId);
  }

  /**
   * Cocina: confirmar pedido (nuevo/pendiente -> preparando)
   * También dispara notificación a deliveries activos de la ciudad.
   */
  async kitchenConfirm(orderId: number, kitchenUserId: number, kitchenCityId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id_pedido: orderId },
      relations: ['address', 'address.store'],
    });

    if (!order) throw new NotFoundException(`Pedido con ID ${orderId} no encontrado`);

    const storeCityId = (order as any).address?.store?.id_ciudad;
    if (storeCityId && storeCityId !== kitchenCityId) {
      throw new ForbiddenException('Este pedido no pertenece a tu ciudad');
    }

    const current = order.estado === 'pendiente' ? 'nuevo' : order.estado;
    if (current !== 'nuevo') {
      throw new BadRequestException('Este pedido ya fue confirmado o no está en estado válido');
    }

    order.estado = 'preparando';
    await this.orderRepository.save(order);

    // Notificar a deliveries activos en la ciudad para que puedan aceptar
    if (storeCityId) {
      this.notificationsService
        .notifyDeliveriesInCity(
          storeCityId,
          '🍦 Pedido confirmado',
          `Pedido #${order.id_pedido} listo para ser aceptado por delivery`,
          { orderId: order.id_pedido, type: 'order_confirmed' },
        )
        .catch(() => undefined);
    }

    return this.findOne(order.id_pedido, kitchenUserId, ['cocina'], kitchenCityId);
  }

  /**
   * Cocina: marcar listo para recoger (asignado -> listo_para_recoger)
   */
  async kitchenMarkReady(orderId: number, kitchenUserId: number, kitchenCityId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id_pedido: orderId },
      relations: ['address', 'address.store'],
    });

    if (!order) throw new NotFoundException(`Pedido con ID ${orderId} no encontrado`);

    const storeCityId = (order as any).address?.store?.id_ciudad;
    if (storeCityId && storeCityId !== kitchenCityId) {
      throw new ForbiddenException('Este pedido no pertenece a tu ciudad');
    }

    if (order.estado !== 'asignado') {
      throw new BadRequestException('Solo puedes marcar listo cuando el pedido está asignado a un delivery');
    }

    order.estado = 'listo_para_recoger';
    await this.orderRepository.save(order);

    return this.findOne(order.id_pedido, kitchenUserId, ['cocina'], kitchenCityId);
  }

  /**
   * Elimina un pedido (solo para admins)
   * Los items del pedido se eliminan automáticamente gracias a CASCADE
   * @param id ID del pedido a eliminar
   * @param userId ID del usuario que realiza la eliminación
   * @param userRoles Roles del usuario
   * @returns Mensaje de confirmación
   */
  async remove(id: number, userId: number, userRoles: string[]): Promise<{ message: string }> {
    // Solo admins pueden eliminar pedidos
    if (!userRoles.includes('admin') && !userRoles.includes('superadmin')) {
      throw new ForbiddenException('Solo los administradores pueden eliminar pedidos');
    }

    const order = await this.findOne(id, userId, userRoles);

    // Verificar que el pedido no esté en un estado crítico (opcional: solo permitir eliminar cancelados o entregados antiguos)
    // Por ahora, permitimos eliminar cualquier pedido si eres admin

    // Eliminar el pedido (los items se eliminan automáticamente por CASCADE)
    await this.orderRepository.remove(order);

    return { message: `Pedido #${id} eliminado exitosamente` };
  }
}
