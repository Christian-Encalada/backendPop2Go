import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de CORS
  app.enableCors();

  // Configuración de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle("Pop2Go API")
    .setDescription("API para la aplicación Pop2Go de entrega de helados")
    .setVersion("1.0")
    .addTag("auth", "Autenticación y registro")
    .addTag("users", "Gestión de usuarios")
    .addTag("cities", "Gestión de ciudades")
    .addTag("products", "Gestión de productos")
    .addTag("orders", "Gestión de pedidos")
    .addTag("addresses", "Gestión de direcciones")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  // Prefijo global para la API
  app.setGlobalPrefix("api", {
    exclude: [""], // Excluir la ruta raíz del prefijo
  });

  // Puerto de la aplicación
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicación iniciada en el puerto ${port}`);
  console.log(
    `Documentación Swagger disponible en: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
