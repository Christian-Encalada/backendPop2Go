import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/users.entity';
import { Role } from '../users/entities/role.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    
    private jwtService: JwtService,
  ) {}

  // Registrar nuevo usuario
  async register(registerDto: RegisterDto) {
    const { email, password, name, phone, cityId } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.usersRepository.findOne({
      where: { tbl_correo: email },
    });

    if (existingUser) {
      throw new UnauthorizedException('El correo ya está registrado');
    }

    // Crear nuevo usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.usersRepository.create({
      tbl_correo: email,
      tbl_contrasena: hashedPassword,
      tbl_nombre: name,
      tbl_telefono: phone,
      id_ciudad: cityId,
    });

    await this.usersRepository.save(newUser);

    // Generar token
    const payload = {
      sub: newUser.tbl_id_usuario,
      email: newUser.tbl_correo,
      name: newUser.tbl_nombre,
      roles: ['cliente'], // Por defecto, los nuevos usuarios son clientes
      cityId: newUser.id_ciudad,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: newUser.tbl_id_usuario,
        name: newUser.tbl_nombre,
        email: newUser.tbl_correo,
        roles: ['cliente'],
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
    const roles = user.roles.map(role => role.tbl_nombre);

    const payload = {
      sub: user.tbl_id_usuario,
      email: user.tbl_correo,
      name: user.tbl_nombre,
      roles,
      cityId: user.id_ciudad,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.tbl_id_usuario,
        name: user.tbl_nombre,
        email: user.tbl_correo,
        roles,
      },
    };
  }

  // Validar usuario para JWT Strategy
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { tbl_correo: email },
      relations: ['roles'],
    });

    if (user && (await bcrypt.compare(password, user.tbl_contrasena))) {
      const { tbl_contrasena, ...result } = user;
      return result;
    }
    return null;
  }

  // Validar usuario para JWT Strategy
  async validateUserById(payload: any): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { tbl_id_usuario: payload.sub },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      userId: user.tbl_id_usuario,
      email: user.tbl_correo,
      roles: user.roles.map(role => role.tbl_nombre),
      cityId: user.id_ciudad,
    };
  }
}