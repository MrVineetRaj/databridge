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
        dbDomain: "localhost:5432",
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
    const dbNames = await pgService.getDatabasesForUser({
      platformUsername: project?.dbUser!,
    });

    const result = {
      project,
      detail: { dbCnt: dbNames.length },
    };
    return new ApiResponse<typeof result>({
      message: "Project fetched successfully",
      statusCode: 200,
      data: result,
    });
  }

  async getDatabasesInsideProject(
    input: { projectId: string },
    ctx: AuthedContext
  ) {
    const { user } = ctx;

    const project = await db.project.findUnique({
      where: {
        userId: user.id,
        id: input.projectId,
      },
    });

    const pgService = new PostgresServices(adminPool);
    const dbNames = await pgService.getDatabasesForUser({
      platformUsername: project?.dbUser!,
    });

    const result = dbNames;
    return new ApiResponse<typeof result>({
      message: "Project fetched successfully",
      statusCode: 200,
      data: result,
    });
  }

  async getTablesOfADatabase(
    input: { projectId: string; dbName: string },
    ctx: AuthedContext
  ) {
    const { user } = ctx;

    const project = await db.project.findUnique({
      where: {
        userId: user.id,
        id: input.projectId,
      },
    });

    const pgService = new PostgresServices(adminPool);
    const tableNames = await pgService.getTablesForDatabase({
      dbUserName: project?.dbUser!,
      dbName: input.dbName,
      dbPassword: project?.dbPassword!,
    });

    const result = tableNames;

    return new ApiResponse<typeof result>({
      message: "Project fetched successfully",
      statusCode: 200,
      data: result,
    });
  }

  async deleteItemFromDatabase(
    input: {
      projectId: string;
      dbName: string;
      primaryKey: string;
      primaryKeyValue: string;
      tableName: string;
    },
    ctx: AuthedContext
  ) {
    const { projectId, dbName, primaryKey, primaryKeyValue, tableName } = input;

    const projectDetails = await db.project.findUnique({
      where: {
        id: projectId,
      },
    });

    const pgService = new PostgresServices(adminPool);
    const result = await pgService.deleteItemFromDatabase({
      dbName,
      dbPassword: projectDetails?.dbPassword!,
      dbUserName: projectDetails?.dbUser!,
      primaryKey,
      primaryKeyValue,
      tableName,
    });
    return new ApiResponse<typeof result>({
      message: "Project fetched successfully",
      statusCode: 200,
      data: result,
    });
  }

  async getTableContent(
    input: {
      dbName: string;
      tableName: string;
      page?: number;
      limit?: number;
      projectId: string;
    },
    ctx: AuthedContext
  ) {
    const { dbName, tableName, projectId } = input;

    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
    });
    if (tableName.includes("XXXXX")) {
      const result = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };
      return new ApiResponse<typeof result>({
        message: "Project fetched successfully",
        statusCode: 200,
        data: result,
      });
    }
    const pgService = new PostgresServices(adminPool);
    const tableContent = await pgService.getTableContentPaginated({
      dbName,
      tableName,
      page: input?.page ?? 1,
      limit: input?.limit ?? 20,
      dbPassword: project?.dbPassword!,
      dbUserName: project?.dbUser!,
    });

    const result = tableContent;
    return new ApiResponse<typeof result>({
      message: "Project fetched successfully",
      statusCode: 200,
      data: result,
    });
  }
}
