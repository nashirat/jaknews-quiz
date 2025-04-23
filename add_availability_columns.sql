-- Add availability time range columns to the quizzes table
ALTER TABLE quizzes 
ADD COLUMN available_from TIMESTAMPTZ,
ADD COLUMN available_to TIMESTAMPTZ;
 
-- Comment explaining the purpose of the new columns
COMMENT ON COLUMN quizzes.available_from IS 'Timestamp when the BrainBee becomes available';
COMMENT ON COLUMN quizzes.available_to IS 'Timestamp when the BrainBee becomes unavailable'; 