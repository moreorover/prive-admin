/*
  Warnings:

  - You are about to drop the `hair_appointment_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hair_sale_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hair_sales` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "hair_appointment_assignments" DROP CONSTRAINT "hair_appointment_assignments_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "hair_appointment_assignments" DROP CONSTRAINT "hair_appointment_assignments_hairOrderId_fkey";

-- DropForeignKey
ALTER TABLE "hair_sale_assignments" DROP CONSTRAINT "hair_sale_assignments_hairOrderId_fkey";

-- DropForeignKey
ALTER TABLE "hair_sale_assignments" DROP CONSTRAINT "hair_sale_assignments_hairSaleId_fkey";

-- DropForeignKey
ALTER TABLE "hair_sales" DROP CONSTRAINT "hair_sales_createdById_fkey";

-- DropForeignKey
ALTER TABLE "hair_sales" DROP CONSTRAINT "hair_sales_customerId_fkey";

-- DropTable
DROP TABLE "hair_appointment_assignments";

-- DropTable
DROP TABLE "hair_sale_assignments";

-- DropTable
DROP TABLE "hair_sales";
