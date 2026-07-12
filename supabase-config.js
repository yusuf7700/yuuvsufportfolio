/* =========================================================
   SUPABASE SOZLAMALARI
   SETUP.md dagi 2-qadamdan Project URL va anon key ni shu yerga qo'ying.
   ========================================================= */

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const SUPABASE_BUCKET = "portfolio-media";

// Sozlanganmi yoki yo'qmi — tekshirish uchun
const SUPABASE_IS_CONFIGURED =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
