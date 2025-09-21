import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { StockLocal } from './entities/stock-local.entity';

/**
 * Módulo de Productos
 * Gestiona las funcionalidades relacionadas con los productos del sistema
 */
@Module({
  imports: [TypeOrmModule.forFeature([Product, StockLocal])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}