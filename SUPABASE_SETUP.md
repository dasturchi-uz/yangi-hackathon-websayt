# Supabase Setup Guide

## Database URL
`https://hadgkmvlazkvhhmuxljg.supabase.co`

## API Key (Public)
`sb_publishable_vfAvrYTF0mNa2wbIP_O0Xw_y_ME4F3f`

## Table Creation SQL

Run this SQL in your Supabase dashboard to create the `applications` table:

```sql
-- Drop table if exists (only first time setup)
-- DROP TABLE IF EXISTS applications CASCADE;

-- Create table
CREATE TABLE applications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'new' NOT NULL,
  grade VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_applications_phone ON applications(phone);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Allow SELECT for everyone (public read)
CREATE POLICY "Allow public select" ON applications
  FOR SELECT USING (true);

-- Create RLS policy: Allow INSERT for everyone (public write)
CREATE POLICY "Allow public insert" ON applications
  FOR INSERT WITH CHECK (true);

-- Create RLS policy: Allow UPDATE for everyone (public update)
CREATE POLICY "Allow public update" ON applications
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create RLS policy: Allow DELETE for everyone (public delete)
CREATE POLICY "Allow public delete" ON applications
  FOR DELETE USING (true);

-- Grant permissions to anon user (if needed)
GRANT ALL ON applications TO anon;
GRANT ALL ON applications_id_seq TO anon;
```

### ⚠️ MUHIM: SQL qadam-qadam

1. Birinchi qator bilan yangi query yarating va **har bir qadam alohida Run qiling**
2. Yoki hammani bir vaqtada paste qilib Run qiling


## How to Apply SQL

1. Go to https://app.supabase.com
2. Open your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste the SQL above
6. Click "Run"

## Functionality

### Registration Form (index.html)
- User enters Name and Phone
- Data is saved to Supabase `applications` table with status `new`

### Admin Panel (admin.html)
- Password: `1234`
- View all applications
- Filter by status (new, called, no_answer, accepted, rejected)
- Search by name or phone
- Edit status, grade, and notes
- Delete applications
- Export to CSV

## Status Values
- `new`: New application
- `called`: Operator called the student
- `no_answer`: Student didn't answer
- `accepted`: Student accepted
- `rejected`: Application rejected (archive)
