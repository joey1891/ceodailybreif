/*
  # Create posts table for articles

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `category` (text)
      - `subcategory` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `author_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `posts` table
    - Add policy for public read access
    - Add policy for authenticated users to create/update their own posts
*/

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  subcategory text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  author_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read posts"
  ON posts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Add some sample data
INSERT INTO posts (title, content, category, author_id)
VALUES 
  ('Latest Advances in Medical Research', 'Exploring recent breakthroughs in medical science...', 'medical', '00000000-0000-0000-0000-000000000000'),
  ('New Pharmaceutical Developments', 'Recent developments in drug research...', 'pharmaceutical', '00000000-0000-0000-0000-000000000000'),
  ('Innovations in Medical Devices', 'Latest innovations in medical technology...', 'medical-devices', '00000000-0000-0000-0000-000000000000'),
  ('Trends in Cosmetics Industry', 'Current trends shaping the cosmetics industry...', 'cosmetics', '00000000-0000-0000-0000-000000000000'),
  ('Health Supplements Market Analysis', 'Analysis of the health supplements market...', 'health-supplements', '00000000-0000-0000-0000-000000000000'),
  ('Digital Healthcare Solutions', 'Emerging trends in digital healthcare...', 'digital-healthcare', '00000000-0000-0000-0000-000000000000');