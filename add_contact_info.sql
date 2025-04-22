-- Add contact_info column to user_responses table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_responses' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE user_responses ADD COLUMN contact_info TEXT;
  END IF;
END $$;

-- Add contact_info column to user_quiz_scores table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_quiz_scores' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE user_quiz_scores ADD COLUMN contact_info TEXT;
  END IF;
END $$; 