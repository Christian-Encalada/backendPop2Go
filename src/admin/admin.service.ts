import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/users.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { Role } from '../users/entities/role.entity';

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
    const isSuperAdmin = userRoles.includes('superadmin');
    
    // Construir condiciones de filtro basadas en el rol y ciudad
    const cityCondition = isSuperAdmin ? {} : { id_ciudad: userCity };

    // Obtener conteo de productos
    const totalProducts = await this.productRepository.count();

    // Obtener conteo de usuarios
    const totalUsers = await this.userRepository.count({
      where: cityCondition
    });

    // Obtener conteo de pedidos
    const totalOrders = await this.orderRepository.count();

    // Obtener repartidores pendientes (usuarios con rol repartidor)
    const pendingDeliveries = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.nombre = :roleName', { roleName: 'repartidor' })
      .andWhere(isSuperAdmin ? '1=1' : 'user.id_ciudad = :cityId', 
        isSuperAdmin ? {} : { cityId: userCity })
      .getCount();

    // Calcular ingresos totales (suma de totales de pedidos completados)
    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.estado = :estado', { estado: 'completado' })
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult?.total || '0');

    return {
      totalProducts,
      totalUsers,
      totalOrders,
      pendingDeliveries,
      totalRevenue,
      currency: 'COP'
    };
  }

  /**
   * Obtiene lista de repartidores pendientes de aprobación
   */
  async getPendingDeliveries(userRoles: string[], userCity?: number) {
    const isSuperAdmin = userRoles.includes('superadmin');

    const pendingDeliveries = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.roles', 'role')
      .innerJoinAndSelect('user.city', 'city')
      .where('role.nombre = :roleName', { roleName: 'repartidor' })
      .andWhere(isSuperAdmin ? '1=1' : 'user.id_ciudad = :cityId', 
        isSuperAdmin ? {} : { cityId: userCity })
      .select([
        'user.id_usuario',
        'user.nombre',
        'user.correo',
        'user.telefono',
        'user.fecha_registro',
        'city.id_ciudad',
        'city.nombre',
        'role.nombre'
      ])
      .getMany();

    return pendingDeliveries;
  }
}