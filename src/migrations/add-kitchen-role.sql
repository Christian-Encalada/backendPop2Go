-- Script para agregar el rol 'cocina' a la base de datos
-- Ejecutar una vez para habilitar el login como cocina

INSERT INTO tbl_roles (nombre) 
VALUES ('cocina') 
ON CONFLICT (nombre) DO NOTHING;

-- Agregar columnas de estado al pedido (si no existen)
ALTER TABLE tbl_pedidos ADD COLUMN IF NOT EXISTS fecha_aceptado_cocina TIMESTAMP NULL;
ALTER TABLE tbl_pedidos ADD COLUMN IF NOT EXISTS fecha_asignado_delivery TIMESTAMP NULL;
