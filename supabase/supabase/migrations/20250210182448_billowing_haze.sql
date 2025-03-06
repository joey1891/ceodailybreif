/*
  # Add Filter and Sort Tables

  1. New Tables
    - `filters`
      - `id` (uuid, primary key)
      - `name` (text)
      - `category` (text)
      - `created_at` (timestamp)
      
    - `sorts`
      - `id` (uuid, primary key)
      - `name` (text)
      - `category` (text)
      - `created_at` (timestamp)
      
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text)
      - `permissions` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create filters table
CREATE TABLE IF NOT EXISTS filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sorts table
CREATE TABLE IF NOT EXISTS sorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create policies for filters
CREATE POLICY "Anyone can read filters"
  ON filters
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can create filters"
  ON filters
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for sorts
CREATE POLICY "Anyone can read sorts"
  ON sorts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can create sorts"
  ON sorts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for roles
CREATE POLICY "Anyone can read roles"
  ON roles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can manage roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);