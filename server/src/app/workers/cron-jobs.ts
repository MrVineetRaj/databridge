import cron from "node-cron";
import { adminPool, PostgresServices } from "../services/pg";
import { db } from "../lib/db";
import { dbInstanceJobQueue } from "../../server";
import logger, { loggerMetadata } from "../lib/logger";

cron.schedule("* * * * *", async () => {
  logger.info(`Checking idle databases for cleanup`, {
    ...loggerMetadata.system({
      filePath: __filename,
    }),
  });
  const pgServices = new PostgresServices(adminPool);
  const res = await pgServices.findIdleDatabasesWithDataActivity();

  const db_meta: {
    dbName: string;
    dbUser: string;
  }[] = res
    .map((it) => {
      return {
        dbName: it.database_name as string,
        dbUser: it.owner_username as string,
      };
    })
    .filter((it) => it.dbUser.split("_").length == 2);

  const relatedProjects = await db.project.findMany({
    where: {
      dbUser: {
        in: db_meta.map((it) => it.dbUser),
      },
    },
    include: {
      user: {
        include: {
          discordIntegration: true,
        },
      },
    },
  });

  const requiredCredentialsMap: {
    [dbUser: string]: {
      dbUser: string;
      title: string;
      projectId: string;
      userName: string;
      userEmail: string;
      discordChannelId: string | null;
      isActionDone: boolean;
      oldInactiveDatabases: string[];
      newInactiveDatabases: string[];
    };
  } = {};
  relatedProjects.forEach((project) => {
    requiredCredentialsMap[project.dbUser as string] = {
      dbUser: project.dbUser as string,
      title: project.projectTitle,
      projectId: project.id,
      userName: project.user.name,
      userEmail: project.user.email,
      discordChannelId: project.user.discordIntegration[0]?.channelId || null,
      isActionDone: project?.isActionDone,
      oldInactiveDatabases: project?.inactiveDatabases,
      newInactiveDatabases: [],
    };
  });

  db_meta.forEach((db) => {
    if (
      !requiredCredentialsMap[db.dbUser]?.oldInactiveDatabases.includes(
        db.dbName
      ) &&
      !requiredCredentialsMap[db.dbUser]?.newInactiveDatabases.includes(
        db.dbName
      )
    ) {
      requiredCredentialsMap[db.dbUser]?.newInactiveDatabases.push(db.dbName);
    }
  });

  Object.values(requiredCredentialsMap).forEach((databaseData) => {
    if (databaseData.newInactiveDatabases.length == 0) return;
    dbInstanceJobQueue.add("pause_db_connection", { ...databaseData });
  });
});
