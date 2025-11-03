import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CopyIcon,
  EyeClosedIcon,
  EyeIcon,
  TableIcon,
  Database,
  Activity,
  HardDrive,
  Shield,
  Play,
  AlertTriangle,
  TrendingUp,
  Wifi,
  Lock,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Skeleton } from "~/components/ui/skeleton";
import { useTRPC } from "~/lib/trpc.config";
import { useUserStore } from "~/store/user-store";
import type { Route } from "../+types/root";
import type { IProject } from "~/lib/types";
import { Label } from "~/components/ui/label";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Project Dashboard | DataBridge" },
    { name: "description", content: "Manage your database project" },
  ];
}

const ConsolePage = () => {
  const { project_id } = useParams();
  const { user } = useUserStore();
  const trpc = useTRPC();

  const [showingCred, setShowingCred] = useState<boolean>(false);

  const resumeDatabases = useMutation(
    trpc.dbInstanceRoutes.resumeDatabases.mutationOptions({
      onSuccess: (res) => {
        toast.success(res.message, {
          id: "resume-db-state",
          duration: 3000,
        });
      },
      onError: (err) => {
        toast.error(err.message, {
          id: "resume-db-state",
          duration: 3000,
        });
      },
    })
  );

  const [projectDetails, setProjectDetails] = useState<IProject | null>();

  const { data: projectDetailsFromDb } = useQuery(
    trpc.projectRoutes.getProjectById.queryOptions({
      projectId: project_id as string,
    })
  );

  useEffect(() => {
    if (projectDetailsFromDb?.data) {
      setProjectDetails(projectDetailsFromDb?.data?.project);
    }
  }, [projectDetailsFromDb]);

  if (!projectDetailsFromDb?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent to-secondary">
        <header className="flex items-center h-16 bg-card/80 backdrop-blur-sm border-b border-border/50 px-6">
          <Skeleton className="w-48 h-6" />
        </header>
        <div className="p-6 space-y-6">
          <Skeleton className="w-full h-32" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  const isActive =
    !projectDetailsFromDb.data.project?.inactiveDatabases.includes(
      projectDetails?.dbName as string
    );

  // Mock data for demonstration
  const storageUsed = 65; // percentage
  const monthlyQueries = 12450;
  const avgResponseTime = 23; // ms

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-secondary">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 bg-card/80 backdrop-blur-sm border-b border-border/50 px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Database className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {projectDetails?.projectTitle}
            </h1>
            <p className="text-xs text-muted-foreground">
              ID: {projectDetails?.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? "Active" : "Paused"}
        </Badge>
      </header>

      <div className="p-6 space-y-6">
        {/* Database Status Alert */}
        {projectDetailsFromDb.data.project?.inactiveDatabases &&
          projectDetailsFromDb.data.project?.inactiveDatabases.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Database Paused
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Database{" "}
                        <strong>
                          {projectDetailsFromDb.data.project?.inactiveDatabases?.join(
                            ", "
                          )}
                        </strong>{" "}
                        is currently paused
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      toast.loading("Resuming database", {
                        id: "resume-db-state",
                      });
                      resumeDatabases.mutateAsync({
                        projectId: project_id as string,
                      });
                    }}
                    className="bg-chart-2 hover:bg-chart-2/90"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume Database
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Connection Details */}
        {isActive && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Connection Details
              </CardTitle>
              <CardDescription>
                Use these credentials to connect your applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm">
                  postgres://{showingCred ? projectDetails?.dbUser : "********"}
                  :{showingCred ? projectDetails?.dbPassword : "********"}@
                  {projectDetails?.dbDomain}/{projectDetails?.dbName}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowingCred(!showingCred)}
                >
                  {showingCred ? (
                    <EyeIcon className="w-4 h-4" />
                  ) : (
                    <EyeClosedIcon className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `postgres://${projectDetails?.dbUser}:${projectDetails?.dbPassword}@${projectDetails?.dbDomain}/${projectDetails?.dbName}`
                    );
                    toast.success("Copied to clipboard!");
                  }}
                >
                  <CopyIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Storage Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Storage Usage
              </CardTitle>
              <CardDescription>
                Monitor your database storage consumption
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Used Storage</span>
                  <span className="font-medium">{storageUsed}% of 1GB</span>
                </div>
                <Progress value={storageUsed} className="h-3" />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">650MB</p>
                  <p className="text-xs text-muted-foreground">Used</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-2">350MB</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-4">
                    {projectDetailsFromDb?.data?.detail.dbCnt}
                  </p>
                  <p className="text-xs text-muted-foreground">Databases</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Access Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Network Access
              </CardTitle>
              <CardDescription>Manage database access rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-chart-2" />
                    <span className="text-sm font-medium">Public Access</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-chart-2/10 text-chart-2"
                  >
                    Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">IP Whitelist</span>
                  </div>
                  <Badge variant="outline">0 Rules</Badge>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Configure Access Rules
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Database Analytics
            </CardTitle>
            <CardDescription>
              Performance metrics and usage statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Stats Cards */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Monthly Queries</p>
                <p className="text-2xl font-bold text-foreground">
                  {monthlyQueries.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-chart-2" />
                  <span className="text-chart-2">+12% from last month</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Avg Response Time
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {avgResponseTime}ms
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-chart-3" />
                  <span className="text-chart-3">-5% improvement</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Active Connections
                </p>
                <p className="text-2xl font-bold text-foreground">8</p>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 bg-chart-2 rounded-full animate-pulse"></div>
                  <span className="text-muted-foreground">Live</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold text-foreground">99.9%</p>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                  <span className="text-muted-foreground">30 days</span>
                </div>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="mt-6 h-48 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <div className="text-center">
                <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Analytics Chart</p>
                <p className="text-xs text-muted-foreground">
                  Query performance over time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConsolePage;
