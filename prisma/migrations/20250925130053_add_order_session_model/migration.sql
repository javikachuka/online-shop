-- CreateTable
CREATE TABLE "OrderSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "cartItems" JSONB NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "discounts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMethodId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderSession_sessionToken_key" ON "OrderSession"("sessionToken");

-- CreateIndex
CREATE INDEX "OrderSession_sessionToken_idx" ON "OrderSession"("sessionToken");

-- CreateIndex
CREATE INDEX "OrderSession_userId_idx" ON "OrderSession"("userId");

-- CreateIndex
CREATE INDEX "OrderSession_isProcessed_idx" ON "OrderSession"("isProcessed");

-- CreateIndex
CREATE INDEX "OrderSession_expiresAt_idx" ON "OrderSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "OrderSession" ADD CONSTRAINT "OrderSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSession" ADD CONSTRAINT "OrderSession_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSession" ADD CONSTRAINT "OrderSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
