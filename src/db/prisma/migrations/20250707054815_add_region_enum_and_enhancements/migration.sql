/*
  Warnings:

  - You are about to drop the column `arrivalRegionId` on the `moving_requests` table. All the data in the column will be lost.
  - You are about to drop the column `departureRegionId` on the `moving_requests` table. All the data in the column will be lost.
  - You are about to drop the column `regionId` on the `profile_regions` table. All the data in the column will be lost.
  - You are about to drop the `regions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[profileId,region]` on the table `profile_regions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `region` to the `profile_regions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MoverActionType" AS ENUM ('VIEWED', 'QUOTED', 'REJECTED', 'BOOKMARKED');

-- CreateEnum
CREATE TYPE "MoverActivityStatus" AS ENUM ('VIEWED', 'INTERESTED', 'QUOTED', 'REJECTED', 'BOOKMARKED');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('SEOUL', 'BUSAN', 'DAEGU', 'INCHEON', 'GWANGJU', 'DAEJEON', 'ULSAN', 'SEJONG', 'GYEONGGI', 'CHUNGBUK', 'CHUNGNAM', 'JEONBUK', 'JEONNAM', 'GYEONGBUK', 'GYEONGNAM', 'GANGWON', 'JEJU');

-- DropForeignKey
ALTER TABLE "moving_requests" DROP CONSTRAINT "moving_requests_arrivalRegionId_fkey";

-- DropForeignKey
ALTER TABLE "moving_requests" DROP CONSTRAINT "moving_requests_departureRegionId_fkey";

-- DropForeignKey
ALTER TABLE "profile_regions" DROP CONSTRAINT "profile_regions_regionId_fkey";

-- DropIndex
DROP INDEX "moving_requests_arrivalRegionId_idx";

-- DropIndex
DROP INDEX "moving_requests_departureRegionId_idx";

-- DropIndex
DROP INDEX "profile_regions_profileId_regionId_key";

-- DropIndex
DROP INDEX "profile_regions_regionId_idx";

-- AlterTable
ALTER TABLE "moving_requests" DROP COLUMN "arrivalRegionId",
DROP COLUMN "departureRegionId",
ADD COLUMN     "arrivalLatitude" DOUBLE PRECISION,
ADD COLUMN     "arrivalLongitude" DOUBLE PRECISION,
ADD COLUMN     "arrivalRegion" "Region",
ADD COLUMN     "arrivalZipCode" TEXT,
ADD COLUMN     "departureLatitude" DOUBLE PRECISION,
ADD COLUMN     "departureLongitude" DOUBLE PRECISION,
ADD COLUMN     "departureRegion" "Region",
ADD COLUMN     "departureZipCode" TEXT,
ADD COLUMN     "designatedQuoteCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxBudget" INTEGER,
ADD COLUMN     "maxDesignatedQuotes" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "maxQuoteCount" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "quoteCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "isRealTime" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "socketSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profile_regions" DROP COLUMN "regionId",
ADD COLUMN     "region" "Region" NOT NULL;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "completedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "favoriteCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "includesPackaging" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "insuranceAmount" INTEGER,
ADD COLUMN     "isReadByCustomer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" INTEGER,
ADD COLUMN     "rejectionNote" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "responseTime" INTEGER,
ADD COLUMN     "userId" INTEGER,
ADD COLUMN     "workingHours" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "canCreateRequest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "currentRegion" "Region",
ADD COLUMN     "hasActiveRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastMovingDate" TIMESTAMP(3),
ADD COLUMN     "lastOnlineAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "webSocketToken" TEXT;

-- DropTable
DROP TABLE "regions";

-- CreateTable
CREATE TABLE "region_infos" (
    "region" "Region" NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "extraFee" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "region_infos_pkey" PRIMARY KEY ("region")
);

-- CreateTable
CREATE TABLE "user_services" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "user_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mover_activities" (
    "id" SERIAL NOT NULL,
    "moverId" INTEGER NOT NULL,
    "requestId" INTEGER NOT NULL,
    "actionType" "MoverActionType" NOT NULL,
    "status" "MoverActivityStatus" NOT NULL DEFAULT 'VIEWED',
    "viewedAt" TIMESTAMP(3),
    "quotedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "reason" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mover_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "moverId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "chatRoomId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "messageType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "step" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_shares" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "sharedBy" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "region_infos_displayName_key" ON "region_infos"("displayName");

-- CreateIndex
CREATE INDEX "region_infos_isActive_idx" ON "region_infos"("isActive");

-- CreateIndex
CREATE INDEX "user_services_userId_idx" ON "user_services"("userId");

-- CreateIndex
CREATE INDEX "user_services_serviceId_idx" ON "user_services"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "user_services_userId_serviceId_key" ON "user_services"("userId", "serviceId");

-- CreateIndex
CREATE INDEX "mover_activities_moverId_idx" ON "mover_activities"("moverId");

-- CreateIndex
CREATE INDEX "mover_activities_requestId_idx" ON "mover_activities"("requestId");

-- CreateIndex
CREATE INDEX "mover_activities_actionType_idx" ON "mover_activities"("actionType");

-- CreateIndex
CREATE INDEX "mover_activities_status_idx" ON "mover_activities"("status");

-- CreateIndex
CREATE INDEX "mover_activities_viewedAt_idx" ON "mover_activities"("viewedAt");

-- CreateIndex
CREATE INDEX "mover_activities_quotedAt_idx" ON "mover_activities"("quotedAt");

-- CreateIndex
CREATE INDEX "mover_activities_rejectedAt_idx" ON "mover_activities"("rejectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "mover_activities_moverId_requestId_key" ON "mover_activities"("moverId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_requestId_key" ON "chat_rooms"("requestId");

-- CreateIndex
CREATE INDEX "chat_rooms_customerId_idx" ON "chat_rooms"("customerId");

-- CreateIndex
CREATE INDEX "chat_rooms_moverId_idx" ON "chat_rooms"("moverId");

-- CreateIndex
CREATE INDEX "chat_rooms_isActive_idx" ON "chat_rooms"("isActive");

-- CreateIndex
CREATE INDEX "chat_messages_chatRoomId_idx" ON "chat_messages"("chatRoomId");

-- CreateIndex
CREATE INDEX "chat_messages_senderId_idx" ON "chat_messages"("senderId");

-- CreateIndex
CREATE INDEX "chat_messages_messageType_idx" ON "chat_messages"("messageType");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "social_shares_entityType_entityId_idx" ON "social_shares"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "social_shares_platform_idx" ON "social_shares"("platform");

-- CreateIndex
CREATE INDEX "social_shares_sharedBy_idx" ON "social_shares"("sharedBy");

-- CreateIndex
CREATE INDEX "social_shares_createdAt_idx" ON "social_shares"("createdAt");

-- CreateIndex
CREATE INDEX "moving_requests_departureRegion_idx" ON "moving_requests"("departureRegion");

-- CreateIndex
CREATE INDEX "moving_requests_arrivalRegion_idx" ON "moving_requests"("arrivalRegion");

-- CreateIndex
CREATE INDEX "moving_requests_movingType_idx" ON "moving_requests"("movingType");

-- CreateIndex
CREATE INDEX "moving_requests_isUrgent_idx" ON "moving_requests"("isUrgent");

-- CreateIndex
CREATE INDEX "moving_requests_maxBudget_idx" ON "moving_requests"("maxBudget");

-- CreateIndex
CREATE INDEX "moving_requests_quoteCount_idx" ON "moving_requests"("quoteCount");

-- CreateIndex
CREATE INDEX "moving_requests_designatedQuoteCount_idx" ON "moving_requests"("designatedQuoteCount");

-- CreateIndex
CREATE INDEX "notifications_isRealTime_idx" ON "notifications"("isRealTime");

-- CreateIndex
CREATE INDEX "notifications_socketSent_idx" ON "notifications"("socketSent");

-- CreateIndex
CREATE INDEX "profile_regions_region_idx" ON "profile_regions"("region");

-- CreateIndex
CREATE UNIQUE INDEX "profile_regions_profileId_region_key" ON "profile_regions"("profileId", "region");

-- CreateIndex
CREATE INDEX "profiles_avgRating_idx" ON "profiles"("avgRating");

-- CreateIndex
CREATE INDEX "profiles_reviewCount_idx" ON "profiles"("reviewCount");

-- CreateIndex
CREATE INDEX "profiles_completedCount_idx" ON "profiles"("completedCount");

-- CreateIndex
CREATE INDEX "profiles_experience_idx" ON "profiles"("experience");

-- CreateIndex
CREATE INDEX "profiles_lastActivityAt_idx" ON "profiles"("lastActivityAt");

-- CreateIndex
CREATE INDEX "profiles_avgRating_completedCount_idx" ON "profiles"("avgRating", "completedCount");

-- CreateIndex
CREATE INDEX "profiles_experience_avgRating_idx" ON "profiles"("experience", "avgRating");

-- CreateIndex
CREATE INDEX "profiles_deletedAt_avgRating_idx" ON "profiles"("deletedAt", "avgRating");

-- CreateIndex
CREATE INDEX "quotes_price_idx" ON "quotes"("price");

-- CreateIndex
CREATE INDEX "quotes_isDesignated_idx" ON "quotes"("isDesignated");

-- CreateIndex
CREATE INDEX "quotes_validUntil_idx" ON "quotes"("validUntil");

-- CreateIndex
CREATE INDEX "quotes_rejectedBy_idx" ON "quotes"("rejectedBy");

-- CreateIndex
CREATE INDEX "quotes_rejectedAt_idx" ON "quotes"("rejectedAt");

-- CreateIndex
CREATE INDEX "users_currentRegion_idx" ON "users"("currentRegion");

-- CreateIndex
CREATE INDEX "users_hasActiveRequest_idx" ON "users"("hasActiveRequest");

-- CreateIndex
CREATE INDEX "users_lastMovingDate_idx" ON "users"("lastMovingDate");

-- CreateIndex
CREATE INDEX "users_isOnline_idx" ON "users"("isOnline");

-- AddForeignKey
ALTER TABLE "moving_requests" ADD CONSTRAINT "moving_requests_arrivalRegion_fkey" FOREIGN KEY ("arrivalRegion") REFERENCES "region_infos"("region") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moving_requests" ADD CONSTRAINT "moving_requests_departureRegion_fkey" FOREIGN KEY ("departureRegion") REFERENCES "region_infos"("region") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_services" ADD CONSTRAINT "user_services_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_services" ADD CONSTRAINT "user_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mover_activities" ADD CONSTRAINT "mover_activities_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mover_activities" ADD CONSTRAINT "mover_activities_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "moving_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "moving_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_sharedBy_fkey" FOREIGN KEY ("sharedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
