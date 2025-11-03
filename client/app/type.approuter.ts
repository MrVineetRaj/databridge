/**
 * Here every routes should be added
 */
export declare const appRouter: import("@trpc/server").TRPCBuiltRouter<
  {
    ctx: {
      req: import("@trpc/server/dist/adapters/express.cjs").CreateExpressContextOptions["req"] &
        import("express").Request;
      res: import("@trpc/server/dist/adapters/express.cjs").CreateExpressContextOptions["res"] &
        import("express").Response;
    };
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
  },
  import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    healthRoutes: import("@trpc/server").TRPCBuiltRouter<
      {
        ctx: {
          req: import("@trpc/server/dist/adapters/express.cjs").CreateExpressContextOptions["req"] &
            import("express").Request;
          res: import("@trpc/server/dist/adapters/express.cjs").CreateExpressContextOptions["res"] &
            import("express").Response;
        };
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
      },
      import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        trpcHealth: import("@trpc/server").TRPCQueryProcedure<{
          input: void;
          output: import("../lib/api.helper").ApiResponse<any>;
          meta: object;
        }>;
      }>
    >;
    projectRoutes: import("@trpc/server").TRPCBuiltRouter<
      {
        ctx: {
          req: import("@trpc/server/dist/adapters/express.cjs").CreateExpressContextOptions["req"] &
            import("express").Request;
          res: import("@trpc/server/dist/adapters/express.cjs").CreateExpressContextOptions["res"] &
            import("express").Response;
        };
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
      },
      import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        newProject: import("@trpc/server").TRPCMutationProcedure<{
          input: {
            projectTitle: string;
            projectDescription: string;
          };
          output: import("../lib/api.helper").ApiResponse<{
            id: string;
            updatedAt: Date;
            createdAt: Date;
            projectTitle: string;
            projectDescription: string;
            userId: string;
            dbUser: string | null;
            dbName: string | null;
            dbDomain: string | null;
            dbPassword: string | null;
            dbSchema: string | null;
            isActionDone: boolean;
            inactiveDatabases: string[];
          }>;
          meta: object;
        }>;
        getProjects: import("@trpc/server").TRPCQueryProcedure<{
          input: void;
          output: import("../lib/api.helper").ApiResponse<
            {
              id: string;
              projectTitle: string;
              projectDescription: string;
              inactiveDatabases: string[];
            }[]
          >;
          meta: object;
        }>;
        getProjectById: import("@trpc/server").TRPCQueryProcedure<{
          input: {
            projectId: string;
          };
          output: import("../lib/api.helper").ApiResponse<{
            project: {
              dbPassword: string;
              id: string;
              updatedAt: Date;
              createdAt: Date;
              projectTitle: string;
              projectDescription: string;
              userId: string;
              dbUser: string | null;
              dbName: string | null;
              dbDomain: string | null;
              dbSchema: string | null;
              isActionDone: boolean;
              inactiveDatabases: string[];
            };
            detail: {
              dbCnt: number;
            };
          }>;
          meta: object;
        }>;
        getBackups: import("@trpc/server").TRPCQueryProcedure<{
          input: {
            projectId: string;
          };
          output: import("../lib/api.helper").ApiResponse<
            {
              id: string;
              updatedAt: Date;
              createdAt: Date;
              dbName: string;
              publicId: string;
              projectId: string;
            }[]
          >;
          meta: object;
        }>;
        downloadBackup: import("@trpc/server").TRPCMutationProcedure<{
          input: {
            projectId: string;
            backupId: string;
          };
          output: {
            data: string;
            fileName: string;
            contentType: string;
            contentLength: number;
          };
          meta: object;
        }>;
      }>
    >;
    dbInstanceRoutes: import("@trpc/server").TRPCBuiltRouter<
      {
        ctx: {
          req: import("@trpc/server/dist/adapters/express.cjs").CreateExpressContextOptions["req"] &
            import("express").Request;
          res: import("@trpc/server/dist/adapters/express.cjs").CreateExpressContextOptions["res"] &
            import("express").Response;
        };
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
      },
      import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getDatabasesInsideProject: import("@trpc/server").TRPCQueryProcedure<{
          input: {
            projectId: string;
          };
          output: import("../lib/api.helper").ApiResponse<string[]>;
          meta: object;
        }>;
        getTablesOfADatabase: import("@trpc/server").TRPCQueryProcedure<{
          input: {
            projectId: string;
            dbName: string;
          };
          output: import("../lib/api.helper").ApiResponse<
            {
              tableName: string;
              primaryKey: string;
            }[]
          >;
          meta: object;
        }>;
        getTableContent: import("@trpc/server").TRPCQueryProcedure<{
          input: {
            dbName: string;
            tableName: string;
            page: number;
            limit: number;
            projectId: string;
          };
          output: import("../lib/api.helper").ApiResponse<{
            data: any[];
            pagination: {
              page: number;
              limit: number;
              total: number;
              totalPages: number;
            };
          }>;
          meta: object;
        }>;
        deleteItemFromDatabase: import("@trpc/server").TRPCMutationProcedure<{
          input: {
            projectId: string;
            dbName: string;
            primaryKey: string;
            primaryKeyValues: string[];
            tableName: string;
          };
          output: import("../lib/api.helper").ApiResponse<{
            message: string;
            success: boolean;
            data: null;
          }>;
          meta: object;
        }>;
        searchItemsUsingSqlQuery: import("@trpc/server").TRPCMutationProcedure<{
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
          };
          output: import("../lib/api.helper").ApiResponse<any[]> | undefined;
          meta: object;
        }>;
        updateMultipleRows: import("@trpc/server").TRPCMutationProcedure<{
          input: {
            dbName: string;
            tableName: string;
            projectId: string;
            primaryKey: string;
            sqlQueryObj: Record<string, Record<string, string>>;
          };
          output: import("../lib/api.helper").ApiResponse<any[]> | undefined;
          meta: object;
        }>;
        resumeDatabases: import("@trpc/server").TRPCMutationProcedure<{
          input: {
            projectId: string;
          };
          output: import("../lib/api.helper").ApiResponse<any>;
          meta: object;
        }>;
      }>
    >;
    discordIntegrationRoutes: import("@trpc/server").TRPCBuiltRouter<
      {
        ctx: {
          req: import("@trpc/server/dist/adapters/express.cjs").CreateExpressContextOptions["req"] &
            import("express").Request;
          res: import("@trpc/server/dist/adapters/express.cjs").CreateExpressContextOptions["res"] &
            import("express").Response;
        };
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
      },
      import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        addNewIntegration: import("@trpc/server").TRPCMutationProcedure<{
          input: {
            channelId: string;
          };
          output: import("../lib/api.helper").ApiResponse<{
            id: string;
            updatedAt: Date;
            createdAt: Date;
            userId: string;
            channelId: string;
          }>;
          meta: object;
        }>;
        getDiscordIntegration: import("@trpc/server").TRPCQueryProcedure<{
          input: void;
          output: import("../lib/api.helper").ApiResponse<any>;
          meta: object;
        }>;
      }>
    >;
  }>
>;
export type AppRouter = typeof appRouter;
//# sourceMappingURL=index.d.ts.map
