/*
  Warnings:

  - You are about to drop the `hair` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hair_components` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[uid]` on the table `hair_orders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "hair" DROP CONSTRAINT "hair_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "hair" DROP CONSTRAINT "hair_hairOrderId_fkey";

-- DropForeignKey
ALTER TABLE "hair_components" DROP CONSTRAINT "hair_components_hairId_fkey";

-- DropForeignKey
ALTER TABLE "hair_components" DROP CONSTRAINT "hair_components_parentId_fkey";

-- AlterTable
ALTER TABLE "hair_orders" ADD COLUMN     "uid" SERIAL NOT NULL,
ADD COLUMN     "weightReceived" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weightUsed" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "hair";

-- DropTable
DROP TABLE "hair_components";

-- CreateTable
CREATE TABLE "hair_appointment_assignments" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "hairOrderId" TEXT NOT NULL,
    "weightInGrams" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hair_appointment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hair_appointment_assignments_appointmentId_hairOrderId_key" ON "hair_appointment_assignments"("appointmentId", "hairOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "hair_orders_uid_key" ON "hair_orders"("uid");

-- AddForeignKey
ALTER TABLE "hair_appointment_assignments" ADD CONSTRAINT "hair_appointment_assignments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_appointment_assignments" ADD CONSTRAINT "hair_appointment_assignments_hairOrderId_fkey" FOREIGN KEY ("hairOrderId") REFERENCES "hair_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
