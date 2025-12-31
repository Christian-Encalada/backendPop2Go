import { IsString, IsNumber, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar un producto existente
 * Todos los campos son opcionales para permitir actualizaciones parciales
 */
export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Nombre del producto',
    example: 'Helado de Chocolate',
    maxLength: 100
  })
  @IsString({ message: 'El nombre debe ser un texto válido' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del producto',
    example: 'Delicioso helado de chocolate con trozos de brownie'
  })
  @IsString({ message: 'La descripción debe ser un texto válido' })
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'URL de imagen del producto',
    example: 'https://example.com/image.png'
  })
  @IsString({ message: 'La imagen debe ser una URL válida' })
  @IsOptional()
  imagen?: string;

  @ApiPropertyOptional({
    description: 'Categoría del producto',
    example: 'Helados'
  })
  @IsString({ message: 'La categoría debe ser un texto válido' })
  @MaxLength(100, { message: 'La categoría no puede exceder 100 caracteres' })
  @IsOptional()
  categoria?: string;

  @ApiPropertyOptional({
    description: 'Precio del producto',
    example: 6.99,
    minimum: 0
  })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @IsOptional()
  @Type(() => Number)
  precio?: number;

  @ApiPropertyOptional({
    description: 'Cantidad disponible en inventario',
    example: 150,
    minimum: 0
  })
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @IsOptional()
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({
    description: 'Indica si el producto está activo y disponible para la venta',
    example: false
  })
  @IsBoolean({ message: 'El estado de activación debe ser un booleano' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  activo?: boolean;
} 
