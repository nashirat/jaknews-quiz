-- Add image columns to the questions and options tables
ALTER TABLE questions 
ADD COLUMN image_url TEXT;

ALTER TABLE options
ADD COLUMN image_url TEXT;

-- Comment explaining the purpose of the new columns
COMMENT ON COLUMN questions.image_url IS 'URL to the uploaded image for the question';
COMMENT ON COLUMN options.image_url IS 'URL to the uploaded image for the answer option'; 