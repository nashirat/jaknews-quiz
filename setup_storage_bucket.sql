-- Create a storage bucket for quiz images
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-assets', 'Quiz Assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quiz-assets');

-- Set up storage policy to allow public access
CREATE POLICY "Allow public access for quiz assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'quiz-assets');

-- Create the folder structure
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES ('quiz-assets', 'quiz-images/', auth.uid(), '{"mimetype": "application/x-directory"}')
ON CONFLICT (bucket_id, name) DO NOTHING; 