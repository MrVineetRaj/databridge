import {
  DatabaseBackups,
  DiscordIntegration,
  Project,
} from "../../../generated/prisma";
import { db } from "../../lib/db";

export class Repository {
  /**
   * Adds a new Discord integration for a user.
   * @param params - Object containing channelId and userId.
   * @returns The newly created DiscordIntegration object.
   */
  public async createNewProject({
    projectDescription,
    projectTitle,
    userId,
    dbDomain,
    dbName,
    dbPassword,
    dbUser,
  }: {
    projectTitle: string;
    projectDescription: string;
    userId: string;
    dbUser: string; // Store the generated username
    dbPassword: string;
    dbName: string;
    dbDomain: string;
  }): Promise<Project> {
    const newProject = await db.project.create({
      data: {
        projectDescription,
        projectTitle,
        userId,
        dbDomain,
        dbName,
        dbPassword,
        dbUser,
      },
    });
    await db.whiteListedIP.create({
      data: {
        ip: "0.0.0.0/0",
        dbName,
        projectId: newProject.id,
        isActive: false,
      },
    });
    return newProject;
  }

  /**
   * Retrieves the Discord integration for a given user.
   * @param params - Object containing userId.
   * @returns The DiscordIntegration object if found, otherwise null.
   */
  public async readProjectsFromDb({ userId }: { userId: string }): Promise<
    {
      projectDescription: string;
      projectTitle: string;
      id: string;
      inactiveDatabases: string[];
    }[]
  > {
    const projects = await db.project.findMany({
      where: {
        userId,
      },
      select: {
        projectTitle: true,
        projectDescription: true,
        id: true,
        inactiveDatabases: true,
      },
    });

    return projects;
  }

  public async getUniqueProject({
    userId,
    projectId,
  }: {
    userId: string;
    projectId: string;
  }): Promise<Project | null> {
    const project = await db.project.findUnique({
      where: {
        userId,
        id: projectId,
      },
    });

    return project;
  }

  public async getAllDatabaseBackups({
    projectId,
  }: {
    projectId: string;
  }): Promise<DatabaseBackups[]> {
    const backups = await db.databaseBackups.findMany({
      where: {
        projectId: projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return backups;
  }
  public async getUniqueDatabaseBackup({
    projectId,
    backupId,
  }: {
    projectId: string;
    backupId: string;
  }): Promise<DatabaseBackups | null> {
    const backup = await db.databaseBackups.findUnique({
      where: {
        projectId: projectId,
        id: backupId,
      },
    });

    return backup;
  }
}
