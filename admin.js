// ===== Yuuvsuf Admin Panel =====

document.addEventListener('DOMContentLoaded', () => {

    const configWarning = document.getElementById('configWarning');
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    const logoutBtn = document.getElementById('logoutBtn');
  
    if (typeof SUPABASE_IS_CONFIGURED === 'undefined' || !SUPABASE_IS_CONFIGURED){
      configWarning.style.display = 'flex';
      loginScreen.style.display = 'none';
      return;
    }
  
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('uploadStatus');
    const uploadBtn = document.getElementById('uploadBtn');
    const itemsList = document.getElementById('itemsList');
    const categorySelect = document.getElementById('fCategory');
    const fileInput = document.getElementById('fFile');
    const linkInput = document.getElementById('fLink');
    const fileLabel = fileInput.closest('label');
    const linkLabel = linkInput.closest('label');
  
    /* multfilmlar = YouTube link only, no file upload needed */
    function syncFieldsToCategory(){
      const isYoutube = categorySelect.value === 'aivideo:multfilmlar';
      fileInput.required = !isYoutube;
      fileLabel.style.display = isYoutube ? 'none' : 'block';
      linkInput.required = isYoutube;
      linkInput.placeholder = isYoutube ? 'https://youtu.be/...' : 'https://... (ixtiyoriy)';
    }
    categorySelect.addEventListener('change', syncFieldsToCategory);
    syncFieldsToCategory();
  
    /* ---------- auth state ---------- */
    async function checkSession(){
      const { data: { session } } = await sb.auth.getSession();
      if (session) showDashboard(); else showLogin();
    }
  
    function showLogin(){
      loginScreen.style.display = 'flex';
      dashboard.style.display = 'none';
      logoutBtn.style.display = 'none';
    }
  
    function showDashboard(){
      loginScreen.style.display = 'none';
      dashboard.style.display = 'block';
      logoutBtn.style.display = 'inline-flex';
      loadItems();
    }
  
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.textContent = '';
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error){
        loginError.textContent = 'Kirish amalga oshmadi: email yoki parol xato.';
        return;
      }
      showDashboard();
    });
  
    logoutBtn.addEventListener('click', async () => {
      await sb.auth.signOut();
      showLogin();
    });
  
    /* ---------- upload ---------- */
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      uploadStatus.textContent = '';
      uploadStatus.style.color = '';
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Yuklanmoqda...';
  
      try{
        const raw = categorySelect.value; // e.g. "design:posterlar" or "websites"
        const [category, subcategory] = raw.split(':');
        const title = document.getElementById('fTitle').value.trim();
        const link = linkInput.value.trim();
        const isYoutube = raw === 'aivideo:multfilmlar';
  
        let type, media_url;
  
        if (isYoutube){
          if (!link) throw new Error('YouTube havolasini kiriting');
          type = 'youtube';
          media_url = link;
        } else {
          const file = fileInput.files[0];
          if (!file) throw new Error('Fayl tanlanmagan');
          type = file.type.startsWith('video') ? 'video' : 'image';
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const path = `${category}/${subcategory || 'general'}/${Date.now()}_${safeName}`;
          const { error: upErr } = await sb.storage.from(SUPABASE_BUCKET).upload(path, file, { upsert: false });
          if (upErr) throw upErr;
          const { data: pub } = sb.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
          media_url = pub.publicUrl;
        }
  
        const { error: insErr } = await sb.from('portfolio_items').insert({
          category,
          subcategory: subcategory || null,
          title,
          type,
          media_url,
          link: (!isYoutube && link) ? link : null
        });
        if (insErr) throw insErr;
  
        uploadStatus.textContent = "✓ Muvaffaqiyatli qo'shildi.";
        uploadForm.reset();
        syncFieldsToCategory();
        loadItems();
      } catch(err){
        console.error(err);
        uploadStatus.textContent = 'Xatolik: ' + (err.message || "yuklab bo'lmadi");
        uploadStatus.style.color = '#ff8e8e';
      } finally{
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Yuklash';
      }
    });
  
    /* ---------- list + delete ---------- */
    async function loadItems(){
      itemsList.innerHTML = '<p class="muted">Yuklanmoqda...</p>';
      const { data, error } = await sb
        .from('portfolio_items')
        .select('*')
        .order('created_at', { ascending: false });
  
      if (error){
        itemsList.innerHTML = "<p class=\"error-text\">Ro'yxatni yuklab bo'lmadi.</p>";
        return;
      }
      if (!data || !data.length){
        itemsList.innerHTML = '<p class="muted">Hozircha hech narsa qo\'shilmagan.</p>';
        return;
      }
  
      itemsList.innerHTML = data.map(row => {
        let media;
        if (row.type === 'video'){
          media = `<video src="${row.media_url}" muted></video>`;
        } else if (row.type === 'youtube'){
          const id = extractYouTubeId(row.media_url);
          media = `<img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="${row.title}" loading="lazy">`;
        } else {
          media = `<img src="${row.media_url}" alt="${row.title}" loading="lazy">`;
        }
        const label = row.subcategory ? `${row.category} / ${row.subcategory}` : row.category;
        const storagePath = row.type === 'youtube' ? '' : extractPath(row.media_url);
        return `
          <article class="glass item-card" data-id="${row.id}">
            <button class="item-delete" title="O'chirish" data-delete="${row.id}" data-path="${storagePath}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
            <div class="card-media">${media}</div>
            <h4>${row.title}</h4>
            <div class="meta">${label}</div>
          </article>`;
      }).join('');
  
      itemsList.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', () => deleteItem(btn.getAttribute('data-delete'), btn.getAttribute('data-path')));
      });
    }
  
    function extractYouTubeId(url){
      const m = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]+)/);
      return m ? m[1] : '';
    }
  
    function extractPath(publicUrl){
      const marker = `/object/public/${SUPABASE_BUCKET}/`;
      const idx = publicUrl.indexOf(marker);
      return idx === -1 ? '' : publicUrl.slice(idx + marker.length);
    }
  
    async function deleteItem(id, path){
      if (!confirm("Bu ishni o'chirishni tasdiqlaysizmi?")) return;
      await sb.from('portfolio_items').delete().eq('id', id);
      if (path) await sb.storage.from(SUPABASE_BUCKET).remove([path]);
      loadItems();
    }
  
    checkSession();
  });