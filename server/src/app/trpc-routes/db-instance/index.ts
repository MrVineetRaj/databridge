import z from "zod";
import { ApiResponse, TRPCAsyncHandler } from "../../lib/api.helper";
import { baseProcedure, protectedProcedure, router } from "../../trpc";
import { Actions } from "./actions";

export function registerRoutes() {
  const actions = new Actions();
  const dbInstanceRoutes = router({
    getDatabasesInsideProject: protectedProcedure
      .input(
        z.object({
          projectId: z.string(),
        })
      )
      .query(TRPCAsyncHandler(actions.getDatabasesInsideProject.bind(actions))),
    getTablesOfADatabase: protectedProcedure
      .input(
        z.object({
          projectId: z.string(),
          dbName: z.string(),
        })
      )
      .query(TRPCAsyncHandler(actions.getTablesOfADatabase.bind(actions))),
    getTableContent: protectedProcedure
      .input(
        z.object({
          dbName: z.string(),
          tableName: z.string(),
          page: z.number(),
          limit: z.number(),
          projectId: z.string(),
        })
      )
      .query(TRPCAsyncHandler(actions.getTableContent.bind(actions))),
    deleteItemFromDatabase: protectedProcedure
      .input(
        z.object({
          projectId: z.string(),
          dbName: z.string(),
          primaryKey: z.string(),
          primaryKeyValues: z.array(z.string()),
          tableName: z.string(),
        })
      )
      .mutation(TRPCAsyncHandler(actions.deleteItemFromDatabase.bind(actions))),

    searchItemsUsingSqlQuery: protectedProcedure
      .input(
        z.object({
          dbName: z.string(),
          tableName: z.string(),
          projectId: z.string(),
          sqlQueryObj: z.array(
            z.object({
              field: z.string(),
              operator: z.string(),
              value: z.string(),
              queryConnector: z.string(),
            })
          ),
        })
      )
      .mutation(
        TRPCAsyncHandler(actions.searchItemsUsingSqlQuery.bind(actions))
      ),
    updateMultipleRows: protectedProcedure
      .input(
        z.object({
          dbName: z.string(),
          tableName: z.string(),
          projectId: z.string(),
          primaryKey: z.string(),
          sqlQueryObj: z.record(
            z.string(), // primary key
            z.record(z.string(), z.string()) // inner object: fieldName -> value
          ),
        })
      )
      .mutation(TRPCAsyncHandler(actions.updateMultipleRows.bind(actions))),
    resumeDatabases: protectedProcedure
      .input(
        z.object({
          projectId: z.string(),
        })
      )
      .mutation(TRPCAsyncHandler(actions.resumeDatabases.bind(actions))),
    getDashboardData: protectedProcedure
      .input(
        z.object({
          projectId: z.string(),
        })
      )
      .query(TRPCAsyncHandler(actions.getDashboardData.bind(actions))),
    addNewWhiteListedIp: protectedProcedure
      .input(
        z.object({
          projectId: z.string(),
          ip: z.string(),
        })
      )
      .mutation(TRPCAsyncHandler(actions.addNewWhiteListedIp.bind(actions))),
    getWhitelistedIps: protectedProcedure
      .input(
        z.object({
          projectId: z.string(),
        })
      )
      .query(TRPCAsyncHandler(actions.getWhitelistedIps.bind(actions))),
  });

  return dbInstanceRoutes;
}

export const dbInstanceRoutes = registerRoutes();
