/* =========================================================
   SUPABASE SOZLAMALARI
   SETUP.md dagi 2-qadamdan Project URL va anon key ni shu yerga qo'ying.
   ========================================================= */

   const SUPABASE_URL = "https://xmtzxzfdvtxwuhanlsln.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";  // sizning haqiqiy anon key
   const SUPABASE_BUCKET = "portfolio-media";
   
   // Sozlanganmi yoki yo'qmi — tekshirish uchun
   const SUPABASE_IS_CONFIGURED =
     SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
