-- ==========================================
-- SUPABASE DATABASE SETUP FOR INSIGHTS
-- ==========================================
-- Run this SQL in your Supabase project -> SQL Editor -> New Query

-- Drop existing table if it exists to avoid conflicts
DROP TABLE IF EXISTS posts CASCADE;

-- 1. Create the posts table
CREATE TABLE posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'Leadership',
  image_url text,
  linkedin_url text,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public can read published posts
CREATE POLICY "Public read published posts"
ON posts FOR SELECT
USING (published = true);

-- 4. Policy: Only authenticated users (Savitha after login) can manage posts (insert, update, delete)
CREATE POLICY "Auth users can manage posts"
ON posts FOR ALL
USING (auth.role() = 'authenticated');

-- ==========================================
-- MESSAGES TABLE (Contact Form)
-- ==========================================
CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read boolean DEFAULT false
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert messages"
ON messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only auth users can read messages"
ON messages FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can delete messages"
ON messages FOR DELETE
USING (auth.role() = 'authenticated');
