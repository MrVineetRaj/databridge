/*
  Warnings:

  - Changed the type of `projectDescription` on the `Project` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "projectDescription",
ADD COLUMN     "projectDescription" TEXT NOT NULL;
