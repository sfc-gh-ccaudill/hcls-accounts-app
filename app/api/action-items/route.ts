import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export interface ActionItem {
  ID: number;
  ACCOUNT_ID: number;
  EVENT_ID: number | null;
  DESCRIPTION: string;
  DUE_DATE: string | null;
  ASSIGNED_TO: string | null;
  COMPLETED: boolean;
  COMPLETED_BY: string | null;
  COMPLETED_AT: string | null;
  CREATED_AT: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id");
    
    let sql = `SELECT * FROM HCLS_ACCOUNTS.PUBLIC.ACTION_ITEMS`;
    if (accountId) {
      sql += ` WHERE ACCOUNT_ID = ${accountId}`;
    }
    sql += ` ORDER BY COMPLETED ASC, DUE_DATE ASC NULLS LAST, CREATED_AT DESC`;
    
    const items = await query<ActionItem>(sql);
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching action items:", error);
    return NextResponse.json({ error: "Failed to fetch action items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { account_id, event_id, description, due_date, assigned_to } = body;
    
    await query(`
      INSERT INTO HCLS_ACCOUNTS.PUBLIC.ACTION_ITEMS (ACCOUNT_ID, EVENT_ID, DESCRIPTION, DUE_DATE, ASSIGNED_TO)
      VALUES (
        ${account_id},
        ${event_id || 'NULL'},
        '${description.replace(/'/g, "''")}',
        ${due_date ? `'${due_date}'` : 'NULL'},
        ${assigned_to ? `'${assigned_to.replace(/'/g, "''")}'` : 'NULL'}
      )
    `);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating action item:", error);
    return NextResponse.json({ error: "Failed to create action item" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, completed, completed_by } = body;
    
    if (completed) {
      await query(`
        UPDATE HCLS_ACCOUNTS.PUBLIC.ACTION_ITEMS 
        SET COMPLETED = TRUE, COMPLETED_BY = '${(completed_by || 'Unknown').replace(/'/g, "''")}', COMPLETED_AT = CURRENT_TIMESTAMP()
        WHERE ID = ${id}
      `);
    } else {
      await query(`
        UPDATE HCLS_ACCOUNTS.PUBLIC.ACTION_ITEMS 
        SET COMPLETED = FALSE, COMPLETED_BY = NULL, COMPLETED_AT = NULL
        WHERE ID = ${id}
      `);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating action item:", error);
    return NextResponse.json({ error: "Failed to update action item" }, { status: 500 });
  }
}
