import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class AdminChatDto {
  @ApiProperty({
    description: "Pregunta del administrador para el asistente",
    example: "Cuantos pedidos entregados tuvimos hoy en mi ciudad?",
    minLength: 3,
    maxLength: 500,
  })
  @IsString({ message: "La pregunta debe ser texto" })
  @MinLength(3, { message: "La pregunta debe tener al menos 3 caracteres" })
  @MaxLength(500, {
    message: "La pregunta no puede superar los 500 caracteres",
  })
  question: string;
}
