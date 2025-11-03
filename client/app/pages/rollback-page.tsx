import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DownloadIcon,
  RotateCcw,
  Calendar,
  Database,
  FileArchive,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
} from "lucide-react";
import { useParams } from "react-router";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { useTRPC } from "~/lib/trpc.config";
import { cn } from "~/lib/utils";
import { useState, useCallback, useMemo } from "react";
import type { Route } from "./+types/rollback-page";

interface Backup {
  id: string;
  dbName: string;
  createdAt: string;
  size?: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Database Rollback | DataBridge" },
    { name: "description", content: "Manage your database project" },
  ];
}

const RollbackPage = () => {
  const { project_id } = useParams();
  const trpc = useTRPC();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Optimized query with better caching
  const {
    data: backups,
    isPending: loadingBackups,
    refetch: refetchBackups,
  } = useQuery(
    trpc.projectRoutes.getBackups.queryOptions({
      projectId: project_id as string,
    })
  );

  // Optimized mutation with better error handling
  const downloadBackup = useMutation(
    trpc.projectRoutes.downloadBackup.mutationOptions({
      onSuccess: (result) => {
        try {
          const binaryString = atob(result.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const blob = new Blob([bytes], { type: result.contentType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast.success("Backup downloaded successfully");
        } catch (error) {
          toast.error("Failed to download backup file");
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to download backup");
      },
    })
  );

  // Memoized backup processing for better performance
  const processedBackups = useMemo(() => {
    if (!backups?.data) return [];

    return backups.data.map((backup: Backup) => ({
      ...backup,
      formattedDate: new Date(backup.createdAt).toLocaleString(),
      relativeTime: getRelativeTime(backup.createdAt),
      sizeDisplay: backup.size || "Unknown",
    }));
  }, [backups?.data]);

  // Optimized callbacks
  const handleDownload = useCallback(
    (backupId: string, dbName: string) => {
      toast.loading(`Downloading backup for ${dbName}...`);
      downloadBackup.mutateAsync({
        projectId: project_id as string,
        backupId: backupId,
      });
    },
    [downloadBackup, project_id]
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetchBackups();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [refetchBackups]);

  // Helper function for relative time
  function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  // Loading state
  if (loadingBackups) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent to-secondary">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 bg-card/80 backdrop-blur-sm border-b border-border/50 px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-32 h-6" />
          </div>
        </header>
        <div className="p-6 space-y-6">
          <Skeleton className="w-full h-20" />
          <Skeleton className="w-full h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-secondary">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 bg-card/80 backdrop-blur-sm border-b border-border/50 px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Database Backups
            </h1>
            <p className="text-xs text-muted-foreground">
              Restore your databases from previous backups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Info Card */}
        <Card className="border-chart-1/20 bg-chart-1/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-chart-1/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-chart-1" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Automated Backup System
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your databases are automatically backed up weekly. Download
                  backups to restore data locally.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backups Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="w-5 h-5" />
              Available Backups
            </CardTitle>
            <CardDescription>
              {processedBackups.length > 0
                ? `${processedBackups.length} backup${
                    processedBackups.length !== 1 ? "s" : ""
                  } available`
                : "No backups found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processedBackups.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          Database
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Created Date
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Age
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedBackups.map((backup: any, index) => (
                      <TableRow
                        key={backup.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Database className="w-4 h-4 text-primary" />
                            </div>
                            <span>{backup.dbName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {backup.formattedDate}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {backup.id.slice(0, 8)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {backup.relativeTime}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownload(backup.id, backup.dbName)
                            }
                            disabled={downloadBackup.isPending}
                            className="gap-2"
                          >
                            {downloadBackup.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <DownloadIcon className="w-4 h-4" />
                            )}
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileArchive className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Backups Available
                </h3>
                <p className="text-muted-foreground mb-4">
                  Backups will appear here once they are created automatically.
                </p>
                <Badge variant="outline" className="text-xs">
                  Weekly backup schedule is active
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup Schedule Info */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h4 className="font-semibold text-foreground mb-2">
                Backup Schedule
              </h4>
              <p className="text-sm text-muted-foreground">
                Automated backups run on 7 days interval. Backups are retained
                for 30 days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RollbackPage;
