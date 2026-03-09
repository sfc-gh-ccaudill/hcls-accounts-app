import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { Account, Event, UseCase } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [account] = await query<Account>(`
      SELECT * FROM HCLS_ACCOUNTS.PUBLIC.ACCOUNTS WHERE ID = ${id}
    `);
    
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const events = await query<Event & { USER_NAME: string }>(`
      SELECT e.*, u.NAME as USER_NAME
      FROM HCLS_ACCOUNTS.PUBLIC.EVENTS e
      LEFT JOIN HCLS_ACCOUNTS.PUBLIC.USERS u ON e.USER_ID = u.ID
      WHERE e.ACCOUNT_ID = ${id}
      ORDER BY e.EVENT_DATE DESC, e.EVENT_TIME DESC
    `);

    const useCases = await query<UseCase & { OWNER_NAME: string }>(`
      SELECT uc.*, u.NAME as OWNER_NAME
      FROM HCLS_ACCOUNTS.PUBLIC.USE_CASES uc
      LEFT JOIN HCLS_ACCOUNTS.PUBLIC.USERS u ON uc.OWNER_ID = u.ID
      WHERE uc.ACCOUNT_ID = ${id}
      ORDER BY uc.PRIORITY ASC, uc.ESTIMATED_VALUE DESC
    `);

    return NextResponse.json({ account, events, useCases });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
  }
}
