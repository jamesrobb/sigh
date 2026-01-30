# Sigh

The vibe-coded job hunt tool no one asked for!

It is a local-first job hunt management tool built with Next.js and SQLite.

## User Interface

To save you the trouble of needing to run this to see what it does, I've uploaded a [small demo video](https://jamesrobb.ca/projects/sigh/demo.mp4) to my website.

## Getting Started

Install dependencies, initialize the database, and run the app:

```bash
npm install
npm run db:init
npm run build
npm run start
```

Open http://localhost:3000 in your browser.

## Attachments

Attachments uploaded to roles will by default be placed in `./attachments`. You can override this by setting the `SIGH_ATTACHMENTS_LOCATION` environment variable. I would recommend having this set to some other location other than the project directory.

## Database

When initializing the database or migrating to new schema changes be sure to have a backup. 

The SQLite database lives at `./sigh.db` by default. You can override the location by setting the `SIGH_DB_LOCATION` environment variable. I would recommend having this set to some other location other than the project directory.

`npm run db:init` wipes the local database, applies migrations, and inserts some default values.

### Schema Migrations

In the event this app is ever updated, you might need to apply a schema migration.

Generate a new migration after schema changes:

```bash
npm run db:generate
```

Apply migrations without wiping data:

```bash
npm run db:migrate
```

## Helpful Commands


- `npm run dev`: start the dev server
- `npm run db:init`: wipe, migrate, and seed the local database
- `npm run db:generate`: create a migration from schema changes
- `npm run db:migrate`: apply migrations without wiping data
- `npm run db:studio`: open Drizzle Studio
