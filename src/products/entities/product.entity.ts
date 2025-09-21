import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { StockLocal } from './stock-local.entity';

/**
 * Entidad para la tabla de productos
 * Representa los productos disponibles en el sistema
 */
@Entity('tbl_productos')
export class Product {
  @PrimaryGeneratedColumn()
  id_producto: number;

  @Column({ length: 100 })
  nombre: string;

  @Column('text', { nullable: true })
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column()
  stock: number;

  @Column({ default: true })
  activo: boolean;

  // Relaciones
  @OneToMany(() => OrderItem, orderItem => orderItem.product)
  orderItems: OrderItem[];

  @OneToMany(() => StockLocal, stockLocal => stockLocal.product)
  stockLocales: StockLocal[];
}