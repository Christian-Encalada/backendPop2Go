import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tbl_categorias')
export class Category {
  @PrimaryGeneratedColumn()
  id_categoria: number;

  @Column({ length: 100 })
  nombre: string;

  @Column('text', { nullable: true })
  descripcion: string | null;

  @Column('text', { nullable: true })
  imagen_url: string | null;

  @Column('text', { nullable: true })
  icono: string | null;

  @Column({ length: 20, nullable: true })
  color: string | null;

  @Column('boolean', { default: true })
  activo: boolean;

  @Column('int', { nullable: true, default: 0 })
  orden: number | null;
}
