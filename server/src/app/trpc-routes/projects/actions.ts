import { Request, Response } from "express";
import { User } from "../../../generated/prisma";
import { ApiResponse } from "../../lib/api.helper";
import { db } from "../../lib/db";
import { AuthedContext, Context } from "../../trpc";
import { adminPool, PostgresServices } from "../../services/pg";
import { envConf } from "../../lib/envConf";

export class Actions {
  async newProject(
    input: { projectTitle: string; projectDescription: string },
    ctx: AuthedContext
  ) {
    const { projectDescription, projectTitle } = input;
    const { user } = ctx;

    const pgService = new PostgresServices(adminPool);

    const dbInfo = await pgService.createProjectInfrastructure({
      username: user.id,
      projectTitle: projectTitle,
    });

    // Now create the project record in your main application database
    const newProject = await db.project.create({
      data: {
        projectTitle,
        projectDescription,
        userId: user.id,
        dbUser: dbInfo.dbUsername, // Store the generated username
        dbPassword: dbInfo.dbPassword,
        dbName: dbInfo.dbName,
      },
    });

    return new ApiResponse({
      message: "Project created successfully",
      statusCode: 201, // 201 Created is more appropriate
      data: newProject,
    });
  }

  async getProjects(input: undefined, ctx: AuthedContext) {
    const { user } = ctx;

    const projects = await db.project.findMany({
      where: {
        userId: user.id,
      },
    });

    return new ApiResponse<typeof projects>({
      message: "Project created successfully",
      statusCode: 200,
      data: projects,
    });
  }

  async getProjectById(input: { projectId: string }, ctx: AuthedContext) {
    const { user } = ctx;

    const project = await db.project.findUnique({
      where: {
        userId: user.id,
        id: input.projectId,
      },
    });

    const pgService = new PostgresServices(adminPool);
    const dbCnt = await pgService.getDatabasesForUser({
      platformUsername: project?.dbUser!,
    });
    console.log(dbCnt);

    const result = {
      project,
      detail: { dbCnt: dbCnt.length },
    };
    return new ApiResponse<typeof result>({
      message: "Project fetched successfully",
      statusCode: 200,
      data: result,
    });
  }
}
