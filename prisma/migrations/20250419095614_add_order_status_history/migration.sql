/*
  Warnings:

  - Made the column `total` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `comment` on table `OrderStatusHistory` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "total" SET NOT NULL;

-- AlterTable
ALTER TABLE "OrderStatusHistory" ALTER COLUMN "comment" SET NOT NULL;
