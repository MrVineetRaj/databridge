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

export class Actions {
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

    const result = dbNames.map((it) => it.datname);
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
    const { dbName } = input;
    if (dbName === "XXXXX") {
      return new ApiResponse<typeof result>({
        message: "Table names fetched",
        statusCode: 200,
        data: [] as {
          tableName: string;
          primaryKey: string;
        }[],
      });
    }
    const { user } = ctx;

    const project = await db.project.findUnique({
      where: {
        userId: user.id,
        id: input.projectId,
      },
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
      message: "Table names fetched",
      statusCode: 200,
      data: result,
    });
  }

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

    const projectDetails = await db.project.findUnique({
      where: {
        id: projectId,
      },
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
        message: `Table content fetched for ${tableName} from ${dbName}`,
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
      message: `Table content fetched for ${tableName} from ${dbName}`,
      statusCode: 200,
      data: result,
    });
  }
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
    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (sqlQueryObj.length >= 50) {
      throw new Error(`Very large sql query`);
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
        message: `Invalid data for sql query sent`,
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
      message: `Table content fetched for ${tableName} from ${dbName}, ${result?.message}`,
      statusCode: 200,
      data: result.data,
    });
  }
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
    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
    });
    if (tableName.includes("XXXXX") || dbName === "XXXXX") {
      const result: any[] = [];
      return new ApiResponse<typeof result>({
        message: `Table content fetched for ${tableName} from ${dbName}`,
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
      message: `${result?.message}, Table content updated for ${tableName} from ${dbName}`,
      statusCode: 200,
      data: result.data,
    });
  }

  async resumeDatabases(
    input: {
      projectId: string;
    },
    ctx: AuthedContext
  ) {
    const project = await db.project.findUnique({
      where: {
        id: input.projectId,
      },
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

    await db.project.update({
      where: {
        id: input.projectId,
      },
      data: {
        inactiveDatabases: [],
      },
    });

    return new ApiResponse({
      statusCode: 200,
      message: `Databases ${project?.inactiveDatabases?.join(", ")} resume`,
    });
  }

  async getDashboardData(input: { projectId: string }, ctx: AuthedContext) {
    const project = await db.project.findUnique({
      where: {
        id: input.projectId,
        userId: ctx.user.id,
      },
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

    const whitelistedIpCnt = await db.whiteListedIP.count({
      where: {
        projectId: input.projectId,
      },
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
      message: "Dashboard Data fetched",
      statusCode: 200,
      data: result,
    });
  }

  async addNewWhiteListedIp(
    input: { projectId: string; ip: string },
    ctx: AuthedContext
  ) {
    if (!isValidIP(input.ip)) {
      throw new Error("Require a valid IPv4");
    }
    const project = await db.project.findUnique({
      where: {
        id: input.projectId,
        userId: ctx.user.id,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }
    const newIp = await db.whiteListedIP.create({
      data: {
        projectId: project.id,
        dbName: project.dbName!,
        ip: input.ip,
        isActive: false,
      },
    });

    dirtyBitForWhitelistingDB.makeItDirty();

    return new ApiResponse<typeof newIp>({
      statusCode: 201,
      message: "New IP whitelisted",
      data: newIp,
    });
  }

  async getWhitelistedIps(input: { projectId: string }, ctx: AuthedContext) {
    const whitelistedIps = await db.whiteListedIP.findMany({
      where: {
        projectId: input.projectId,
      },
    });

    return new ApiResponse<typeof whitelistedIps>({
      statusCode: 201,
      message: "Whitelisted ips fetched",
      data: whitelistedIps,
    });
  }
}
