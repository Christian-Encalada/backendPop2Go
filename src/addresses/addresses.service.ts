import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

// Interfaz para el objeto que incluye id_usuario
interface CreateAddressWithUserDto extends CreateAddressDto {
  id_usuario: number;
}

/**
 * Servicio para la gestión de direcciones
 * Implementa la lógica de negocio relacionada con las direcciones
 */
@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}

  /**
   * Crea una nueva dirección
   * @param addressData Datos de la dirección a crear (incluye id_usuario)
   * @param requestUserId ID del usuario que realiza la solicitud
   * @param userRoles Roles del usuario que realiza la solicitud
   * @returns La dirección creada
   */
  async create(addressData: CreateAddressWithUserDto, requestUserId: number, userRoles: string[]): Promise<Address> {
    // Verificar permisos: un usuario solo puede crear direcciones para sí mismo, excepto admins
    if (
      addressData.id_usuario !== requestUserId && 
      !userRoles.includes('admin') && 
      !userRoles.includes('superadmin')
    ) {
      throw new ForbiddenException('No tienes permisos para crear una dirección para otro usuario');
    }

    const newAddress = this.addressRepository.create(addressData);
    return this.addressRepository.save(newAddress);
  }

  /**
   * Obtiene todas las direcciones según permisos
   * @param userId ID del usuario (para clientes)
   * @param userRoles Roles del usuario
   * @param cityId ID de la ciudad (para admins)
   * @returns Lista de direcciones según filtros
   */
  async findAll(userId: number, userRoles: string[], cityId?: number): Promise<Address[]> {
    // Construir opciones de consulta según permisos
    const options: any = {
      relations: ['user', 'city'],
    };

    // Filtrar según rol
    if (userRoles.includes('cliente') && !userRoles.includes('admin') && !userRoles.includes('superadmin')) {
      // Cliente solo ve sus propias direcciones
      options.where = { id_usuario: userId };
    } else if (userRoles.includes('admin') && !userRoles.includes('superadmin') && cityId) {
      // Admin ve direcciones de su ciudad
      options.where = { id_ciudad: cityId };
    }
    // Superadmin ve todas las direcciones

    return this.addressRepository.find(options);
  }

  /**
   * Obtiene una dirección específica por ID según permisos
   * @param id ID de la dirección a buscar
   * @param userId ID del usuario (para clientes)
   * @param userRoles Roles del usuario
   * @param cityId ID de la ciudad (para admins)
   * @returns La dirección encontrada
   */
  async findOne(id: number, userId: number, userRoles: string[], cityId?: number): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id_direccion: id },
      relations: ['user', 'city'],
    });

    if (!address) {
      throw new NotFoundException(`Dirección con ID ${id} no encontrada`);
    }

    // Verificar permisos
    if (
      userRoles.includes('cliente') && 
      !userRoles.includes('admin') && 
      !userRoles.includes('superadmin') && 
      address.id_usuario !== userId
    ) {
      throw new ForbiddenException('No tienes permisos para ver esta dirección');
    } else if (
      userRoles.includes('admin') && 
      !userRoles.includes('superadmin') && 
      cityId && 
      address.id_ciudad !== cityId
    ) {
      throw new ForbiddenException('No tienes permisos para ver direcciones de otras ciudades');
    }

    return address;
  }

  /**
   * Actualiza una dirección existente según permisos
   * @param id ID de la dirección a actualizar
   * @param updateAddressDto Datos a actualizar
   * @param userId ID del usuario (para clientes)
   * @param userRoles Roles del usuario
   * @param cityId ID de la ciudad (para admins)
   * @returns La dirección actualizada
   */
  async update(
    id: number, 
    updateAddressDto: UpdateAddressDto, 
    userId: number, 
    userRoles: string[], 
    cityId?: number
  ): Promise<Address> {
    const address = await this.findOne(id, userId, userRoles, cityId);
    
    // Actualizar datos
    Object.assign(address, updateAddressDto);
    
    return this.addressRepository.save(address);
  }

  /**
   * Elimina una dirección según permisos
   * @param id ID de la dirección a eliminar
   * @param userId ID del usuario (para clientes)
   * @param userRoles Roles del usuario
   * @param cityId ID de la ciudad (para admins)
   * @returns La dirección eliminada
   */
  async remove(id: number, userId: number, userRoles: string[], cityId?: number): Promise<Address> {
    const address = await this.findOne(id, userId, userRoles, cityId);
    return this.addressRepository.remove(address);
  }
} 