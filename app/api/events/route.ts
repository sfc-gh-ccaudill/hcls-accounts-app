import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      account_id, user_id, title, event_type, location_type, 
      event_date, event_time, attendees, objective, notes 
    } = body;
    
    await query(`
      INSERT INTO HCLS_ACCOUNTS.PUBLIC.EVENTS 
      (ACCOUNT_ID, USER_ID, TITLE, EVENT_TYPE, LOCATION_TYPE, EVENT_DATE, EVENT_TIME, ATTENDEES, OBJECTIVE, NOTES)
      VALUES (
        ${account_id}, 
        ${user_id || 'NULL'}, 
        '${title.replace(/'/g, "''")}', 
        '${event_type.replace(/'/g, "''")}', 
        '${location_type.replace(/'/g, "''")}', 
        '${event_date}', 
        ${event_time ? `'${event_time}'` : 'NULL'}, 
        ${attendees ? `'${attendees.replace(/'/g, "''")}'` : 'NULL'}, 
        ${objective ? `'${objective.replace(/'/g, "''")}'` : 'NULL'}, 
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}
      )
    `);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
