/*
  Warnings:

  - You are about to drop the `appointment_notes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hair_order_notes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "appointment_notes" DROP CONSTRAINT "appointment_notes_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "hair_order_notes" DROP CONSTRAINT "hair_order_notes_createdById_fkey";

-- DropForeignKey
ALTER TABLE "hair_order_notes" DROP CONSTRAINT "hair_order_notes_hairOrderId_fkey";

-- DropTable
DROP TABLE "appointment_notes";

-- DropTable
DROP TABLE "hair_order_notes";
