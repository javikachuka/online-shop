-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('INITIAL', 'RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stockBefore" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "reason" TEXT,
    "orderId" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockMovement_variantId_idx" ON "StockMovement"("variantId");

-- CreateIndex
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");

-- CreateIndex
CREATE INDEX "StockMovement_orderId_idx" ON "StockMovement"("orderId");

-- CreateIndex
CREATE INDEX "StockMovement_actorUserId_idx" ON "StockMovement"("actorUserId");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
