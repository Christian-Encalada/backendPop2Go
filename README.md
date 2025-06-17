# Pop2Go - Backend API

Este es el backend de la aplicación Pop2Go, desarrollado con Nest.js y PostgreSQL.

## Tecnologías

- **Framework**: Nest.js
- **Base de datos**: PostgreSQL (Supabase)
- **ORM**: TypeORM/Prisma
- **Autenticación**: JWT
- **Comunicación en tiempo real**: WebSockets
- **Pagos**: Stripe

## Estructura del Proyecto

```
src/
├── auth/                # Módulo de autenticación
│   ├── controllers/     # Controladores de autenticación
│   ├── dto/             # Objetos de transferencia de datos
│   ├── entities/        # Entidades relacionadas con la autenticación
│   ├── services/        # Servicios de autenticación
│   └── guards/          # Guards de protección de rutas
├── users/               # Módulo de usuarios
├── products/            # Módulo de productos
├── orders/              # Módulo de pedidos
├── delivery/            # Módulo de entregas y repartidores
├── reports/             # Módulo de reportes y métricas
├── common/              # Código compartido
│   ├── dto/             # DTOs compartidos
│   ├── entities/        # Entidades base
│   ├── interfaces/      # Interfaces comunes
│   └── decorators/      # Decoradores personalizados
└── config/              # Configuración de la aplicación
```

## Pendiente por desarrollar

1. Integración con Supabase
2. Autenticación JWT
3. Módulos principales
4. WebSockets para notificaciones en tiempo real
5. Integración de Stripe para pagos
6. Sistema de reportes y métricas

## Flujo de trabajo

1. Autenticación de usuarios (registro, login)
2. Gestión de productos y categorías
3. Creación y seguimiento de pedidos
4. Asignación automática de repartidores
5. Reportes y métricas de ventas

## Endpoints principales (planificados)

- `/auth/register` - Registro de usuarios
- `/auth/login` - Inicio de sesión
- `/products` - CRUD de productos
- `/orders` - CRUD de pedidos
- `/delivery` - Gestión de entregas
- `/reports` - Generación de reportes 