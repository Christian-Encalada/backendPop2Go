import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Order } from "./order.entity";
import { Product } from "../../products/entities/product.entity";

/**
 * Entidad para la tabla de productos en carrito/pedido
 * Representa los productos incluidos en un pedido específico
 */
@Entity("tbl_carrito_productos")
export class OrderItem {
  @PrimaryGeneratedColumn()
  id_carrito: number;

  @Column()
  cantidad: number;

  @Column("decimal", { precision: 10, scale: 2 })
  precio_unitario: number;

  // Relaciones
  @ManyToOne(() => Order, order => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_pedido' })
  order: Order;

  @Column()
  id_pedido: number;

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn({ name: "id_producto" })
  product: Product;

  @Column()
  id_producto: number;
}
