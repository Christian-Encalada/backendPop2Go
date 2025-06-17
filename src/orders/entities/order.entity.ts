import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Address } from '../../addresses/entities/address.entity';
import { OrderItem } from './order-item.entity';

/**
 * Entidad para la tabla de pedidos
 * Representa los pedidos realizados por los clientes
 */
@Entity('tbl_pedidos')
export class Order {
  @PrimaryGeneratedColumn()
  tbl_id_pedido: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  tbl_fecha_pedido: Date;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'pendiente'
  })
  tbl_estado: string; // 'pendiente', 'en_camino', 'entregado', 'cancelado'

  @Column('decimal', { precision: 10, scale: 2 })
  tbl_total: number;

  @Column({ type: 'interval', nullable: true })
  tbl_tiempo_entrega: string;

  // Relaciones
  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'tbl_id_usuario' })
  user: User;

  @Column()
  tbl_id_usuario: number;

  @ManyToOne(() => Address)
  @JoinColumn({ name: 'tbl_id_direccion' })
  address: Address;

  @Column()
  tbl_id_direccion: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tbl_id_repartidor' })
  deliveryPerson: User;

  @Column({ nullable: true })
  tbl_id_repartidor: number;

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  orderItems: OrderItem[];
} 