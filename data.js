/* =========================================================
   YUUVSUF PORTFOLIO — CONTENT DATA
   =========================================================
   Yangi ish qo'shish uchun kod yozish shart emas — shunchaki
   quyidagi ro'yxatlarga yangi bitta { } obyekt qo'shing.

   Har bir element uchun maydonlar:
     title : ko'rinadigan nom (istalgan matn)
     type  : "image" | "video" | "link"
     src   : fayl manzili (assets papkasi ichida)
     link  : (ixtiyoriy) tashqi havola — bosilganda ochiladi

   Fayllarni "assets" papkasi ichiga, shu yerda ko'rsatilgan
   papka tuzilishi bo'yicha joylashtiring:
     assets/saytlar/...
     assets/dizayn/posterlar/...
     assets/dizayn/muqovalar/...
     assets/dizayn/avatarlar/...
     assets/aivideolar/reels/...
     assets/aivideolar/multfilmlar/...

   ESLATMA: rasm kengaytmasi (.jpg/.png) va video kengaytmasi
   (.mp4) taxminiy qo'yilgan. Agar fayl formatingiz boshqacha
   bo'lsa (masalan .png yoki .mov), shu yerda "src" qatoridagi
   kengaytmani almashtiring — bu ham shunchaki matn tahriri.
   ========================================================= */

   const PORTFOLIO_DATA = {

    websites: [
      { title: "PlannerY", type: "image", src: "assets/saytlar/PlannerY.jpg", link: "" }
    ],
  
    design: {
      posterlar: [
        { title: "Honor",   type: "image", src: "assets/dizayn/posterlar/honor.jpg" },
        { title: "Dinay",   type: "image", src: "assets/dizayn/posterlar/dinay.jpg" },
        { title: "ASU",     type: "image", src: "assets/dizayn/posterlar/asu.jpg" },
        { title: "Malibu",  type: "image", src: "assets/dizayn/posterlar/malibu.jpg" },
        { title: "ASU 2",   type: "image", src: "assets/dizayn/posterlar/asu2.jpg" },
        { title: "Dena",    type: "image", src: "assets/dizayn/posterlar/dena.jpg" },
        { title: "Porsche", type: "image", src: "assets/dizayn/posterlar/porsche.jpg" }
      ],
      muqovalar: [
        { title: "Miswak",              type: "image", src: "assets/dizayn/muqovalar/miswak.jpg" },
        { title: "Arab tili va ustoz",  type: "image", src: "assets/dizayn/muqovalar/arabtilivaustoz.jpg" },
        { title: "Fusxa",               type: "image", src: "assets/dizayn/muqovalar/fusxa.jpg" },
        { title: "JCH",                 type: "image", src: "assets/dizayn/muqovalar/jch.jpg" },
        { title: "Coffee",              type: "image", src: "assets/dizayn/muqovalar/coffee.jpg" },
        { title: "Ovqat",               type: "image", src: "assets/dizayn/muqovalar/ovqat.jpg" },
        { title: "Xarizma",             type: "image", src: "assets/dizayn/muqovalar/xarizma.jpg" },
        { title: "Arab ChatGPT",        type: "image", src: "assets/dizayn/muqovalar/arabchatgpt.jpg" },
        { title: "Olma banan",          type: "image", src: "assets/dizayn/muqovalar/olmabanan.jpg" },
        { title: "2-o'yin natija",      type: "image", src: "assets/dizayn/muqovalar/2oynatija.jpg" }
      ],
      avatarlar: [
        { title: "Y. Yunusov", type: "image", src: "assets/dizayn/avatarlar/yyunusov.jpg" },
        { title: "Mahmudov",   type: "image", src: "assets/dizayn/avatarlar/mahmudov.jpg" },
        { title: "Aminya",     type: "image", src: "assets/dizayn/avatarlar/amiyna.jpg" },
        { title: "Mustafo",    type: "image", src: "assets/dizayn/avatarlar/mustafo.jpg" }
      ]
    },
  
    aivideo: {
      reels: [
        { title: "Cloud 6", type: "video", src: "assets/aivideolar/reels/cloud6.mp4" },
        { title: "Moxitos", type: "video", src: "assets/aivideolar/reels/moxitos.mp4" },
        { title: "Result",  type: "video", src: "assets/aivideolar/reels/result.mp4" },
        { title: "Ice",     type: "video", src: "assets/aivideolar/reels/ice.mp4" }
      ],
      multfilmlar: [
        { title: "Hayit multfilmi", type: "video", src: "assets/aivideolar/multfilmlar/hayitmultfilm.mp4" },
        { title: "Non multfilmi",   type: "video", src: "assets/aivideolar/multfilmlar/nonmultfilm.mp4" }
      ]
    }
  
  };