import { useQuery } from "@tanstack/react-query";
import { CopyIcon, EyeClosedIcon, EyeIcon, TableIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useTRPC } from "~/lib/trpc.config";
import { useUserStore } from "~/store/user-store";
import type { Route } from "../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}
const ConsolePage = () => {
  const { project_id } = useParams();
  const { user } = useUserStore();
  const trpc = useTRPC();

  const [showingCred, setShowingCred] = useState<boolean>(false);
  const quickLinks = [
    {
      title: "Tables",
      link: "/console/project_id/table",
      icon: TableIcon,
    },
  ];

  const [projectDetails, setProjectDetails] = useState<{
    projectTitle: string;
    projectDescription: string;
    id: string;
    updatedAt: string;
    createdAt: string;
    userId: string;
    dbUser: string | null;
    dbName: string | null;
    dbDomain: string | null;
    dbPassword: string | null;
    dbSchema: string | null;
  } | null>();
  const [cardDetails, setCardDetails] = useState<{
    [key: string]: {
      title: string;
      description: string;
      val: string;
    };
  }>({
    databases: {
      title: "Databases",
      description: "It is about number of databases in this project instances ",
      val: "2",
    },
    storage: {
      title: "Storage",
      description:
        "It is about how much storage is being used by databases in this project instances ",
      val: "---",
    },
  });

  const { data: projectDetailsFromDb } = useQuery(
    trpc.projectRoutes.getProjectById.queryOptions({
      projectId: project_id as string,
    })
  );
  useEffect(() => {
    if (projectDetailsFromDb?.data) {
      setProjectDetails(projectDetailsFromDb?.data?.project);
      setCardDetails({
        ...cardDetails,
        databases: {
          ...cardDetails["databases"],
          val: `${projectDetailsFromDb?.data?.detail.dbCnt}`,
        },
      });
    }
  }, [projectDetailsFromDb]);

  if (!projectDetailsFromDb?.data) {
    return (
      <header className="flex items-center h-14 bg-sidebar border-b w-full p-4">
        <Skeleton className="w-84 h-9 rounded-none" />
      </header>
    );
  }

  return (
    <>
      <header className="flex items-center h-14 bg-sidebar border-b w-full p-4">
        <p className="font-semibold">{projectDetails?.projectTitle}</p>
      </header>
      <div className="p-4 space-y-8">
        {" "}
        <div className="bg-sidebar w-full rounded-md p-4 shadow-md border space-y-2">
          <h2 className="text-lg font-semibold">Quick Links</h2>
          <div className="">
            {quickLinks?.map(({ title, link, icon: Icon }) => {
              return (
                <Link to={link.replace("project_id", project_id as string)}>
                  <Button>
                    <Icon /> {title}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="bg-sidebar w-full rounded-md p-4 shadow-md border space-y-2">
          <h2 className="text-lg font-semibold">Connection String</h2>
          <span className="flex items-center gap-2">
            <pre className="p-2 bg-background border rounded-md w-full text-sm text-muted-foreground text-wrap">{`postgres://${
              showingCred ? projectDetails?.dbUser : "<********>"
            }:${showingCred ? projectDetails?.dbPassword : "<********>"}@${
              projectDetails?.dbDomain
            }/${projectDetails?.dbName}`}</pre>
            <Button
              variant={"outline"}
              onClick={() => {
                setShowingCred((prev) => !prev);
              }}
            >
              {!showingCred ? (
                <EyeClosedIcon className="size-4" />
              ) : (
                <EyeIcon />
              )}
            </Button>
            <Button
              variant={"outline"}
              onClick={() => {
                toast.success("Copied to clipboard!", { duration: 2000 });
                navigator.clipboard.writeText(
                  `postgres://${projectDetails?.dbUser}:${projectDetails?.dbPassword}@${projectDetails?.dbDomain}/${projectDetails?.dbName}?`
                );
              }}
            >
              <CopyIcon />
            </Button>
          </span>
        </div>
        <div
          className="flex flex-row overflow-x-auto gap-4"
          style={{
            scrollbarWidth: "thin",
          }}
        >
          {Object.values(cardDetails)?.map(
            ({ title, description, val }, idx) => {
              return (
                <div
                  className="bg-chart-4/70 max-w-84 min-w-84 flex-col p-4 rounded-md shadow-lg relative"
                  key={idx}
                >
                  <h2 className="font-bold text-xl">{title}</h2>
                  <p className="text-muted-foreground text-sm italic">
                    {description}
                  </p>
                  <h1 className="text-3xl font-bold w-full text-right mt-2">
                    {val}
                  </h1>
                  <span className="absolute  size-4 bg-red-300/80 rounded-full top-4 right-4 flex items-center justify-center  animate-pulse">
                    <span className="block size-2 bg-red-500 rounded-full animate-pulse "></span>
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>
    </>
  );
};

export default ConsolePage;
