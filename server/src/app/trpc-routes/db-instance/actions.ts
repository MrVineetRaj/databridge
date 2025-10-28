import { Request, Response } from "express";
import { User } from "../../../generated/prisma";
import { ApiResponse } from "../../lib/api.helper";
import { db } from "../../lib/db";
import { AuthedContext, Context } from "../../trpc";
import { adminPool, PostgresServices } from "../../services/pg";
import { envConf } from "../../lib/envConf";
import format from "pg-format";

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

    const pgService = new PostgresServices(adminPool);
    const tableNames = await pgService.getTablesForDatabase({
      dbUserName: project?.dbUser!,
      dbName: input.dbName,
      dbPassword: project?.dbPassword!,
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

    const pgService = new PostgresServices(adminPool);
    const result = await pgService.deleteItemFromDatabase({
      dbName,
      dbPassword: projectDetails?.dbPassword!,
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

    console.log(sqlQuery);
    const pgService = new PostgresServices(adminPool);
    const result = await pgService.searchItemsUsingSqlQuery({
      dbName,
      sqlQuery,
      dbPassword: project?.dbPassword!,
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
WITH updated_data (%I, %s) AS (
  VALUES %L
)
UPDATE %I AS t
SET %s
FROM updated_data AS u
WHERE t.%I = u.%I;
  `,
      primaryKey,
      cols.map((c) => format.ident(c)).join(", "),
      valuesArray,
      tableName,
      cols
        .map((col) => format("%I = COALESCE(u.%I, t.%I)", col, col, col))
        .join(", "),
      primaryKey,
      primaryKey
    );

    const pgService = new PostgresServices(adminPool);
    const result = await pgService.updateMultipleRows({
      dbName,
      sqlQuery,
      dbPassword: project?.dbPassword!,
      dbUserName: project?.dbUser!,
    });

    return new ApiResponse<typeof result.data>({
      message: `${result?.message}, Table content updated for ${tableName} from ${dbName}`,
      statusCode: 200,
      data: result.data,
    });
  }
}
