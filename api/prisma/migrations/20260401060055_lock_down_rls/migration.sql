-- Habilitar RLS en TODAS las tablas de la base de datos para restringir acceso no autorizado por API Pública (anon/DataStudio/GraphQL)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrustedDevice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoginAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RawMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RawMaterialInventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recipe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeIngredient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductionLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Branch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Política explícita DENY ALL (Opcional, pero explícita para documentación)
-- Al no existir políticas (CREATE POLICY ... TO public/anon/authenticated),
-- Postgres aplica por defecto una política Deny-All para esos roles en estas tablas.
-- El backend de NestJS que usa Prisma se conecta empleando el rol 'postgres',
-- el cual es Superuser y, por tanto, ignora automáticamente el RLS,
-- logrando un esquema de "Defense In Depth" perfecto.