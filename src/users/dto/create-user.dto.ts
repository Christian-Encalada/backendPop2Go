import { IsEmail, IsString, IsNotEmpty, MinLength, IsArray, IsOptional, IsNumber, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo usuario
 * Incluye validaciones para los campos principales
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez'
  })
  @IsString({ message: 'El nombre debe ser un texto válido' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  tbl_nombre: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@ejemplo.com'
  })
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo es requerido' })
  tbl_correo: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123',
    minLength: 6
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  tbl_contrasena: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono del usuario',
    example: '123456789'
  })
  @IsString({ message: 'El teléfono debe ser un texto' })
  @IsOptional()
  tbl_telefono?: string;

  @ApiProperty({
    description: 'ID de la ciudad del usuario',
    example: 1
  })
  @IsNumber({}, { message: 'El ID de ciudad debe ser un número' })
  @IsNotEmpty({ message: 'La ciudad es requerida' })
  id_ciudad: number;

  @ApiPropertyOptional({
    description: 'Roles asignados al usuario',
    example: ['cliente'],
    default: ['cliente']
  })
  @IsArray({ message: 'Los roles deben ser proporcionados como un array' })
  @ArrayNotEmpty({ message: 'Debe proporcionar al menos un rol' })
  @IsOptional()
  roles?: string[];
} 