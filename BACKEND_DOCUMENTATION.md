# 📋 **DOCUMENTACIÓN BACKEND POP2GO - PARA FRONTEND**

## 🏗️ **Arquitectura General**

### **Tecnologías**
- **Framework**: Nest.js (Node.js + Express)
- **Base de datos**: PostgreSQL (Supabase)
- **ORM**: TypeORM
- **Autenticación**: JWT (JSON Web Tokens)
- **Documentación**: Swagger/OpenAPI
- **Validación**: class-validator + class-transformer
- **Rate Limiting**: ThrottlerModule

### **Patrón de Arquitectura**
- **Arquitectura en Capas** (Layered Architecture)
- **Módulos independientes** con responsabilidades específicas
- **Inyección de dependencias** automática
- **Guards y Decoradores** para autorización

---

## 🔐 **Sistema de Autenticación y Autorización**

### **Roles Disponibles**
```typescript
// Roles en el sistema
'cliente'      // Usuario final que compra productos
'repartidor'   // Entrega pedidos
'admin'        // Administra su ciudad
'superadmin'   // Administra todo el sistema
```

### **Flujo de Autenticación**
1. **Registro**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login`
3. **Token JWT**: Se incluye en header `Authorization: Bearer <token>`

### **Estructura del Token JWT**
```typescript
{
  sub: number,           // ID del usuario
  email: string,         // Email del usuario
  name: string,          // Nombre del usuario
  roles: string[],       // Array de roles ['cliente', 'admin']
  cityId: number         // ID de la ciudad del usuario
}
```

### **Reglas de Autorización**
- **Cliente**: Solo ve sus propios datos y pedidos
- **Repartidor**: Ve pedidos asignados a él
- **Admin**: Ve datos de su ciudad únicamente
- **Superadmin**: Acceso completo a todo el sistema

---

## 🚀 **Endpoints Disponibles**

### **🔐 Autenticación**
```typescript
POST /api/auth/register    // Registro de usuarios
POST /api/auth/login       // Inicio de sesión
GET  /api/auth/profile     // Perfil del usuario (requiere auth)
```

### **👥 Usuarios** (Solo admin/superadmin)
```typescript
GET    /api/users          // Lista usuarios (según permisos)
POST   /api/users          // Crear usuario
GET    /api/users/:id      // Obtener usuario específico
PUT    /api/users/:id      // Actualizar usuario
DELETE /api/users/:id      // Eliminar usuario
```

### **🏙️ Ciudades**
```typescript
GET    /api/cities         // Lista todas las ciudades (público)
POST   /api/cities         // Crear ciudad (admin/superadmin)
GET    /api/cities/:id     // Obtener ciudad específica (público)
DELETE /api/cities/:id     // Eliminar ciudad (solo superadmin)
```

### **📦 Productos**
```typescript
GET    /api/products       // Lista productos (público)
POST   /api/products       // Crear producto (admin/superadmin)
GET    /api/products/:id   // Obtener producto específico (público)
PUT    /api/products/:id   // Actualizar producto (admin/superadmin)
DELETE /api/products/:id   // Eliminar producto (admin/superadmin)
```

### **📍 Direcciones**
```typescript
GET    /api/addresses      // Lista direcciones del usuario
POST   /api/addresses      // Crear dirección
GET    /api/addresses/:id  // Obtener dirección específica
PUT    /api/addresses/:id  // Actualizar dirección
DELETE /api/addresses/:id  // Eliminar dirección
```

### **🛒 Pedidos**
```typescript
GET    /api/orders         // Lista pedidos (según permisos)
POST   /api/orders         // Crear pedido (solo cliente)
GET    /api/orders/:id     // Obtener pedido específico
PATCH  /api/orders/:id/status  // Actualizar estado (admin/repartidor)
```

---

## 📊 **Estructura de Datos**

### **Usuario (User)**
```typescript
{
  id_usuario: number,
  nombre: string,
  correo: string,
  telefono?: string,
  fecha_registro: Date,
  id_ciudad: number,
  roles: Role[],
  city: City,
  orders: Order[]
}
```

### **Producto (Product)**
```typescript
{
  id_producto: number,
  nombre: string,
  descripcion?: string,
  precio: number,
  stock: number,
  activo: boolean
}
```

### **Pedido (Order)**
```typescript
{
  id_pedido: number,
  fecha_pedido: Date,
  estado: 'pendiente' | 'en_camino' | 'entregado' | 'cancelado',
  total: number,
  tiempo_entrega?: string,
  id_usuario: number,
  id_direccion: number,
  id_repartidor?: number,
  user: User,
  address: Address,
  orderItems: OrderItem[]
}
```

### **Dirección (Address)**
```typescript
{
  id_direccion: number,
  direccion: string,
  referencia?: string,
  id_usuario: number,
  id_ciudad: number,
  user: User,
  city: City
}
```

---

## 🛡️ **Seguridad y Validaciones**

### **Headers Requeridos**
```typescript
// Para endpoints protegidos
Authorization: Bearer <jwt_token>

