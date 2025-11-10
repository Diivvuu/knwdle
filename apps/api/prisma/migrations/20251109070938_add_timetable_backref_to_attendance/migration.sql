-- AlterTable
ALTER TABLE "AttendanceSession" ADD COLUMN     "timeTableEntryId" TEXT;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_timeTableEntryId_fkey" FOREIGN KEY ("timeTableEntryId") REFERENCES "TimeTableEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
