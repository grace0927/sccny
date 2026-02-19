-- CreateTable: users (Stack Auth user IDs with local metadata)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Backfill users from existing user_roles (Stack Auth user IDs already in DB)
INSERT INTO "users" ("id", "updatedAt")
SELECT DISTINCT "userId", NOW()
FROM "user_roles"
ON CONFLICT ("id") DO NOTHING;

-- AddForeignKey: user_roles -> users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_userId_fkey'
  ) THEN
    ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- AddForeignKey: worship_order_items -> worship_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'worship_order_items_orderId_fkey'
  ) THEN
    ALTER TABLE "worship_order_items" ADD CONSTRAINT "worship_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "worship_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- AddForeignKey: translation_entries -> translation_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'translation_entries_sessionId_fkey'
  ) THEN
    ALTER TABLE "translation_entries" ADD CONSTRAINT "translation_entries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "translation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