// Para todas las peticiones
Content-Type: application/json
```

### **Validaciones Automáticas**
- **Email**: Formato válido
- **Contraseña**: Mínimo 6 caracteres
- **Números**: Validación de tipos
- **Campos requeridos**: Validación de presencia

### **Rate Limiting**
- **100 requests por minuto** por IP
- **Configurable** por endpoint

---

## 🔄 **Flujos de Negocio**

### **Registro de Usuario**
1. Validar datos de entrada
2. Verificar email único
3. Encriptar contraseña
4. Asignar roles (por defecto: 'cliente')
5. Crear usuario en base de datos
6. Generar JWT token
7. Retornar token + datos del usuario

### **Creación de Pedido**
1. Validar productos y cantidades
2. Verificar stock disponible
3. Calcular total
4. Crear pedido con estado 'pendiente'
5. Reducir stock de productos
6. Asignar repartidor (automático o manual)

### **Gestión de Estados**
```typescript
// Estados de pedido
'pendiente'    // Pedido creado, esperando asignación
'en_camino'    // Repartidor asignado, en ruta
'entregado'    // Pedido completado
'cancelado'    // Pedido cancelado
```

---

## 📝 **Convenciones de Código**

### **Nomenclatura**
- **Entidades**: PascalCase (`User`, `Product`)
- **DTOs**: PascalCase + Dto (`CreateUserDto`)
- **Servicios**: PascalCase + Service (`UsersService`)
- **Controladores**: PascalCase + Controller (`UsersController`)

### **Respuestas HTTP**
```typescript
// Éxito
{
  status: 200/201,
  data: {...}
}

// Error
{
  status: 400/401/403/404/500,
  message: "Descripción del error"
}
```

### **Manejo de Errores**
- **400**: Datos inválidos
- **401**: No autenticado
- **403**: No autorizado
- **404**: Recurso no encontrado
- **409**: Conflicto (email duplicado)
- **500**: Error interno del servidor

---

## 🚀 **Configuración para Frontend**

### **Variables de Entorno Necesarias**
```env
# Backend URL
REACT_APP_API_URL=http://localhost:3000/api

# JWT Secret (solo backend)
JWT_SECRET=tu_secreto_jwt

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=pop2go
```

### **Configuración de Axios**
```typescript
// Ejemplo de configuración
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 📚 **Documentación Swagger**

### **Acceso a la Documentación**
- **URL**: `http://localhost:3000/api/docs`
- **Interactiva**: Prueba endpoints directamente
- **Autenticación**: Incluye botón para JWT Bearer

### **Ejemplos de Uso**
```typescript
// Login
POST /api/auth/login
{
  "email": "usuario@ejemplo.com",
  "password": "Password123"
}

// Crear pedido
POST /api/orders
{
  "id_direccion": 1,
  "productos": [
    { "id_producto": 1, "cantidad": 2 },
    { "id_producto": 3, "cantidad": 1 }
  ]
}
```

---

## 🎯 **Próximos Pasos Recomendados**

### **Para el Frontend**
1. **Setup inicial** con React Native + Expo
2. **Configurar Axios** para conectar con el backend
3. **Implementar autenticación** (login/register)
4. **Crear contexto de auth** con roles
5. **Navegación basada en roles**
6. **Pantallas principales** (Home, Catálogo, Carrito)
7. **Integración con endpoints** del backend

### **Endpoints Prioritarios**
1. `POST /api/auth/login` - Autenticación
2. `GET /api/products` - Lista de productos
3. `GET /api/cities` - Selección de ciudad
4. `POST /api/orders` - Crear pedidos
5. `GET /api/orders` - Ver pedidos del usuario

---

## 📋 **Base de Datos**

### **Tablas Principales**
```sql
-- Usuarios y roles
tbl_usuarios          // Usuarios del sistema
tbl_roles             // Roles disponibles
tbl_usuario_roles     // Relación muchos a muchos

-- Productos y pedidos
tbl_productos         // Catálogo de productos
tbl_pedidos           // Pedidos realizados
tbl_carrito_productos // Items de cada pedido

-- Ubicaciones
tbl_ciudades          // Ciudades disponibles
tbl_direcciones       // Direcciones de entrega

-- Reportes (futuro)
tbl_reportes_ventas   // Métricas de ventas
tbl_metricas_repartidores // Rendimiento repartidores
```

### **Índices Optimizados**
- Usuarios por ciudad
- Pedidos por usuario y estado
- Productos por activo
- Direcciones por usuario

---

## 🔧 **Configuración del Proyecto**

### **Estructura de Carpetas**
```
src/
├── auth/              // Autenticación JWT
├── users/             // Gestión de usuarios
├── cities/            // Gestión de ciudades
├── products/          // Gestión de productos
├── orders/            // Gestión de pedidos
├── addresses/         // Gestión de direcciones
├── common/            // Código compartido
│   ├── decorators/    // Decoradores personalizados
│   ├── guards/        // Guards de autorización
│   └── pipes/         // Pipes de validación
└── config/            // Configuración de la app
```

### **Dependencias Principales**
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/typeorm": "^10.0.1",
  "@nestjs/swagger": "^8.1.1",
  "@nestjs/throttler": "^5.2.0",
  "typeorm": "^0.3.17",
  "bcrypt": "^6.0.0",
  "class-validator": "^0.14.0"
}
```

---

## 📞 **Contacto y Soporte**

**📧 Contacto**: Para dudas sobre la API, consultar la documentación Swagger o contactar al equipo de backend.

**🔄 Actualizaciones**: Este documento se actualiza conforme evoluciona el backend.

**🐛 Reportes**: Para reportar bugs o solicitar nuevas funcionalidades, crear un issue en el repositorio.

---

*Última actualización: Junio 2024*
*Versión del backend: 1.0.0* 