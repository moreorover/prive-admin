-- CreateTable
CREATE TABLE "hair_sales" (
    "id" TEXT NOT NULL,
    "placedAt" DATE,
    "weightInGrams" INTEGER NOT NULL DEFAULT 0,
    "pricePerGram" INTEGER NOT NULL DEFAULT 0,
    "customerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hair_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hair_sale_assignments" (
    "id" TEXT NOT NULL,
    "hairSaleId" TEXT NOT NULL,
    "hairOrderId" TEXT NOT NULL,
    "weightInGrams" INTEGER NOT NULL DEFAULT 0,
    "soldFor" INTEGER NOT NULL DEFAULT 0,
    "profit" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hair_sale_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hair_sale_assignments_hairSaleId_hairOrderId_key" ON "hair_sale_assignments"("hairSaleId", "hairOrderId");

-- AddForeignKey
ALTER TABLE "hair_sales" ADD CONSTRAINT "hair_sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_sales" ADD CONSTRAINT "hair_sales_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_sale_assignments" ADD CONSTRAINT "hair_sale_assignments_hairSaleId_fkey" FOREIGN KEY ("hairSaleId") REFERENCES "hair_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_sale_assignments" ADD CONSTRAINT "hair_sale_assignments_hairOrderId_fkey" FOREIGN KEY ("hairOrderId") REFERENCES "hair_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
