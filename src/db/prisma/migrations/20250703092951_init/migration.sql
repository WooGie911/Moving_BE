-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CUSTOMER', 'MOVER');

-- CreateEnum
CREATE TYPE "SocialProvider" AS ENUM ('GOOGLE', 'NAVER', 'KAKAO');

-- CreateEnum
CREATE TYPE "MovingType" AS ENUM ('SMALL', 'HOME', 'OFFICE');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'SENT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('ACTIVE', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISABLED');

-- CreateEnum
CREATE TYPE "DesignatedQuoteRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('QUOTE_SUBMITTED', 'QUOTE_ACCEPTED', 'QUOTE_REJECTED', 'DESIGNATED_QUOTE_REQUESTED', 'DESIGNATED_QUOTE_SUBMITTED', 'MOVING_COMPLETED', 'REVIEW_SUBMITTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_QUOTE', 'QUOTE_CONFIRMED', 'MOVING_DAY', 'NEW_REQUEST', 'REVIEW_REQUEST', 'QUOTE_REJECTED', 'DESIGNATED_QUOTE_REQUEST', 'PAYMENT_CONFIRMED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedPassword" TEXT,
    "encryptedPhoneNumber" TEXT,
    "userType" "UserType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" SERIAL NOT NULL,
    "provider" "SocialProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nickname" TEXT NOT NULL,
    "profileImage" TEXT,
    "experience" INTEGER NOT NULL,
    "introduction" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "iconUrl" TEXT,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_regions" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "regionId" INTEGER NOT NULL,

    CONSTRAINT "profile_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_services" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "profile_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moving_requests" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "movingType" "MovingType" NOT NULL,
    "movingDate" TIMESTAMP(3) NOT NULL,
    "departureAddr" TEXT NOT NULL,
    "arrivalAddr" TEXT NOT NULL,
    "departureDetail" TEXT,
    "arrivalDetail" TEXT,
    "departureRegionId" INTEGER,
    "arrivalRegionId" INTEGER,
    "description" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'ACTIVE',
    "confirmedQuoteId" INTEGER,
    "estimatedDistance" DOUBLE PRECISION,
    "floor" INTEGER,
    "hasElevator" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moving_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designated_quote_requests" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "moverId" INTEGER NOT NULL,
    "message" TEXT,
    "status" "DesignatedQuoteRequestStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designated_quote_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "moverId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "isDesignated" BOOLEAN NOT NULL DEFAULT false,
    "designatedQuoteRequestId" INTEGER,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "ActionType" NOT NULL,
    "entityId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "actionId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "moverId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "moverId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_userType_idx" ON "users"("userType");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "social_accounts_userId_idx" ON "social_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_provider_providerId_key" ON "social_accounts"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_nickname_key" ON "profiles"("nickname");

-- CreateIndex
CREATE INDEX "profiles_nickname_idx" ON "profiles"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "regions_name_key" ON "regions"("name");

-- CreateIndex
CREATE INDEX "regions_isActive_idx" ON "regions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- CreateIndex
CREATE INDEX "services_isActive_idx" ON "services"("isActive");

-- CreateIndex
CREATE INDEX "profile_regions_profileId_idx" ON "profile_regions"("profileId");

-- CreateIndex
CREATE INDEX "profile_regions_regionId_idx" ON "profile_regions"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_regions_profileId_regionId_key" ON "profile_regions"("profileId", "regionId");

-- CreateIndex
CREATE INDEX "profile_services_profileId_idx" ON "profile_services"("profileId");

-- CreateIndex
CREATE INDEX "profile_services_serviceId_idx" ON "profile_services"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_services_profileId_serviceId_key" ON "profile_services"("profileId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "moving_requests_confirmedQuoteId_key" ON "moving_requests"("confirmedQuoteId");

-- CreateIndex
CREATE INDEX "moving_requests_userId_idx" ON "moving_requests"("userId");

-- CreateIndex
CREATE INDEX "moving_requests_status_idx" ON "moving_requests"("status");

-- CreateIndex
CREATE INDEX "moving_requests_movingDate_idx" ON "moving_requests"("movingDate");

-- CreateIndex
CREATE INDEX "moving_requests_departureRegionId_idx" ON "moving_requests"("departureRegionId");

-- CreateIndex
CREATE INDEX "moving_requests_arrivalRegionId_idx" ON "moving_requests"("arrivalRegionId");

-- CreateIndex
CREATE INDEX "designated_quote_requests_customerId_idx" ON "designated_quote_requests"("customerId");

-- CreateIndex
CREATE INDEX "designated_quote_requests_moverId_idx" ON "designated_quote_requests"("moverId");

-- CreateIndex
CREATE INDEX "designated_quote_requests_status_idx" ON "designated_quote_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "designated_quote_requests_requestId_moverId_key" ON "designated_quote_requests"("requestId", "moverId");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_designatedQuoteRequestId_key" ON "quotes"("designatedQuoteRequestId");

-- CreateIndex
CREATE INDEX "quotes_moverId_idx" ON "quotes"("moverId");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quotes_createdAt_idx" ON "quotes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_requestId_moverId_key" ON "quotes"("requestId", "moverId");

-- CreateIndex
CREATE INDEX "actions_userId_idx" ON "actions"("userId");

-- CreateIndex
CREATE INDEX "actions_type_idx" ON "actions"("type");

-- CreateIndex
CREATE INDEX "actions_entityId_entityType_idx" ON "actions"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "actions_createdAt_idx" ON "actions"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_actionId_idx" ON "notifications"("actionId");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "reviews_moverId_idx" ON "reviews"("moverId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_requestId_userId_key" ON "reviews"("requestId", "userId");

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE INDEX "favorites_moverId_idx" ON "favorites"("moverId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_moverId_key" ON "favorites"("userId", "moverId");

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_regions" ADD CONSTRAINT "profile_regions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_regions" ADD CONSTRAINT "profile_regions_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_services" ADD CONSTRAINT "profile_services_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_services" ADD CONSTRAINT "profile_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moving_requests" ADD CONSTRAINT "moving_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moving_requests" ADD CONSTRAINT "moving_requests_departureRegionId_fkey" FOREIGN KEY ("departureRegionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moving_requests" ADD CONSTRAINT "moving_requests_arrivalRegionId_fkey" FOREIGN KEY ("arrivalRegionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moving_requests" ADD CONSTRAINT "moving_requests_confirmedQuoteId_fkey" FOREIGN KEY ("confirmedQuoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designated_quote_requests" ADD CONSTRAINT "designated_quote_requests_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "moving_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designated_quote_requests" ADD CONSTRAINT "designated_quote_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designated_quote_requests" ADD CONSTRAINT "designated_quote_requests_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "moving_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_designatedQuoteRequestId_fkey" FOREIGN KEY ("designatedQuoteRequestId") REFERENCES "designated_quote_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "moving_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_moverId_fkey" FOREIGN KEY ("moverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
