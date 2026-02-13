import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "./admin.controller";
import { DeliveryController } from "./delivery.controller";
import { AdminService } from "./admin.service";
import { UsersModule } from '../users/users.module';
import { User } from "../users/entities/users.entity";
import { Product } from "../products/entities/product.entity";
import { Order } from "../orders/entities/order.entity";
import { Role } from "../users/entities/role.entity";

/**
 * Módulo de administración
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Product,
      Order,
      Role
    ]),
    UsersModule,
  ],
  controllers: [AdminController, DeliveryController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
