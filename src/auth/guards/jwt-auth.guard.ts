import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard para autenticación JWT
 * Verifica si el token JWT es válido
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Añadir lógica adicional aquí si es necesario
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // Si hay error o no hay usuario, lanzar excepción
    if (err || !user) {
      throw err || new UnauthorizedException('No autorizado. Por favor, inicie sesión');
    }
    return user;
  }
} 