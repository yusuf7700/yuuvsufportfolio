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
  const linkLabel = document.getElementById('fLinkLabel');
  const filterBar = document.getElementById('itemFilters');

  let allItems = [];       // cache of everything fetched from Supabase
  let activeFilter = 'all';

  /* form fields change meaning depending on chosen category */
  function syncFieldsToCategory(){
    const raw = categorySelect.value;
    const isYoutube = raw === 'aivideo:multfilmlar';
    const isWebsite = raw === 'websites';

    fileInput.required = !isYoutube;
    fileLabel.style.display = isYoutube ? 'none' : 'block';
    linkInput.required = isYoutube;

    if (isYoutube){
      linkLabel.firstChild.textContent = 'YouTube havolasi ';
      linkInput.placeholder = 'https://youtu.be/...';
    } else if (isWebsite){
      linkLabel.firstChild.textContent = 'Sayt manzili ';
      linkInput.placeholder = 'https://sizningsaytingiz.com';
    } else {
      linkLabel.firstChild.textContent = 'Havola (ixtiyoriy) ';
      linkInput.placeholder = 'https://... (ixtiyoriy)';
    }
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

  /* ---------- filter tabs ---------- */
  filterBar.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      renderItems();
    });
  });

  /* ---------- list / edit / delete ---------- */
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
    allItems = data || [];
    renderItems();
  }

  function rowMatchesFilter(row){
    if (activeFilter === 'all') return true;
    const key = row.subcategory ? `${row.category}:${row.subcategory}` : row.category;
    return key === activeFilter;
  }

  function renderItems(){
    const rows = allItems.filter(rowMatchesFilter);

    if (!rows.length){
      itemsList.innerHTML = '<p class="muted">Bu bo\'limda hozircha hech narsa yo\'q.</p>';
      return;
    }

    itemsList.innerHTML = rows.map(row => {
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
      return `
        <article class="glass item-card" data-id="${row.id}">
          <div class="item-actions">
            <button class="item-icon-btn" title="Tahrirlash" data-edit="${row.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="item-icon-btn danger" title="O'chirish" data-delete="${row.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
          </div>
          <div class="card-media">${media}</div>
          <h4 class="item-title">${row.title}</h4>
          <div class="meta">${label}</div>
        </article>`;
    }).join('');

    itemsList.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => deleteItem(btn.getAttribute('data-delete')));
    });
    itemsList.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => startEdit(btn.getAttribute('data-edit')));
    });
  }

  function startEdit(id){
    const row = allItems.find(r => r.id === id);
    if (!row) return;
    const card = itemsList.querySelector(`.item-card[data-id="${id}"]`);
    if (!card) return;

    card.innerHTML = `
      <div class="edit-form">
        <label>Nomi
          <input type="text" class="edit-title" value="${escapeAttr(row.title)}">
        </label>
        <label>Havola ${row.type === 'youtube' ? '(YouTube)' : '(ixtiyoriy)'}
          <input type="text" class="edit-link" value="${escapeAttr(row.type === 'youtube' ? row.media_url : (row.link || ''))}">
        </label>
        <div class="edit-actions">
          <button class="btn btn-primary edit-save">Saqlash</button>
          <button class="btn btn-ghost edit-cancel">Bekor qilish</button>
        </div>
      </div>`;

    card.querySelector('.edit-cancel').addEventListener('click', renderItems);
    card.querySelector('.edit-save').addEventListener('click', async () => {
      const newTitle = card.querySelector('.edit-title').value.trim();
      const newLink = card.querySelector('.edit-link').value.trim();
      const payload = { title: newTitle };
      if (row.type === 'youtube'){
        payload.media_url = newLink;
      } else {
        payload.link = newLink || null;
      }
      const { error } = await sb.from('portfolio_items').update(payload).eq('id', id);
      if (error){
        alert('Saqlashda xatolik: ' + error.message);
        return;
      }
      await loadItems();
    });
  }

  function escapeAttr(str){
    return String(str || '').replace(/"/g, '&quot;');
  }

  function extractYouTubeId(url){
    const m = (url || '').match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]+)/);
    return m ? m[1] : '';
  }

  function extractPath(publicUrl){
    const marker = `/object/public/${SUPABASE_BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    return idx === -1 ? '' : publicUrl.slice(idx + marker.length);
  }

  async function deleteItem(id){
    if (!confirm("Bu ishni o'chirishni tasdiqlaysizmi?")) return;
    const row = allItems.find(r => r.id === id);
    await sb.from('portfolio_items').delete().eq('id', id);
    if (row && row.type !== 'youtube'){
      const path = extractPath(row.media_url);
      if (path) await sb.storage.from(SUPABASE_BUCKET).remove([path]);
    }
    loadItems();
  }

  checkSession();
});
