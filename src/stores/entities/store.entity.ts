import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { City } from '../../cities/entities/city.entity';
import { Address } from '../../addresses/entities/address.entity';

/**
 * Entidad para la tabla de locales/tiendas
 * Representa los locales disponibles en cada ciudad
 */
@Entity('tbl_locales')
export class Store {
  @PrimaryGeneratedColumn()
  id_local: number;

  @Column({ length: 100 })
  nombre: string;

  @Column('text')
  direccion: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column('text', { nullable: true })
  descripcion: string;

  @Column('boolean', { default: true })
  activo: boolean;

  @Column('time', { nullable: true })
  hora_apertura: string;

  @Column('time', { nullable: true })
  hora_cierre: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude: number;

  // Relaciones
  @ManyToOne(() => City)
  @JoinColumn({ name: 'id_ciudad' })
  city: City;

  @Column()
  id_ciudad: number;

  @OneToMany(() => Address, address => address.store)
  addresses: Address[];
}