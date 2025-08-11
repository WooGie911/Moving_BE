-- DropIndex
DROP INDEX "actions_createdAt_idx";

-- DropIndex
DROP INDEX "actions_type_idx";

-- DropIndex
DROP INDEX "actions_userId_idx";

-- DropIndex
DROP INDEX "addresses_city_idx";

-- DropIndex
DROP INDEX "addresses_district_idx";

-- DropIndex
DROP INDEX "addresses_region_idx";

-- DropIndex
DROP INDEX "designated_movers_estimateRequestId_idx";

-- DropIndex
DROP INDEX "designated_movers_moverId_idx";

-- DropIndex
DROP INDEX "designated_movers_status_idx";

-- DropIndex
DROP INDEX "estimate_requests_customerId_idx";

-- DropIndex
DROP INDEX "estimate_requests_moveDate_idx";

-- DropIndex
DROP INDEX "estimate_requests_moveType_idx";

-- DropIndex
DROP INDEX "estimate_requests_status_idx";

-- DropIndex
DROP INDEX "estimates_isDesignated_idx";

-- DropIndex
DROP INDEX "estimates_moverId_idx";

-- DropIndex
DROP INDEX "estimates_price_idx";

-- DropIndex
DROP INDEX "estimates_status_idx";

-- DropIndex
DROP INDEX "favorites_customerId_idx";

-- DropIndex
DROP INDEX "favorites_moverId_idx";

-- DropIndex
DROP INDEX "mover_service_areas_district_idx";

-- DropIndex
DROP INDEX "mover_service_areas_region_idx";

-- DropIndex
DROP INDEX "notifications_actionId_idx";

-- DropIndex
DROP INDEX "notifications_createdAt_idx";

-- DropIndex
DROP INDEX "notifications_type_idx";

-- DropIndex
DROP INDEX "notifications_userId_isRead_idx";

-- DropIndex
DROP INDEX "reviews_moverId_idx";

-- DropIndex
DROP INDEX "reviews_rating_idx";

-- DropIndex
DROP INDEX "user_addresses_addressId_idx";

-- DropIndex
DROP INDEX "user_addresses_userId_idx";

-- DropIndex
DROP INDEX "users_email_idx";

-- CreateIndex
CREATE INDEX "actions_userId_type_idx" ON "actions"("userId", "type");

-- CreateIndex
CREATE INDEX "actions_createdAt_type_idx" ON "actions"("createdAt", "type");

-- CreateIndex
CREATE INDEX "addresses_region_city_district_idx" ON "addresses"("region", "city", "district");

-- CreateIndex
CREATE INDEX "designated_movers_moverId_status_idx" ON "designated_movers"("moverId", "status");

-- CreateIndex
CREATE INDEX "designated_movers_estimateRequestId_status_idx" ON "designated_movers"("estimateRequestId", "status");

-- CreateIndex
CREATE INDEX "estimate_requests_customerId_status_idx" ON "estimate_requests"("customerId", "status");

-- CreateIndex
CREATE INDEX "estimate_requests_moveDate_moveType_idx" ON "estimate_requests"("moveDate", "moveType");

-- CreateIndex
CREATE INDEX "estimates_moverId_status_idx" ON "estimates"("moverId", "status");

-- CreateIndex
CREATE INDEX "estimates_estimateRequestId_status_idx" ON "estimates"("estimateRequestId", "status");

-- CreateIndex
CREATE INDEX "estimates_status_price_idx" ON "estimates"("status", "price");

-- CreateIndex
CREATE INDEX "estimates_isDesignated_status_idx" ON "estimates"("isDesignated", "status");

-- CreateIndex
CREATE INDEX "favorites_customerId_createdAt_idx" ON "favorites"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "favorites_moverId_createdAt_idx" ON "favorites"("moverId", "createdAt");

-- CreateIndex
CREATE INDEX "mover_service_areas_region_district_idx" ON "mover_service_areas"("region", "district");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_type_createdAt_idx" ON "notifications"("type", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_moverId_rating_idx" ON "reviews"("moverId", "rating");

-- CreateIndex
CREATE INDEX "user_addresses_userId_role_idx" ON "user_addresses"("userId", "role");
