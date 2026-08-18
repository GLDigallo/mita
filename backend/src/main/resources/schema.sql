-- Migration: Fix DB constraints for TARJETA and category deletion

-- forma_pago CHECK constraint to include TARJETA (allow NULL for unpaid consultas)
ALTER TABLE consulta DROP CONSTRAINT IF EXISTS consulta_forma_pago_check;
ALTER TABLE consulta ADD CONSTRAINT consulta_forma_pago_check
    CHECK (forma_pago IS NULL OR forma_pago IN ('EFECTIVO', 'TARJETA', 'DIGITAL'));

-- producto.categoria_id to allow null (for category deletion of inactive products)
ALTER TABLE producto ALTER COLUMN categoria_id DROP NOT NULL;
