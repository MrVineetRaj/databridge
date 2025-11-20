import { Request, Response } from "express";
import { User } from "../../../generated/prisma";
import { ApiResponse } from "../../lib/api.helper";
import { db } from "../../lib/db";
import { AuthedContext, Context } from "../../trpc";
import { adminPool, PostgresServices } from "../../services/pg";
import { envConf } from "../../lib/envConf";
import format from "pg-format";
import { encryptionServices } from "../../services/encryption";
import logger, { loggerMetadata } from "../../lib/logger";
import { isValidIP } from "../../lib/utils";
import { dirtyBitForWhitelistingDB } from "../../services/dirty-bit-service";
import { Repository } from "./repository";

export class Actions {
  repository: Repository;
  constructor() {
    this.repository = new Repository();
  }

  /**
   * Retrieves all database names inside a project for the authenticated user.
   * @param input - Object containing projectId.
   * @param ctx - Authenticated context.
   * @returns ApiResponse with database names.
   */
  async getDatabasesInsideProject(
    input: { projectId: string },
    ctx: AuthedContext
  ) {
    const { user } = ctx;

    const project = await this.repository.findProjectByIdAndUserId({
      id: input.projectId,
      userId: user.id,
    });

    const pgService = new PostgresServices(adminPool);
    const dbNames = await pgService.getDatabasesForUser({
      platformUsername: project?.dbUser!,
    });

    const result = dbNames.map((it) => it.datname);
    return new ApiResponse<typeof result>({
      message: "Databases fetched successfully",
      statusCode: 200,
      data: result,
    });
  }

  /**
   * Retrieves all tables of a specific database in a project.
   * @param input - Object containing projectId and dbName.
   * @param ctx - Authenticated context.
   * @returns ApiResponse with table names and primary keys.
   */
  async getTablesOfADatabase(
    input: { projectId: string; dbName: string },
    ctx: AuthedContext
  ) {
    const { dbName } = input;
    if (dbName === "XXXXX") {
      return new ApiResponse<typeof result>({
        message: "No tables found for the specified database",
        statusCode: 200,
        data: [] as {
          tableName: string;
          primaryKey: string;
        }[],
      });
    }
    const { user } = ctx;

    const project = await this.repository.findProjectByIdAndUserId({
      userId: user.id,
      id: input.projectId,
    });

    if (!project || !project.dbUser) {
      logger.error(
        "Project not found",
        loggerMetadata.system({
          filePath: __filename,
        })
      );
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

    const tableNames = await pgService.getTablesForDatabase({
      dbUserName: project?.dbUser!,
      dbName: input.dbName,
      dbPassword: decryptedRes.result!,
    });

    const result = tableNames;

    return new ApiResponse<typeof result>({
      message: "Tables fetched successfully",
      statusCode: 200,
      data: result,
    });
  }

  /**
   * Deletes items from a table in a database.
   * @param input - Object containing projectId, dbName, primaryKey, primaryKeyValues, and tableName.
   * @param ctx - Authenticated context.
   * @returns ApiResponse with deletion result.
   */
  async deleteItemFromDatabase(
    input: {
      projectId: string;
      dbName: string;
      primaryKey: string;
      primaryKeyValues: string[];
      tableName: string;
    },
    ctx: AuthedContext
  ) {
    const { projectId, dbName, primaryKey, primaryKeyValues, tableName } =
      input;

    const user = ctx.user;

    const projectDetails = await this.repository.findProjectByIdAndUserId({
      userId: user.id,
      id: projectId,
    });

    const decryptedRes = encryptionServices.decrypt(
      projectDetails?.dbPassword!
    );

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
    const result = await pgService.deleteItemFromDatabase({
      dbName,
      dbPassword: decryptedRes.result,
      dbUserName: projectDetails?.dbUser!,
      primaryKey,
      primaryKeyValues,
      tableName,
    });
    return new ApiResponse<typeof result>({
      message: "Items deleted successfully",
      statusCode: 200,
      data: result,
    });
  }

  /**
   * Retrieves paginated content of a table in a database.
   * @param input - Object containing dbName, tableName, page, limit, and projectId.
   * @param ctx - Authenticated context.
   * @returns ApiResponse with table content and pagination.
   */
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

    const project = await this.repository.findProjectByIdAndUserId({
      userId: ctx.user.id,
      id: projectId,
    });
    if (tableName.includes("XXXXX") || dbName === "XXXXX") {
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
        message: "No content found for the specified table or database",
        statusCode: 200,
        data: result,
      });
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
    const tableContent = await pgService.getTableContentPaginated({
      dbName,
      tableName,
      page: input?.page ?? 1,
      limit: input?.limit ?? 20,
      dbPassword: decryptedRes?.result!,
      dbUserName: project?.dbUser!,
    });

