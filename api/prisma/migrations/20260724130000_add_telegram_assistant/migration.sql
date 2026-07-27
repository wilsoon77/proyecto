-- Telegram assistant access, secure linking, webhook idempotency and alert state.
CREATE TYPE "AssistantScope" AS ENUM ('ALL_BRANCHES');
CREATE TYPE "AlertType" AS ENUM ('RAW_MATERIAL_LOW', 'PRODUCT_LOW');

CREATE TABLE "AssistantAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scope" "AssistantScope" NOT NULL DEFAULT 'ALL_BRANCHES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AssistantAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "username" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlinkedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    CONSTRAINT "TelegramLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramLinkToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelegramLinkToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramUpdate" (
    "updateId" BIGINT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    CONSTRAINT "TelegramUpdate_pkey" PRIMARY KEY ("updateId")
);

CREATE TABLE "TelegramLinkAttempt" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    CONSTRAINT "TelegramLinkAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlertState" (
    "id" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "resourceKey" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "firstTriggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastNotifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AlertState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssistantAccess_userId_key" ON "AssistantAccess"("userId");
CREATE UNIQUE INDEX "TelegramLink_userId_key" ON "TelegramLink"("userId");
CREATE UNIQUE INDEX "TelegramLink_chatId_key" ON "TelegramLink"("chatId");
CREATE UNIQUE INDEX "TelegramLinkToken_tokenHash_key" ON "TelegramLinkToken"("tokenHash");
CREATE INDEX "TelegramLinkToken_userId_expiresAt_idx" ON "TelegramLinkToken"("userId", "expiresAt");
CREATE INDEX "TelegramLinkAttempt_chatId_attemptedAt_idx" ON "TelegramLinkAttempt"("chatId", "attemptedAt");
CREATE UNIQUE INDEX "AlertState_branchId_alertType_resourceKey_key" ON "AlertState"("branchId", "alertType", "resourceKey");
CREATE INDEX "AlertState_branchId_active_idx" ON "AlertState"("branchId", "active");

ALTER TABLE "AssistantAccess" ADD CONSTRAINT "AssistantAccess_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TelegramLink" ADD CONSTRAINT "TelegramLink_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TelegramLinkToken" ADD CONSTRAINT "TelegramLinkToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlertState" ADD CONSTRAINT "AlertState_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable the same database-side protection used by the other server-owned tables.
ALTER TABLE "AssistantAccess" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelegramLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelegramLinkToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelegramUpdate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelegramLinkAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlertState" ENABLE ROW LEVEL SECURITY;

-- Existing eligible users can use the assistant immediately after migration;
-- disabling a row remains the explicit revocation mechanism.
INSERT INTO "AssistantAccess" ("id", "userId", "enabled", "scope", "createdAt", "updatedAt")
SELECT 'assistant_' || md5(u."id" || clock_timestamp()::text), u."id", true, 'ALL_BRANCHES', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u
WHERE u."role" IN ('ADMIN', 'MANAGER')
ON CONFLICT ("userId") DO NOTHING;

-- Notification rules used by the new channel and by the optional close summary.
INSERT INTO "NotificationConfig"
  ("key", "name", "description", "category", "isEnabled", "title", "message", "targetRoles", "thresholds", "soundType", "createdAt", "updatedAt")
VALUES
  ('telegram.linked', 'Telegram vinculado', 'Confirma que una cuenta fue vinculada a un chat privado de Telegram.', 'SYSTEM', true, 'Telegram vinculado', 'Tu cuenta se vinculó al bot de Telegram {username}', '["ADMIN","MANAGER"]'::jsonb, NULL, 'suave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('daily_close.completed', 'Cierre de día completado', 'Resume las unidades vendidas, merma y sobrantes de un cierre.', 'SYSTEM', true, 'Cierre de día completado', 'Cierre de {branchName}: {totalSold} vendidos, {totalWaste} de merma y {totalSurplus} sobrantes', '["ADMIN","MANAGER"]'::jsonb, NULL, 'suave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- Owners who receive branch-specific operational alerts must include ADMIN.
UPDATE "NotificationConfig"
SET "targetRoles" = '["ADMIN","MANAGER","CASHIER"]'::jsonb
WHERE "key" IN ('order.new_pending', 'order.cancelled');
UPDATE "NotificationConfig"
SET "targetRoles" = '["ADMIN","MANAGER"]'::jsonb
WHERE "key" = 'inventory.raw_material_low';
