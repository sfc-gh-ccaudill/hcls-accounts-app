# HCLS Accounts Tracker

A React/Next.js web application for tracking customer accounts, events, and use cases for HCLS team collaboration.

## Features

- **Home Page**: Overview of all customer accounts with summary metrics (last meeting date, use case count, pipeline value)
- **Account Detail**: Drill into specific accounts to:
  - Log events (meetings, workshops, demos, etc.)
  - Track use cases with priority, value, stage, and ownership
- **Team Activity**: Weekly view showing what each team member is working on
- **Priority Use Cases**: Dashboard of top P1-P3 priority use cases with activity tracking

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Snowflake for data storage

## Database Schema

Tables are created in `HCLS_ACCOUNTS.PUBLIC`:
- `users` - Team members (Chris, Joel, Andy)
- `accounts` - Customer accounts
- `events` - Meeting/event logs
- `use_cases` - Active use cases with details
- `use_case_activity` - Activity/status updates on use cases

## Running Locally

```bash
npm install
npm run dev
```

Note: Local development requires Snowflake authentication. Set `SNOWFLAKE_CONNECTION_NAME=<your-connection>` environment variable.

## Deployment to SPCS

1. Build and push the Docker image:
```bash
docker build -t hcls-accounts-app .
docker tag hcls-accounts-app <repo>/hcls-accounts-app
docker push <repo>/hcls-accounts-app
```

2. Create the SPCS service with OAuth-enabled ingress

The app automatically uses OAuth tokens when running in SPCS (reads from `/snowflake/session/token`).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SNOWFLAKE_CONNECTION_NAME` | Named connection for local dev | - |
| `SNOWFLAKE_ACCOUNT` | Snowflake account identifier | SFSENORTHAMERICA-CCAUDILL-AWS2 |
| `SNOWFLAKE_DATABASE` | Database name | HCLS_ACCOUNTS |
| `SNOWFLAKE_SCHEMA` | Schema name | PUBLIC |
| `SNOWFLAKE_WAREHOUSE` | Warehouse name | COMPUTE_WH |
