# BrainBee Team Feature Upgrade

This document provides instructions for upgrading your BrainBee application to support teams.

## Overview

The BrainBee application has been upgraded to support team-based participation. Teams can now register with:
- A team name
- Team leader (name and email)
- 2-5 team members (names and optional emails)

## Database Changes

A new `team_info` column has been added to the `user_quiz_scores` table to store team information in JSONB format.

### Running the Migration

You have several options to run the database migration:

#### Option 1: Run the provided script

```bash
# Install dependencies if needed
npm install dotenv

# Run the migration script
node run-migration.js
```

#### Option 2: Manual migration via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `migrations/add_team_info_column.sql`
4. Paste into the SQL Editor and run

## Features Added

1. **Team Registration Form**
   - Team name field
   - Team leader information
   - Dynamic addition of up to 5 team members
   - Required minimum of 2 team members

2. **Duplicate Prevention**
   - Checks if team leader or any team member has already participated
   - Shows specific error message identifying which team member has already participated

3. **Enhanced BrainBee Session**
   - Shows team information during the quiz
   - Displays all team members on completion screen

4. **Leaderboard Improvements**
   - Team indicators in the leaderboard
   - Expandable team member details
   - Visual indicators for teams vs individual participants

## Database Structure

The `team_info` column in `user_quiz_scores` uses the following JSON structure:

```json
{
  "leader": {
    "name": "Leader Name",
    "email": "leader@example.com"
  },
  "members": [
    {
      "name": "Member 1 Name",
      "email": "member1@example.com"
    },
    {
      "name": "Member 2 Name",
      "email": "member2@example.com"
    }
    // ... additional members
  ]
}
```

## SQL Functions Added

Two SQL functions have been added to help with team-related queries:

1. `find_teams_with_member(member_email TEXT)` - Finds all teams where a specific email participated
2. `get_team_details(score_id UUID)` - Gets complete team details for a specific score record

## Backward Compatibility

The upgrade maintains backward compatibility with existing data:
- Solo participants will still be displayed correctly on the leaderboard
- Existing participants can continue to use the system as before
- The BrainBee session handles both team and solo participant data formats

## Testing

After deployment, test the following:

1. Create a new BrainBee
2. Register a team and complete the BrainBee
3. Verify the team appears correctly on the leaderboard
4. Try registering with an email that already participated (should be prevented)
5. Check the expandable team details in the leaderboard 