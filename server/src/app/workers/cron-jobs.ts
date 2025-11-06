import cron from "node-cron";
import { adminPool, PostgresServices } from "../services/pg";
import { db } from "../lib/db";
import { dbInstanceJobQueue } from "../../server";
import logger, { loggerMetadata } from "../lib/logger";
import fs from "fs";
import { envConf } from "../lib/envConf";
import { dirtyBitForWhitelistingDB } from "../services/dirty-bit-service";
import { execSync } from "child_process";
cron.schedule("0 0 */7 * *", async () => {
  logger.info(`Checking idle databases for cleanup`, {
    ...loggerMetadata.system({
      filePath: __filename,
    }),
  });
  const pgServices = new PostgresServices(adminPool);
  const res = await pgServices.findIdleDatabasesWithDataActivity(30);

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

cron.schedule("0 0 * * *", async () => {
  const pgService = new PostgresServices(adminPool);

  await pgService.resetAllAnalytics();
});

cron.schedule("*/15 * * * *", async () => {
  logger.info("Starting the ip whitelisting");
  try {
    if (!dirtyBitForWhitelistingDB.isDirty()) {
      logger.info("No IP address change required");
      return;
    }
    const whiteListedIp = await db.whiteListedIP.findMany({
      where: {
        dbName: { not: "databridge" },
      },
      include: {
        project: true,
      },
    });
    let contentToWrite = [
      `local all all trust`,
      "host all all 127.0.0.1/32 trust",
      `ost all all ::1/128 trust`,
      `host all all ${envConf.PRIVATE_IP}/32 scram-sha-256`,
    ];

    let newIpRules = whiteListedIp?.map((it) => {
      return `host ${it.project?.dbName} ${it.project.dbUser} ${it.ip}/${
        it.ip === "0.0.0.0" ? "0" : "32"
      } scram-sha-256`;
    });

    contentToWrite = [...contentToWrite, ...newIpRules];
    fs.writeFileSync(
      "./pgconfig/pg_hba.conf",
      contentToWrite.map((it) => it.trim()).join("\n") + "\n\n"
    );

    execSync(
      `docker exec databridge-database psql -U ${envConf.DATABASE_ADMIN_USER} -c "SELECT pg_reload_conf();"`
    );

    const data = await db.whiteListedIP.updateManyAndReturn({
      where: {
        isActive: false,
      },
      data: {
        isActive: true,
      },
    });

    console.log(data);

    dirtyBitForWhitelistingDB.cleanBit();
    logger.info("updated pg_conf");
  } catch (error: any) {
    logger.error(error.message);
  }
});
