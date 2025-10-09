-- AlterTable
ALTER TABLE "public"."OrgMembership" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Invite_orgId_createdAt_idx" ON "public"."Invite"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Invite_orgId_expiresAt_idx" ON "public"."Invite"("orgId", "expiresAt");

-- CreateIndex
CREATE INDEX "OrgMembership_orgId_createdAt_idx" ON "public"."OrgMembership"("orgId", "createdAt");
