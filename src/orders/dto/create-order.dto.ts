import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
  ArrayNotEmpty,
  IsEnum,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Enum para los métodos de pago
 */
export enum PaymentMethod {
  CASH = "CASH",
  TRANSFER = "TRANSFER",
}

/**
 * DTO para los items de una orden
 */
class OrderItemDto {
  @ApiProperty({
    description: "ID del producto",
    example: 1,
  })
  @IsNumber({}, { message: "El ID del producto debe ser un número" })
  @IsNotEmpty({ message: "El ID del producto es requerido" })
  id_producto: number;

  @ApiProperty({
    description: "Cantidad del producto",
    example: 2,
    minimum: 1,
  })
  @IsNumber({}, { message: "La cantidad debe ser un número" })
  @IsNotEmpty({ message: "La cantidad es requerida" })
  cantidad: number;
}

/**
 * DTO para crear una nueva orden
 */
export class CreateOrderDto {
  @ApiProperty({
    description: "ID de la dirección de entrega",
    example: 1,
  })
  @IsNumber({}, { message: "El ID de la dirección debe ser un número" })
  @IsNotEmpty({ message: "La dirección de entrega es requerida" })
  id_direccion: number;

  @ApiProperty({
    description: "Lista de productos en el pedido",
    type: [OrderItemDto],
    example: [
      { id_producto: 1, cantidad: 2 },
      { id_producto: 3, cantidad: 1 },
    ],
  })
  @IsArray({ message: "Los productos deben ser proporcionados como un array" })
  @ArrayNotEmpty({ message: "Debe proporcionar al menos un producto" })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  productos: OrderItemDto[];

  @ApiProperty({
    description: "Método de pago",
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod, {
    message: "El método de pago debe ser CASH o TRANSFER",
  })
  @IsNotEmpty({ message: "El método de pago es requerido" })
  metodo_pago: PaymentMethod;

  @ApiPropertyOptional({
    description:
      "Monto en efectivo con el que pagará el cliente (solo para pago en efectivo)",
    example: 50.0,
  })
  @IsOptional()
  @IsNumber({}, { message: "El monto en efectivo debe ser un número" })
  monto_efectivo?: number;
}
