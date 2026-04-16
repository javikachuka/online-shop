-- Add global order for product images
ALTER TABLE "ProductImage" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Create explicit image/variant assignments with per-variant ordering
CREATE TABLE "ProductImageVariant" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductImageVariant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductImageVariant_imageId_variantId_key" ON "ProductImageVariant"("imageId", "variantId");
CREATE INDEX "ProductImageVariant_variantId_sortOrder_idx" ON "ProductImageVariant"("variantId", "sortOrder");
CREATE INDEX "ProductImageVariant_imageId_idx" ON "ProductImageVariant"("imageId");
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");

ALTER TABLE "ProductImageVariant" ADD CONSTRAINT "ProductImageVariant_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ProductImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductImageVariant" ADD CONSTRAINT "ProductImageVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill a stable global order for existing product images
WITH ranked_images AS (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "productId" ORDER BY "id") - 1 AS row_num
    FROM "ProductImage"
)
UPDATE "ProductImage" AS image
SET "sortOrder" = ranked_images.row_num
FROM ranked_images
WHERE image."id" = ranked_images."id";

-- Backfill explicit assignments from the previous implicit M:N table
INSERT INTO "ProductImageVariant" ("id", "imageId", "variantId", "sortOrder", "isPrimary")
SELECT
    relation."A" || ':' || relation."B",
    relation."A",
    relation."B",
    ROW_NUMBER() OVER (PARTITION BY relation."B" ORDER BY image."sortOrder", image."id") - 1,
    false
FROM "_ProductImageToProductVariant" AS relation
INNER JOIN "ProductImage" AS image ON image."id" = relation."A";

DROP TABLE "_ProductImageToProductVariant";