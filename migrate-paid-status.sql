-- Migrar todos los pagos confirmados actuales al estado "Pagado"
UPDATE supplier_payments
SET paid = true
WHERE confirmed = true
AND (paid IS NULL OR paid = false);
