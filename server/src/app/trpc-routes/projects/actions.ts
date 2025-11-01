import { Request, Response } from "express";
import { User } from "../../../generated/prisma";
import { ApiResponse } from "../../lib/api.helper";
import { db } from "../../lib/db";
import { AuthedContext, Context } from "../../trpc";
import { adminPool, PostgresServices } from "../../services/pg";
import { envConf } from "../../lib/envConf";
import format from "pg-format";
import { dbInstanceJobQueue } from "../../../server";
import { encryptionServices } from "../../services/encryption";
import logger, { loggerMetadata } from "../../lib/logger";

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
    // // Now create the project record in your main application database

    // const dbInfo = {
    //   dbUsername: "cmhfy7paf0000i0d6zsvlykri_verdict",
    //   dbPassword: "a07afac9efd742db91c011cb",
    //   dbName: "verdict_ebd4333b_db",
    // };

    const encryptedPassword = encryptionServices.encrypt(dbInfo.dbPassword);

    // console.log({dbInfo,encryptedPassword});
    const newProject = await db.project.create({
      data: {
        projectTitle,
        projectDescription,
        userId: user.id,
        dbUser: dbInfo.dbUsername, // Store the generated username
        dbPassword: encryptedPassword,
        dbName: dbInfo.dbName,
        dbDomain: "localhost:5432",
      },
    });

    dbInstanceJobQueue.add(
      "rotate_password",
      {
        projectId: newProject.id,
        userId: user.id,
      },
      {
        delay: 1000 * 60 * 60 * 24 * 30,
      }
    );

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
      select: {
        dbPassword: false,
        projectTitle: true,
        projectDescription: true,
        id: true,
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

    const decryptedRes = encryptionServices.decrypt(project?.dbPassword!);

    if (!decryptedRes.success) {
      logger.error(
        "Invalid encrypted data",
        loggerMetadata.system({
          filePath: __filename,
        })
      );
      throw new Error("Invalid encrypted data");
    }

    const pgService = new PostgresServices(adminPool);
    const dbNames = await pgService.getDatabasesForUser({
      platformUsername: project?.dbUser!,
    });

    const result = {
      project: {
        ...project,
        dbPassword: decryptedRes.result,
      },
      detail: { dbCnt: dbNames.length },
    };
    return new ApiResponse<typeof result>({
      message: "Project fetched successfully",
      statusCode: 200,
      data: result,
    });
  }
}
