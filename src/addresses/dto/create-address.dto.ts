import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear una nueva dirección
 */
export class CreateAddressDto {
  @ApiProperty({
    description: 'Dirección completa',
    example: 'Calle Principal #123, Colonia Centro'
  })
  @IsString({ message: 'La dirección debe ser un texto válido' })
  @IsNotEmpty({ message: 'La dirección es requerida' })
  direccion: string;

  @ApiPropertyOptional({
    description: 'Referencias adicionales para ubicar la dirección',
    example: 'Casa blanca con rejas negras, frente al parque'
  })
  @IsString({ message: 'La referencia debe ser un texto válido' })
  @IsOptional()
  referencia?: string;

  @ApiProperty({
    description: 'ID de la ciudad donde se encuentra la dirección',
    example: 1
  })
  @IsNumber({}, { message: 'El ID de ciudad debe ser un número' })
  @IsNotEmpty({ message: 'La ciudad es requerida' })
  id_ciudad: number;
} 