-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "imageGroupingAttributeId" TEXT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_imageGroupingAttributeId_fkey" FOREIGN KEY ("imageGroupingAttributeId") REFERENCES "Attribute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
