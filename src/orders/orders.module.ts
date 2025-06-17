import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductsModule } from '../products/products.module';

/**
 * Módulo de Pedidos
 * Gestiona las funcionalidades relacionadas con los pedidos y sus items
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    ProductsModule, // Importamos el módulo de productos para gestionar el stock
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {} 