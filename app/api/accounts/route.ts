import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";
import { AccountSummary } from "@/lib/types";

export async function GET() {
  try {
    const accounts = await query<AccountSummary>(`
      SELECT 
        a.ID, a.NAME, a.INDUSTRY, a.DESCRIPTION, a.CREATED_AT, a.UPDATED_AT,
        MAX(e.EVENT_DATE) as LAST_EVENT_DATE,
        COUNT(DISTINCT uc.ID) as USE_CASE_COUNT,
        SUM(uc.ESTIMATED_VALUE) as TOTAL_VALUE
      FROM HCLS_ACCOUNTS.PUBLIC.ACCOUNTS a
      LEFT JOIN HCLS_ACCOUNTS.PUBLIC.EVENTS e ON a.ID = e.ACCOUNT_ID
      LEFT JOIN HCLS_ACCOUNTS.PUBLIC.USE_CASES uc ON a.ID = uc.ACCOUNT_ID
      GROUP BY a.ID, a.NAME, a.INDUSTRY, a.DESCRIPTION, a.CREATED_AT, a.UPDATED_AT
      ORDER BY a.NAME
    `);
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, industry, description } = body;
    
    await query(`
      INSERT INTO HCLS_ACCOUNTS.PUBLIC.ACCOUNTS (NAME, INDUSTRY, DESCRIPTION)
      VALUES ('${name.replace(/'/g, "''")}', '${(industry || 'HCLS').replace(/'/g, "''")}', '${(description || '').replace(/'/g, "''")}')
    `);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
