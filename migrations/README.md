# Database Migration Scripts

This folder contains SQL migration scripts for setting up and managing the database schema for the project. Each script corresponds to a specific table or set of changes in the database. The scripts must be run in the specified order to maintain foreign key dependencies. The easiest way to run these is in Supabase's web SQL editor.

## Creating the database
1. `001_create_users_table.sql`
2. `002_create_categories_table.sql`
3. `003_create_resumes_table.sql`