import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// テスト環境ではTEST_DATABASE_URLを使用
const connectionString =
  process.env.NODE_ENV === "test" || process.env.E2E_TEST === "true"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    `${process.env.NODE_ENV === "test" ? "TEST_DATABASE_URL" : "DATABASE_URL"} is not set in environment variables`,
  );
}

const poolConnection = mysql.createPool(connectionString);

export const db = drizzle(poolConnection, {
  schema,
  mode: "default",
});

export { schema };
export type * from "./schema";
