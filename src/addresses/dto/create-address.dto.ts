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

  @ApiPropertyOptional({
    description: 'Latitud de la ubicación',
    example: -0.1806532
  })
  @IsNumber({}, { message: 'La latitud debe ser un número válido' })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud de la ubicación',
    example: -78.4678382
  })
  @IsNumber({}, { message: 'La longitud debe ser un número válido' })
  @IsOptional()
  longitude?: number;
}