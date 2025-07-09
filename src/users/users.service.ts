import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from './entities/users.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Servicio para la gestión de usuarios
 * Implementa la lógica de negocio relacionada con los usuarios
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * Crea un nuevo usuario
   * @param createUserDto Datos del usuario a crear
   * @param requestUserId ID del usuario que realiza la solicitud
   * @param userRoles Roles del usuario que realiza la solicitud
   * @returns El usuario creado
   */
  async create(createUserDto: CreateUserDto, requestUserId?: number, userRoles?: string[]) {
    const { correo, contrasena, roles = ['cliente'], ...userData } = createUserDto;

    // Verificar si el email ya está registrado
    const existingUser = await this.userRepository.findOne({
      where: { correo }
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // Verificar permisos para asignar roles específicos
    if (roles.includes('admin') || roles.includes('superadmin')) {
      if (!userRoles || (!userRoles.includes('admin') && !userRoles.includes('superadmin'))) {
        throw new ForbiddenException('No tiene permisos para asignar estos roles');
      }
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 12);

    // Buscar roles en la base de datos
    const userRolesEntities = await this.roleRepository.find({
      where: roles.map(role => ({ nombre: role }))
    });

    if (userRolesEntities.length === 0) {
      throw new BadRequestException('No se encontraron roles válidos');
    }

    // Crear usuario
    const newUser = this.userRepository.create({
      ...userData,
      correo,
      contrasena: hashedPassword,
      roles: userRolesEntities
    });

    return this.userRepository.save(newUser);
  }

  /**
   * Encuentra todos los usuarios con filtrado por rol y ciudad según permisos
   * @param userCity Ciudad del usuario que realiza la solicitud
   * @param userRoles Roles del usuario que realiza la solicitud
   * @returns Lista de usuarios según filtros
   */
  async findAll(userCity?: number, userRoles?: string[]) {
    // Construir opciones de búsqueda según permisos
    const options: any = {
      relations: ['roles', 'city']
    };

    // Filtrar por ciudad si es admin (no superadmin)
    if (userRoles && userRoles.includes('admin') && !userRoles.includes('superadmin') && userCity) {
      options.where = { id_ciudad: userCity };
    }

    return this.userRepository.find(options);
  }

  /**
   * Encuentra un usuario específico por ID
   * @param id ID del usuario a buscar
   * @param userCity Ciudad del usuario que realiza la solicitud
   * @param userRoles Roles del usuario que realiza la solicitud
   * @returns El usuario encontrado
   */
  async findOne(id: number, userCity?: number, userRoles?: string[]) {
    const user = await this.userRepository.findOne({
      where: { id_usuario: id },
      relations: ['roles', 'city']
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Verificar permisos de acceso por ciudad
    if (
      userRoles && 
      userRoles.includes('admin') && 
      !userRoles.includes('superadmin') && 
      userCity && 
      user.id_ciudad !== userCity
    ) {
      throw new ForbiddenException('No tiene permisos para acceder a usuarios de otras ciudades');
    }

    return user;
  }

  /**
   * Actualiza un usuario existente
   * @param id ID del usuario a actualizar
   * @param updateUserDto Datos a actualizar
   * @param userCity Ciudad del usuario que realiza la solicitud
   * @param userRoles Roles del usuario que realiza la solicitud
   * @returns El usuario actualizado
   */
  async update(id: number, updateUserDto: UpdateUserDto, userCity?: number, userRoles?: string[]) {
    const user = await this.findOne(id, userCity, userRoles);
    
    // Si se actualiza contraseña, encriptarla
    if (updateUserDto.contrasena) {
      updateUserDto.contrasena = await bcrypt.hash(updateUserDto.contrasena, 12);
    }

    // Actualizar roles si fueron proporcionados
    if (updateUserDto.roles) {
      // Verificar permisos para asignar roles
      if (
        (updateUserDto.roles.includes('admin') || updateUserDto.roles.includes('superadmin')) &&
        (!userRoles || (!userRoles.includes('admin') && !userRoles.includes('superadmin')))
      ) {
        throw new ForbiddenException('No tiene permisos para asignar estos roles');
      }

      const userRolesEntities = await this.roleRepository.find({
        where: updateUserDto.roles.map(role => ({ nombre: role }))
      });

      if (userRolesEntities.length === 0) {
        throw new BadRequestException('No se encontraron roles válidos');
      }

      user.roles = userRolesEntities;
      delete updateUserDto.roles;
    }

    // Actualizar otros datos
    Object.assign(user, updateUserDto);
    
    return this.userRepository.save(user);
  }

  /**
   * Elimina un usuario
   * @param id ID del usuario a eliminar
   * @param userCity Ciudad del usuario que realiza la solicitud
   * @param userRoles Roles del usuario que realiza la solicitud
   */
  async remove(id: number, userCity?: number, userRoles?: string[]) {
    const user = await this.findOne(id, userCity, userRoles);
    return this.userRepository.remove(user);
  }
}
