import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateCityDto {
  @ApiProperty({
    description: "Nombre de la ciudad",
    example: "Guayaquil",
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString({ message: "El nombre debe ser un texto válido" })
  @IsNotEmpty({ message: "El nombre es requerido" })
  @MaxLength(100, { message: "El nombre no puede exceder los 100 caracteres" })
  nombre?: string;

  @ApiProperty({
    description: "Si la ciudad está activa",
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "El estado activo debe ser verdadero o falso" })
  activo?: boolean;
}

