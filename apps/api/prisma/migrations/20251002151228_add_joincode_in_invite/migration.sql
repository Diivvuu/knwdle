/*
  Warnings:

  - A unique constraint covering the columns `[joinCode]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Invite" ADD COLUMN     "joinCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invite_joinCode_key" ON "public"."Invite"("joinCode");
