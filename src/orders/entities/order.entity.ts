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
  id_pedido: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_pedido: Date;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'pendiente'
  })
  estado: string; // 'pendiente', 'en_camino', 'entregado', 'cancelado'

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'interval', nullable: true })
  tiempo_entrega: string;

  // Relaciones
  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @Column()
  id_usuario: number;

  @ManyToOne(() => Address)
  @JoinColumn({ name: 'id_direccion' })
  address: Address;

  @Column()
  id_direccion: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_repartidor' })
  deliveryPerson: User;

  @Column({ nullable: true })
  id_repartidor: number;

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  orderItems: OrderItem[];
} 