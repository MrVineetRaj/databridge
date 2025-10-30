import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CogIcon, GitBranchIcon, HomeIcon, LogOutIcon } from "lucide-react";
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
import { cn } from "~/lib/utils";
import { useUserStore } from "~/store/user-store";

const ConsoleLayout = () => {
  const isMobile = useIsMobile();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, error, loadingUser } = useUserStore();

  const [reloadReq, setReloadReq] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const { data: projectDetails } = useQuery(
    trpc.projectRoutes.getProjects.queryOptions()
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
  const SIDEBAR_LINKS = [
    {
      title: "Console",
      link: "/console",
      icon: HomeIcon,
    },
  ];

  return (
    <div className="max-w-screen flex min-h-screen">
      <SidebarProvider className={cn(isMobile ? "w-0" : "w-64")}>
        <Sidebar>
          <SidebarHeader className="h-14 border-b flex flex-row items-center">
            <h2 className="text-lg font-bold">Databridge</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
              {SIDEBAR_LINKS?.map(({ title, link, icon: Icon }) => {
                return (
                  <Link
                    to={link}
                    key={link}
                    className={cn(
                      "w-full bg-background p-4 rounded-md outline btn",
                      location.pathname === link
                        ? "bg-primary"
                        : "bg-background"
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
            <SidebarGroup className="space-y-4">
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <ProjectForm setReloadReq={setReloadReq} />
              {projectDetails?.data &&
                projectDetails?.data?.length > 0 &&
                projectDetails?.data?.map(({ projectTitle: title, id }) => {
                  return (
                    <Link
                      key={id}
                      to={`/console/${id}`}
                      className={cn(
                        "w-full bg-background p-4 rounded-md outline btn",
                        location.pathname.includes(`/console/${id}`)
                          ? "bg-primary/50 text-white"
                          : "bg-background"
                      )}
                    >
                      <span className="w-full flex flex-row p-0 items-center gap-2">
                        <Label>{title}</Label>
                      </span>
                    </Link>
                  );
                })}

              {!projectDetails?.data ||
                (projectDetails?.data?.length <= 0 && (
                  <span className="text-center mt-4 italic text-muted-foreground text-sm">
                    No Projects yet
                  </span>
                ))}
            </SidebarGroup>
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
