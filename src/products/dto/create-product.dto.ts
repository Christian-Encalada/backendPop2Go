import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';
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
    description: 'Precio del producto',
    example: 5.99,
    minimum: 0
  })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @IsNotEmpty({ message: 'El precio es requerido' })
  precio: number;

  @ApiProperty({
    description: 'Cantidad disponible en inventario',
    example: 100,
    minimum: 0
  })
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @IsNotEmpty({ message: 'El stock es requerido' })
  stock: number;

  @ApiProperty({
    description: 'Indica si el producto está activo y disponible para la venta',
    example: true,
    default: true,
    required: false
  })
  @IsBoolean({ message: 'El estado de activación debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
} 