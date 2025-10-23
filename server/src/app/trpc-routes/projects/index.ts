import z from "zod";
import { ApiResponse, TRPCAsyncHandler } from "../../lib/api.helper";
import { baseProcedure, protectedProcedure, router } from "../../trpc";
import { Actions } from "./actions";

export function registerRoutes() {
  const actions = new Actions();
  const projectRoutes = router({
    newProject: protectedProcedure
      .input(
        z.object({
          projectTitle: z.string(),
          projectDescription: z.string(),
        })
      )
      .mutation(TRPCAsyncHandler(actions.newProject.bind(actions))), // Changed from .query to .mutation
    getProjects: protectedProcedure.query(
      TRPCAsyncHandler(actions.getProjects.bind(actions))
    ),
    getProjectById: protectedProcedure
      .input(
        z.object({
          projectId: z.string(),
        })
      )
      .query(TRPCAsyncHandler(actions.getProjectById.bind(actions))),
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
  });

  return projectRoutes;
}

export const projectRoutes = registerRoutes();
