/*
  Warnings:

  - Changed the type of `role` on the `Invite` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `OrgMembership` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `parentRole` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ParentRole" AS ENUM ('admin', 'staff', 'student', 'parent');

-- AlterTable
ALTER TABLE "public"."Invite" DROP COLUMN "role",
ADD COLUMN     "role" "public"."ParentRole" NOT NULL;

-- AlterTable
ALTER TABLE "public"."OrgMembership" DROP COLUMN "role",
ADD COLUMN     "role" "public"."ParentRole" NOT NULL;

-- AlterTable
ALTER TABLE "public"."Role" ADD COLUMN     "parentRole" "public"."ParentRole" NOT NULL;

-- CreateIndex
CREATE INDEX "OrgMembership_orgId_userId_role_idx" ON "public"."OrgMembership"("orgId", "userId", "role");

-- CreateIndex
CREATE INDEX "OrgMembership_userId_orgId_role_unitId_idx" ON "public"."OrgMembership"("userId", "orgId", "role", "unitId");

-- CreateIndex
CREATE INDEX "OrgMembership_orgId_role_idx" ON "public"."OrgMembership"("orgId", "role");
