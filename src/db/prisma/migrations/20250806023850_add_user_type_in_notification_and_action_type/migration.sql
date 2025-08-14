/*
  Warnings:

  - Added the required column `userType` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DESIGNATED_ESTIMATE_REQUEST_ARRIVED';
ALTER TYPE "NotificationType" ADD VALUE 'DESIGNATED_ESTIMATE_ARRIVED';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "userType" "UserType" NOT NULL;
