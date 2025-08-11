/*
  Warnings:

  - You are about to drop the column `content` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `messageEn` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messageKo` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messageZh` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "content",
DROP COLUMN "title",
ADD COLUMN     "messageEn" TEXT NOT NULL,
ADD COLUMN     "messageKo" TEXT NOT NULL,
ADD COLUMN     "messageZh" TEXT NOT NULL;
