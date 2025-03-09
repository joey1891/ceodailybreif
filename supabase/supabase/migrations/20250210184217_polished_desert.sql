/*
  # Fix posts table and sample data

  1. Changes
    - Remove author_id constraint temporarily to allow sample data
    - Update sample data to use NULL for author_id
    - Add index on category for better query performance

  2. Security
    - Maintain existing RLS policies
    - Add index for performance optimization
*/

-- Temporarily disable RLS to modify data
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Remove the foreign key constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;

-- Add index for category column
CREATE INDEX IF NOT EXISTS posts_category_idx ON posts(category);

-- Update existing sample data to use NULL author_id
UPDATE posts SET author_id = NULL;

-- Add new constraint that allows NULL
ALTER TABLE posts ADD CONSTRAINT posts_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Re-enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;