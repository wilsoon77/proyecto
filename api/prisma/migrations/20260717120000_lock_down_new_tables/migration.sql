-- Tablas agregadas después de la política inicial de RLS.
-- El backend usa el rol postgres a través de Prisma; clientes anon/authenticated
-- de Supabase no reciben políticas, por lo que PostgreSQL las bloquea por defecto.
ALTER TABLE "SystemConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
