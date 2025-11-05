-- CreateTable
CREATE TABLE "WhiteListedIP" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "dbName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhiteListedIP_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WhiteListedIP" ADD CONSTRAINT "WhiteListedIP_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
