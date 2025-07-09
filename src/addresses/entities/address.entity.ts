import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { City } from '../../cities/entities/city.entity';
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

  // Relaciones
  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @Column()
  id_usuario: number;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'id_ciudad' })
  city: City;

  @Column()
  id_ciudad: number;

  @OneToMany(() => Order, order => order.address)
  orders: Order[];
} 