-- Migración para agregar ON DELETE CASCADE a la foreign key de tbl_carrito_productos
-- Esto permite eliminar pedidos sin tener que eliminar manualmente los items primero

-- Paso 1: Encontrar y eliminar la constraint existente
-- Buscar el nombre real de la constraint que referencia id_pedido
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Buscar el nombre de la constraint que referencia id_pedido
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'tbl_carrito_productos'::regclass
      AND confrelid = 'tbl_pedidos'::regclass
      AND contype = 'f'
    LIMIT 1;

    -- Si encontramos la constraint, eliminarla
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE "tbl_carrito_productos" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Constraint eliminada: %', constraint_name;
    ELSE
        RAISE NOTICE 'No se encontró constraint para eliminar';
    END IF;
END $$;

-- Paso 2: Recrear la constraint con ON DELETE CASCADE
ALTER TABLE "tbl_carrito_productos"
ADD CONSTRAINT "FK_carrito_productos_pedido"
FOREIGN KEY ("id_pedido")
REFERENCES "tbl_pedidos"("id_pedido")
ON DELETE CASCADE;
