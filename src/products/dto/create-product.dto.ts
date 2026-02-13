import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo producto
 */
export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Helado de Vainilla',
    maxLength: 100
  })
  @IsString({ message: 'El nombre debe ser un texto válido' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Descripción detallada del producto',
    example: 'Delicioso helado de vainilla con trozos de galleta',
    required: false
  })
  @IsString({ message: 'La descripción debe ser un texto válido' })
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'URL de imagen del producto',
    example: 'https://example.com/image.png',
    required: false
  })
  @IsString({ message: 'La imagen debe ser una URL válida' })
  @IsOptional()
  imagen?: string;

  @ApiProperty({
    description: 'ID de la categoría del producto',
    example: 1,
    required: true
  })
  @IsNumber({}, { message: 'El ID de categoría debe ser un número' })
  @IsNotEmpty({ message: 'El ID de categoría es requerido' })
  @Type(() => Number)
  id_categoria: number;

  @ApiProperty({
    description: 'Precio del producto',
    example: 5.99,
    minimum: 0
  })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @IsNotEmpty({ message: 'El precio es requerido' })
  @Type(() => Number)
  precio: number;

  @ApiProperty({
    description: 'Cantidad disponible en inventario',
    example: 100,
    minimum: 0
  })
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @IsNotEmpty({ message: 'El stock es requerido' })
  @Type(() => Number)
  stock: number;

  @ApiProperty({
    description: 'ID del local para asignar stock inicial',
    example: 1,
    required: false
  })
  @IsNumber({}, { message: 'El ID del local debe ser un número' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  localId?: number;

  @ApiProperty({
    description: 'Indica si el producto está activo y disponible para la venta',
    example: true,
    default: true,
    required: false
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
