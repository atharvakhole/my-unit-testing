/*
  Warnings:

  - You are about to drop the column `cartId` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `usersId` on the `cart_items` table. All the data in the column will be lost.
  - The primary key for the `carts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `carts` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - Added the required column `cartUser` to the `cart_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_cartId_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_usersId_fkey";

-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "cartId",
DROP COLUMN "usersId",
ADD COLUMN     "cartUser" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "carts" DROP CONSTRAINT "carts_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("username");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("username");

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_username_fkey" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartUser_fkey" FOREIGN KEY ("cartUser") REFERENCES "carts"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
