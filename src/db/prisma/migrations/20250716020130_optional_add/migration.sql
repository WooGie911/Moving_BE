/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `actions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "actions" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "experience" DROP NOT NULL,
ALTER COLUMN "introduction" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;
