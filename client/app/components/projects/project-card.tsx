import { DatabaseIcon, Calendar, Zap, Pause } from "lucide-react";
import React from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";

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
  const isActive = inactiveDatabases.length === 0;
  
  return (
    <Card className="group relative overflow-hidden bg-card/90 backdrop-blur-sm border-border hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 cursor-pointer min-h-[200px]">
      {/* Background Gradient Effect */}
      <div className={`absolute inset-0 ${isActive ? 'bg-gradient-to-br from-chart-1/5 to-chart-2/5' : 'bg-gradient-to-br from-chart-5/5 to-muted/10'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge 
          variant={isActive ? "default" : "destructive"}
          className={`${isActive ? 'bg-chart-2 hover:bg-chart-2/90' : 'bg-destructive hover:bg-destructive/90'} text-white border-0 shadow-lg`}
        >
          {isActive ? (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Active
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Pause className="w-3 h-3" />
              Paused
            </div>
          )}
        </Badge>
      </div>

      <CardHeader className="pb-3 relative">
        {/* Project Icon */}
        <div className={`w-12 h-12 ${isActive ? 'bg-chart-1' : 'bg-chart-5'} rounded-xl flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform duration-300`}>
          <DatabaseIcon className="w-6 h-6 text-white" />
        </div>

        {/* Project Title */}
        <h3 className="text-xl font-bold text-card-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
          {projectTitle}
        </h3>
      </CardHeader>

      <CardContent className="relative flex-1 flex flex-col justify-between">
        {/* Project Description */}
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
          {projectDescription || "No description provided"}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Project ID: {id.slice(0, 8)}...</span>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-chart-2' : 'bg-destructive'} animate-pulse`}></div>
            <span className="text-xs text-muted-foreground">
              {isActive ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>

        {/* Inactive Databases Count */}
        {inactiveDatabases.length > 0 && (
          <div className="mt-2 text-xs text-destructive">
            {inactiveDatabases.length} database{inactiveDatabases.length !== 1 ? 's' : ''} paused
          </div>
        )}
      </CardContent>

      {/* Hover Effect Border */}
      <div className={`absolute inset-0 rounded-lg border-2 ${isActive ? 'border-chart-1/0 group-hover:border-chart-1/50' : 'border-chart-5/0 group-hover:border-chart-5/50'} transition-all duration-300 pointer-events-none`}></div>
    </Card>
  );
};