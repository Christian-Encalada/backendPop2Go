import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductsModule } from '../products/products.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DeliveryOrdersController } from './delivery-orders.controller';
import { User } from '../users/entities/users.entity';
import { KitchenOrdersController } from './kitchen-orders.controller';
import { AddressesModule } from '../addresses/addresses.module';

/**
 * Módulo de Pedidos
 * Gestiona las funcionalidades relacionadas con los pedidos y sus items
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, User]),
    ProductsModule, // Importamos el módulo de productos para gestionar el stock
    NotificationsModule, // Para enviar notificaciones push
    AddressesModule, // Importamos el módulo de direcciones para validar
  ],
  controllers: [OrdersController, DeliveryOrdersController, KitchenOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {} 