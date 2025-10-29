-- CreateTable
CREATE TABLE "DiscordIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscordIntegration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DiscordIntegration" ADD CONSTRAINT "DiscordIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
