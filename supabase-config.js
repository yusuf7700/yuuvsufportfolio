/* =========================================================
   SUPABASE SOZLAMALARI
   ========================================================= */

const SUPABASE_URL = "https://xmtzxzfdvtxwuhanlsln.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Nq3BzinWVqMY3yiqB8H2YQ_d2EA47Yj";
const SUPABASE_BUCKET = "portfolio-media";

// Sozlanganmi yoki yo'qmi — tekshirish uchun
const SUPABASE_IS_CONFIGURED =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
