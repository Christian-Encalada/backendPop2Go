import { Controller, Get } from "@nestjs/common";

/**
 * Controlador para la ruta raíz de la aplicación
 */
@Controller()
export class AppController {
  /**
   * Muestra información básica sobre la API
   */
  @Get()
  getInfo() {
    return {
      name: "Pop2Go API",
      version: "1.0.0",
      description: "API para la aplicación de entrega de helados Pop2Go",
      endpoints: {
        docs: "/api/docs",
        auth: "/api/auth",
        users: "/api/users",
        cities: "/api/cities",
        products: "/api/products",
        orders: "/api/orders",
      },
    };
  }
}
