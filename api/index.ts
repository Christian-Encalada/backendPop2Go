import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import express from 'express';
import serverless from 'serverless-http';

let cachedServer: ((req: any, res: any) => any) | undefined;

async function createServer() {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    const config = new DocumentBuilder()
      .setTitle('Pop2Go API')
      .setDescription('API para la aplicación Pop2Go de entrega de helados')
      .setVersion('1.0')
      .addTag('auth', 'Autenticación y registro')
      .addTag('users', 'Gestión de usuarios')
      .addTag('cities', 'Gestión de ciudades')
      .addTag('products', 'Gestión de productos')
      .addTag('orders', 'Gestión de pedidos')
      .addTag('addresses', 'Gestión de direcciones')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    app.setGlobalPrefix('api', {
      exclude: [''],
    });
    await app.init();
    cachedServer = serverless(expressApp);
  }
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  const server = await createServer();
  return server(req, res);
}
