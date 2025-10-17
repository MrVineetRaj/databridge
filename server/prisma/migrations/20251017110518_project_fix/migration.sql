/*
  Warnings:

  - You are about to drop the column `dbHost` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `dbPort` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "dbHost",
DROP COLUMN "dbPort",
ADD COLUMN     "dbDomain" TEXT,
ADD COLUMN     "dbUser" TEXT;
