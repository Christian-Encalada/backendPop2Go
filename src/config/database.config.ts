import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as dotenv from "dotenv";

// Cargar variables de entorno manualmente
dotenv.config();

export const databaseConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME,
  // Asegurarse de que la contraseña se maneje como string
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  synchronize: process.env.NODE_ENV !== "production", // Solo en desarrollo
  logging: process.env.NODE_ENV !== "production",
  // Habilitar SSL para conexión a Supabase
  ssl: true,
  // Opciones adicionales para resolver problemas de conexión
  extra: {
    // Opciones específicas para pg
    max: 20, // máximo número de clientes en el pool
    connectionTimeoutMillis: 30000, // tiempo de espera para conexión
    ssl: {
      rejectUnauthorized: false, // Necesario para conexiones desde cualquier IP
    },
  },
};
