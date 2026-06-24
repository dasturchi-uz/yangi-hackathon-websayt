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
## Table Creation SQL

**MUHIM:** Quyidagi SQL-ni **har bir queryni alohida** Run qiling (hammani bir vaqtada paste qilmang):

### Query 1: Jadval yaratish
```sql
DROP TABLE IF EXISTS applications CASCADE;

CREATE TABLE applications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'new' NOT NULL,
  grade VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Query 2: Indexlar yaratish
```sql
CREATE INDEX idx_applications_phone ON applications(phone);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
```

### Query 3: RLS o'chiish (eng oson yechim)
```sql
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
```

### Query 4: Permissions berish
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON applications TO anon;
GRANT USAGE ON SEQUENCE applications_id_seq TO anon;
```

---

## ⚠️ Agar hali xato bo'lsa - alternativ SQL

Agar yuqoridagi SQL xato bersa, quyidagi minimal SQL-ni ishlatib ko'ring:

```sql
-- Jadval o'chirib yangi yaratish
DROP TABLE IF EXISTS applications;

-- Yangi jadval
CREATE TABLE public.applications (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  grade TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS o'chirib qo'yish
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;

-- Public access
GRANT ALL ON public.applications TO public;
```

---

## 🔍 Yoki Supabase UI orqali yaratish

Agar SQL ishlamasa, Supabase dashboard dan:

1. **Table Editor** → **Create table** tugmasini bosing
2. **Name**: `applications`
3. Ustunlarni qo'shing:
   - `id` (BIGINT, Primary Key)
   - `full_name` (TEXT)
   - `phone` (TEXT)
   - `status` (TEXT, default: 'new')
   - `grade` (TEXT, nullable)
   - `notes` (TEXT, nullable)
   - `created_at` (TIMESTAMP, default: now())
   - `updated_at` (TIMESTAMP, default: now())

4. **RLS** o'chirib qo'ying (Toggle OFF)
5. **Create table** bosing
