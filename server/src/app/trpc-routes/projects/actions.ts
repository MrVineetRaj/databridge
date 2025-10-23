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
    if (tableName.includes("XXXXX") || dbName === "XXXXX") {
      const result: any[] = [];
      return new ApiResponse<typeof result>({
        message: `Table content fetched for ${tableName} from ${dbName}`,
        statusCode: 200,
        data: result,
      });
    }

    let sqlQuery = `select * from "${tableName}" where `;

    sqlQueryObj.forEach((queryObj) => {
      const { field, operator, queryConnector, value } = queryObj;

      sqlQuery += ` ${field} ${operator} '${value}' ${queryConnector}`;
    });

    console.log(sqlQuery);
    const pgService = new PostgresServices(adminPool);
    const result = await pgService.searchItemsUsingSqlQuery({
      dbName,
      sqlQuery,
      dbPassword: project?.dbPassword!,
      dbUserName: project?.dbUser!,
    });

    return new ApiResponse<typeof result>({
      message: `Table content fetched for ${tableName} from ${dbName}`,
      statusCode: 200,
      data: result,
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

    let cols: string[] = [];

    for (let i = 0; i < dataToBeUpdated.length; i++) {
      const currentItem = dataToBeUpdated[i] ?? {};
      if (currentItem) {
        Object.keys(currentItem).forEach((col) => {
          if (!cols.includes(col)) {
            cols.push(col);
          }
        });
      }
    }

    if (!dataToBeUpdated || dataToBeUpdated?.length <= 0) {
      return;
    }

    let sqlQuery = `
WITH updated_data (${primaryKey}, ${cols?.join(", ")}) AS (
  VALUES
    ${primaryKeyValues
      ?.map((primaryKeyValue, idx) => {
        const currentData = dataToBeUpdated[idx];
        return `('${primaryKeyValue}'${cols
          ?.map((col) => {
            const value = currentData?.[col];
            return `, '${value || "NULL"}'`;
          })
          .join("")})`;
      })
      .join(",    ")}
)
UPDATE ${tableName} AS t
SET
  ${cols
    ?.map((col) => {
      return `${col} = COALESCE(u.${col}, t.${col})`;
    })
    .join(",  ")}
FROM updated_data AS u
WHERE t.${primaryKey} = u.${primaryKey};
`;

    console.log(sqlQuery);

    const pgService = new PostgresServices(adminPool);
    const result = await pgService.updateMultipleRows({
      dbName,
      sqlQuery,
      dbPassword: project?.dbPassword!,
      dbUserName: project?.dbUser!,
    });

    // const result = ""
    console.log(result)

    return new ApiResponse<typeof result>({
      message: `Table content updated for ${tableName} from ${dbName}`,
      statusCode: 200,
      data: result,
    });
  }
}