    const result = tableContent;
    return new ApiResponse<typeof result>({
      message: "Table content fetched successfully",
      statusCode: 200,
      data: result,
    });
  }

  /**
   * Searches items in a table using a custom SQL query object.
   * @param input - Object containing dbName, tableName, projectId, and sqlQueryObj.
   * @param ctx - Authenticated context.
   * @returns ApiResponse with search results.
   */
  async searchItemsUsingSqlQuery(
    input: {
      dbName: string;
      tableName: string;
      projectId: string;
      sqlQueryObj: {
        field: string;
        operator: string;
        value: string;
        queryConnector: string;
      }[];
    },
    ctx: AuthedContext
  ) {
    const { dbName, tableName, projectId, sqlQueryObj } = input;

    // console.log(sqlQueryObj);
    const project = await this.repository.findProjectByIdAndUserId({
      userId: ctx.user.id,
      id: projectId,
    });

    if (sqlQueryObj.length >= 50) {
      throw new Error(`SQL query too large`);
      return;
    }

    let isInvalidSqlQuery = sqlQueryObj.some(
      (queryObj) =>
        queryObj.field == "" || queryObj.operator == "" || queryObj.value == ""
    );

    if (!isInvalidSqlQuery) {
      isInvalidSqlQuery = sqlQueryObj
        .slice(0, sqlQueryObj.length - 1)
        .some((queryObj) => queryObj.queryConnector === "");
    }

    if (
      tableName.includes("XXXXX") ||
      dbName === "XXXXX" ||
      isInvalidSqlQuery
    ) {
      const result: any[] = [];
      return new ApiResponse<typeof result>({
        message: "Invalid data for SQL query sent",
        statusCode: 400,
        data: result,
      });
    }

    let sqlQuery = format(`select * from "%I" where `, tableName);

    sqlQueryObj.forEach((queryObj, index) => {
      const { field, operator, queryConnector, value } = queryObj;
      const isLast = index === sqlQueryObj.length - 1;

      // Validate operator
      const validOps = ["=", "<", "<=", ">", ">=", "!="];
      if (!validOps.includes(operator)) {
        throw new Error(`Invalid operator: ${operator}`);
      }

      const validConnectors = ["", "AND", "OR"];
      if (!validConnectors.includes(queryConnector)) {
        throw new Error(`Invalid query connector: ${queryConnector}`);
      }

      // Append condition
      sqlQuery += format(` %I ${operator} %L`, field, value);

      // Append connector only if not last
      if (!isLast && queryConnector) {
        sqlQuery += ` ${queryConnector}`;
      }
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
    const result = await pgService.searchItemsUsingSqlQuery({
      dbName,
      sqlQuery,
      dbPassword: decryptedRes?.result!,
      dbUserName: project?.dbUser!,
    });

    return new ApiResponse<typeof result.data>({
      message: "Table content fetched successfully",
      statusCode: 200,
      data: result.data,
    });
  }

  /**
   * Updates multiple rows in a table using a SQL query object.
   * @param input - Object containing dbName, tableName, projectId, primaryKey, and sqlQueryObj.
   * @param ctx - Authenticated context.
   * @returns ApiResponse with update results.
   */
  async updateMultipleRows(
    input: {
      dbName: string;
      tableName: string;
      projectId: string;
      primaryKey: string;
      sqlQueryObj: { [primaryKey: string]: { [field: string]: string } };
    },
    ctx: AuthedContext
  ) {
    const { dbName, tableName, projectId, primaryKey, sqlQueryObj } = input;

    // console.log(sqlQueryObj);
    const project = await this.repository.findProjectByIdAndUserId({
      userId: ctx.user.id,
      id: projectId,
    });
    if (tableName.includes("XXXXX") || dbName === "XXXXX") {
      const result: any[] = [];
      return new ApiResponse<typeof result>({
        message: "No content found for the specified table or database",
        statusCode: 200,
        data: result,
      });
    }

    const primaryKeyValues = Object.keys(sqlQueryObj);
    const dataToBeUpdated = Object.values(sqlQueryObj);

    if (!dataToBeUpdated.length) return;

    // Collect all columns to update
    const cols = [
      ...new Set(dataToBeUpdated.flatMap((item) => Object.keys(item || {}))),
    ];

    // Build VALUES safely
    const valuesArray = primaryKeyValues.map((pk, idx) => {
      const currentData = dataToBeUpdated[idx] as {
        [field: string]: string;
      };
      return [
        pk,
        ...cols.map((col) =>
          currentData[col] === undefined || currentData[col] === null
            ? null
            : currentData[col]
        ),
      ];
    });

    const sqlQuery = format(
      `
UPDATE %I AS t
SET %s
FROM (VALUES %L) AS u(%I, %s)
WHERE t.%I = u.%I;
  `,
      tableName,
      cols
        .map((col) => {
          // Check if it's a timestamp column
          if (
            col.toLowerCase().includes("at") ||
            col.toLowerCase().includes("time")
          ) {
            return format(
              "%I = CASE WHEN u.%I ~ '^[0-9]+$' THEN to_timestamp(u.%I::bigint / 1000) ELSE u.%I::timestamp END",
              col,
              col,
              col,
              col
            );
          }
          return format("%I = u.%I", col, col);
        })
        .join(", "),
      valuesArray,
      primaryKey,
      cols.map((c) => format.ident(c)).join(", "),
      primaryKey,
      primaryKey
    );
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

    const result = await pgService.updateMultipleRows({
      dbName,
      sqlQuery,
      dbPassword: decryptedRes?.result!,
      dbUserName: project?.dbUser!,
    });

    return new ApiResponse<typeof result.data>({
      message: "Table content updated successfully",
      statusCode: 200,
      data: result.data,
    });
  }

  /**
   * Resumes access to all inactive databases for a project.
   * @param input - Object containing projectId.
   * @param ctx - Authenticated context.
   * @returns ApiResponse indicating the result.
   */
  async resumeDatabases(
    input: {
      projectId: string;
    },
    ctx: AuthedContext
  ) {
    const project = await this.repository.findProjectByIdAndUserId({
      userId: ctx.user.id,
      id: input.projectId,
    });

    if (!project) {
      throw new Error("No project found");
    }

    if (project.inactiveDatabases.length > 0) {
      const pgServices = new PostgresServices(adminPool);

      await pgServices.resumeUserAccessForDatabases({
        databaseNames: project?.inactiveDatabases,
      });
    }

    await this.repository.markActiveStatusForDatabase({ id: input.projectId });

    return new ApiResponse({
      statusCode: 200,
      message: "Databases resumed successfully",
    });
  }

  /**
   * Retrieves dashboard data for a project.
   * @param input - Object containing projectId.
   * @param ctx - Authenticated context.
   * @returns ApiResponse with dashboard data.
   */
  async getDashboardData(input: { projectId: string }, ctx: AuthedContext) {
    const project = await this.repository.findProjectByIdAndUserId({
      userId: ctx.user.id,
      id: input.projectId,
    });

    if (!project) {
      logger.error("Project not found", {
        projectId: input.projectId,
        userId: ctx.user.id,
      });
      throw new Error("Project not found");
      return;
    }

    const pgService = new PostgresServices(adminPool);
    const databasesResources = await pgService.getDatabasesForUser({
      platformUsername: project?.dbUser!,
    });

    const dbPassword = encryptionServices.decrypt(project.dbPassword!).result;
    const analytics = await pgService.getAnalytics({
      dbName: project.dbName!,
      dbPassword: dbPassword,
      dbUserName: project.dbUser!,
    });

    const whitelistedIpCnt =
      await this.repository.getAllWhiteListedIpCountForProject({
        projectId: input.projectId,
      });

    const result = {
      project: {
        ...project,
        dbCnt: databasesResources.length,
        dbPassword: dbPassword,
      },
      analytics: analytics.data || [],
      resourceUsage: {
        storage: databasesResources.reduce((acc, it) => acc + +it.sizeBytes, 0),
        activeConnections:
          databasesResources?.reduce(
            (acc, it) => acc + +it.activeConnections,
            0
          ) || 0,
        totalOperations:
          databasesResources?.reduce(
            (acc, it) => acc + +it.totalOperations,
            0
          ) || 0,
      },
      whitelistedIpCnt,
    };

    return new ApiResponse<typeof result>({
      message: "Dashboard data fetched successfully",
      statusCode: 200,
      data: result,
    });
  }

  /**
   * Adds a new IP address to the whitelist for a project.
   * @param input - Object containing projectId and ip.
   * @param ctx - Authenticated context.
   * @returns ApiResponse with the new whitelisted IP.
   */
  async addNewWhiteListedIp(
    input: { projectId: string; ip: string },
    ctx: AuthedContext
  ) {
    const ipWithCIDR = input.ip.includes("/") ? input.ip : input.ip + "/32";
    if (ipWithCIDR.startsWith("/")) {
      throw new Error("Require a valid IPv4 with or without CIDR");
    }
    if (!isValidIP(ipWithCIDR.split("/")[0]!)) {
      throw new Error("Require a valid IPv4 with or without CIDR");
    }

    const validCIDR = ["0", "32", "64", "128"];
    if (!validCIDR.some((val) => val == ipWithCIDR.split("/")[1]!)) {
      throw new Error("Require a valid IPv4 with or without CIDR");
    }

    const project = await this.repository.findProjectByIdAndUserId({
      userId: ctx.user.id,
      id: input.projectId,
    });

    if (!project) {
      throw new Error("Project not found");
    }
    const newIp = await this.repository.addNewWhitelistedIP({
      projectId: project.id,
      dbName: project.dbName!,
      ip: ipWithCIDR.split("/")[0] == "0.0.0.0" ? "0.0.0.0/0" : ipWithCIDR,
      isActive: false,
    });

    dirtyBitForWhitelistingDB.makeItDirty();

    return new ApiResponse<typeof newIp>({
      statusCode: 201,
      message: "New IP whitelisted successfully",
      data: newIp,
    });
  }

  /**
   * Retrieves all whitelisted IPs for a project.
   * @param input - Object containing projectId.
   * @param ctx - Authenticated context.
   * @returns ApiResponse with whitelisted IPs.
   */
  async getWhitelistedIps(input: { projectId: string }, ctx: AuthedContext) {
    const whitelistedIps = await this.repository.getAllWhiteListedIpForProject({
      projectId: input.projectId,
    });

    return new ApiResponse<typeof whitelistedIps>({
      statusCode: 200,
      message: "Whitelisted IPs fetched successfully",
      data: whitelistedIps,
    });
  }

  /**
   * Removes a whitelisted IP by its ID.
   * @param input - Object containing the IP ID.
   * @param ctx - Authenticated context.
   * @returns ApiResponse indicating removal.
   */
  async removeWhiteListedIp(input: { id: string }, ctx: AuthedContext) {
    await this.repository.deleteWhitelistedIp({
      id: input.id,
    });

    dirtyBitForWhitelistingDB.makeItDirty();

    return new ApiResponse({
      statusCode: 200,
      message: "Whitelisted IP removed successfully",
      data: null,
    });
  }
}
