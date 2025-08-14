-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CUSTOMER', 'MOVER');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'NAVER', 'KAKAO');

-- CreateEnum
CREATE TYPE "MoveType" AS ENUM ('SMALL', 'HOME', 'OFFICE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED', 'AUTO_REJECTED');

-- CreateEnum
CREATE TYPE "AddressRole" AS ENUM ('FROM', 'TO', 'EXTRA');

-- CreateEnum
CREATE TYPE "RegionType" AS ENUM ('SEOUL', 'BUSAN', 'DAEGU', 'INCHEON', 'GWANGJU', 'DAEJEON', 'ULSAN', 'SEJONG', 'GYEONGGI', 'GANGWON', 'CHUNGBUK', 'CHUNGNAM', 'JEONBUK', 'JEONNAM', 'GYEONGBUK', 'GYEONGNAM', 'JEJU');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WELCOME', 'ESTIMATE_REQUEST_ARRIVED', 'ESTIMATE_ARRIVED', 'ESTIMATE_STATUS_UPDATED', 'DESIGNATED_ESTIMATE_REQUEST_STATUS_UPDATED', 'DESIGNATED_ESTIMATE_STATUS_UPDATED', 'REVIEW_EVENT', 'FAVORITE_EVENT', 'MOVE_DAY_REMINDER');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('WELCOME', 'ESTIMATE_REQUEST_CREATE', 'ESTIMATE_SUBMITTED', 'ESTIMATE_ACCEPTED', 'ESTIMATE_REJECTED', 'DESIGNATED_ESTIMATE_REQUEST_SUBMITTED', 'DESIGNATED_ESTIMATE_REQUEST_REJECTED', 'DESIGNATED_ESTIMATE_SUBMITTED', 'DESIGNATED_ESTIMATE_ACCEPTED', 'DESIGNATED_ESTIMATE_REJECTED', 'REVIEW_SUBMITTED', 'FAVORITE_ADDED', 'FAVORITE_REMOVED', 'MOVE_DAY_REMINDER_TOMORROW', 'MOVE_DAY_REMINDER_TODAY', 'MOVE_DAY_REVIEW_REQUEST');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedPassword" TEXT,
    "encryptedPhoneNumber" TEXT,
    "name" TEXT NOT NULL,
    "userType" "UserType"[],
    "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "providerId" TEXT,
    "customerImage" TEXT,
    "moverImage" TEXT,
    "nickname" TEXT,
    "isVeteran" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "currentArea" "RegionType" NOT NULL,
    "preferredServices" "MoveType"[],
    "shortIntro" TEXT,
    "detailIntro" TEXT,
    "career" INTEGER,
    "workedCount" INTEGER DEFAULT 0,
    "averageRating" DOUBLE PRECISION DEFAULT 0,
    "totalReviewCount" INTEGER DEFAULT 0,
    "serviceTypes" "MoveType"[],

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "detail" TEXT,
    "region" "RegionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "role" "AddressRole" NOT NULL,
    "customLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mover_service_areas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "region" "RegionType" NOT NULL,
    "district" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "mover_service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_requests" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "moveType" "MoveType" NOT NULL,
    "moveDate" TIMESTAMP(3) NOT NULL,
    "fromAddressId" TEXT NOT NULL,
    "toAddressId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "estimate_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designated_movers" (
    "id" TEXT NOT NULL,
    "estimateRequestId" TEXT NOT NULL,
    "moverId" TEXT NOT NULL,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "designated_movers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimates" (
    "id" TEXT NOT NULL,
    "moverId" TEXT NOT NULL,
    "estimateRequestId" TEXT NOT NULL,
    "price" INTEGER,
    "comment" TEXT,
    "status" "EstimateStatus" NOT NULL DEFAULT 'PROPOSED',
    "rejectReason" TEXT,
    "isDesignated" BOOLEAN NOT NULL DEFAULT false,
    "workingHours" TEXT,
    "includesPackaging" BOOLEAN NOT NULL DEFAULT false,
    "insuranceAmount" INTEGER,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "moverId" TEXT NOT NULL,
    "estimateRequestId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "moverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActionType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "path" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "addresses_region_idx" ON "addresses"("region");

-- CreateIndex
CREATE INDEX "addresses_city_idx" ON "addresses"("city");

-- CreateIndex
CREATE INDEX "addresses_district_idx" ON "addresses"("district");

-- CreateIndex
CREATE INDEX "addresses_deletedAt_idx" ON "addresses"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_postalCode_city_district_detail_key" ON "addresses"("postalCode", "city", "district", "detail");

-- CreateIndex
CREATE INDEX "user_addresses_deletedAt_idx" ON "user_addresses"("deletedAt");

-- CreateIndex
CREATE INDEX "user_addresses_userId_idx" ON "user_addresses"("userId");

-- CreateIndex
CREATE INDEX "user_addresses_addressId_idx" ON "user_addresses"("addressId");

-- CreateIndex
CREATE UNIQUE INDEX "user_addresses_userId_addressId_role_key" ON "user_addresses"("userId", "addressId", "role");

-- CreateIndex
CREATE INDEX "mover_service_areas_region_idx" ON "mover_service_areas"("region");

-- CreateIndex
CREATE INDEX "mover_service_areas_district_idx" ON "mover_service_areas"("district");

-- CreateIndex
CREATE INDEX "mover_service_areas_deletedAt_idx" ON "mover_service_areas"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "mover_service_areas_userId_region_district_key" ON "mover_service_areas"("userId", "region", "district");

-- CreateIndex
CREATE INDEX "estimate_requests_customerId_idx" ON "estimate_requests"("customerId");

-- CreateIndex
CREATE INDEX "estimate_requests_status_idx" ON "estimate_requests"("status");

-- CreateIndex
CREATE INDEX "estimate_requests_moveDate_idx" ON "estimate_requests"("moveDate");

-- CreateIndex
CREATE INDEX "estimate_requests_moveType_idx" ON "estimate_requests"("moveType");

-- CreateIndex
CREATE INDEX "estimate_requests_deletedAt_idx" ON "estimate_requests"("deletedAt");

-- CreateIndex
CREATE INDEX "designated_movers_estimateRequestId_idx" ON "designated_movers"("estimateRequestId");

-- CreateIndex
CREATE INDEX "designated_movers_moverId_idx" ON "designated_movers"("moverId");

-- CreateIndex
CREATE INDEX "designated_movers_status_idx" ON "designated_movers"("status");

-- CreateIndex
CREATE INDEX "designated_movers_deletedAt_idx" ON "designated_movers"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "designated_movers_estimateRequestId_moverId_key" ON "designated_movers"("estimateRequestId", "moverId");

-- CreateIndex
CREATE INDEX "estimates_moverId_idx" ON "estimates"("moverId");

-- CreateIndex
CREATE INDEX "estimates_status_idx" ON "estimates"("status");

-- CreateIndex
CREATE INDEX "estimates_price_idx" ON "estimates"("price");

-- CreateIndex
CREATE INDEX "estimates_isDesignated_idx" ON "estimates"("isDesignated");

-- CreateIndex
CREATE INDEX "estimates_deletedAt_idx" ON "estimates"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_estimateRequestId_moverId_key" ON "estimates"("estimateRequestId", "moverId");

-- CreateIndex
CREATE INDEX "reviews_moverId_idx" ON "reviews"("moverId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_deletedAt_idx" ON "reviews"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_estimateRequestId_key" ON "reviews"("estimateRequestId");

-- CreateIndex
CREATE INDEX "favorites_customerId_idx" ON "favorites"("customerId");

-- CreateIndex
CREATE INDEX "favorites_moverId_idx" ON "favorites"("moverId");

-- CreateIndex
CREATE INDEX "favorites_deletedAt_idx" ON "favorites"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_customerId_moverId_key" ON "favorites"("customerId", "moverId");

-- CreateIndex
CREATE INDEX "actions_userId_idx" ON "actions"("userId");

-- CreateIndex
CREATE INDEX "actions_type_idx" ON "actions"("type");

-- CreateIndex
CREATE INDEX "actions_entityId_entityType_idx" ON "actions"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "actions_createdAt_idx" ON "actions"("createdAt");

-- CreateIndex
CREATE INDEX "actions_deletedAt_idx" ON "actions"("deletedAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_actionId_idx" ON "notifications"("actionId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_deletedAt_idx" ON "notifications"("deletedAt");

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mover_service_areas" ADD CONSTRAINT "mover_service_areas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_requests" ADD CONSTRAINT "estimate_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_requests" ADD CONSTRAINT "estimate_requests_fromAddressId_fkey" FOREIGN KEY ("fromAddressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_requests" ADD CONSTRAINT "estimate_requests_toAddressId_fkey" FOREIGN KEY ("toAddressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designated_movers" ADD CONSTRAINT "designated_movers_estimateRequestId_fkey" FOREIGN KEY ("estimateRequestId") REFERENCES "estimate_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designated_movers" ADD CONSTRAINT "designated_movers_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_estimateRequestId_fkey" FOREIGN KEY ("estimateRequestId") REFERENCES "estimate_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_estimateRequestId_fkey" FOREIGN KEY ("estimateRequestId") REFERENCES "estimate_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
