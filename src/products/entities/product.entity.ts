import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { OrderItem } from '../../orders/entities/order-item.entity';

/**
 * Entidad para la tabla de productos
 * Representa los productos disponibles en el sistema
 */
@Entity('tbl_productos')
export class Product {
  @PrimaryGeneratedColumn()
  tbl_id_producto: number;

  @Column({ length: 100 })
  tbl_nombre: string;

  @Column('text', { nullable: true })
  tbl_descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  tbl_precio: number;

  @Column()
  tbl_stock: number;

  @Column({ default: true })
  tbl_activo: boolean;

  // Relaciones
  @OneToMany(() => OrderItem, orderItem => orderItem.product)
  orderItems: OrderItem[];
} 