-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "completedDateBy" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING';
