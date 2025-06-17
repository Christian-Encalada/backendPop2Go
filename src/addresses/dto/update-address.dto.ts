import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar una dirección existente
 * Todos los campos son opcionales para permitir actualizaciones parciales
 */
export class UpdateAddressDto {
  @ApiPropertyOptional({
    description: 'Dirección completa',
    example: 'Calle Principal #123, Colonia Centro'
  })
  @IsString({ message: 'La dirección debe ser un texto válido' })
  @IsOptional()
  tbl_direccion?: string;

  @ApiPropertyOptional({
    description: 'Referencias adicionales para ubicar la dirección',
    example: 'Casa blanca con rejas negras, frente al parque'
  })
  @IsString({ message: 'La referencia debe ser un texto válido' })
  @IsOptional()
  tbl_referencia?: string;

  @ApiPropertyOptional({
    description: 'ID de la ciudad donde se encuentra la dirección',
    example: 1
  })
  @IsNumber({}, { message: 'El ID de ciudad debe ser un número' })
  @IsOptional()
  id_ciudad?: number;
} 