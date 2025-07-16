-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActionType" ADD VALUE 'MOVING_DAY_TOMORROW';
ALTER TYPE "ActionType" ADD VALUE 'MOVING_DAY_TODAY';

-- AlterEnum
ALTER TYPE "EstimateStatus" ADD VALUE 'MOVER_REJECTED';

-- AlterTable
ALTER TABLE "estimates" ALTER COLUMN "price" SET DEFAULT 0;
