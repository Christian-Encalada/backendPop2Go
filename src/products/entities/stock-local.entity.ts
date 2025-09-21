import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Product } from './product.entity';
import { Store } from '../../stores/entities/store.entity';

/**
 * Entidad para la tabla de stock por local
 * Representa el stock específico de cada producto en cada local
 */
@Entity('tbl_stock_local')
@Unique(['id_producto', 'id_local']) // Un producto solo puede tener un registro por local
export class StockLocal {
  @PrimaryGeneratedColumn()
  id_stock_local: number;

  @Column()
  stock: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  precio_local: number; // Precio específico del local (opcional, si es null usa el precio base del producto)

  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_actualizacion: Date;

  // Relaciones
  @ManyToOne(() => Product, product => product.stockLocales)
  @JoinColumn({ name: 'id_producto' })
  product: Product;

  @Column()
  id_producto: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'id_local' })
  store: Store;

  @Column()
  id_local: number;
}