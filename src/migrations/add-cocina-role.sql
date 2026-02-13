-- Migración: agregar rol 'cocina' para gestión de pedidos en local
-- Fecha: 2026-01-21

INSERT INTO tbl_roles (nombre)
SELECT 'cocina'
WHERE NOT EXISTS (SELECT 1 FROM tbl_roles WHERE nombre = 'cocina');

