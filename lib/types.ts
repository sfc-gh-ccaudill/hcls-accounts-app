export interface User {
  ID: number;
  NAME: string;
  EMAIL: string | null;
  CREATED_AT: string;
}

export interface Account {
  ID: number;
  NAME: string;
  INDUSTRY: string;
  DESCRIPTION: string | null;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export interface Event {
  ID: number;
  ACCOUNT_ID: number;
  USER_ID: number | null;
  TITLE: string;
  EVENT_TYPE: string;
  LOCATION_TYPE: string;
  EVENT_DATE: string;
  EVENT_TIME: string | null;
  ATTENDEES: string | null;
  OBJECTIVE: string | null;
  NOTES: string | null;
  CREATED_AT: string;
}

export interface UseCase {
  ID: number;
  ACCOUNT_ID: number;
  TITLE: string;
  PRIORITY: number | null;
  ESTIMATED_VALUE: number | null;
  STAGE: string | null;
  ACCOUNT_EXECUTIVE: string | null;
  SOLUTION_ENGINEER: string | null;
  OWNER_ID: number | null;
  DESCRIPTION: string | null;
  SALESFORCE_LINK: string | null;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export interface UseCaseActivity {
  ID: number;
  USE_CASE_ID: number;
  USER_ID: number | null;
  ACTIVITY_TYPE: string | null;
  DESCRIPTION: string | null;
  CREATED_AT: string;
}

export interface AccountSummary extends Account {
  LAST_EVENT_DATE: string | null;
  USE_CASE_COUNT: number;
  TOTAL_VALUE: number | null;
}

export interface UseCaseWithDetails extends UseCase {
  ACCOUNT_NAME: string;
  OWNER_NAME: string | null;
  LATEST_ACTIVITY: string | null;
  LATEST_ACTIVITY_DATE: string | null;
}

export interface UserActivity {
  USER_ID: number;
  USER_NAME: string;
  ACCOUNT_ID: number;
  ACCOUNT_NAME: string;
  EVENT_ID: number | null;
  EVENT_TITLE: string | null;
  EVENT_DATE: string | null;
  EVENT_TYPE: string | null;
  USE_CASE_ID: number | null;
  USE_CASE_TITLE: string | null;
}
