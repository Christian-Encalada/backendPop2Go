import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { City } from "./entities/city.entity";
import { CreateCityDto } from "./dto/create-city.dto";
import { UpdateCityDto } from "./dto/update-city.dto";

/**
 * Servicio para la gestión de ciudades
 * Implementa la lógica de negocio relacionada con las ciudades
 */
@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private cityRepository: Repository<City>,
  ) {}

  /**
   * Crea una nueva ciudad
   * @param createCityDto Datos de la ciudad a crear
   * @returns La ciudad creada
   */
  async create(createCityDto: CreateCityDto): Promise<City> {
    // Verificar si la ciudad ya existe
    const existingCity = await this.cityRepository.findOne({
      where: { nombre: createCityDto.nombre },
    });

    if (existingCity) {
      throw new ConflictException(
        `La ciudad ${createCityDto.nombre} ya existe`,
      );
    }

    const newCity = this.cityRepository.create({
      nombre: createCityDto.nombre,
      activo: createCityDto.activo ?? true,
    });
    return this.cityRepository.save(newCity);
  }

  /**
   * Busca todas las ciudades
   * @returns Lista de todas las ciudades
   */
  async findAll(): Promise<City[]> {
    return this.cityRepository.find();
  }

  /**
   * Busca una ciudad por su ID
   * @param id ID de la ciudad a buscar
   * @returns La ciudad encontrada
   */
  async findOne(id: number): Promise<City> {
    const city = await this.cityRepository.findOne({
      where: { id_ciudad: id },
    });

    if (!city) {
      throw new NotFoundException(`Ciudad con ID ${id} no encontrada`);
    }

    return city;
  }

  /**
   * Busca una ciudad por su nombre
   * @param nombre Nombre de la ciudad a buscar
   * @returns La ciudad encontrada
   */
  async findByName(nombre: string): Promise<City> {
    const city = await this.cityRepository.findOne({
      where: { nombre },
    });

    if (!city) {
      throw new NotFoundException(`Ciudad ${nombre} no encontrada`);
    }

    return city;
  }

  /**
   * Actualiza una ciudad
   * @param id ID de la ciudad a actualizar
   * @param updateCityDto Datos actualizados de la ciudad
   * @returns La ciudad actualizada
   */
  async update(id: number, updateCityDto: UpdateCityDto): Promise<City> {
    const city = await this.findOne(id);

    // Verificar si ya existe otra ciudad con el mismo nombre
    if (updateCityDto.nombre && updateCityDto.nombre !== city.nombre) {
      const existingCity = await this.cityRepository.findOne({
        where: { nombre: updateCityDto.nombre },
      });

      if (existingCity) {
        throw new ConflictException(
          `Ya existe una ciudad con el nombre ${updateCityDto.nombre}`,
        );
      }
    }

    // Actualizar los campos
    if (updateCityDto.nombre !== undefined) city.nombre = updateCityDto.nombre;
    if (updateCityDto.activo !== undefined) city.activo = updateCityDto.activo;

    return this.cityRepository.save(city);
  }

  /**
   * Elimina una ciudad por su ID
   * @param id ID de la ciudad a eliminar
   * @returns La ciudad eliminada
   */
  async remove(id: number): Promise<City> {
    const city = await this.findOne(id);
    return this.cityRepository.remove(city);
  }
}
