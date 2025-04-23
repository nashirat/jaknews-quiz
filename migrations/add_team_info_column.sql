-- Add team_info column to user_quiz_scores table to store team member information
DO $$ 
BEGIN
  -- Check if the team_info column already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_quiz_scores' AND column_name = 'team_info'
  ) THEN
    -- Add the team_info column as JSONB to store structured team data
    ALTER TABLE user_quiz_scores 
    ADD COLUMN team_info JSONB;

    -- Add a comment to explain the purpose of the new column
    COMMENT ON COLUMN user_quiz_scores.team_info IS 'Stores team information for BrainBee quizzes in JSON format, including leader and member details';
  END IF;
END $$;

-- Create index on team_info to improve query performance when searching by team member
CREATE INDEX IF NOT EXISTS idx_user_quiz_scores_team_info_gin 
ON user_quiz_scores USING GIN (team_info);

-- Create a function to search for teams where a specific user participated
CREATE OR REPLACE FUNCTION find_teams_with_member(member_email TEXT)
RETURNS TABLE (
  id UUID,
  quiz_id UUID,
  team_name TEXT,
  score INTEGER,
  completed_at TIMESTAMPTZ,
  leader_name TEXT,
  leader_email TEXT,
  members JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uqs.id,
    uqs.quiz_id,
    uqs.user_name AS team_name,
    uqs.score,
    uqs.completed_at,
    (team_info->>'leader')::JSONB->>'name' AS leader_name,
    (team_info->>'leader')::JSONB->>'email' AS leader_email,
    (team_info->>'members')::JSONB AS members
  FROM 
    user_quiz_scores uqs
  WHERE 
    uqs.team_info IS NOT NULL 
    AND (
      -- Check if the member_email is the leader's email
      ((team_info->>'leader')::JSONB->>'email')::TEXT = member_email
      OR
      -- Check if the member_email is in any of the team members' emails
      EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(team_info->'members') AS member 
        WHERE (member->>'email')::TEXT = member_email
      )
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get a team's details by score record ID
CREATE OR REPLACE FUNCTION get_team_details(score_id UUID)
RETURNS TABLE (
  team_name TEXT,
  score INTEGER,
  completed_at TIMESTAMPTZ,
  quiz_id UUID,
  quiz_name TEXT,
  leader_name TEXT,
  leader_email TEXT,
  members JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uqs.user_name AS team_name,
    uqs.score,
    uqs.completed_at,
    uqs.quiz_id,
    q.name AS quiz_name,
    (uqs.team_info->>'leader')::JSONB->>'name' AS leader_name,
    (uqs.team_info->>'leader')::JSONB->>'email' AS leader_email,
    (uqs.team_info->>'members')::JSONB AS members
  FROM 
    user_quiz_scores uqs
  JOIN
    quizzes q ON uqs.quiz_id = q.id
  WHERE 
    uqs.id = score_id
    AND uqs.team_info IS NOT NULL;
END;
$$ LANGUAGE plpgsql; 