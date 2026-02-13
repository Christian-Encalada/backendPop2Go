import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Registrar un nuevo usuario" })
  @ApiResponse({ status: 201, description: "Usuario registrado exitosamente" })
  @ApiResponse({ status: 400, description: "Datos de registro inválidos" })
  @ApiResponse({ status: 409, description: "El correo ya está registrado" })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post("login")
  @ApiOperation({ summary: "Iniciar sesión" })
  @ApiResponse({
    status: 200,
    description: "Login exitoso",
    schema: {
      properties: {
        access_token: { type: "string" },
        user: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            email: { type: "string" },
            roles: { type: "array", items: { type: "string" } },
            addresses: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Credenciales inválidas" })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("profile")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtener perfil del usuario autenticado" })
  @ApiResponse({ status: 200, description: "Perfil del usuario" })
  @ApiResponse({ status: 401, description: "No autorizado" })
  async getProfile(@Request() req) {
    return await this.authService.getUserProfile(req.user.userId);
  }
}
