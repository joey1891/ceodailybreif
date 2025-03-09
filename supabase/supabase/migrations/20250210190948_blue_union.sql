/*
  # Calendar Events Schema

  1. New Tables
    - `calendar_events`
      - `id` (uuid, primary key)
      - `title` (text, event title)
      - `start_date` (timestamptz, event start date/time)
      - `end_date` (timestamptz, event end date/time)
      - `description` (text, optional event description)
      - `calendar_type` (text, either 'monthly' or 'weekly')
      - `user_id` (uuid, reference to auth.users)
      - `google_event_id` (text, for Google Calendar sync)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on calendar_events table
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  description text,
  calendar_type text NOT NULL CHECK (calendar_type IN ('monthly', 'weekly')),
  user_id uuid REFERENCES auth.users(id),
  google_event_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);