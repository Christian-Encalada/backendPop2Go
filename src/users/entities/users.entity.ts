import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from "typeorm";
import { City } from "../../cities/entities/city.entity";
import { Role } from "./role.entity";
import { Order } from "../../orders/entities/order.entity";

@Entity("tbl_usuarios")
export class User {
  @PrimaryGeneratedColumn()
  id_usuario: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100, unique: true })
  correo: string;

  @Column("text")
  contrasena: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  fecha_registro: Date;

  // Campos específicos para delivery
  @Column({ type: "text", nullable: true })
  profile_image: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  vehicle: string;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    enumName: "delivery_status_enum",
    default: "pending",
    nullable: true,
  })
  delivery_status: "pending" | "approved" | "rejected"; // Estado del delivery

  // Relaciones
  @ManyToOne(() => City)
  @JoinColumn({ name: "id_ciudad" })
  city: City;

  @Column()
  id_ciudad: number;

  @ManyToMany(() => Role)
  @JoinTable({
    name: "tbl_usuario_roles",
    joinColumn: { name: "id_usuario" },
    inverseJoinColumn: { name: "id_rol" },
  })
  roles: Role[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
