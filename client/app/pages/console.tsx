import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ProjectCard } from "~/components/projects/project-card";
import { ProjectForm } from "~/components/projects/project-form";
import { Navbar } from "~/components/shared/nav-bar";
import { Label } from "~/components/ui/label";
import { useTRPC } from "~/lib/trpc.config";
import { cn } from "~/lib/utils";
import { useUserStore } from "~/store/user-store";

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

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="w-full  p-4 flex flex-wrap gap-4">
        <ProjectForm setReloadReq={setReloadReq} />

        {projectDetails?.data &&
          projectDetails?.data?.length > 0 &&
          projectDetails?.data?.map(
            ({
              projectTitle: title,
              id,
              projectDescription,
              inactiveDatabases,
            }) => {
              return (
                <Link key={id} to={`/console/${id}`}>
                  <ProjectCard
                    id={id}
                    projectTitle={title}
                    projectDescription={projectDescription}
                    inactiveDatabases={inactiveDatabases}
                  />
                </Link>
              );
            }
          )}

        {!projectDetails?.data ||
          (projectDetails?.data?.length <= 0 && (
            <span className="text-center mt-4 italic text-muted-foreground text-sm">
              No Projects yet
            </span>
          ))}
      </div>
    </div>
  );
};

export default ConsolePage;
