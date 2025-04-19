-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "featuredAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastModifiedBy" TEXT;
