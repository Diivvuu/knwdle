-- CreateTable
CREATE TABLE "public"."InviteBatch" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InviteBatch_orgId_createdAt_idx" ON "public"."InviteBatch"("orgId", "createdAt");
