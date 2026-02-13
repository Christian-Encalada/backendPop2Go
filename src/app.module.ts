import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";

import { databaseConfig } from "./config/database.config";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CitiesModule } from "./cities/cities.module";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";
import { AddressesModule } from "./addresses/addresses.module";
import { StoresModule } from "./stores/stores.module";
import { AdminModule } from "./admin/admin.module";
import { AppController } from "./app.controller";
import { CategoriesModule } from "./categories/categories.module";
import { UploadModule } from "./upload/upload.module";

/**
 * Módulo principal de la aplicación
 * Configura todos los aspectos globales y registra los módulos
 */
@Module({
  imports: [
    // Variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Base de datos
    TypeOrmModule.forRoot(databaseConfig),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      },
    ]),

    // Módulos de la aplicación
    AuthModule,
    UsersModule,
    CitiesModule,
    StoresModule,
    ProductsModule,
    OrdersModule,
    AddressesModule,
    AdminModule,
    CategoriesModule,
    UploadModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
