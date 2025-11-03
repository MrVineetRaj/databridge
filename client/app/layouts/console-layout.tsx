import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CogIcon,
  GitBranchIcon,
  HomeIcon,
  LayoutDashboard,
  LogOutIcon,
  TableIcon,
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
import { IntegrationForm } from "~/components/shared/integrations";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
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
    },
    {
      title: "Tables",
      link: `/console/${project_id}/table`,
      icon: TableIcon,
    },
    {
      title: "Rollback",
      link: `/console/${project_id}/rollback`,
      icon: GitBranchIcon,
    },
  ];

  return (
    <div className="max-w-screen flex min-h-screen">
      <SidebarProvider className={cn(isMobile ? "w-0" : "w-64")}>
        <Sidebar>
          <SidebarHeader className="h-14 border-b flex flex-row items-center">
            <Link to={"/console"} className="text-lg font-bold">
              Databridge
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="space-y-4">
              <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
              {SIDEBAR_LINKS?.map(({ title, link, icon: Icon }) => {
                return (
                  <Link
                    to={
                      link.includes("table") &&
                      projectDetails?.inactiveDatabases.includes(
                        projectDetails.dbName as string
                      )
                        ? "#"
                        : link
                    }
                    key={link}
                    className={cn(
                      "w-full bg-background p-4 rounded-md outline btn",
                      location.pathname === link
                        ? "bg-primary text-white"
                        : "bg-background",
                      link.includes("table") &&
                        projectDetails?.inactiveDatabases.includes(
                          projectDetails.dbName as string
                        ) &&
                        "opacity-50"
                    )}
                  >
                    <span className="w-full flex flex-row p-0 items-center gap-2">
                      <Icon className="size-5" />
                      <Label>{title}</Label>
                    </span>
                  </Link>
                );
              })}
            </SidebarGroup>
            <SidebarGroup className="space-y-4"></SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="flex flex-row items-center border bg-white ">
            <span className="w-full flex items-center gap-2">
              <img
                src={user?.avatar}
                alt={"avatar"}
                className="size-10 rounded-full"
              />
              <p>{user?.name}</p>
            </span>
            <span className="flex items-center gap-2">
              <IntegrationForm />
              <Button
                variant="destructive"
                onClick={() => {
                  logout();
                }}
              >
                <LogOutIcon />
              </Button>
            </span>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
      <main className="w-full overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default ConsoleLayout;
