import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, Database, Folder, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ProjectCard } from "~/components/projects/project-card";
import { ProjectForm } from "~/components/projects/project-form";
import { Navbar } from "~/components/shared/nav-bar";
import { Label } from "~/components/ui/label";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useTRPC } from "~/lib/trpc.config";
import { cn } from "~/lib/utils";
import { useUserStore } from "~/store/user-store";
import type { Route } from "./+types/console";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Console | DataBridge" },
    {
      name: "description",
      content: "Create, manage, and backup your databases with ease.",
    },
  ];
}

const ConsolePage = () => {
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

  const projectCount = projectDetails?.data?.length || 0;
  const activeProjects =
    projectDetails?.data?.filter((p) => p.inactiveDatabases.length == 0)
      ?.length || 0;
  const inactiveProjects = projectDetails?.data?.reduce(
    (acc, it) => acc + it.inactiveDatabases.length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-secondary">
      <Navbar />

      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-chart-1/20 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-chart-3/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back, {user?.name || "Developer"}
                </h1>
                <p className="text-muted-foreground">
                  Manage your database projects from here
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            {projectCount > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-card/80 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">
                          {projectCount}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Total Projects
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-chart-1 rounded-lg flex items-center justify-center">
                        <Folder className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">
                          {activeProjects}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Active Databases
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-chart-2 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">
                          {inactiveProjects}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Paused Databases
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-chart-5 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">
                  Your Projects
                </h2>
                {projectCount > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {projectCount} project{projectCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>{" "}
              {/* Create New Project Card */}
              <div className="mb-2">
                <ProjectForm setReloadReq={setReloadReq} />
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid gap-6">
              {/* Project Cards */}
              {projectDetails?.data && projectDetails?.data?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projectDetails?.data?.map(
                    ({
                      projectTitle: title,
                      id,
                      projectDescription,
                      inactiveDatabases,
                    }) => (
                      <Link key={id} to={`/console/${id}`} className="group">
                        <div className="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                          <ProjectCard
                            id={id}
                            projectTitle={title}
                            projectDescription={projectDescription}
                            inactiveDatabases={inactiveDatabases}
                          />
                        </div>
                      </Link>
                    )
                  )}
                </div>
              ) : (
                /* Empty State */
                <Card className="bg-card/80 backdrop-blur-sm border-border border-dashed">
                  <CardContent className="pt-16 pb-16 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">
                      No projects yet
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Create your first database project to get started with
                      DataBridge. It only takes a few seconds!
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <PlusIcon className="w-4 h-4" />
                      <span>Click "Create New Project" above to begin</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsolePage;
