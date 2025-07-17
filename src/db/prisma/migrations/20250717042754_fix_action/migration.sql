/*
  Warnings:

  - The values [DESIGNATED_ESTIMATE_REQUESTED] on the enum `ActionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [DESIGNATED_ESTIMATE_REQUEST,PAYMENT_CONFIRMED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActionType_new" AS ENUM ('QUOTE_CREATE', 'QUOTE_REJECTED', 'ESTIMATE_SUBMITTED', 'ESTIMATE_ACCEPTED', 'ESTIMATE_REJECTED', 'DESIGNATED_QUOTE_REQUESTED', 'DESIGNATED_ESTIMATE_SUBMITTED', 'MOVING_COMPLETED', 'REVIEW_SUBMITTED', 'MOVING_DAY_TOMORROW', 'MOVING_DAY_TODAY');
ALTER TABLE "actions" ALTER COLUMN "type" TYPE "ActionType_new" USING ("type"::text::"ActionType_new");
ALTER TYPE "ActionType" RENAME TO "ActionType_old";
ALTER TYPE "ActionType_new" RENAME TO "ActionType";
DROP TYPE "ActionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('NEW_ESTIMATE', 'ESTIMATE_CONFIRMED', 'MOVING_DAY', 'NEW_QUOTE', 'REVIEW_REQUEST', 'ESTIMATE_REJECTED', 'DESIGNATED_QUOTE_REQUESTED', 'ESTIMATE_SUBMITTED');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;
