import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/users.entity";
import { Product } from "../products/entities/product.entity";
import { Order } from "../orders/entities/order.entity";
import { Role } from "../users/entities/role.entity";

/**
 * Servicio para funcionalidades de administración
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Obtiene estadísticas del dashboard
   */
  async getDashboardStats(userRoles: string[], userCity?: number) {
    const isSuperAdmin = userRoles.includes("superadmin");

    // Construir condiciones de filtro basadas en el rol y ciudad
    const cityCondition = isSuperAdmin ? {} : { id_ciudad: userCity };

    // Obtener conteo de productos
    const totalProducts = await this.productRepository.count();

    // Obtener conteo de usuarios
    const totalUsers = await this.userRepository.count({
      where: cityCondition,
    });

    // Obtener conteo de pedidos
    const totalOrders = await this.orderRepository.count();

    // Obtener repartidores pendientes (usuarios con rol repartidor)
    const pendingDeliveries = await this.userRepository
      .createQueryBuilder("user")
      .innerJoin("user.roles", "role")
      .where("role.nombre = :roleName", { roleName: "repartidor" })
      .andWhere(
        isSuperAdmin ? "1=1" : "user.id_ciudad = :cityId",
        isSuperAdmin ? {} : { cityId: userCity },
      )
      .getCount();

    // Calcular ingresos totales (suma de totales de pedidos completados)
    const revenueResult = await this.orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.total)", "total")
      .where("order.estado = :estado", { estado: "completado" })
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult?.total || "0");

    return {
      totalProducts,
      totalUsers,
      totalOrders,
      pendingDeliveries,
      totalRevenue,
      currency: "COP",
    };
  }

  /**
   * Obtiene lista de repartidores pendientes de aprobación
   */
  async getPendingDeliveries(userRoles: string[], userCity?: number) {
    const isSuperAdmin = userRoles.includes("superadmin");

    const pendingDeliveries = await this.userRepository
      .createQueryBuilder("user")
      .innerJoinAndSelect("user.roles", "role")
      .innerJoinAndSelect("user.city", "city")
      .where("role.nombre = :roleName", { roleName: "repartidor" })
      .andWhere(
        isSuperAdmin ? "1=1" : "user.id_ciudad = :cityId",
        isSuperAdmin ? {} : { cityId: userCity },
      )
      .select([
        "user.id_usuario",
        "user.nombre",
        "user.correo",
        "user.telefono",
        "user.fecha_registro",
        "city.id_ciudad",
        "city.nombre",
        "role.nombre",
      ])
      .getMany();

    return pendingDeliveries;
  }

  async getAllDeliveries(userRoles: string[], userCity?: number) {
    const isSuperAdmin = userRoles.includes("superadmin");

    const deliveries = await this.userRepository
      .createQueryBuilder("user")
      .innerJoin("user.roles", "role")
      .innerJoinAndSelect("user.city", "city")
      .where("role.nombre = :roleName", { roleName: "repartidor" })
      .andWhere(
        isSuperAdmin ? "1=1" : "user.id_ciudad = :cityId",
        isSuperAdmin ? {} : { cityId: userCity },
      )
      .select([
        "user.id_usuario",
        "user.nombre",
        "user.correo",
        "user.telefono",
        "user.fecha_registro",
        "user.delivery_status",
        "city.id_ciudad",
        "city.nombre",
      ])
      .getMany();

    return deliveries.map((d) => ({
      id_usuario: d.id_usuario,
      nombre: d.nombre,
      correo: d.correo,
      telefono: d.telefono,
      estado: d.delivery_status,
      fecha_registro: d.fecha_registro,
      city: d.city,
    }));
  }

  async deactivateDelivery(
    deliveryId: number,
    userRoles: string[],
    userCity?: number,
  ) {
    const isSuperAdmin = userRoles.includes("superadmin");

    const delivery = await this.userRepository
      .createQueryBuilder("user")
      .innerJoin("user.roles", "role")
      .innerJoinAndSelect("user.city", "city")
      .where("user.id_usuario = :deliveryId", { deliveryId })
      .andWhere("role.nombre = :roleName", { roleName: "repartidor" })
      .andWhere(
        isSuperAdmin ? "1=1" : "user.id_ciudad = :cityId",
        isSuperAdmin ? {} : { cityId: userCity },
      )
      .getOne();

    if (!delivery) {
      throw new NotFoundException(
        "Repartidor no encontrado o no tienes permisos para desactivarlo",
      );
    }

    delivery.delivery_status = "rejected";
    await this.userRepository.save(delivery);

    return {
      message: "Repartidor desactivado exitosamente",
      delivery: {
        id: delivery.id_usuario,
        name: delivery.nombre,
        email: delivery.correo,
        status: delivery.delivery_status,
      },
    };
  }

  /**
   * Aprueba un repartidor pendiente
   */
  async approveDelivery(
    deliveryId: number,
    userRoles: string[],
    userCity?: number,
  ) {
    const isSuperAdmin = userRoles.includes("superadmin");

    const delivery = await this.userRepository
      .createQueryBuilder("user")
      .innerJoinAndSelect("user.roles", "role")
      .innerJoinAndSelect("user.city", "city")
      .where("user.id_usuario = :deliveryId", { deliveryId })
      .andWhere("role.nombre = :roleName", { roleName: "repartidor" })
      .andWhere(
        isSuperAdmin ? "1=1" : "user.id_ciudad = :cityId",
        isSuperAdmin ? {} : { cityId: userCity },
      )
      .getOne();

    if (!delivery) {
      throw new NotFoundException(
        "Repartidor no encontrado o no tienes permisos para aprobarlo",
      );
    }

    if (delivery.delivery_status === "approved") {
      throw new BadRequestException("El repartidor ya está aprobado");
    }

    delivery.delivery_status = "approved";
    await this.userRepository.save(delivery);

    return {
      message: "Repartidor aprobado exitosamente",
      delivery: {
        id: delivery.id_usuario,
        name: delivery.nombre,
        email: delivery.correo,
        status: delivery.delivery_status,
      },
    };
  }

  /**
   * Rechaza un repartidor pendiente
   */
  async rejectDelivery(
    deliveryId: number,
    userRoles: string[],
    userCity?: number,
  ) {
    const isSuperAdmin = userRoles.includes("superadmin");

    const delivery = await this.userRepository
      .createQueryBuilder("user")
      .innerJoinAndSelect("user.roles", "role")
      .innerJoinAndSelect("user.city", "city")
      .where("user.id_usuario = :deliveryId", { deliveryId })
      .andWhere("role.nombre = :roleName", { roleName: "repartidor" })
      .andWhere(
        isSuperAdmin ? "1=1" : "user.id_ciudad = :cityId",
        isSuperAdmin ? {} : { cityId: userCity },
      )
      .getOne();

    if (!delivery) {
      throw new NotFoundException(
        "Repartidor no encontrado o no tienes permisos para rechazarlo",
      );
    }

    if (delivery.delivery_status === "rejected") {
      throw new BadRequestException("El repartidor ya está rechazado");
    }

    delivery.delivery_status = "rejected";
    await this.userRepository.save(delivery);

    return {
      message: "Repartidor rechazado exitosamente",
      delivery: {
        id: delivery.id_usuario,
        name: delivery.nombre,
        email: delivery.correo,
        status: delivery.delivery_status,
      },
    };
  }
}
