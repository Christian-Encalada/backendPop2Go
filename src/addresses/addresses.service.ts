import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Store } from '../stores/entities/store.entity';

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
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
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

    // Validar que el local existe
    if (addressData.id_local) {
      const store = await this.storeRepository.findOne({
        where: { id_local: addressData.id_local, activo: true }
      });
      
      if (!store) {
        throw new BadRequestException('El local especificado no existe o no está activo');
      }
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
    const queryBuilder = this.addressRepository.createQueryBuilder('address')
      .leftJoinAndSelect('address.user', 'user')
      .leftJoinAndSelect('address.store', 'store')
      .leftJoinAndSelect('store.city', 'city');

    // Filtrar según rol
    if (userRoles.includes('cliente') && !userRoles.includes('admin') && !userRoles.includes('superadmin')) {
      // Cliente solo ve sus propias direcciones
      queryBuilder.where('address.id_usuario = :userId', { userId });
    } else if (userRoles.includes('admin') && !userRoles.includes('superadmin') && cityId) {
      // Admin ve direcciones de su ciudad (a través del local)
      queryBuilder.where('city.id_ciudad = :cityId', { cityId });
    }
    // Superadmin ve todas las direcciones

    return queryBuilder.getMany();
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
      relations: ['user', 'store', 'store.city'],
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
      address.store?.city?.id_ciudad !== cityId
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
    console.log('🔄 Backend - Actualizando dirección:', {
      id,
      updateAddressDto,
      userId,
      userRoles,
      cityId
    });
    
    const address = await this.findOne(id, userId, userRoles, cityId);
    
    console.log('📍 Backend - Dirección antes de actualizar:', {
      id_direccion: address.id_direccion,
      direccion: address.direccion,
      id_local: address.id_local,
      referencia: address.referencia
    });
    
    // Actualizar datos
    Object.assign(address, updateAddressDto);
    
    console.log('📍 Backend - Dirección después de Object.assign:', {
      id_direccion: address.id_direccion,
      direccion: address.direccion,
      id_local: address.id_local,
      referencia: address.referencia
    });
    
    const savedAddress = await this.addressRepository.save(address);
    
    console.log('✅ Backend - Dirección guardada en BD:', {
      id_direccion: savedAddress.id_direccion,
      direccion: savedAddress.direccion,
      id_local: savedAddress.id_local,
      referencia: savedAddress.referencia
    });
    
    // Recargar la dirección con las relaciones actualizadas
    const updatedAddress = await this.addressRepository.findOne({
      where: { id_direccion: savedAddress.id_direccion },
      relations: ['user', 'store', 'store.city'],
    });
    
    console.log('🔄 Backend - Dirección recargada con relaciones:', {
      id_direccion: updatedAddress.id_direccion,
      direccion: updatedAddress.direccion,
      city: updatedAddress.store?.city,
      id_local: updatedAddress.id_local,
      store: updatedAddress.store,
      referencia: updatedAddress.referencia
    });
    
    return updatedAddress;
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

  /**
   * Establece una dirección como predeterminada
   * @param id ID de la dirección a establecer como predeterminada
   * @param userId ID del usuario que realiza la solicitud
   * @param userRoles Roles del usuario
   * @param cityId ID de la ciudad (para admins)
   * @returns La dirección actualizada
   */
  async setDefault(id: number, userId: number, userRoles: string[], cityId?: number): Promise<Address> {
    // Buscar la dirección
    const address = await this.findOne(id, userId, userRoles, cityId);

    // Primero, quitar el estado predeterminado de todas las direcciones del usuario
    if (userRoles.includes('admin') || userRoles.includes('superadmin')) {
      // Para admins, actualizar todas las direcciones del usuario propietario de la dirección
      await this.addressRepository.update(
        { id_usuario: address.id_usuario },
        { is_default: false }
      );
    } else {
      // Para clientes, actualizar solo sus propias direcciones
      await this.addressRepository.update(
        { id_usuario: userId },
        { is_default: false }
      );
    }

    // Establecer la dirección seleccionada como predeterminada
    await this.addressRepository.update(id, { is_default: true });

    // Retornar la dirección actualizada
    return this.findOne(id, userId, userRoles, cityId);
  }

  /**
   * Actualiza el local asociado a una dirección específica
   * @param id ID de la dirección a actualizar
   * @param id_local ID del nuevo local
   * @param userId ID del usuario que realiza la solicitud
   * @param userRoles Roles del usuario
   * @param cityId ID de la ciudad (para admins)
   * @returns La dirección actualizada
   */
  async updateStore(id: number, id_local: number, userId: number, userRoles: string[], cityId?: number): Promise<Address> {
    console.log('🔄 Backend - updateStore iniciado:', {
      id,
      id_local,
      userId,
      userRoles,
      cityId
    });

    try {
      // Buscar la dirección y verificar permisos
      const address = await this.findOne(id, userId, userRoles, cityId);
      console.log('📍 Backend - Dirección encontrada:', {
        id_direccion: address.id_direccion,
        id_usuario: address.id_usuario,
        id_local_actual: address.id_local,
        direccion: address.direccion
      });

      // Verificar que el local existe
      const store = await this.addressRepository.manager.getRepository('Store').findOne({
        where: { id_local },
        relations: ['city']
      });

      if (!store) {
        console.error('❌ Backend - Local no encontrado:', id_local);
        throw new BadRequestException(`Local con ID ${id_local} no encontrado`);
      }

      console.log('🏪 Backend - Local encontrado:', {
        id_local: store.id_local,
        nombre: store.nombre,
        id_ciudad: store.id_ciudad
      });

      // Actualizar solo el campo id_local
      console.log('🔄 Backend - Actualizando dirección con nuevo local...');
      await this.addressRepository.update(id, { id_local });

      console.log('✅ Backend - Dirección actualizada exitosamente');

      // Retornar la dirección actualizada
      const updatedAddress = await this.findOne(id, userId, userRoles, cityId);
      console.log('📍 Backend - Dirección actualizada retornada:', {
        id_direccion: updatedAddress.id_direccion,
        id_local_nuevo: updatedAddress.id_local,
        store_nombre: updatedAddress.store?.nombre
      });

      return updatedAddress;
    } catch (error) {
      console.error('❌ Backend - Error en updateStore:', error);
      throw error;
    }
  }
}