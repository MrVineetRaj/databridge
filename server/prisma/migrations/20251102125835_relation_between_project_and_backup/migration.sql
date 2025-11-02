-- AddForeignKey
ALTER TABLE "DatabaseBackups" ADD CONSTRAINT "DatabaseBackups_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
