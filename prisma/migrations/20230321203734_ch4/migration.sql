/*
  Warnings:

  - A unique constraint covering the columns `[itemName]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `quantity` to the `cart_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usersId` to the `cart_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "usersId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" SERIAL NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_itemName_key" ON "inventory"("itemName");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_itemName_key" ON "cart_items"("itemName");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
