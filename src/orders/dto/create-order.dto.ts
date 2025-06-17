import { IsArray, IsNotEmpty, IsNumber, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para los items de una orden
 */
class OrderItemDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 1
  })
  @IsNumber({}, { message: 'El ID del producto debe ser un número' })
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  tbl_id_producto: number;

  @ApiProperty({
    description: 'Cantidad del producto',
    example: 2,
    minimum: 1
  })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsNotEmpty({ message: 'La cantidad es requerida' })
  tbl_cantidad: number;
}

/**
 * DTO para crear una nueva orden
 */
export class CreateOrderDto {
  @ApiProperty({
    description: 'ID de la dirección de entrega',
    example: 1
  })
  @IsNumber({}, { message: 'El ID de la dirección debe ser un número' })
  @IsNotEmpty({ message: 'La dirección de entrega es requerida' })
  tbl_id_direccion: number;

  @ApiProperty({
    description: 'Lista de productos en el pedido',
    type: [OrderItemDto],
    example: [
      { tbl_id_producto: 1, tbl_cantidad: 2 },
      { tbl_id_producto: 3, tbl_cantidad: 1 }
    ]
  })
  @IsArray({ message: 'Los productos deben ser proporcionados como un array' })
  @ArrayNotEmpty({ message: 'Debe proporcionar al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  productos: OrderItemDto[];
} 