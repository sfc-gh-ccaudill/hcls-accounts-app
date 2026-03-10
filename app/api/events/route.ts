import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      account_id, user_id, title, event_type, location_type, 
      event_date, event_time, attendees, objective, notes,
      follow_ups
    } = body;
    
    const result = await query<{ID: number}>(`
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
    
    const eventIdResult = await query<{ID: number}>(`SELECT MAX(ID) as ID FROM HCLS_ACCOUNTS.PUBLIC.EVENTS WHERE ACCOUNT_ID = ${account_id}`);
    const eventId = eventIdResult[0]?.ID;
    
    if (follow_ups && Array.isArray(follow_ups) && follow_ups.length > 0 && eventId) {
      for (const followUp of follow_ups) {
        if (followUp.description?.trim()) {
          await query(`
            INSERT INTO HCLS_ACCOUNTS.PUBLIC.ACTION_ITEMS (ACCOUNT_ID, EVENT_ID, DESCRIPTION, DUE_DATE, ASSIGNED_TO, OWNER_ID)
            VALUES (
              ${account_id},
              ${eventId},
              '${followUp.description.replace(/'/g, "''")}',
              ${followUp.due_date ? `'${followUp.due_date}'` : 'NULL'},
              ${followUp.assigned_to ? `'${followUp.assigned_to.replace(/'/g, "''")}'` : 'NULL'},
              ${followUp.owner_id || 'NULL'}
            )
          `);
        }
      }
    }
    
    return NextResponse.json({ success: true, event_id: eventId });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, event_type, location_type, event_date, event_time, attendees, objective, notes } = body;
    
    await query(`
      UPDATE HCLS_ACCOUNTS.PUBLIC.EVENTS SET
        TITLE = '${title.replace(/'/g, "''")}',
        EVENT_TYPE = '${event_type.replace(/'/g, "''")}',
        LOCATION_TYPE = '${location_type.replace(/'/g, "''")}',
        EVENT_DATE = '${event_date}',
        EVENT_TIME = ${event_time ? `'${event_time}'` : 'NULL'},
        ATTENDEES = ${attendees ? `'${attendees.replace(/'/g, "''")}'` : 'NULL'},
        OBJECTIVE = ${objective ? `'${objective.replace(/'/g, "''")}'` : 'NULL'},
        NOTES = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}
      WHERE ID = ${id}
    `);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }
    
    await query(`DELETE FROM HCLS_ACCOUNTS.PUBLIC.ACTION_ITEMS WHERE EVENT_ID = ${id}`);
    await query(`DELETE FROM HCLS_ACCOUNTS.PUBLIC.EVENTS WHERE ID = ${id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
