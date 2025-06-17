import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para autenticación de usuarios
 */
export class LoginDto {
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
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}