-- Quizzes table to store all quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  passcode TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table to store questions for each quiz
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false')),
  time_limit INTEGER NOT NULL DEFAULT 40, -- In seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Options table to store options for multiple choice questions
CREATE TABLE IF NOT EXISTS options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User responses table
CREATE TABLE IF NOT EXISTS user_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_name TEXT, -- Store user's name
  contact_info TEXT, -- Store user's email or phone
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES options(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  response_time INTEGER, -- Time taken to answer in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User quiz scores table
CREATE TABLE IF NOT EXISTS user_quiz_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_name TEXT, -- Store user's name
  contact_info TEXT, -- Store user's email or phone
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for quizzes table
-- Anyone can view quizzes
CREATE POLICY "Anyone can view quizzes" ON quizzes
  FOR SELECT USING (true);

-- Anyone can create quizzes
CREATE POLICY "Anyone can create quizzes" ON quizzes
  FOR INSERT WITH CHECK (true);

-- Anyone can update quizzes
CREATE POLICY "Anyone can update quizzes" ON quizzes
  FOR UPDATE USING (true);

-- Anyone can delete quizzes
CREATE POLICY "Anyone can delete quizzes" ON quizzes
  FOR DELETE USING (true);

-- Policies for questions table
CREATE POLICY "Anyone can view questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert questions" ON questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update questions" ON questions
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete questions" ON questions
  FOR DELETE USING (true);

-- Policies for options table
CREATE POLICY "Anyone can view options" ON options
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert options" ON options
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update options" ON options
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete options" ON options
  FOR DELETE USING (true);

-- Policies for user_responses table
CREATE POLICY "Anyone can view user_responses" ON user_responses
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert user_responses" ON user_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update user_responses" ON user_responses
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete user_responses" ON user_responses
  FOR DELETE USING (true);

-- Policies for user_quiz_scores table
CREATE POLICY "Anyone can view user_quiz_scores" ON user_quiz_scores
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert user_quiz_scores" ON user_quiz_scores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update user_quiz_scores" ON user_quiz_scores
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete user_quiz_scores" ON user_quiz_scores
  FOR DELETE USING (true);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update timestamps
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON quizzes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_options_updated_at
BEFORE UPDATE ON options
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add user_name column to user_responses table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_responses' AND column_name = 'user_name'
  ) THEN
    ALTER TABLE user_responses ADD COLUMN user_name TEXT;
  END IF;
END $$;

-- Add user_name column to user_quiz_scores table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_quiz_scores' AND column_name = 'user_name'
  ) THEN
    ALTER TABLE user_quiz_scores ADD COLUMN user_name TEXT;
  END IF;
END $$;

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