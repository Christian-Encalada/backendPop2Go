import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from './users.entity';

@Entity('tbl_roles')
export class Role {
  @PrimaryGeneratedColumn()
  id_rol: number;

  @Column({ length: 50, unique: true })
  nombre: string; // 'cliente', 'repartidor', 'admin', 'superadmin'

  @ManyToMany(() => User, user => user.roles)
  users: User[];
}