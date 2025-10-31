/*
  Warnings:

  - The values [ROOT] on the enum `OrgType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrgType_new" AS ENUM ('SCHOOL', 'COACHING_CENTER', 'TUITION_CENTER', 'COLLEGE', 'UNIVERSITY', 'EDTECH', 'TRAINING', 'NGO');
ALTER TABLE "Organisation" ALTER COLUMN "type" TYPE "OrgType_new" USING ("type"::text::"OrgType_new");
ALTER TYPE "OrgType" RENAME TO "OrgType_old";
ALTER TYPE "OrgType_new" RENAME TO "OrgType";
DROP TYPE "public"."OrgType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "OrgUnitType" ADD VALUE 'ROOT';
