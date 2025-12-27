/*
  Warnings:

  - Added the required column `level` to the `Audience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Audience` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AudienceType" AS ENUM ('ACADEMIC', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "AudienceLevel" AS ENUM ('PARENT', 'LEAF');

-- AlterTable
ALTER TABLE "Audience" ADD COLUMN     "level" "AudienceLevel" NOT NULL,
ADD COLUMN     "type" "AudienceType" NOT NULL;

-- CreateIndex
CREATE INDEX "Audience_orgId_type_level_idx" ON "Audience"("orgId", "type", "level");
