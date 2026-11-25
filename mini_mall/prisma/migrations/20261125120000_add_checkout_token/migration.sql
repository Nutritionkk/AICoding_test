-- AlterTable
ALTER TABLE "Order" ADD COLUMN "checkoutToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_userId_checkoutToken_key" ON "Order"("userId", "checkoutToken");

