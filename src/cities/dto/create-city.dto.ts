import { IsString, IsNotEmpty, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO para crear una nueva ciudad
 */
export class CreateCityDto {
  @ApiProperty({
    description: "Nombre de la ciudad",
    example: "Bogotá",
    maxLength: 100,
  })
  @IsString({ message: "El nombre debe ser un texto válido" })
  @IsNotEmpty({ message: "El nombre es requerido" })
  @MaxLength(100, { message: "El nombre no puede exceder los 100 caracteres" })
  nombre: string;
}
