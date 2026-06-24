# Supabase Setup Guide

## Database URL
`https://hadgkmvlazkvhhmuxljg.supabase.co`

## API Key (Public)
`sb_publishable_vfAvrYTF0mNa2wbIP_O0Xw_y_ME4F3f`

## Table Creation SQL

Run this SQL in your Supabase dashboard to create the `applications` table:

```sql
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

-- Create index on phone for faster search
CREATE INDEX idx_applications_phone ON applications(phone);

-- Create index on status for faster filtering
CREATE INDEX idx_applications_status ON applications(status);

-- Create index on created_at for sorting
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
```

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
