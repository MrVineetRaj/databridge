import { Project, User, WhiteListedIP } from "../../../generated/prisma";
import { db } from "../../lib/db";

export class Repository {
  /**
   * Finds a project by its ID and the associated user ID.
   * @param params - Object containing project ID and user ID.
   * @returns The project if found, otherwise null.
   */
  public async findProjectByIdAndUserId({
    id,
    userId,
  }: {
    id: string;
    userId: string;
  }): Promise<Project | null> {
    const project = await db.project.findUnique({
      where: {
        userId,
        id,
      },
    });

    return project;
  }

  /**
   * Adds a new whitelisted IP address for a project and database.
   * @param params - Object containing projectId, dbName, ip, and isActive.
   * @returns The created WhiteListedIP record.
   */
  public async addNewWhitelistedIP({
    projectId,
    dbName,
    ip,
    isActive,
  }: {
    projectId: string;
    dbName: string;
    ip: string;
    isActive: boolean;
  }): Promise<WhiteListedIP> {
    return await db.whiteListedIP.create({
      data: {
        projectId,
        dbName,
        ip,
        isActive,
      },
    });
  }

  /**
   * Retrieves all whitelisted IPs for a given project.
   * @param params - Object containing projectId.
   * @returns Array of WhiteListedIP records.
   */
  public async getAllWhiteListedIpForProject({
    projectId,
  }: {
    projectId: string;
  }): Promise<WhiteListedIP[]> {
    return await db.whiteListedIP.findMany({
      where: {
        projectId: projectId,
      },
    });
  }

  /**
   * Gets the count of all whitelisted IPs for a given project.
   * @param params - Object containing projectId.
   * @returns Number of whitelisted IPs.
   */
  public async getAllWhiteListedIpCountForProject({
    projectId,
  }: {
    projectId: string;
  }): Promise<number> {
    return await db.whiteListedIP.count({
      where: {
        projectId: projectId,
      },
    });
  }

  /**
   * Marks all databases as active for a given project by clearing inactiveDatabases.
   * @param params - Object containing project ID.
   * @returns The updated Project.
   */
  public async markActiveStatusForDatabase({
    id,
  }: {
    id: string;
  }): Promise<Project> {
    return await db.project.update({
      where: {
        id,
      },
      data: {
        inactiveDatabases: [],
      },
    });
  }

  /**
   * Deletes a whitelisted IP by updating the project's inactiveDatabases.
   * @param params - Object containing project ID.
   * @returns The updated Project.
   */
  public async deleteWhitelistedIp({ id }: { id: string }): Promise<Project> {
    return await db.project.update({
      where: {
        id,
      },
      data: {
        inactiveDatabases: [],
      },
    });
  }
}
