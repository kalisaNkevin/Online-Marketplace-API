/*
  Warnings:

  - You are about to drop the column `paymentProvider` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,orderId,userId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paymentMethod` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingAddress` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `paymentStatus` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MOMO_MTN', 'MOMO_AIRTEL', 'CARD', 'CASH');

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_productId_fkey";

-- DropIndex
DROP INDEX "Review_userId_productId_orderId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentProvider",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ADD COLUMN     "shippingAddress" JSONB NOT NULL,
ALTER COLUMN "paymentStatus" SET NOT NULL,
ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_productId_orderId_userId_key" ON "Review"("productId", "orderId", "userId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
