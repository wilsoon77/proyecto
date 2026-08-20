-- Retiro del rol CASHIER después de eliminar el POS del alcance del producto.
-- Se conserva la trazabilidad de usuarios históricos sin conceder privilegios:
-- cualquier usuario CASHIER existente pasa a CUSTOMER antes de quitar el enum.
UPDATE "User"
SET "role" = 'CUSTOMER',
    "branchId" = NULL
WHERE "role"::text = 'CASHIER';

-- Los roles de las notificaciones se almacenan como JSON, por lo que también
-- se elimina CASHIER de configuraciones antiguas sin tocar el historial enviado.
UPDATE "NotificationConfig"
SET "targetRoles" = COALESCE(
  (
    SELECT jsonb_agg(value)
    FROM jsonb_array_elements("targetRoles") AS role(value)
    WHERE value <> '"CASHIER"'::jsonb
  ),
  '[]'::jsonb
)
WHERE "targetRoles" @> '["CASHIER"]'::jsonb;

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT;

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN', 'MANAGER', 'BAKER');

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole"
  USING ("role"::text::"UserRole");

ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';

DROP TYPE "UserRole_old";
