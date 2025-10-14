-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryMethod" TEXT NOT NULL DEFAULT 'delivery';

-- AlterTable
ALTER TABLE "OrderSession" ADD COLUMN     "deliveryMethod" TEXT NOT NULL DEFAULT 'delivery';
