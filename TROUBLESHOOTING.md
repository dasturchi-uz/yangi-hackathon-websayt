# 🔍 Troubleshooting Guide

## Problem 1: Ma'lumotlar yozilmayapti

### Step 1: Debug page-ni tekshirish
1. `debug.html` ni brauzer bilan oching
2. "Connection Test" tugmasini bosing
3. Natijalarga qarang:

**✅ Muvaffaqiyat bo'lsa:**
```
[12:34:56] ✅ Supabase library loaded
[12:34:57] 🔍 Connection test started...
[12:34:57] ✅ Supabase client exists
[12:34:58] ✅ Connection successful!
```

**❌ Xato bo'lsa:**
```
[12:34:56] ❌ Supabase library NOT loaded
```
→ HTML da Supabase CDN yoqolgan bo'lishi kerak

### Step 2: Table tekshirish
1. Debug.html da "Check Table" tugmasini bosing
2. Error bo'lsa:
   - app.supabase.com ga o'ting
   - SQL Editor da SUPABASE_SETUP.md SQL-ni run qiling

### Step 3: Insert test
1. Debug.html da "Test Insert" tugmasini bosing
2. Test ma'lumot yozilsa ✅
3. Yozilmasa ❌ → SUPABASE_SETUP.md SQL-ni check qiling

---

## Problem 2: Admin panelida ma'lumotlar ko'rinmayapti

### Tekshirish:
1. F12 → Console tab
2. Admin panelga kiring (parol: `1234`)
3. Console da loglarni qarang

**Masalan:**
```
✅ Arizalar yuklandi: 0 ta
```
→ Jadvalni hali bitta ma'lumot yo'q

```
❌ Fetch xatosi: relation "applications" does not exist
```
→ Jadval yaratilmagan

### Tuzatish:
1. SUPABASE_SETUP.md SQL-ni run qiling
2. RLS policies yoqolganmi tekshiring
3. Admin.js app.supabase.com da tekshiring

---

## Problem 3: RLS (Row Level Security) xatosi

**Xato:**
```
new row violates row-level security policy
```

**Tuzatish:**
1. app.supabase.com → SQL Editor
2. Quyidagi SQL-ni run qiling:

```sql
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
```

Yoki RLS policylarni yarating:

```sql
-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Allow all operations for public
CREATE POLICY "Allow public access"
  ON applications
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## Problem 4: CORS (Cross-Origin) xatosi

**Xato:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Tuzatish:**
- Supabase CORS settings-ni tekshiring
- app.supabase.com → Settings → API
- CORS allowed origins-ga websayt URL-ni qo'shing

---

## Problem 5: Jadval struktura nomuvofiq

**Xato:**
```
column "full_name" does not exist
```

**Tuzatish:**
1. app.supabase.com → Table Editor
2. `applications` table-ni ochin
3. Quyidagi ustunlar bormi tekshiring:
   - `id` (BIGINT)
   - `full_name` (VARCHAR)
   - `phone` (VARCHAR)
   - `status` (VARCHAR)
   - `grade` (VARCHAR) - optional
   - `notes` (TEXT) - optional
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

Agar yo'q bo'lsa, SUPABASE_SETUP.md dagi DROP TABLE qatorini uncomment qilib, hammasini qayta run qiling.

---

## 🚀 Step-by-step Setup

### 1. Supabase SQL yaratish
```
1. app.supabase.com → proyekt tanlang
2. SQL Editor → New Query
3. SUPABASE_SETUP.md SQL-ni copy qiling
4. Run tugmasini bosing
5. Xato bo'lsa, har bir amalni alohida run qiling
```

### 2. RLS tekshirish
```
1. app.supabase.com → SQL Editor
2. Test query: SELECT COUNT(*) FROM applications;
3. Xato bo'lsa, RLS disable qiling
```

### 3. Websayt test qilish
```
1. index.html oching
2. Forma to'ldiring
3. "Qabulga yozilish" bosing
4. F12 → Console - loglarni qarang
5. Agar INSERT successful bo'lsa ✅
6. Admin panelga kiring (🔒 lock tugmasi)
7. Arizalar ko'rinadimi check qiling
```

### 4. Debug page
```
1. debug.html oching
2. Barcha testlarni ketma-ket run qiling
3. Qaysi qadamda fail bo'lsa, o'sha joyni tuzating
```

---

## 📞 Xato kodelari

| Kod | Ma'nosi | Tuzatish |
|-----|---------|---------|
| `PGRST301` | RLS policy blokli | RLS disable yoki policy yarating |
| `42P01` | Table topilmadi | SUPABASE_SETUP.md SQL run qiling |
| `42703` | Column topilmadi | Table struktura tekshiring |
| `CORS` | Origin ruxsatsiz | CORS settings-ni o'zgartiring |

---

## ✅ Success Indicators

**Index.html formdan yuborganda:**
```
✅ Supabase initialized
📤 Supabasega ma'lumot yuborilimoqda
✅ Ma'lumot saqlandi
```

**Admin.html da:**
```
✅ Arizalar yuklandi: N ta
```

**Debug.html da:**
```
✅ Connection successful!
✅ Table exists and is accessible
✅ Insert successful!
✅ Loaded N records
```

Agar hammasi ✅ bo'lsa, websayt tayyor! 🚀
