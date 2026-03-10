import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET() {
  try {
    const result = await query<{CURRENT_USER: string}>(`SELECT CURRENT_USER() as CURRENT_USER`);
    const snowflakeUser = result[0]?.CURRENT_USER;
    
    if (!snowflakeUser) {
      return NextResponse.json({ user: null });
    }

    const userResult = await query<{ID: number; NAME: string}>(`
      SELECT ID, NAME FROM HCLS_ACCOUNTS.PUBLIC.USERS 
      WHERE UPPER(SNOWFLAKE_USER) = UPPER('${snowflakeUser}')
    `);

    if (userResult.length > 0) {
      return NextResponse.json({ user: userResult[0], snowflake_user: snowflakeUser });
    }

    return NextResponse.json({ user: null, snowflake_user: snowflakeUser });
  } catch (error) {
    console.error("Error getting current user:", error);
    return NextResponse.json({ user: null });
  }
}
