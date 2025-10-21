import crypto from "crypto";
import { Pool, Client } from "pg";
import format from "pg-format";
import { envConf } from "../lib/envConf";

export const adminPool = new Pool({
  host: envConf.DATABASE_HOST,
  port: +envConf.DATABASE_PORT!,
  user: envConf.DATABASE_ADMIN_USER,
  password: envConf.DATABASE_ADMIN_PASSWORD,
  database: "postgres", // Connect to the default 'postgres' db to run CREATE DATABASE
});

export class PostgresServices {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
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

  async getDatabasesForUser({
    platformUsername,
  }: {
    platformUsername: string;
  }): Promise<string[]> {
    // We look for DB owners that start with the platform username, e.g., 'vineet_%'
    const userPattern = `${platformUsername}%`;

    const query = format(
      `SELECT d.datname FROM pg_database d
       JOIN pg_user u ON d.datdba = u.usesysid
       WHERE u.usename LIKE %L;`,
      userPattern
    );

    try {
      const result = await this.pool.query(query);
      // The result is an array of objects, so we map it to an array of strings
      return result.rows.map((row) => row.datname);
    } catch (error) {
      console.error(
        `Failed to fetch databases for ${platformUsername}:`,
        (error as Error).message
      );
      throw new Error("Could not fetch databases.");
    }
  }

  async getTablesForDatabase({
    dbUserName,
    dbName,
  }: {
    dbUserName: string;
    dbName: string;
  }): Promise<string[]> {
    // We will list all tables owned by this dbUserName inside dbName
    const query = format(
      `
  SELECT n.nspname AS schema_name,
         c.relname AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_roles r ON r.oid = c.relowner
  WHERE c.relkind = 'r'
    AND n.nspname NOT IN ('pg_catalog', 'information_schema');
`,
      dbUserName
    );

    try {
      // Ensure you're connected to the target database (dbName)
      // const client = await this.pool.connect();
      await this.pool.query(`SET search_path TO ${dbName};`);

      const result = await this.pool.query(query);

      // Map to array of strings like ['users', 'orders', 'transactions']
      return result.rows
        .map((row) => `${row.table_name}`)
        .filter((it) => !it.startsWith("_"));
    } catch (error) {
      console.error(
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
  }: {
    dbName: string;
    tableName: string;
    page?: number;
    limit?: number;
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

      const [dataResult, countResult] = await Promise.all([
        this.pool.query(safeQuery),
        this.pool.query(safeCountQuery),
      ]);

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
}
