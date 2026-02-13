-- Migración: Agregar campos para control de trabajo y notificaciones push en deliveries
-- Fecha: 2026-01-20
-- Descripción: Añade is_working (boolean) y expo_push_token (text) a tbl_usuarios

-- Agregar campo is_working (por defecto false)
ALTER TABLE tbl_usuarios 
ADD COLUMN IF NOT EXISTS is_working BOOLEAN DEFAULT FALSE;

-- Agregar campo expo_push_token (nullable)
ALTER TABLE tbl_usuarios 
ADD COLUMN IF NOT EXISTS expo_push_token TEXT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN tbl_usuarios.is_working IS 'Indica si el delivery está activo/trabajando y puede recibir notificaciones de pedidos nuevos';
COMMENT ON COLUMN tbl_usuarios.expo_push_token IS 'Token de Expo Push Notifications para enviar notificaciones al dispositivo del delivery';

-- Índice para búsquedas rápidas de deliveries activos
CREATE INDEX IF NOT EXISTS idx_usuarios_working 
ON tbl_usuarios (is_working) 
WHERE is_working = TRUE;

-- Índice compuesto para búsquedas de deliveries activos por ciudad
CREATE INDEX IF NOT EXISTS idx_usuarios_working_city 
ON tbl_usuarios (id_ciudad, is_working) 
WHERE is_working = TRUE;
