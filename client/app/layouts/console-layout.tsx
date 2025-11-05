import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CogIcon,
  GitBranchIcon,
  HomeIcon,
  LayoutDashboard,
  LogOutIcon,
  TableIcon,
  Database,
  Settings,
  ArrowLeft,
  User,
  Bell,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { ProjectForm } from "~/components/projects/project-form";
import { SettingDialog } from "~/components/shared/settings";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
} from "~/components/ui/sidebar";
import { useIsMobile } from "~/hooks/use-mobile";
import { useTRPC } from "~/lib/trpc.config";
import type { IProject } from "~/lib/types";
import { cn } from "~/lib/utils";
import { useUserStore } from "~/store/user-store";

const ConsoleLayout = () => {
  const isMobile = useIsMobile();
  const { user, logout, isAuthenticated, error, loadingUser } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { project_id } = useParams();

  const [projectDetails, setProjectDetails] = useState<IProject | null>();

  const [reloadReq, setReloadReq] = useState<boolean>(false);

  const { data: projectDetailsFromDb } = useQuery(
    trpc.projectRoutes.getProjectById.queryOptions({
      projectId: project_id as string,
    })
  );

  useEffect(() => {
    console.log({ loadingUser, isAuthenticated, error });
    if (!loadingUser && !isAuthenticated && error) {
      navigate("/");
    }
  }, [isAuthenticated, error, loadingUser]);

  useEffect(() => {
    if (reloadReq) {
      queryClient.invalidateQueries(
        trpc.projectRoutes.getProjects.queryOptions()
      );
      setReloadReq(false);
    }
  }, [reloadReq]);

  useEffect(() => {
    if (projectDetailsFromDb?.data) {
      setProjectDetails(projectDetailsFromDb?.data?.project);
    }
  }, [projectDetailsFromDb]);

  const SIDEBAR_LINKS = [
    {
      title: "Dashboard",
      link: `/console/${project_id}`,
      icon: LayoutDashboard,
      description: "Project overview",
    },
    {
      title: "Tables",
      link: `/console/${project_id}/table`,
      icon: TableIcon,
      description: "Manage data",
    },
    {
      title: "Rollback",
      link: `/console/${project_id}/rollback`,
      icon: GitBranchIcon,
      description: "Restore backups",
    },
  ];

  const QUICK_ACTIONS: {
    title: string;
    link: string;
    icon: typeof GitBranchIcon;
    description: string;
  }[] = [];

  const isTableDisabled = projectDetails?.inactiveDatabases.includes(
    projectDetails.dbName as string
  );

  return (
    <div className="max-w-screen flex min-h-screen bg-linear-to-br from-background via-accent to-secondary">
      <SidebarProvider className={cn(isMobile ? "w-0" : "w-80")}>
        <Sidebar className=" backdrop-blur-sm border-r border-border/50 shadow-xl w-80">
          {/* Header */}
          <SidebarHeader className="px-6 py-4 border-b border-border/50 bg-white">
            <div className="flex items-center justify-between">
              <Link to={"/console"} className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Database className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold bg-linear-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                  DataBridge
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/console")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-4 py-6  bg-white ">
            {/* Project Info Card */}
            {projectDetails && (
              <div className="mb-6 p-3 bg-linear-to-r from-primary/10 to-chart-1/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                      <Database className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-card-foreground truncate max-w-32">
                        {projectDetails.projectTitle}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {projectDetails.id.slice(0, 6)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isTableDisabled ? "bg-destructive" : "bg-chart-2"
                      } animate-pulse`}
                    ></div>
                    <span
                      className={`text-xs font-medium ${
                        isTableDisabled ? "text-destructive" : "text-chart-2"
                      }`}
                    >
                      {isTableDisabled ? "Paused" : "Active"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* Navigation Links */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-3 px-2">
                Navigation
              </SidebarGroupLabel>
              <div className="space-y-2">
                {SIDEBAR_LINKS?.map(
                  ({ title, link, icon: Icon, description }) => {
                    const isActive = location.pathname === link;
                    const isDisabled =
                      link.includes("table") && isTableDisabled;

                    return (
                      <Link
                        to={isDisabled ? "#" : link}
                        key={link}
                        className={cn(
                          "group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                          "hover:bg-accent/50 hover:shadow-sm",
                          isActive &&
                            "bg-primary text-primary-foreground shadow-lg",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                            isActive
                              ? "bg-primary-foreground/20"
                              : "bg-muted group-hover:bg-primary/10"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-4 h-4 transition-colors",
                              isActive
                                ? "text-primary-foreground"
                                : "text-muted-foreground group-hover:text-primary"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              "font-medium text-sm",
                              isActive
                                ? "text-primary-foreground"
                                : "text-foreground"
                            )}
                          >
                            {title}
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              isActive
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            )}
                          >
                            {description}
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-1 h-8 bg-primary-foreground/50 rounded-full"></div>
                        )}
                      </Link>
                    );
                  }
                )}
              </div>
            </SidebarGroup>

            {/* Quick Actions */}
            <SidebarGroup className="mt-8 ">
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-3 px-2">
                Quick Actions
              </SidebarGroupLabel>
              <div className="space-y-2">
                <span
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                    "hover:bg-accent/50 hover:shadow-sm"
                  )}
                  onClick={() => {
                    navigate(location.pathname + "?configuration-tab=integrations");
                  }}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                      "bg-muted group-hover:bg-primary/10"
                    )}
                  >
                    <CogIcon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        "text-muted-foreground group-hover:text-primary"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("font-medium text-sm text-foreground")}>
                      {"Settings"}
                    </div>{" "}
                    <div className={cn("text-xs", "text-muted-foreground")}>
                      Project Settings
                    </div>
                  </div>
                </span>
                {QUICK_ACTIONS?.map(
                  ({ title, link, icon: Icon, description }) => {
                    const isActive = location.pathname === link;

                    return (
                      <Link
                        to={link}
                        key={link}
                        className={cn(
                          "group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                          "hover:bg-accent/50 hover:shadow-sm",
                          isActive &&
                            "bg-primary text-primary-foreground shadow-lg"
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                            isActive
                              ? "bg-primary-foreground/20"
                              : "bg-muted group-hover:bg-primary/10"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-4 h-4 transition-colors",
                              isActive
                                ? "text-primary-foreground"
                                : "text-muted-foreground group-hover:text-primary"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              "font-medium text-sm",
                              isActive
                                ? "text-primary-foreground"
                                : "text-foreground"
                            )}
                          >
                            {title}
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              isActive
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            )}
                          >
                            {description}
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-1 h-8 bg-primary-foreground/50 rounded-full"></div>
                        )}
                      </Link>
                    );
                  }
                )}
              </div>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="p-4 border-t border-border/50  bg-white">
            <Card className="bg-sidebar/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user?.avatar}
                      alt="User avatar"
                      className="w-10 h-10 rounded-full border-2 border-border/50"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-chart-2 rounded-full border-2 border-card"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-card-foreground truncate">
                      {user?.name || "Developer"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logout()}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOutIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      <SettingDialog />
    </div>
  );
};

export default ConsoleLayout;
