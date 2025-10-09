-- AlterTable
ALTER TABLE "public"."Invite" ADD COLUMN     "roleId" TEXT;

-- CreateIndex
CREATE INDEX "OrgMembership_orgId_unitId_createdAt_idx" ON "public"."OrgMembership"("orgId", "unitId", "createdAt");

-- CreateIndex
CREATE INDEX "OrgMembership_orgId_role_createdAt_idx" ON "public"."OrgMembership"("orgId", "role", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
