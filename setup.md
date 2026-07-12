# Yuuvsuf Portfolio — Admin tizimi sozlash qo'llanmasi

Bu qo'llanma bir marta bajariladi. Tugagach, `admin.html` orqali telefondan ham
rasm/video qo'shib turasiz, sayt esa avtomatik yangilanadi.

---

## 1-qadam — Supabase akkaunt va loyiha

1. https://supabase.com ga kiring, **Start your project** tugmasi orqali bepul
   ro'yxatdan o'ting (GitHub yoki email bilan).
2. **New project** tugmasini bosing:
   - Name: `yuuvsuf-portfolio` (yoki xohlagan nom)
   - Database password: kuchli parol o'ylab qo'ying va **saqlab qo'ying**
   - Region: eng yaqin regionni tanlang (masalan Frankfurt)
3. Loyiha yaratilishini kuting (1-2 daqiqa).

## 2-qadam — API kalitlarni olish

1. Chap menyuda **Project Settings → API** bo'limiga o'ting.
2. Ikkita qiymatni nusxalab oling:
   - **Project URL** (masalan `https://abcxyz.supabase.co`)
   - **anon public** kaliti (uzun matn)
3. Bu ikkalasini keyinroq `supabase-config.js` fayliga qo'yasiz (quyida ko'rsatilgan).

## 3-qadam — Ma'lumotlar jadvali (SQL)

Chap menyuda **SQL Editor → New query** ni oching, quyidagini nusxalab, **Run** bosing:

```sql
create table portfolio_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,        -- 'websites' | 'design' | 'aivideo'
  subcategory text,               -- 'posterlar' | 'muqovalar' | 'avatarlar' | 'reels' | 'multfilmlar' | null
  title text not null,
  type text not null,             -- 'image' | 'video'
  media_url text not null,
  link text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table portfolio_items enable row level security;

create policy "Public can read" on portfolio_items
  for select using (true);

create policy "Only logged-in admins can insert" on portfolio_items
  for insert with check (auth.role() = 'authenticated');

create policy "Only logged-in admins can update" on portfolio_items
  for update using (auth.role() = 'authenticated');

create policy "Only logged-in admins can delete" on portfolio_items
  for delete using (auth.role() = 'authenticated');
```

Bu — har kim o'qiy oladi (sayt ochiq), lekin faqat **tizimga kirgan admin**
qo'sha/o'chira oladi.

## 4-qadam — Fayl saqlash (Storage)

1. Chap menyuda **Storage** bo'limiga o'ting → **New bucket**.
2. Nomi: `portfolio-media`, **Public bucket** ni yoqing (toggle ON) → Create.
3. Yana **SQL Editor → New query** ochib, quyidagini ishga tushiring:

```sql
create policy "Public can view media"
  on storage.objects for select
  using (bucket_id = 'portfolio-media');

create policy "Only logged-in admins can upload media"
  on storage.objects for insert
  with check (bucket_id = 'portfolio-media' and auth.role() = 'authenticated');

create policy "Only logged-in admins can delete media"
  on storage.objects for delete
  using (bucket_id = 'portfolio-media' and auth.role() = 'authenticated');
```

## 5-qadam — O'zingizni admin qilib qo'shish

1. Chap menyuda **Authentication → Users → Add user**.
2. Email va parol kiriting (masalan o'z emailingiz) → **Create user**.
   - "Auto Confirm User" belgisini albatta yoqing (bo'lmasa email tasdiqlash so'raydi).
3. Tayyor — shu email/parol bilan `admin.html` sahifasiga kirasiz.
   Boshqa hech kim ro'yxatdan o'ta olmaydi — faqat siz shu yerda qo'shgan odamlar kira oladi.

## 6-qadam — Kalitlarni saytga ulash

`supabase-config.js` faylini oching va ikkita qiymatni almashtiring:

```js
const SUPABASE_URL = "https://abcxyz.supabase.co";   // 2-qadamdagi Project URL
const SUPABASE_ANON_KEY = "eyJhbGciOi...";             // 2-qadamdagi anon public kalit
```

Shu bo'ldi. Endi:
- `portfolio.html` — ochiq sayt, hamma ko'radi
- `admin.html` — faqat sizga (yoki qo'shgan odamlaringizga) mo'ljallangan, login talab qiladi

Barcha fayllarni bitta papkaga (masalan hosting papkasiga) joylang: `portfolio.html`,
`admin.html`, `portfolio.css`, `admin.css`, `portfolio.js`, `admin.js`,
`supabase-config.js`, `data.js`, `logo.png`.

## Eslatma

- `admin.html` havolasi asosiy saytda hech qayerda ko'rsatilmagan — uni faqat
  to'g'ridan-to'g'ri manzil orqali (masalan `yourdomain.com/admin.html`) ochasiz.
- Xavfsizlik login (parol) orqali ta'minlanadi — havola yashirin bo'lishi qo'shimcha
  ehtiyot chorasi, asosiysi emas.
- Video fayllar hajmi katta bo'lsa yuklash biroz vaqt olishi mumkin — Wi-Fida
  yuklashni tavsiya qilamiz.