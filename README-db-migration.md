# Database Migration for BrainBee Updates

This file contains instructions on running the SQL migrations for BrainBee functionality updates.

## What These Migrations Do

There are three migration files in this directory:

1. `add_availability_columns.sql` - Adds time-based availability fields:
   - `available_from`: Timestamp when the BrainBee becomes available
   - `available_to`: Timestamp when the BrainBee becomes unavailable

2. `add_image_columns.sql` - Adds image support for questions and answers:
   - `image_url` column to the `questions` table
   - `image_url` column to the `options` table

3. `setup_storage_bucket.sql` - Sets up the Supabase storage bucket for images:
   - Creates a `quiz-assets` bucket for storing images
   - Configures permissions to allow uploading and viewing images
   - Creates the necessary folder structure

## How to Run These Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of each SQL file one at a time
5. Run each query

### Option 2: Using psql CLI

If you have direct database access via psql:

```bash
psql -h YOUR_SUPABASE_HOST -d postgres -U postgres -f add_availability_columns.sql
psql -h YOUR_SUPABASE_HOST -d postgres -U postgres -f add_image_columns.sql
psql -h YOUR_SUPABASE_HOST -d postgres -U postgres -f setup_storage_bucket.sql
```

Replace `YOUR_SUPABASE_HOST` with your actual Supabase database host.

### Option 3: Using Supabase CLI

If you're using the Supabase CLI:

```bash
supabase db execute --file add_availability_columns.sql
supabase db execute --file add_image_columns.sql
supabase db execute --file setup_storage_bucket.sql
```

## After Running the Migrations

After adding these database columns and setting up the storage bucket, your application code should work with:

1. Time-based availability for BrainBees
2. Image uploads for both questions and answer options

The TypeScript interfaces have already been updated to include these new fields. 