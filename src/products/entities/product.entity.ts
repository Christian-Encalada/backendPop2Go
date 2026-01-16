import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { StockLocal } from './stock-local.entity';
import { Category } from '../../categories/entities/category.entity';

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

  @Column('text', { nullable: true })
  imagen: string;

  @Column({ nullable: true })
  id_categoria: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  precio: number;

  @Column()
  stock: number;

  @Column({ default: true })
  activo: boolean;

  // Relaciones
  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'id_categoria' })
  categoryRelation: Category;

  @OneToMany(() => OrderItem, orderItem => orderItem.product)
  orderItems: OrderItem[];

  @OneToMany(() => StockLocal, stockLocal => stockLocal.product)
  stockLocales: StockLocal[];
}
