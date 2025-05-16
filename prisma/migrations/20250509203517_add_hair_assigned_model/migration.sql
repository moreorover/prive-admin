-- CreateTable
CREATE TABLE "hair_assigned" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "hairOrderId" TEXT NOT NULL,
    "weightInGrams" INTEGER NOT NULL DEFAULT 0,
    "soldFor" INTEGER NOT NULL DEFAULT 0,
    "profit" INTEGER NOT NULL DEFAULT 0,
    "pricePerGram" INTEGER NOT NULL DEFAULT 0,
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hair_assigned_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hair_assigned" ADD CONSTRAINT "hair_assigned_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_assigned" ADD CONSTRAINT "hair_assigned_hairOrderId_fkey" FOREIGN KEY ("hairOrderId") REFERENCES "hair_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_assigned" ADD CONSTRAINT "hair_assigned_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_assigned" ADD CONSTRAINT "hair_assigned_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
