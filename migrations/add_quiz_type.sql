-- Add quiz_type column to quizzes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'quiz_type'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN quiz_type TEXT NOT NULL DEFAULT 'standard';
    
    -- Add check constraint to ensure quiz_type is either 'standard' or 'brainbee'
    ALTER TABLE quizzes ADD CONSTRAINT valid_quiz_type CHECK (quiz_type IN ('standard', 'brainbee'));
    
    -- Update existing quizzes to be 'standard' type
    UPDATE quizzes SET quiz_type = 'standard';
  END IF;
END $$; 