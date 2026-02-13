-- Migración para crear la tabla tbl_stock_local
-- Esta tabla maneja el stock específico de cada producto por local

CREATE TABLE IF NOT EXISTS tbl_stock_local (
    id_stock_local SERIAL PRIMARY KEY,
    stock INTEGER NOT NULL DEFAULT 0,
    precio_local DECIMAL(10,2) NULL, -- Precio específico del local (opcional)
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_producto INTEGER NOT NULL,
    id_local INTEGER NOT NULL,
    
    -- Claves foráneas
    CONSTRAINT fk_stock_local_producto 
        FOREIGN KEY (id_producto) 
        REFERENCES tbl_productos(id_producto) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_stock_local_local 
        FOREIGN KEY (id_local) 
        REFERENCES tbl_locales(id_local) 
        ON DELETE CASCADE,
        
    -- Restricción única: un producto solo puede tener un registro por local
    CONSTRAINT uk_producto_local UNIQUE (id_producto, id_local)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_stock_local_producto ON tbl_stock_local(id_producto);
CREATE INDEX IF NOT EXISTS idx_stock_local_local ON tbl_stock_local(id_local);
CREATE INDEX IF NOT EXISTS idx_stock_local_activo ON tbl_stock_local(activo);

-- Comentarios para documentación
COMMENT ON TABLE tbl_stock_local IS 'Tabla que maneja el stock específico de cada producto por local';
COMMENT ON COLUMN tbl_stock_local.stock IS 'Cantidad disponible del producto en el local específico';
COMMENT ON COLUMN tbl_stock_local.precio_local IS 'Precio específico del producto en este local (opcional, si es NULL usa precio base)';
COMMENT ON COLUMN tbl_stock_local.activo IS 'Indica si el producto está activo en este local';
COMMENT ON COLUMN tbl_stock_local.fecha_actualizacion IS 'Fecha de última actualización del stock';