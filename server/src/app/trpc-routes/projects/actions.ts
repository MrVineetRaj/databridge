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
import { cloudinaryServices } from "../../services/cloudinary";
import axios, { AxiosError } from "axios";
import { dirtyBitForWhitelistingDB } from "../../services/dirty-bit-service";
import { Repository } from "./repository";

export class Actions {
  repository: Repository;
  constructor() {
    this.repository = new Repository();
  }
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
    const newProject = await this.repository.createNewProject({
      projectTitle,
      projectDescription,
      userId: user.id,
      dbUser: dbInfo.dbUsername, // Store the generated username
      dbPassword: encryptedPassword,
      dbName: dbInfo.dbName,
      dbDomain: envConf.DATABASE_HOST,
    });

    dirtyBitForWhitelistingDB.makeItDirty();

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
    dbInstanceJobQueue.add(
      "database_backup",
      {
        dbName: newProject.dbName,
        projectId: newProject.id,
      },
      {
        delay: 1000 * 60 * 60 * 24 * 7,
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

    const projects = await this.repository.readProjectsFromDb({
      userId: user.id,
    });

    return new ApiResponse<typeof projects>({
      message: "Project created successfully",
      statusCode: 200,
      data: projects,
    });
  }

  async getProjectById(input: { projectId: string }, ctx: AuthedContext) {
    const { user } = ctx;

    const project = await this.repository.getUniqueProject({
      userId: user.id,
      projectId: input.projectId,
    });

    if (!project) {
      throw new Error("Project not found");
    }

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

  async getAllBackups(input: { projectId: string }, ctx: AuthedContext) {
    const backups = await this.repository.getAllDatabaseBackups({
      projectId: input.projectId,
    });

    return new ApiResponse<typeof backups>({
      statusCode: 200,
      message: "Loaded backups for project",
      data: backups,
    });
  }

  async downloadBackup(
    input: { projectId: string; backupId: string },
    ctx: AuthedContext
  ) {
    const { user } = ctx;

    // Verify project belongs to user
    const project = await this.repository.getUniqueProject({
      projectId: input.projectId,
      userId: user.id,
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Get the backup record
    const backup = await this.repository.getUniqueDatabaseBackup({
      backupId: input.backupId,
      projectId: input.projectId,
    });

    if (!backup) {
      throw new Error("Backup not found");
    }

    const publicId = backup.publicId;
    const signedURL = await cloudinaryServices.singedURLforCloudinaryFile({
      publicId,
    });

    const fileName = publicId.split("/").pop() || "backup.sql";

    try {
      const response = await axios.get(signedURL, {
        responseType: "arraybuffer",
      });

      const buffer = Buffer.from(response.data);

      return {
        data: buffer.toString("base64"),
        fileName,
        contentType: "application/octet-stream",
        contentLength: buffer.length,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error("Cloudinary error:", error.response?.data?.message);
      }
      throw new Error("Failed to download backup");
    }
  }
}
