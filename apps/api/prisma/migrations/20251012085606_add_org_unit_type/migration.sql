-- CreateEnum
CREATE TYPE "public"."OrgUnitType" AS ENUM ('ORGANISATION', 'DEPARTMENT', 'CLASS', 'SUBJECT', 'BATCH', 'SECTION', 'GROUP', 'OTHER');

-- AlterTable
ALTER TABLE "public"."OrgUnit" ADD COLUMN     "meta" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "type" "public"."OrgUnitType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "OrgUnit_orgId_type_idx" ON "public"."OrgUnit"("orgId", "type");
