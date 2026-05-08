import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as dotenv from "dotenv";

// Cargar variables de entorno manualmente
dotenv.config();

const dbHost = (process.env.DB_HOST || "").toLowerCase();
const cloudHostsRequiringSsl = ["neon.tech", "supabase.co"];
const inferredSslByHost = cloudHostsRequiringSsl.some((host) =>
  dbHost.includes(host),
);
const dbSslEnabled =
  typeof process.env.DB_SSL === "string"
    ? process.env.DB_SSL === "true"
    : inferredSslByHost;

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
  // Evitar spam de queries en consola (puede saturar logs en móvil)
  // Para ver queries, setear TYPEORM_LOGGING=true
  logging: process.env.TYPEORM_LOGGING === "true",
  // Habilitar SSL según entorno (Supabase/Neon suele requerir true)
  ssl: dbSslEnabled,
  // Opciones adicionales para resolver problemas de conexión
  extra: {
    // Opciones específicas para pg
    max: 20, // máximo número de clientes en el pool
    connectionTimeoutMillis: 30000, // tiempo de espera para conexión
    ...(dbSslEnabled
      ? {
          ssl: {
            rejectUnauthorized: false, // Necesario para algunos proveedores cloud
          },
        }
      : {}),
  },
};
