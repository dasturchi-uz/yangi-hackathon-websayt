# 🔧 Supabase Quick Fix Checklist

Buatni **ketma-ketlik bilan** bajaring:

## ✅ Step 1: Dashboard o'rnating
- [ ] https://app.supabase.com ga o'ting
- [ ] Proyektingizni tanlang
- [ ] "SQL Editor" ochib yangi query yarating

## ✅ Step 2: Jadval o'chir va yangi yarat (MUHIM!)
- [ ] Quyidagini copy-paste qiling va **RUN** bosing:

```sql
DROP TABLE IF EXISTS applications CASCADE;

CREATE TABLE applications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'new',
  grade VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Natija:** ✅ Query executed successfully

---

## ✅ Step 3: RLS o'chibing
- [ ] **Yangi query** yarating va quyidagini run qiling:

```sql
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
```

**Natija:** ✅ Rows: 0

---

## ✅ Step 4: Permissions berish
- [ ] **Yangi query** yarating:

```sql
GRANT ALL ON applications TO anon;
GRANT ALL ON applications TO authenticated;
GRANT USAGE ON SEQUENCE applications_id_seq TO anon;
GRANT USAGE ON SEQUENCE applications_id_seq TO authenticated;
```

**Natija:** ✅ Rows: 0

---

## ✅ Step 5: Test ma'lumot qo'shish
- [ ] **Yangi query** yarating:

```sql
INSERT INTO applications (full_name, phone, status) 
VALUES ('Test User', '+998 90 123 45 67', 'new');
```

**Natija:** ✅ Rows: 1 (bir ma'lumot qo'shiladi)

---

## ✅ Step 6: Tekshirish
- [ ] **Yangi query** yarating:

```sql
SELECT COUNT(*) as total FROM applications;
```

**Natija:** ✅ Rows: 1 (total = 1)

---

## ✅ Step 7: Websayt test
- [ ] Browser-da **index.html** oching
- [ ] F12 (Developer Tools) bosing
- [ ] **Console** tab oching
- [ ] Forma to'ldiring:
  - F.I.SH: Test
  - Telefon: +998 90 111 11 11
- [ ] "Qabulga yozilish" bosing

**Natija expected:**
```
✅ Supabase initialized
📤 Supabasega ma'lumot yuborilimoqda
✅ Ma'lumot saqlandi
```

---

## ✅ Step 8: Admin panelni tekshirish
- [ ] index.html-da 🔒 tugmasini bosing
- [ ] admin.html ochilyapti
- [ ] Parol: **1234**
- [ ] **Kirish** bosing

**Natija expected:**
```
📥 Arizalar yuklanmoqda...
✅ Arizalar yuklandi: 2 ta
(1 test query orqali + 1 forma orqali)
```

---

## ⚠️ Agar Step 5, 6 da xato bo'lsa:

### Error: "relation 'applications' does not exist"
- [ ] Step 2-ni qayta run qiling
- [ ] Dashboard → Table Editor-da `applications` jadvali ko'rinadimi?
- [ ] Ko'rinmasa, jadval hali yaratilmagan

### Error: "permission denied"
- [ ] Step 4-ni qayta run qiling
- [ ] Dashboard → Settings → Database → Users → check permissions

### Error: "RLS policy violation"
- [ ] Step 3-ni qayta run qiling
- [ ] RLS DISABLED bo'lishi kerak

---

## ⚠️ Agar Step 7 da Console error bo'lsa:

1. **Error xabarini copy qiling** (F12 Console-dan)
2. **CONNECTION_ERRORS.md** faylida tekshiring
3. **Debug.html** oching va testlarni run qiling
4. Qaysi test failga urinsa, o'sha joyni tuzating

---

## 🎯 Agar hammasi ✅ bo'lsa:

Admin panelda:
- [ ] Arizalar soni ko'rinmoqda (2 ta)
- [ ] Status filter ishlaymoqda
- [ ] Search ishlaymoqda
- [ ] ✏️ O'zgartirish tugmasi ishlaymoqda
- [ ] 🗑️ O'chirish tugmasi ishlaymoqda
- [ ] ⬇ CSV export ishlaymoqda

**Natija = WEBSAYT TAYYOR! 🚀**

---

## 📋 Agar hali muammo bo'lsa:

1. F12 → Console error xabarini yozing
2. Debug.html test natijalarini qarang
3. SQL Query-lari-ing status-ini tekshiring (✅ nechta bo'lsa)
4. SUPABASE_SETUP.md va CONNECTION_ERRORS.md qayta o'qib ko'ring

**MUHIM:** SQL Query-larni alohida-alohida run qiling, hammani bir vaqtada paste qilmang!

---

## 🆘 Final Debug

Agar hali qaytsa-qaytmoqda bo'lsa:

```bash
1. Browser cache o'chirib qo'ying (Ctrl+Shift+Delete)
2. Sahifani qayta yuklang (F5)
3. index.html va admin.html qayta oching
4. Supabase dashboard-ni refresh qiling
5. Debug.html testlarini qayta run qiling
```

**Endi hammasi ishlamog'i kerak!** ✅
