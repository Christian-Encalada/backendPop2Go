import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

/**
 * Entidad para la tabla de productos en carrito/pedido
 * Representa los productos incluidos en un pedido específico
 */
@Entity('tbl_carrito_productos')
export class OrderItem {
  @PrimaryGeneratedColumn()
  tbl_id_carrito: number;

  @Column()
  tbl_cantidad: number;

  @Column('decimal', { precision: 10, scale: 2 })
  tbl_precio_unitario: number;

  // Relaciones
  @ManyToOne(() => Order, order => order.orderItems)
  @JoinColumn({ name: 'tbl_id_pedido' })
  order: Order;

  @Column()
  tbl_id_pedido: number;

  @ManyToOne(() => Product, product => product.orderItems)
  @JoinColumn({ name: 'tbl_id_producto' })
  product: Product;

  @Column()
  tbl_id_producto: number;
} 