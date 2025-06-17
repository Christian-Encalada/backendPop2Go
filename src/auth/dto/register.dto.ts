import { IsEmail, IsString, MinLength, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para el registro de nuevos usuarios
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
    minLength: 2
  })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@ejemplo.com'
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123',
    minLength: 6
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono del usuario',
    example: '123456789'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'ID de la ciudad del usuario',
    example: 1
  })
  @IsNumber({}, { message: 'Debe seleccionar una ciudad válida' })
  cityId: number;

  @ApiPropertyOptional({
    description: 'Roles asignados al usuario (solo administradores pueden asignar roles)',
    example: ['cliente'],
    default: ['cliente']
  })
  @IsOptional()
  @IsArray()
  roles?: string[];
}