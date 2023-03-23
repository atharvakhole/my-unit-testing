/*
  Warnings:

  - The primary key for the `inventory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `inventory` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "inventory_itemName_key";

-- AlterTable
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("itemName");
