/*
  Warnings:

  - A unique constraint covering the columns `[orgId,userId,unitId]` on the table `OrgMembership` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OrgMembership_orgId_userId_unitId_key" ON "public"."OrgMembership"("orgId", "userId", "unitId");
