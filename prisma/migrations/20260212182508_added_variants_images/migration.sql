-- CreateTable
CREATE TABLE "_ProductImageToProductVariant" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProductImageToProductVariant_AB_unique" ON "_ProductImageToProductVariant"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductImageToProductVariant_B_index" ON "_ProductImageToProductVariant"("B");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- AddForeignKey
ALTER TABLE "_ProductImageToProductVariant" ADD CONSTRAINT "_ProductImageToProductVariant_A_fkey" FOREIGN KEY ("A") REFERENCES "ProductImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductImageToProductVariant" ADD CONSTRAINT "_ProductImageToProductVariant_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
