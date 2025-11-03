-- CreateTable
CREATE TABLE "DatabaseBackups" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "dbName" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatabaseBackups_pkey" PRIMARY KEY ("id")
);
