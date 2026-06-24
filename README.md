# Websayt Setup Checklist

## ✅ Bajarilgan Ishlar

### 1. Responsive Design
- [x] Telefon, planshet, va kompyuterda chiroyli ko'rinadi
- [x] Mobile menu burger button
- [x] Fluid typography va images
- [x] Overflow-x hidden (gorizontal scrolling o'chirildi)

### 2. Form Submission
- [x] index.html - Qabul formasini to'ldirish
- [x] Phone number formatting (+998 XX XXX XX XX)
- [x] Form validation
- [x] Success message bilan UI o'zgarishi

### 3. Admin Panel
- [x] admin.html - Admin kirish paneli
- [x] Parol: `1234`
- [x] Arizalarni ko'rish va boshqarish

### 4. Supabase Integration
- [x] index.js - Forma data Supabasega yozish
- [x] admin.js - Arizalarni Supabasedan o'qish
- [x] Status filtering (new, called, no_answer, accepted, rejected)
- [x] Search functionality
- [x] Edit va delete operations
- [x] CSV export

### 5. Page Scripts
- [x] assets/index.js - Index sahifasi logikasi
- [x] assets/about.js - About sahifasi logikasi
- [x] assets/admin.js - Admin paneli logikasi

## 📋 Supabase Jadval Yaratish

1. https://app.supabase.com ga o'ting
2. "SQL Editor" ochib, SUPABASE_SETUP.md da berilgan SQL-ni yozing
3. "Run" tugmasini bosing

SQL natijasida yaratiladi:
- `applications` jadvali
- 3 ta indeks (phone, status, created_at)

## 🔧 Muhim Malumotlar

**Supabase URL**: `https://hadgkmvlazkvhhmuxljg.supabase.co`
**API Key**: `sb_publishable_vfAvrYTF0mNa2wbIP_O0Xw_y_ME4F3f`

## 🚀 Qo'llash

### Registration Form (index.html)
1. F.I.SH va telefon raqamini to'ldirish
2. "Qabulga yozilish" tugmasini bosish
3. Ma'lumot Supabasega saqlanadi (status = 'new')
4. Success xabari ko'rinadi

### Admin Panel (admin.html)
1. 🔒 lock tugmasini bosish (index.html da)
2. Parol: `1234`
3. Arizalarni ko'rish:
   - Hammasi: 0
   - Yangi arizalar: 0
   - Gaplashildi: 0
   - Ko'tarmadi: 0
   - Qabul qilingan: 0
   - Rad etilgan: 0

4. Filtrerlash va qidirish
5. ✏️ Holat, sinf, izohlarni o'zgartirish
6. 🗑️ O'chirish
7. ⬇ CSV yuklab olish

## ✨ Features

- ✅ Mobile responsive
- ✅ Uzbek language
- ✅ Form validation
- ✅ Phone number formatting
- ✅ Database persistence
- ✅ Admin filtering
- ✅ Export to CSV
- ✅ Real-time updates
- ✅ Status tracking

## 🔧 Debug va Xatolarni Tuzatish

**Agar ma'lumotlar yozilmayapti yoki ko'rinmayapti:**

1. **debug.html ni ochish** (brauzer bilan)
   - Supabase bilan ulanishni tekshiradi
   - Test ma'lumot yuborish mumkin

2. **Console loguruv** (F12 → Console)
   - ✅ belgilari = muvaffaqiyat
   - ❌ belgilari = xato
   - Xato xabarini o'qiy olasiz

3. **Supabase setup tekshirish**
   - SUPABASE_SETUP.md dagi SQL bari run qilinganmi?
   - RLS policies yoqolganmi?

4. **Agar hali ham ishlamasa:**
   - Console xato xabarini ko'rib yozing
   - app.supabase.com da table bor-bormi tekshiring
   - Debug.html test tugmalarini bosib, qaysi qadam failga urinsa bilib olasiz

## 📝 Statuses

- `new` - Yangi ariza
- `called` - Operator qo'ng'iroq qildi
- `no_answer` - Javob berdi yo
- `accepted` - Qabul qilingan
- `rejected` - Rad etilgan (arxiv)

## 🎯 Next Steps

1. Supabase jadvalini yaratish (SUPABASE_SETUP.md)
2. Websaytni test qilish
3. Forman bilan test ma'lumot yuboring
4. Admin panelda ko'rish
5. Tayyorlash tugatdingiz!
