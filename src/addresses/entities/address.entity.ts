import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Store } from '../../stores/entities/store.entity';
import { Order } from '../../orders/entities/order.entity';

/**
 * Entidad para la tabla de direcciones
 * Representa las direcciones de entrega registradas por los usuarios
 */
@Entity('tbl_direcciones')
export class Address {
  @PrimaryGeneratedColumn()
  id_direccion: number;

  @Column('text')
  direccion: string;

  @Column('text', { nullable: true })
  referencia: string;

  @Column('boolean', { default: false })
  is_default: boolean;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude: number;

  // Relaciones
  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @Column()
  id_usuario: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'id_local' })
  store: Store;

  @Column()
  id_local: number;

  @OneToMany(() => Order, order => order.address)
  orders: Order[];
}