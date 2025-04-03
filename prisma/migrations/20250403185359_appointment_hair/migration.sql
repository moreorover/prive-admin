-- AlterTable
ALTER TABLE "hair" ADD COLUMN     "appointmentId" TEXT;

-- AddForeignKey
ALTER TABLE "hair" ADD CONSTRAINT "hair_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
