import { Prisma, StockMovementType } from '@prisma/client';

interface ApplyStockChangeParams {
  tx: Prisma.TransactionClient;
  variantId: string;
  type: StockMovementType;
  quantityDelta: number;
  reason?: string;
  orderId?: string;
  actorUserId?: string;
  allowNegativeStock?: boolean;
}

export async function applyStockChange({
  tx,
  variantId,
  type,
  quantityDelta,
  reason,
  orderId,
  actorUserId,
  allowNegativeStock = false,
}: ApplyStockChangeParams) {
  if (quantityDelta === 0) {
    throw new Error('quantityDelta must be non-zero');
  }

  const variant = await tx.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, stock: true, sku: true },
  });

  if (!variant) {
    throw new Error(`Variant ${variantId} not found`);
  }

  const stockBefore = variant.stock;
  const stockAfter = stockBefore + quantityDelta;

  if (!allowNegativeStock && stockAfter < 0) {
    throw new Error(
      `Insufficient stock for variant ${variant.sku ?? variant.id}. ` +
        `Current: ${stockBefore}, delta: ${quantityDelta}`
    );
  }

  const updatedVariant = await tx.productVariant.update({
    where: { id: variantId },
    data: { stock: stockAfter },
  });

  await tx.stockMovement.create({
    data: {
      variantId,
      type,
      quantity: quantityDelta,
      stockBefore,
      stockAfter,
      reason,
      orderId,
      actorUserId: actorUserId ?? null,
    },
  });

  return updatedVariant;
}
