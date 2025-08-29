import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/users.entity';
import { Role } from '../users/entities/role.entity';
import { Address } from '../addresses/entities/address.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    
    private jwtService: JwtService,
  ) {}

  // Registrar nuevo usuario
  async register(registerDto: RegisterDto) {
    const { email, password, name, phone, cityId, roles = ['cliente'] } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.usersRepository.findOne({
      where: { correo: email },
    });

    if (existingUser) {
      throw new UnauthorizedException('El correo ya está registrado');
    }

    // Buscar los roles en la base de datos
    const userRoles = await this.roleRepository.find({
      where: roles.map(roleName => ({ nombre: roleName }))
    });

    if (userRoles.length === 0) {
      throw new NotFoundException('No se encontraron los roles especificados. Asegúrate de que existan en la base de datos.');
    }

    // Crear nuevo usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.usersRepository.create({
      correo: email,
      contrasena: hashedPassword,
      nombre: name,
      telefono: phone,
      id_ciudad: cityId,
      roles: userRoles, // Asignar roles al usuario
    });

    await this.usersRepository.save(newUser);

    // Generar token
    const payload = {
      sub: newUser.id_usuario,
      email: newUser.correo,
      name: newUser.nombre,
      roles: userRoles.map(role => role.nombre), // Usar los roles asignados
      cityId: newUser.id_ciudad,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: newUser.id_usuario,
        name: newUser.nombre,
        email: newUser.correo,
        roles: userRoles.map(role => role.nombre),
      },
    };
  }

  // Iniciar sesión
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Extraer los nombres de roles
    const roles = user.roles.map(role => role.nombre);

    const payload = {
      sub: user.id_usuario,
      email: user.correo,
      name: user.nombre,
      roles,
      cityId: user.id_ciudad,
    };

    // Obtener direcciones del usuario
    const addresses = await this.addressRepository.find({
      where: { id_usuario: user.id_usuario },
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id_usuario,
        name: user.nombre,
        email: user.correo,
        roles,
        addresses,
      },
    };
  }

  // Validar usuario para JWT Strategy
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { correo: email },
      relations: ['roles'],
    });

    if (user && (await bcrypt.compare(password, user.contrasena))) {
      const { contrasena, ...result } = user;
      return result;
    }
    return null;
  }

  // Validar usuario para JWT Strategy
  async validateUserById(payload: any): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id_usuario: payload.sub },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      userId: user.id_usuario,
      email: user.correo,
      roles: user.roles.map(role => role.nombre),
      cityId: user.id_ciudad,
    };
  }

  // Obtener perfil completo del usuario incluyendo direcciones
  async getUserProfile(userId: number): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id_usuario: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Obtener direcciones del usuario
    const addresses = await this.addressRepository.find({
      where: { id_usuario: userId },
    });

    return {
      id: user.id_usuario,
      name: user.nombre,
      email: user.correo,
      roles: user.roles.map(role => role.nombre),
      addresses,
    };
  }
}