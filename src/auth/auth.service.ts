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
      where: { correo: email },
    });

    if (existingUser) {
      throw new UnauthorizedException('El correo ya está registrado');
    }

    // Crear nuevo usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.usersRepository.create({
      correo: email,
      contrasena: hashedPassword,
      nombre: name,
      telefono: phone,
      id_ciudad: cityId,
    });

    await this.usersRepository.save(newUser);

    // Generar token
    const payload = {
      sub: newUser.id_usuario,
      email: newUser.correo,
      name: newUser.nombre,
      roles: ['cliente'], // Por defecto, los nuevos usuarios son clientes
      cityId: newUser.id_ciudad,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: newUser.id_usuario,
        name: newUser.nombre,
        email: newUser.correo,
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
    const roles = user.roles.map(role => role.nombre);

    const payload = {
      sub: user.id_usuario,
      email: user.correo,
      name: user.nombre,
      roles,
      cityId: user.id_ciudad,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id_usuario,
        name: user.nombre,
        email: user.correo,
        roles,
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
}