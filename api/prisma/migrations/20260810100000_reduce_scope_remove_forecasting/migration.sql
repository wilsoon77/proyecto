-- Reducción de alcance: se elimina la analítica predictiva que ya no forma
-- parte del flujo operativo de la panadería.
DROP TABLE IF EXISTS "ForecastItem";
DROP TABLE IF EXISTS "ForecastRun";
DROP TABLE IF EXISTS "DemandDaily";

-- La caducidad solo aplica a productos comprados para reventa.
UPDATE "Product"
SET "tracksExpiration" = false,
    "expirationAlertDays" = 0
WHERE "origin" = 'PRODUCIDO';

-- Solo se conservan las dos alertas automáticas solicitadas por el cliente.
DELETE FROM "NotificationConfig"
WHERE "key" NOT IN ('inventory.raw_material_low', 'inventory.expiration_warning');
