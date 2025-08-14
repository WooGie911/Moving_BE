-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "rating" SET DEFAULT 0,
ALTER COLUMN "content" SET DEFAULT '';
