/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `designated_movers` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `designated_movers` table. All the data in the column will be lost.
  - You are about to drop the column `customLabel` on the `user_addresses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "designated_movers" DROP COLUMN "expiresAt",
DROP COLUMN "message";

-- AlterTable
ALTER TABLE "user_addresses" DROP COLUMN "customLabel";
