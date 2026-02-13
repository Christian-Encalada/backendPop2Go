import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { User } from "../../users/entities/users.entity";

/**
 * Entidad para la tabla de ciudades
 * Representa las ciudades donde opera el sistema
 */
@Entity("tbl_ciudades")
export class City {
  @PrimaryGeneratedColumn()
  id_ciudad: number;

  @Column({ length: 100, unique: true })
  nombre: string;

  // Relaciones
  @OneToMany(() => User, (user) => user.city)
  users: User[];
}
