/*
  Warnings:

  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `userType` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_isActive_idx";

-- DropIndex
DROP INDEX "users_userType_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isActive",
DROP COLUMN "userType",
ADD COLUMN     "currentRole" "UserType" NOT NULL DEFAULT 'CUSTOMER',
ADD COLUMN     "hasProfile" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "UserType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_role_idx" ON "user_roles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "user_roles"("userId", "role");

-- CreateIndex
CREATE INDEX "users_currentRole_idx" ON "users"("currentRole");

-- CreateIndex
CREATE INDEX "users_hasProfile_idx" ON "users"("hasProfile");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
