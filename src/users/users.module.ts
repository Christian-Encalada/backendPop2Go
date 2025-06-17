import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/users.entity';
import { Role } from './entities/role.entity';

/**
 * Módulo de Usuarios
 * Gestiona las funcionalidades relacionadas con los usuarios del sistema
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
