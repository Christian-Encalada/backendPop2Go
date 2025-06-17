import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { City } from '../../cities/entities/city.entity';
import { Role } from './role.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('tbl_usuarios')
export class User {
  @PrimaryGeneratedColumn()
  tbl_id_usuario: number;

  @Column({ length: 100 })
  tbl_nombre: string;

  @Column({ length: 100, unique: true })
  tbl_correo: string;

  @Column('text')
  tbl_contrasena: string;

  @Column({ length: 20, nullable: true })
  tbl_telefono: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  tbl_fecha_registro: Date;

  // Relaciones
  @ManyToOne(() => City)
  @JoinColumn({ name: 'id_ciudad' })
  city: City;

  @Column()
  id_ciudad: number;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'tbl_usuario_roles',
    joinColumn: { name: 'tbl_id_usuario' },
    inverseJoinColumn: { name: 'tbl_id_rol' }
  })
  roles: Role[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];
}