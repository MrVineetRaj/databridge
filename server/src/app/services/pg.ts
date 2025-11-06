import crypto from "crypto";
import { Pool, Client } from "pg";
import format from "pg-format";
import { envConf } from "../lib/envConf";
import logger, { loggerMetadata } from "../lib/logger";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { cloudinaryServices } from "./cloudinary";
import { db } from "../lib/db";
import { UploadApiResponse } from "cloudinary";

export const adminPool = new Pool({
  host: "localhost",
  port: 5432,
  user: envConf.DATABASE_ADMIN_USER,
  password: envConf.DATABASE_ADMIN_PASSWORD,
  database: "postgres", // Connect to the default 'postgres' db to run CREATE DATABASE
});

class PGClassResults<T = null> {
  message: string;
  success: boolean;
  data: T;
  constructor({
    message,
    success,
    data,
  }: {
    message: string;
    success: boolean;
    data?: T;
  }) {
    this.message = message;
    this.success = success;
    if (data) {
      this.data = data;
    } else {
      this.data = null as T;
    }
  }
}
export class PostgresServices {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async adminInitialization({ dbName }: { dbName: string }) {
    const client = await this.pool.connect();

    try {
      const newDbClient = new Pool({
        user: envConf.DATABASE_ADMIN_USER,
        host: "localhost",
        password: envConf.DATABASE_ADMIN_PASSWORD,
        database: dbName,
        port: 5432,
      });

      const subClient = await newDbClient.connect();

      try {
        await subClient.query(
          "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
        );
        await subClient.query("CREATE EXTENSION IF NOT EXISTS dblink;");

        console.log(`📊 pg_stat_statements enabled in ${dbName}`);
      } finally {
        subClient.release();
        await newDbClient.end();
      }

      console.log(`✅ Successfully intiialized database ${dbName}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`Failed to create database infrastructure.`);
    } finally {
      client.release();
    }
  }
  // Updated to create a full database per project
  async createProjectInfrastructure(input: {
    username: string; // This is your platform's user ID/name
    projectTitle: string;
  }) {
    const { username, projectTitle } = input;

    const sanitizedProjectTitle = projectTitle
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .toLowerCase();

    // Create unique identifiers for the new user and database
    const dbUsername = `${username}_${sanitizedProjectTitle}`;
    const dbPassword = crypto.randomBytes(12).toString("hex");
    // The new database name will also be unique
    const dbName = `${sanitizedProjectTitle}_${crypto
      .randomBytes(4)
      .toString("hex")}_db`;

    const client = await this.pool.connect();

    try {
      // 1. Create the new user. We grant CREATEDB as requested for full capabilities.
      const createUserQuery = format(
        "CREATE USER %I WITH PASSWORD %L CREATEDB;",
        dbUsername,
        dbPassword
      );

      await client.query(createUserQuery);

      // 2. Create the new database and assign the new user as the OWNER.
      // Ownership grants all privileges on the database automatically.
      const createDbQuery = format(
        "CREATE DATABASE %I WITH OWNER %I;",
        dbName,
        dbUsername
      );
      await client.query(createDbQuery);
      const newDbClient = new Pool({
        user: envConf.DATABASE_ADMIN_USER,
        host: "localhost",
        password: envConf.DATABASE_ADMIN_PASSWORD,
        database: dbName,
        port: 5432,
      });

      const subClient = await newDbClient.connect();

      try {
        await subClient.query(
          "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
        );
        await subClient.query("CREATE EXTENSION IF NOT EXISTS dblink;");

        console.log(`📊 pg_stat_statements enabled in ${dbName}`);
      } finally {
        subClient.release();
        await newDbClient.end();
      }

      console.log(
        `✅ Successfully created user ${dbUsername} and database ${dbName}`
      );

      return {
        dbUsername,
        dbPassword,
        dbName, // Return the new database name
      };
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(
        `❌ Error creating infrastructure for project ${projectTitle}:`,
        (err as Error).message
      );
      throw new Error(`Failed to create database infrastructure.`);
    } finally {
      client.release();
    }
  }

  async changeDbPassword({
    dbName,
    dbUserName,
    dbPassword,
  }: {
    dbName: string;
    dbUserName: string;
    dbPassword: string;
  }) {
    const client = new Client({
      user: dbUserName,
      password: dbPassword, // current password
      database: dbName,
      host: "localhost", // or your DB host
      port: 5432, // default postgres port
    });

    const newPassword = crypto.randomBytes(12).toString("hex");

    try {
      await client.connect();

      // Parameterized query for safety (though pg doesn’t parametrize identifiers)
      const query = `ALTER USER ${dbUserName} WITH PASSWORD '${newPassword}';`;

      await client.query(query);

      return new PGClassResults<string>({
        message: "Password changed successfully",
        success: true,
        data: newPassword,
      });
    } catch (err) {
      if (err instanceof Error) {
        console.error("❌ Error updating password:", err.message);
      }

      console.error("❌ Error updating password:", "Unknown error");
      return new PGClassResults<string>({
        message: "❌ Error updating password",
        success: false,
        data: "",
      });
    } finally {
      await client.end();
    }
  }

  async getDatabasesForUser({
    platformUsername,
  }: {
    platformUsername: string;
  }): Promise<
    {
      datname: string;
      size: string;
      sizeBytes: number;
      activeConnections: number;
      totalOperations: number;
    }[]
  > {
    const userPattern = `${platformUsername}%`;

    const query = format(
      `SELECT 
        d.datname,
        pg_size_pretty(pg_database_size(d.datname)) as size,
        pg_database_size(d.datname) as size_bytes,
        COALESCE(active_conn.active_connections, 0) as active_connections,
        COALESCE(s.tup_returned + s.tup_fetched + s.tup_inserted + s.tup_updated + s.tup_deleted, 0) as total_operations
      FROM pg_database d
      JOIN pg_user u ON d.datdba = u.usesysid
      LEFT JOIN pg_stat_database s ON d.oid = s.datid
      LEFT JOIN (
        SELECT 
          datname, 
          COUNT(*) as active_connections
        FROM pg_stat_activity 
        WHERE state = 'active' 
        GROUP BY datname
      ) active_conn ON d.datname = active_conn.datname
      WHERE u.usename LIKE %L
      ORDER BY d.datname;`,
      userPattern
    );

    try {
      const result = await this.pool.query(query);

      return result.rows.map((row) => ({
        datname: row.datname,
        size: row.size,
        sizeBytes: parseInt(row.size_bytes, 10),
        activeConnections: parseInt(row.active_connections, 10),
        totalOperations: parseInt(row.total_operations, 10),
      }));
    } catch (error) {
      console.error(
        `Failed to fetch databases for ${platformUsername}:`,
        (error as Error).message
      );
      throw new Error("Could not fetch databases.");
    }
  }
  //   async getTablesForDatabase({
  //     dbUserName,
  //     dbName,
  //   }: {
  //     dbUserName: string;
  //     dbName: string;
  //   }): Promise<string[]> {
  //     // We will list all tables owned by this dbUserName inside dbName
  //     const query = format(
  //       `
  //   SELECT n.nspname AS schema_name,
  //          c.relname AS table_name
  //   FROM pg_class c
  //   JOIN pg_namespace n ON n.oid = c.relnamespace
  //   JOIN pg_roles r ON r.oid = c.relowner
  //   WHERE c.relkind = 'r'
  //     AND n.nspname NOT IN ('pg_catalog', 'information_schema');
  // `,
  //       dbUserName
  //     );

  //     try {
  //       // Ensure you're connected to the target database (dbName)
  //       // const client = await this.pool.connect();
  //       await this.pool.query(`SET search_path TO ${dbName};`);

  //       const result = await this.pool.query(query);

  //       // Map to array of strings like ['users', 'orders', 'transactions']
  //       return result.rows
  //         .map((row) => `${row.table_name}`)
  //         .filter((it) => !it.startsWith("_"));
  //     } catch (error) {
  //       console.error(
  //         `Failed to fetch tables for ${dbUserName} in ${dbName}:`,
  //         (error as Error).message
  //       );
  //       throw new Error("Could not fetch tables.");
  //     }
  //   }

  async getTablesForDatabase({
    dbUserName,
    dbName,
    dbPassword,
  }: {
    dbUserName: string;
    dbName: string;
    dbPassword: string;
  }): Promise<{ tableName: string; primaryKey: string }[]> {
    const query = `
SELECT
  c.relname AS table_name,
  a.attname AS primary_key_column
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attnum = ANY(con.conkey) AND a.attrelid = c.oid
WHERE con.contype = 'p'  -- 'p' = PRIMARY KEY
  AND n.nspname NOT IN ('pg_catalog', 'information_schema');
`;

    try {
      // Must connect to the right database
      const client = new Pool({
        user: dbUserName,
        host: "localhost",
        database: dbName,
        password: dbPassword, // or inject from env
        port: 5432,
      });

      // const result = await client.query(query, [dbUserName]);
      const result = await client.query(query);

      await client.end();

      return result.rows.map((row) => {
        return {
          tableName: row.table_name,
          primaryKey: row.primary_key_column,
        };
      });
      // return ["hello"];
    } catch (error) {
      logger.error(
        `Failed to fetch tables for ${dbUserName} in ${dbName}:`,
        (error as Error).message
      );
      throw new Error("Could not fetch tables.");
    }
  }
  async getTableContentPaginated({
    dbName,
    tableName,
    page = 1,
    limit = 20,
    dbUserName,
    dbPassword,
  }: {
    dbName: string;
    tableName: string;
    page?: number;
    limit?: number;
    dbUserName: string;
    dbPassword: string;
  }) {
    const offset = (page - 1) * limit;
    let schema = "public";
    let pureTable = tableName;

    if (tableName.includes(".")) {
      const [sch, tbl] = tableName.split(".");
      schema = sch as string;
      pureTable = tbl as string;
    }

    try {
      // Safe, parameterized query
      // Detect if table name is quoted (case-sensitive)
      const isQuoted = pureTable.startsWith('"') && pureTable.endsWith('"');
      const safeQuery = isQuoted
        ? `SELECT * FROM ${schema}.${pureTable} OFFSET ${offset} LIMIT ${limit};`
        : format(
            `SELECT * FROM %I.%I OFFSET %L LIMIT %L;`,
            schema,
            pureTable,
            offset,
            limit
          );

      const safeCountQuery = isQuoted
        ? `SELECT COUNT(*) AS total FROM ${schema}.${pureTable};`
        : format(`SELECT COUNT(*) AS total FROM %I.%I;`, schema, pureTable);

      const client = new Pool({
        user: dbUserName,
        host: "localhost",
        database: dbName,
        password: dbPassword, // or inject from env
        port: 5432,
      });
      const [dataResult, countResult] = await Promise.all([
        client.query(safeQuery),
        client.query(safeCountQuery),
      ]);

      client.end();

      const total = parseInt(countResult.rows[0].total, 10);
      const totalPages = Math.ceil(total / limit);

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error(
        `❌ Failed to fetch paginated data for table ${tableName} in DB ${dbName}:`,
        error
      );
      throw new Error("Could not fetch table data.");
    }
  }

  async deleteItemFromDatabase({
    dbName,
    dbPassword,
    dbUserName,
    primaryKey,
    primaryKeyValues,
    tableName,
  }: {
    dbUserName: string;
    dbName: string;
    dbPassword: string;
    tableName: string;
    primaryKey: string;
    primaryKeyValues: string[];
  }) {
    if (!/^[a-zA-Z0-9_]+$/.test(tableName))
      throw new Error("Invalid table name");
    if (!/^[a-zA-Z0-9_]+$/.test(primaryKey))
      throw new Error("Invalid primary key column name");

    const placeholders = primaryKeyValues
      .map((_, index) => `$${index + 1}`)
      .join(", ");

    const query = format(
      `DELETE FROM %I.%I WHERE %I IN (${placeholders})`,
      "public",
      tableName,
      primaryKey
    );

    console.log("Executing:", query, "with value:", primaryKeyValues);

    try {
      // Must connect to the right database
      const client = new Pool({
        user: dbUserName,
        host: "localhost",
        database: dbName,
        password: dbPassword, // or inject from env
        port: 5432,
      });

      const result = await client.query(query, primaryKeyValues);

      await client.end();

      return new PGClassResults({
        success: true,
        message: `Affected rows ${result.rowCount}`,
      });
    } catch (error) {
      logger.error(
        `Failed to Delete items from table for ${dbUserName} in ${dbName}:`,
        error
      );
      throw new Error(
        `Failed to Delete items from table for ${dbUserName} in ${dbName}:`
      );
    }
  }

  async searchItemsUsingSqlQuery({
    dbName,
    dbPassword,
    dbUserName,
    sqlQuery,
  }: {
    dbUserName: string;
    dbName: string;
    dbPassword: string;
    sqlQuery: string;
  }) {
    try {
      // Must connect to the right database
      const client = new Pool({
        user: dbUserName,
        host: "localhost",
        database: dbName,
        password: dbPassword, // or inject from env
        port: 5432,
      });

      // const result = await client.query(query, [dbUserName]);
      const result = await client.query(sqlQuery);

      await client.end();

      // return result.rows;
      return new PGClassResults<typeof result.rows>({
        success: true,
        message: `Affected rows ${result.rowCount}`,
        data: result.rows,
      });
      // return ["hello"];
    } catch (error) {
      logger.error(
        `Failed to fetch content for search query for ${dbUserName} in ${dbName}:`,
        error
      );
      throw new Error(
        `Failed to fetch content for search query for ${dbUserName} in ${dbName}`
      );
    }
  }
  async updateMultipleRows({
    dbName,
    dbPassword,
    dbUserName,
    sqlQuery,
  }: {
    dbUserName: string;
    dbName: string;
    dbPassword: string;
    sqlQuery: string;
  }) {
    try {
      // Must connect to the right database
      const client = new Pool({
        user: dbUserName,
        host: "localhost",
        database: dbName,
        password: dbPassword, // or inject from env
        port: 5432,
      });

      // const result = await client.query(query, [dbUserName]);
      const result = await client.query(sqlQuery);

      await client.end();

      return new PGClassResults<typeof result.rows>({
        success: true,
        message: `Affected rows ${result.rowCount}`,
        data: result.rows,
      });
    } catch (error) {
      logger.error(
        `Failed to update rows for ${dbUserName} in ${dbName}:`,
        error
      );
      throw new Error(`Failed to update rows for ${dbUserName} in ${dbName}:`);
    }
  }
  async findIdleDatabasesWithDataActivity(idleDays = 7) {
    const client = await this.pool.connect();

    try {
      const query = `
      SELECT
        d.datname as database_name,
        r.rolname as owner_username,
        pg_size_pretty(pg_database_size(d.datname)) as size,
        COALESCE(COUNT(psa.pid), 0) as active_connections,
        EXTRACT(EPOCH FROM (NOW() - s.stats_reset)) / 86400 as days_since_stats_reset,
        s.tup_returned as tuples_read,
        s.tup_fetched as tuples_fetched,
        s.tup_inserted as tuples_inserted,
        s.tup_updated as tuples_updated,
        s.tup_deleted as tuples_deleted,
        (s.tup_returned + s.tup_fetched + s.tup_inserted + s.tup_updated + s.tup_deleted) as total_operations,
        CASE 
          WHEN (s.tup_returned + s.tup_fetched + s.tup_inserted + s.tup_updated + s.tup_deleted) = 0 
          THEN 'Never Used'
          WHEN s.stats_reset < NOW() - INTERVAL '${idleDays} days' 
          THEN 'Idle'
          ELSE 'Active'
        END as status
      FROM pg_database d
      LEFT JOIN pg_roles r ON d.datdba = r.oid
      LEFT JOIN pg_stat_database s ON d.oid = s.datid
      LEFT JOIN pg_stat_activity psa ON d.oid = psa.datid
      WHERE 
        d.datname NOT IN ('postgres', 'template0', 'template1')
      GROUP BY d.datname, r.rolname, s.stats_reset, s.tup_returned, s.tup_fetched, 
               s.tup_inserted, s.tup_updated, s.tup_deleted
      HAVING 
        (s.tup_returned + s.tup_fetched + s.tup_inserted + s.tup_updated + s.tup_deleted) = 0
        OR s.stats_reset < NOW() - INTERVAL '${idleDays} days'
      ORDER BY total_operations ASC, s.stats_reset DESC;
    `;

      const result = await client.query(query);
      return result.rows;
    } catch (err) {
      console.error("Error finding idle databases:", (err as Error).message);
      throw err;
    } finally {
      client.release();
    }
  }

  async pauseUserAccessForDatabases({
    databaseNames,
  }: {
    databaseNames: string[];
  }) {
    const client = await this.pool.connect();

    try {
      // Terminate all connections to these specific databases
      await client.query(
        `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = ANY($1) AND pid <> pg_backend_pid();
      `,
        [databaseNames]
      );

      // Revoke privileges only on the specific databases (not all)
      for (const dbName of databaseNames) {
        await client.query(
          format("REVOKE ALL PRIVILEGES ON DATABASE %I FROM PUBLIC;", dbName)
        );
        console.log(`⏸️  Paused access for database: ${dbName}`);
      }

      logger.info(
        `Databases paused`,
        loggerMetadata.system({
          filePath: __filename,
          description: `Paused databases: ${databaseNames.join(", ")}`,
        })
      );

      return { paused: true, databases: databaseNames };
    } catch (err) {
      console.error(`Error pausing databases:`, (err as Error).message);
      throw err;
    } finally {
      client.release();
    }
  }

  // Resume specific databases later
  async resumeUserAccessForDatabases({
    databaseNames,
  }: {
    databaseNames: string[];
  }) {
    const client = await this.pool.connect();

    try {
      for (const dbName of databaseNames) {
        await client.query(
          format("GRANT ALL PRIVILEGES ON DATABASE %I TO PUBLIC;", dbName)
        );
        console.log(`▶️  Resumed access for database: ${dbName}`);
      }

      return { resumed: true, databases: databaseNames };
    } catch (err) {
      console.error(`Error resuming databases:`, (err as Error).message);
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteIdleDatabase({
    inactiveDatabaseNames,
  }: {
    inactiveDatabaseNames: string[];
  }) {
    const client = await this.pool.connect();

    try {
      // 1. Terminate all connections to these databases
      await client.query(
        `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = ANY($1) AND pid <> pg_backend_pid();
    `,
        [inactiveDatabaseNames] // ✅ Fixed: pass array directly
      );

      // 2. Delete each database
      for (const dbName of inactiveDatabaseNames) {
        await client.query(
          format("DROP DATABASE IF EXISTS %I;", dbName) // ✅ Use format() for safety
        );
      }

      logger.info(
        `databases deleted`,
        loggerMetadata.system({
          filePath: __filename,
          description: `Deleted databases were ${inactiveDatabaseNames.join(
            ", "
          )}`,
        })
      );

      return { success: true, deleted: inactiveDatabaseNames };
    } catch (err) {
      console.error(
        `❌ Error deleting database ${inactiveDatabaseNames}:`,
        (err as Error).message
      );
      throw err;
    } finally {
      client.release();
    }
  }

  async createDatabaseBackup({
    dbName,
  }: {
    dbName: string;
  }): Promise<UploadApiResponse> {
    const backupsDir = path.join(process.cwd(), "sql-dumps");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const backupFile = path.join(
      backupsDir,
      `${dbName}_backup_${Date.now()}.sql`
    );

    try {
      execSync(
        `docker exec -t databridge-database pg_dump -U ${envConf.DATABASE_ADMIN_USER} ${dbName} > "${backupFile}"`,
        {
          env: {
            ...process.env,
            PGPASSWORD: envConf.DATABASE_ADMIN_PASSWORD,
          },
          shell: "/bin/bash", // required for the redirection (">") to work
        }
      );

      const cloudinaryResult =
        await cloudinaryServices.uploadBackupToCloudinary({
          backupFilePath: backupFile,
        });

      return cloudinaryResult.result;
    } catch (err: any) {
      console.error("pg_dump failed:", err.stderr?.toString() || err.message);
      throw err;
    }
  }

  async getAnalytics({
    dbUserName,
    dbName,
    dbPassword,
  }: {
    dbUserName: string;
    dbName: string;
    dbPassword: string;
  }) {
    const client = new Client({
      user: envConf.DATABASE_ADMIN_USER,
      host: "localhost",
      database: dbName,
      password: envConf.DATABASE_ADMIN_PASSWORD,
      port: 5432,
    });

    const sqlQuery = `
SELECT
  CASE
    WHEN query ILIKE 'select%' THEN 'SELECT'
    WHEN query ILIKE 'insert%' THEN 'INSERT'
    WHEN query ILIKE 'update%' THEN 'UPDATE'
    WHEN query ILIKE 'delete%' THEN 'DELETE'
    WHEN query ILIKE 'alter%'  THEN 'ALTER'
    WHEN query ILIKE 'drop%'   THEN 'DROP'
    ELSE 'OTHER'
  END AS query_type,
  COUNT(*) AS total_unique_queries,
  SUM(calls) AS total_calls,
  ROUND(AVG(mean_exec_time)::numeric, 3) AS avg_exec_time_ms,
  ROUND(SUM(total_exec_time)::numeric, 3) AS total_exec_time_ms
FROM pg_stat_statements
GROUP BY query_type
ORDER BY total_calls ASC;

    `;

    try {
      await client.connect();
      await client.query("CREATE EXTENSION IF NOT EXISTS pg_stat_statements;");
      const result = await client.query(sqlQuery);

      return new PGClassResults<typeof result.rows>({
        success: true,
        message: `Retrieved ${result.rowCount} analytics rows`,
        data: result.rows.filter(
          (it: { query_type: string }) => it.query_type != "OTHER"
        ),
      });
    } catch (error: any) {
      console.log(error);
      if (error.message.includes("pg_stat_statements")) {
        logger.warn(
          `pg_stat_statements not enabled for ${dbName} (user ${dbUserName})`
        );
        throw new Error(
          "pg_stat_statements extension not enabled for this database."
        );
      }

      logger.error(
        `Failed to fetch query analytics for ${dbUserName} in ${dbName}:`,
        error
      );
      throw new Error("Could not fetch analytics data.");
    } finally {
      await client.end();
    }
  }
  async resetAllAnalytics() {
    logger.info("🧹 Starting global analytics reset across all databases...");

    try {
      const { rows } = await this.pool.query(`
      SELECT datname
      FROM pg_database
      WHERE datistemplate = false
        AND datallowconn = true
        AND datname NOT IN ('postgres')
      ORDER BY datname;
    `);

      const temp = [
        "databridge",
        "80e372048afe24c26980ec67e6a91fa65012",
        "postgres",
      ];

      // Process databases in parallel with limited concurrency
      const resetPromises = rows
        .filter(({ datname }) => !temp.includes(datname))
        .map(async ({ datname }) => {
          try {
            const dbPool = new Pool({
              user: envConf.DATABASE_ADMIN_USER,
              host: "localhost",
              database: datname,
              password: envConf.DATABASE_ADMIN_PASSWORD,
              port: 5432,
              max: 1, // Only one connection needed
            });

            await dbPool.query("SELECT pg_stat_statements_reset();");
            await dbPool.end();

            logger.info(`✅ Reset analytics for ${datname}`);
            return { success: true, database: datname };
          } catch (err: any) {
            logger.warn(
              `⚠️ Could not reset analytics for ${datname}: ${err.message}`
            );
            return { success: false, database: datname, error: err.message };
          }
        });

      const results = await Promise.allSettled(resetPromises);
      const successful = results.filter((r) => r.status === "fulfilled").length;

      return new PGClassResults({
        success: true,
        message: `Analytics reset completed for ${successful}/${results.length} databases`,
      });
    } catch (error: any) {
      throw error;
    }
  }
}
