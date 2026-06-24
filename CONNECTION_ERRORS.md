# 🚨 Supabase Connection Errors - Tezkor Tuzatish

## Step 1: Xatoni aniqlash

### Browser Console-da xatoni qarang (F12)

**Common errors va yechimlar:**

---

### ❌ Error 1: "relation 'applications' does not exist"
```
Error: relation "applications" does not exist
Code: 42P01
```

**Sabab:** Jadval yaratilmagan

**Yechim:**
1. app.supabase.com → SQL Editor
2. Query 1 (jadval yaratish) ni run qiling
3. Query 2 (indexlar) ni run qiling
4. Qayta test qiling

---

### ❌ Error 2: "new row violates row-level security policy"
```
Error: new row violates row-level security policy
Code: PGRST304
```

**Sabab:** RLS (Row Level Security) blokili

**Yechim:**
```sql
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
```

---

### ❌ Error 3: "permission denied for schema public"
```
Error: permission denied for schema public
Code: 42501
```

**Sabab:** Permissions kerak

**Yechim:**
```sql
GRANT ALL ON public.applications TO anon;
GRANT USAGE ON SEQUENCE applications_id_seq TO anon;
```

---

### ❌ Error 4: "Cross-Origin Request Blocked (CORS)"
```
Access to XMLHttpRequest at 'https://...' blocked by CORS policy
```

**Sabab:** CORS blokirovka

**Yechim:**
1. app.supabase.com → Settings → API
2. "Origins" section-da websayt URL-ni qo'shing
3. Yoki `localhost:*` qo'shing (local test uchun)

---

### ❌ Error 5: "Invalid API key"
```
Error: Invalid API Key
```

**Sabab:** API key nomuvofiq

**Yechim:**
1. SUPABASE_SETUP.md da API Key-ni tekshiring
2. index.js va admin.js-da to'g'ri key bor-bormi tekshiring
3. Key: `sb_publishable_vfAvrYTF0mNa2wbIP_O0Xw_y_ME4F3f`

---

## Step 2: Debug Page Testlari

### debug.html ni oching va testlarni run qiling:

```
1. 🔍 Connection Test
   ✅ Agar "Connection successful" bo'lsa → jadval yoki RLS muammosi
   ❌ Agar "Connection failed" bo'lsa → API key yoki URL muammosi

2. 🔍 Check Table
   ✅ Agar "Table exists" bo'lsa → jadval yoq
   ❌ Agar "Table exists error" bo'lsa → jadval yaratilmagan

3. 🔍 Insert Test Data
   ✅ Agar insert bo'lsa → RLS yoki permission muammosi
   ❌ Agar error bo'lsa → ustun nomlari nomuvofiq

4. 🔍 Load All Data
   ✅ Agar data ko'rinsa → hammasi yaxshi
   ❌ Agar error bo'lsa → RLS o'chirishingiz kerak
```

---

## Step 3: Tezkor Setup (UI orqali)

Agar SQL ishlamasa, dashboard-dan yaratish:

1. **app.supabase.com** → Proyekt
2. **SQL Editor** ← **Table Editor** o'rniga
3. **Create table** tugmasini bosing
4. Nomi: `applications`
5. **Columns** qo'shing:
   ```
   id          BIGINT        PRIMARY KEY
   full_name   TEXT          NOT NULL
   phone       TEXT          NOT NULL
   status      TEXT          DEFAULT 'new'
   grade       TEXT          (nullable)
   notes       TEXT          (nullable)
   created_at  TIMESTAMP     DEFAULT now()
   updated_at  TIMESTAMP     DEFAULT now()
   ```
6. **RLS** Toggle → **OFF**
7. **Create table** bosing

---

## Step 4: Verify

Dashboard-dan:

```
1. Table Editor-ga kiring
2. "applications" jadvali ko'rinsa ✅
3. Birnechta test ma'lumot qo'shing:
   - full_name: Test User
   - phone: +998 90 123 45 67
   - status: new
4. "Insert row" bosing
5. Jadvalda ko'rinadimi tekshiring
```

---

## Step 5: Websaytni Test Qilish

1. **index.html** oching
2. Forma to'ldiring:
   - F.I.SH: Test Name
   - Telefon: +998 90 987 65 43
3. "Qabulga yozilish" bosing
4. Success xabari ko'rinadimi?
5. F12 → Console loguruv tekshiring
6. **admin.html** da 🔒 lock → parol `1234`
7. Arizalar ko'rinadimi?

---

## 🎯 Qadamlar Ketma-ketligi

```
1. app.supabase.com → SQL Editor
   ↓
2. Query 1 → Run (jadval yaratish)
   ↓
3. Query 2 → Run (indexlar)
   ↓
4. Query 3 → Run (RLS o'chiish)
   ↓
5. Query 4 → Run (permissions)
   ↓
6. debug.html → Connection Test ✅
   ↓
7. index.html → Forma test ✅
   ↓
8. admin.html → Arizalar ko'rish ✅
   ↓
TAYYORLASH TUGATILDI! 🚀
```

---

## 📊 Asl Xatoliklar (Common Issues)

| Xato | Sabab | Tuzatish |
|------|--------|---------|
| "relation does not exist" | Jadval yo'q | SUPABASE_SETUP SQL Query 1 |
| "RLS policy violation" | RLS yoqli | Query 3 run qiling |
| "permission denied" | Permissions yo'q | Query 4 run qiling |
| "CORS error" | CORS blokirovka | Settings → API → Origins |
| "Invalid key" | API key xato | SUPABASE_SETUP.md check |
| "Table not found" | UI-dan table topilmadi | Dashboard → Tables refresh |

---

## ✨ Success Indicators

**Console-da quyidagi loglarni ko'rsangiz, hammasi ✅:**

```javascript
✅ Supabase initialized: https://hadgkmvlazkvhhmuxljg.supabase.co
📤 Supabasega ma'lumot yuborilimoqda: {fullName, phone}
✅ Ma'lumot saqlandi: [{id, full_name, phone, status, ...}]
```

**Admin panelda:**
```
📥 Arizalar yuklanmoqda...
✅ Arizalar yuklandi: X ta
```

---

## 🆘 Agar hali ishlamasa

1. **Screenshot** olib xato xabarni yozing
2. **Console log**-ni copy qiling (F12)
3. **Debug page** test natijalarini qarang
4. Bu ma'lumotlar bilan savol bering - to'liq yechim beraman!

Endi SQL-ni qadam-qadam run qilib ko'ring! 🚀
