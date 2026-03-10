/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `branches` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `deliveries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `distributors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "distributors" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_code_key" ON "deliveries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "distributors_code_key" ON "distributors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "orders_code_key" ON "orders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_code_key" ON "payments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_code_key" ON "users"("code");
