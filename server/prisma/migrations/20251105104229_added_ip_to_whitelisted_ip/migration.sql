/*
  Warnings:

  - Added the required column `ip` to the `WhiteListedIP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WhiteListedIP" ADD COLUMN     "ip" TEXT NOT NULL;
