-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refreshToken" TEXT,
ALTER COLUMN "currentArea" DROP NOT NULL;
