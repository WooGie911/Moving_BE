/*
  Warnings:

  - The values [QUOTE_SUBMITTED,QUOTE_ACCEPTED,QUOTE_REJECTED,DESIGNATED_QUOTE_REQUESTED,DESIGNATED_QUOTE_SUBMITTED] on the enum `ActionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [QUOTED] on the enum `MoverActionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [QUOTED] on the enum `MoverActivityStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [QUOTE_CONFIRMED,NEW_REQUEST,QUOTE_REJECTED,DESIGNATED_QUOTE_REQUEST] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `requestId` on the `chat_rooms` table. All the data in the column will be lost.
  - You are about to drop the column `quotedAt` on the `mover_activities` table. All the data in the column will be lost.
  - You are about to drop the column `requestId` on the `mover_activities` table. All the data in the column will be lost.
  - You are about to drop the column `socketSent` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `designatedQuoteRequestId` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `includesPackaging` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceAmount` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `isDesignated` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `isReadByCustomer` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `moverId` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedBy` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionNote` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `requestId` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `responseTime` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `validUntil` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `workingHours` on the `quotes` table. All the data in the column will be lost.
  - The `status` column on the `quotes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `requestId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `isOnline` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `webSocketToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `designated_quote_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `moving_requests` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[quoteId]` on the table `chat_rooms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[moverId,quoteId]` on the table `mover_activities` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[confirmedEstimateId]` on the table `quotes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[quoteId,userId]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `quoteId` to the `chat_rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quoteId` to the `mover_activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `arrivalAddr` to the `quotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departureAddr` to the `quotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `movingDate` to the `quotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `movingType` to the `quotes` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `quotes` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `estimateId` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'SENT');

-- CreateEnum
CREATE TYPE "DesignatedEstimateRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- AlterEnum
BEGIN;
CREATE TYPE "ActionType_new" AS ENUM ('ESTIMATE_SUBMITTED', 'ESTIMATE_ACCEPTED', 'ESTIMATE_REJECTED', 'DESIGNATED_ESTIMATE_REQUESTED', 'DESIGNATED_ESTIMATE_SUBMITTED', 'MOVING_COMPLETED', 'REVIEW_SUBMITTED');
ALTER TABLE "actions" ALTER COLUMN "type" TYPE "ActionType_new" USING ("type"::text::"ActionType_new");
ALTER TYPE "ActionType" RENAME TO "ActionType_old";
ALTER TYPE "ActionType_new" RENAME TO "ActionType";
DROP TYPE "ActionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MoverActionType_new" AS ENUM ('VIEWED', 'ESTIMATED', 'REJECTED', 'BOOKMARKED');
ALTER TABLE "mover_activities" ALTER COLUMN "actionType" TYPE "MoverActionType_new" USING ("actionType"::text::"MoverActionType_new");
ALTER TYPE "MoverActionType" RENAME TO "MoverActionType_old";
ALTER TYPE "MoverActionType_new" RENAME TO "MoverActionType";
DROP TYPE "MoverActionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MoverActivityStatus_new" AS ENUM ('VIEWED', 'INTERESTED', 'ESTIMATED', 'REJECTED', 'BOOKMARKED');
ALTER TABLE "mover_activities" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "mover_activities" ALTER COLUMN "status" TYPE "MoverActivityStatus_new" USING ("status"::text::"MoverActivityStatus_new");
ALTER TYPE "MoverActivityStatus" RENAME TO "MoverActivityStatus_old";
ALTER TYPE "MoverActivityStatus_new" RENAME TO "MoverActivityStatus";
DROP TYPE "MoverActivityStatus_old";
ALTER TABLE "mover_activities" ALTER COLUMN "status" SET DEFAULT 'VIEWED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('NEW_ESTIMATE', 'ESTIMATE_CONFIRMED', 'MOVING_DAY', 'NEW_QUOTE', 'REVIEW_REQUEST', 'ESTIMATE_REJECTED', 'DESIGNATED_ESTIMATE_REQUEST', 'PAYMENT_CONFIRMED');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "chat_rooms" DROP CONSTRAINT "chat_rooms_requestId_fkey";

-- DropForeignKey
ALTER TABLE "designated_quote_requests" DROP CONSTRAINT "designated_quote_requests_customerId_fkey";

-- DropForeignKey
ALTER TABLE "designated_quote_requests" DROP CONSTRAINT "designated_quote_requests_moverId_fkey";

-- DropForeignKey
ALTER TABLE "designated_quote_requests" DROP CONSTRAINT "designated_quote_requests_requestId_fkey";

-- DropForeignKey
ALTER TABLE "mover_activities" DROP CONSTRAINT "mover_activities_requestId_fkey";

-- DropForeignKey
ALTER TABLE "moving_requests" DROP CONSTRAINT "moving_requests_confirmedQuoteId_fkey";

-- DropForeignKey
ALTER TABLE "moving_requests" DROP CONSTRAINT "moving_requests_userId_fkey";

-- DropForeignKey
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_designatedQuoteRequestId_fkey";

-- DropForeignKey
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_moverId_fkey";

-- DropForeignKey
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_rejectedBy_fkey";

-- DropForeignKey
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_requestId_fkey";

-- DropForeignKey
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_userId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_requestId_fkey";

-- DropIndex
DROP INDEX "chat_rooms_requestId_key";

-- DropIndex
DROP INDEX "mover_activities_moverId_requestId_key";

-- DropIndex
DROP INDEX "mover_activities_quotedAt_idx";

-- DropIndex
DROP INDEX "mover_activities_requestId_idx";

-- DropIndex
DROP INDEX "notifications_socketSent_idx";

-- DropIndex
DROP INDEX "quotes_createdAt_idx";

-- DropIndex
DROP INDEX "quotes_designatedQuoteRequestId_key";

-- DropIndex
DROP INDEX "quotes_isDesignated_idx";

-- DropIndex
DROP INDEX "quotes_moverId_idx";

-- DropIndex
DROP INDEX "quotes_price_idx";

-- DropIndex
DROP INDEX "quotes_rejectedAt_idx";

-- DropIndex
DROP INDEX "quotes_rejectedBy_idx";

-- DropIndex
DROP INDEX "quotes_requestId_moverId_key";

-- DropIndex
DROP INDEX "quotes_validUntil_idx";

-- DropIndex
DROP INDEX "reviews_requestId_userId_key";

-- DropIndex
DROP INDEX "users_isOnline_idx";

-- AlterTable
ALTER TABLE "chat_rooms" DROP COLUMN "requestId",
ADD COLUMN     "quoteId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "mover_activities" DROP COLUMN "quotedAt",
DROP COLUMN "requestId",
ADD COLUMN     "estimatedAt" TIMESTAMP(3),
ADD COLUMN     "quoteId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "socketSent",
ADD COLUMN     "sseSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "quotes" DROP COLUMN "designatedQuoteRequestId",
DROP COLUMN "includesPackaging",
DROP COLUMN "insuranceAmount",
DROP COLUMN "isDesignated",
DROP COLUMN "isReadByCustomer",
DROP COLUMN "moverId",
DROP COLUMN "price",
DROP COLUMN "rejectedAt",
DROP COLUMN "rejectedBy",
DROP COLUMN "rejectionNote",
DROP COLUMN "rejectionReason",
DROP COLUMN "requestId",
DROP COLUMN "responseTime",
DROP COLUMN "validUntil",
DROP COLUMN "workingHours",
ADD COLUMN     "arrivalAddr" TEXT NOT NULL,
ADD COLUMN     "arrivalDetail" TEXT,
ADD COLUMN     "arrivalLatitude" DOUBLE PRECISION,
ADD COLUMN     "arrivalLongitude" DOUBLE PRECISION,
ADD COLUMN     "arrivalRegion" "Region",
ADD COLUMN     "arrivalZipCode" TEXT,
ADD COLUMN     "confirmedEstimateId" INTEGER,
ADD COLUMN     "departureAddr" TEXT NOT NULL,
ADD COLUMN     "departureDetail" TEXT,
ADD COLUMN     "departureLatitude" DOUBLE PRECISION,
ADD COLUMN     "departureLongitude" DOUBLE PRECISION,
ADD COLUMN     "departureRegion" "Region",
ADD COLUMN     "departureZipCode" TEXT,
ADD COLUMN     "designatedEstimateCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimateCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimatedDistance" DOUBLE PRECISION,
ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "hasElevator" BOOLEAN,
ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxBudget" INTEGER,
ADD COLUMN     "maxDesignatedEstimates" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "maxEstimateCount" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "movingDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "movingType" "MovingType" NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "requestId",
ADD COLUMN     "estimateId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isOnline",
DROP COLUMN "webSocketToken";

-- DropTable
DROP TABLE "designated_quote_requests";

-- DropTable
DROP TABLE "moving_requests";

-- DropEnum
DROP TYPE "DesignatedQuoteRequestStatus";

-- DropEnum
DROP TYPE "QuoteStatus";

-- CreateTable
CREATE TABLE "designated_estimate_requests" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "moverId" INTEGER NOT NULL,
    "message" TEXT,
    "status" "DesignatedEstimateRequestStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designated_estimate_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimates" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "moverId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "EstimateStatus" NOT NULL DEFAULT 'PENDING',
    "isDesignated" BOOLEAN NOT NULL DEFAULT false,
    "designatedEstimateRequestId" INTEGER,
    "validUntil" TIMESTAMP(3),
    "responseTime" INTEGER,
    "isReadByCustomer" BOOLEAN NOT NULL DEFAULT false,
    "workingHours" TEXT,
    "includesPackaging" BOOLEAN NOT NULL DEFAULT false,
    "insuranceAmount" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "designated_estimate_requests_customerId_idx" ON "designated_estimate_requests"("customerId");

-- CreateIndex
CREATE INDEX "designated_estimate_requests_moverId_idx" ON "designated_estimate_requests"("moverId");

-- CreateIndex
CREATE INDEX "designated_estimate_requests_status_idx" ON "designated_estimate_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "designated_estimate_requests_quoteId_moverId_key" ON "designated_estimate_requests"("quoteId", "moverId");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_designatedEstimateRequestId_key" ON "estimates"("designatedEstimateRequestId");

-- CreateIndex
CREATE INDEX "estimates_moverId_idx" ON "estimates"("moverId");

-- CreateIndex
CREATE INDEX "estimates_status_idx" ON "estimates"("status");

-- CreateIndex
CREATE INDEX "estimates_createdAt_idx" ON "estimates"("createdAt");

-- CreateIndex
CREATE INDEX "estimates_price_idx" ON "estimates"("price");

-- CreateIndex
CREATE INDEX "estimates_isDesignated_idx" ON "estimates"("isDesignated");

-- CreateIndex
CREATE INDEX "estimates_validUntil_idx" ON "estimates"("validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_quoteId_moverId_key" ON "estimates"("quoteId", "moverId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_quoteId_key" ON "chat_rooms"("quoteId");

-- CreateIndex
CREATE INDEX "mover_activities_quoteId_idx" ON "mover_activities"("quoteId");

-- CreateIndex
CREATE INDEX "mover_activities_estimatedAt_idx" ON "mover_activities"("estimatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "mover_activities_moverId_quoteId_key" ON "mover_activities"("moverId", "quoteId");

-- CreateIndex
CREATE INDEX "notifications_sseSent_idx" ON "notifications"("sseSent");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_confirmedEstimateId_key" ON "quotes"("confirmedEstimateId");

-- CreateIndex
CREATE INDEX "quotes_userId_idx" ON "quotes"("userId");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quotes_movingDate_idx" ON "quotes"("movingDate");

-- CreateIndex
CREATE INDEX "quotes_departureRegion_idx" ON "quotes"("departureRegion");

-- CreateIndex
CREATE INDEX "quotes_arrivalRegion_idx" ON "quotes"("arrivalRegion");

-- CreateIndex
CREATE INDEX "quotes_movingType_idx" ON "quotes"("movingType");

-- CreateIndex
CREATE INDEX "quotes_isUrgent_idx" ON "quotes"("isUrgent");

-- CreateIndex
CREATE INDEX "quotes_maxBudget_idx" ON "quotes"("maxBudget");

-- CreateIndex
CREATE INDEX "quotes_estimateCount_idx" ON "quotes"("estimateCount");

-- CreateIndex
CREATE INDEX "quotes_designatedEstimateCount_idx" ON "quotes"("designatedEstimateCount");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_quoteId_userId_key" ON "reviews"("quoteId", "userId");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_confirmedEstimateId_fkey" FOREIGN KEY ("confirmedEstimateId") REFERENCES "estimates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designated_estimate_requests" ADD CONSTRAINT "designated_estimate_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designated_estimate_requests" ADD CONSTRAINT "designated_estimate_requests_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designated_estimate_requests" ADD CONSTRAINT "designated_estimate_requests_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_designatedEstimateRequestId_fkey" FOREIGN KEY ("designatedEstimateRequestId") REFERENCES "designated_estimate_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mover_activities" ADD CONSTRAINT "mover_activities_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
