-- Migration: Fix DB constraints for TARJETA and category deletion

-- forma_pago CHECK constraint to include TARJETA (allow NULL for unpaid consultas)
ALTER TABLE consulta DROP CONSTRAINT IF EXISTS consulta_forma_pago_check;
ALTER TABLE consulta ADD CONSTRAINT consulta_forma_pago_check
    CHECK (forma_pago IS NULL OR forma_pago IN ('EFECTIVO', 'TARJETA', 'DIGITAL'));

-- producto.categoria_id to allow null (for category deletion of inactive products)
ALTER TABLE producto ALTER COLUMN categoria_id DROP NOT NULL;

-- Composite index for the most common variante lookup (N+1 fix)
CREATE INDEX IF NOT EXISTS idx_variante_producto_color_talle
    ON variante_producto (producto_id, color, talle);

-- Index for producto by tienda
CREATE INDEX IF NOT EXISTS idx_producto_tienda ON producto (tienda_id);
