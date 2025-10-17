import crypto from "crypto";
import { Pool } from "pg";
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

  async getDatabasesForUser({platformUsername}:{platformUsername: string}): Promise<string[]> {
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
}
