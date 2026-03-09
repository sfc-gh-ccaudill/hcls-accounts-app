import snowflake from "snowflake-sdk";
import fs from "fs";

snowflake.configure({ logLevel: "ERROR" });

let connection: snowflake.Connection | null = null;
let cachedToken: string | null = null;

function getOAuthToken(): string | null {
  const tokenPath = "/snowflake/session/token";
  try {
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, "utf8");
    }
  } catch {
    // Not in SPCS environment
  }
  return null;
}

function getConfig(): snowflake.ConnectionOptions {
  const connectionName = process.env.SNOWFLAKE_CONNECTION_NAME;
  
  if (connectionName) {
    return {
      connection_name: connectionName,
      database: process.env.SNOWFLAKE_DATABASE || "HCLS_ACCOUNTS",
      schema: process.env.SNOWFLAKE_SCHEMA || "PUBLIC",
    } as unknown as snowflake.ConnectionOptions;
  }

  const base = {
    account: process.env.SNOWFLAKE_ACCOUNT || "SFSENORTHAMERICA-CCAUDILL-AWS2",
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH",
    database: process.env.SNOWFLAKE_DATABASE || "HCLS_ACCOUNTS",
    schema: process.env.SNOWFLAKE_SCHEMA || "PUBLIC",
  };

  const token = getOAuthToken();
  if (token) {
    return {
      ...base,
      host: process.env.SNOWFLAKE_HOST,
      token,
      authenticator: "oauth",
    };
  }

  return {
    ...base,
    username: process.env.SNOWFLAKE_USER || "CCAUDILL",
    authenticator: "EXTERNALBROWSER",
  };
}

async function getConnection(): Promise<snowflake.Connection> {
  const token = getOAuthToken();
  const connectionName = process.env.SNOWFLAKE_CONNECTION_NAME;

  if (connection && (!token || token === cachedToken)) {
    return connection;
  }

  if (connection) {
    console.log("Token changed, reconnecting");
    connection.destroy(() => {});
  }

  if (connectionName) {
    console.log("Connecting with connection name:", connectionName);
  } else if (token) {
    console.log("Connecting with OAuth token");
  } else {
    console.log("Connecting with external browser auth");
  }
  
  const conn = snowflake.createConnection(getConfig());
  await conn.connectAsync(() => {});
  connection = conn;
  cachedToken = token;
  return connection;
}

function isRetryableError(err: unknown): boolean {
  const error = err as { message?: string; code?: number };
  return !!(
    error.message?.includes("OAuth access token expired") ||
    error.message?.includes("terminated connection") ||
    error.code === 407002
  );
}

export async function query<T>(sql: string, retries = 1): Promise<T[]> {
  try {
    const conn = await getConnection();
    return await new Promise<T[]>((resolve, reject) => {
      conn.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve((rows || []) as T[]);
          }
        },
      });
    });
  } catch (err) {
    console.error("Query error:", (err as Error).message);
    if (retries > 0 && isRetryableError(err)) {
      connection = null;
      return query(sql, retries - 1);
    }
    throw err;
  }
}

export async function execute(sql: string): Promise<void> {
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText: sql,
      complete: (err) => {
        if (err) reject(err);
        else resolve();
      },
    });
  });
}
