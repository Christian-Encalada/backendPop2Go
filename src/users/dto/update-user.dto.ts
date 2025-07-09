import { IsEmail, IsString, IsOptional, MinLength, IsArray, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar usuarios
 * Todos los campos son opcionales para actualizaciones parciales
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez'
  })
  @IsString({ message: 'El nombre debe ser un texto válido' })
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico del usuario',
    example: 'usuario@ejemplo.com'
  })
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  @IsOptional()
  correo?: string;

  @ApiPropertyOptional({
    description: 'Contraseña del usuario',
    example: 'NuevaPassword123',
    minLength: 6
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsOptional()
  contrasena?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono del usuario',
    example: '123456789'
  })
  @IsString({ message: 'El teléfono debe ser un texto' })
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'ID de la ciudad del usuario',
    example: 1
  })
  @IsNumber({}, { message: 'El ID de ciudad debe ser un número' })
  @IsOptional()
  id_ciudad?: number;

  @ApiPropertyOptional({
    description: 'Roles asignados al usuario',
    example: ['cliente', 'repartidor']
  })
  @IsArray({ message: 'Los roles deben ser proporcionados como un array' })
  @IsOptional()
  roles?: string[];
} 