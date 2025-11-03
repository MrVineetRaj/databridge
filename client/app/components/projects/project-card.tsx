import { DatabaseIcon } from "lucide-react";
import React from "react";
import { Badge } from "../ui/badge";

interface Props {
  projectTitle: string;
  projectDescription: string;
  id: string;
  inactiveDatabases: string[];
}
export const ProjectCard = ({
  projectDescription,
  projectTitle,
  id,
  inactiveDatabases,
}: Props) => {
  return (
    <div className="min-w-84 bg-sidebar min-h-48 h-48 flex flex-col items-start p-4 rounded-md hover:shadow-lg transition-all duration-300 border cursor-pointer relative">
      <Badge className="rounded-none absolute top-1 right-1" variant={inactiveDatabases.length > 0 ? "destructive" : "default"}>
        {inactiveDatabases.length > 0 ? "Paused" : "Active"}
      </Badge>
      <h2 className="text-lg font-bold">{projectTitle}</h2>
      <small className="line-clamp-3 h-full">{projectDescription}</small>
      <span className="w-full flex items-center justify-end">
        <DatabaseIcon className="size-6" />
      </span>
    </div>
  );
};
