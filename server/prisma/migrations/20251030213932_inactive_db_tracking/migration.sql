-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "inactiveDatabases" TEXT[],
ADD COLUMN     "isActionDone" BOOLEAN NOT NULL DEFAULT false;
