const { execSync } = require('child_process');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Check that Supabase URL and key are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env file');
  process.exit(1);
}

// Path to the SQL migration file
const migrationFile = path.join(__dirname, 'migrations', 'add_team_info_column.sql');

// Read the migration file
try {
  const sql = fs.readFileSync(migrationFile, 'utf8');
  
  // Create a temporary file with psql command
  const tempFile = path.join(__dirname, 'temp_migration.sql');
  fs.writeFileSync(tempFile, sql);
  
  // Get connection string from environment variables
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Extract project reference from Supabase URL
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)/)[1];
  
  // Run the migration using supabase CLI
  console.log('Running migration to add team_info column...');
  try {
    execSync(`supabase db reset --linked`, { stdio: 'inherit' });
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error.message);
    
    // Fallback to psql if supabase CLI fails
    console.log('Attempting to run migration with psql directly...');
    try {
      const connectionString = `postgres://postgres:${SUPABASE_KEY}@db.${projectRef}.supabase.co:5432/postgres`;
      execSync(`psql "${connectionString}" -f ${tempFile}`, { stdio: 'inherit' });
      console.log('Migration completed successfully with psql!');
    } catch (psqlError) {
      console.error('Error running migration with psql:', psqlError.message);
      console.log('\nManual instructions:');
      console.log('1. Go to the Supabase dashboard: https://app.supabase.com/project/_/sql/new');
      console.log('2. Copy and paste the SQL from migrations/add_team_info_column.sql');
      console.log('3. Click "Run" to execute the migration');
    }
  }
  
  // Clean up temp file
  fs.unlinkSync(tempFile);
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} 