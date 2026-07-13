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
  const searchInput = document.getElementById('itemSearch');

  let allItems = [];
  let activeFilter = 'all';
  let searchTerm = '';

  /* ---------- top-level admin tabs (Kontent / Sozlamalar / Statistika) ---------- */
  const adminTabsBar = document.getElementById('adminTabs');
  adminTabsBar.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-admin-tab');
      adminTabsBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-admin-panel') === target);
      });
      if (target === 'stats') loadStats();
      if (target === 'settings') loadSettings();
    });
  });

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
      const raw = categorySelect.value;
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
        link: (!isYoutube && link) ? link : null,
        published: true,
        sort_order: Date.now() % 1000000
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

  /* ---------- filter tabs + search ---------- */
  filterBar.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      renderItems();
    });
  });
  searchInput.addEventListener('input', () => {
    searchTerm = searchInput.value.trim().toLowerCase();
    renderItems();
  });

  /* ---------- list / edit / delete / publish / reorder ---------- */
  async function loadItems(){
    itemsList.innerHTML = '<p class="muted">Yuklanmoqda...</p>';
    const { data, error } = await sb
      .from('portfolio_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error){
      itemsList.innerHTML = "<p class=\"error-text\">Ro'yxatni yuklab bo'lmadi.</p>";
      return;
    }
    allItems = data || [];
    renderItems();
  }

  function rowMatchesFilter(row){
    if (activeFilter !== 'all'){
      const key = row.subcategory ? `${row.category}:${row.subcategory}` : row.category;
      if (key !== activeFilter) return false;
    }
    if (searchTerm && !row.title.toLowerCase().includes(searchTerm)) return false;
    return true;
  }

  function renderItems(){
    const rows = allItems.filter(rowMatchesFilter);

    if (!rows.length){
      itemsList.innerHTML = '<p class="muted">Hech narsa topilmadi.</p>';
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
      const isPublished = row.published !== false;
      return `
        <article class="glass item-card ${isPublished ? '' : 'unpublished'}" data-id="${row.id}" draggable="true">
          <div class="item-actions">
            <button class="item-icon-btn" title="${isPublished ? 'Yashirish' : 'Ko\u2019rsatish'}" data-toggle="${row.id}">
              ${isPublished
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.9 17.9A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.6 21.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a21.6 21.6 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>'}
            </button>
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
    itemsList.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => togglePublished(btn.getAttribute('data-toggle')));
    });
    wireDragReorder();
  }

  async function togglePublished(id){
    const row = allItems.find(r => r.id === id);
    if (!row) return;
    const next = !(row.published !== false);
    const { error } = await sb.from('portfolio_items').update({ published: next }).eq('id', id);
    if (error){ alert('Xatolik: ' + error.message); return; }
    row.published = next;
    renderItems();
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

  /* ---------- drag & drop reorder ---------- */
  function wireDragReorder(){
    let dragEl = null;
    itemsList.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('dragstart', () => {
        dragEl = card;
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        itemsList.querySelectorAll('.drag-over').forEach(c => c.classList.remove('drag-over'));
        persistOrder();
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (card !== dragEl) card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (!dragEl || card === dragEl) return;
        const cards = Array.from(itemsList.children);
        const dragIdx = cards.indexOf(dragEl);
        const dropIdx = cards.indexOf(card);
        if (dragIdx < dropIdx) card.after(dragEl); else card.before(dragEl);
      });
    });
  }

  async function persistOrder(){
    const idsInOrder = Array.from(itemsList.querySelectorAll('.item-card')).map(c => c.getAttribute('data-id'));
    // only meaningful within the currently filtered view; assign fresh sequential values
    const updates = idsInOrder.map((id, idx) => ({ id, sort_order: (idx + 1) * 10 }));
    for (const u of updates){
      const row = allItems.find(r => r.id === u.id);
      if (row) row.sort_order = u.sort_order;
      await sb.from('portfolio_items').update({ sort_order: u.sort_order }).eq('id', u.id);
    }
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

  /* ---------- site settings (About + Contact) ---------- */
  const settingsForm = document.getElementById('settingsForm');
  const settingsStatus = document.getElementById('settingsStatus');
  let settingsLoaded = false;

  async function loadSettings(){
    if (settingsLoaded) return;
    const { data, error } = await sb.from('site_settings').select('*').eq('id', 1).single();
    if (error || !data) return;
    document.getElementById('sAboutHeading').value = data.about_heading || '';
    document.getElementById('sAboutText1').value = data.about_text1 || '';
    document.getElementById('sAboutText2').value = data.about_text2 || '';
    document.getElementById('sStat1Value').value = data.stat1_value || '';
    document.getElementById('sStat1Label').value = data.stat1_label || '';
    document.getElementById('sStat2Value').value = data.stat2_value || '';
    document.getElementById('sStat2Label').value = data.stat2_label || '';
    document.getElementById('sStat3Value').value = data.stat3_value || '';
    document.getElementById('sStat3Label').value = data.stat3_label || '';
    document.getElementById('sTelegram').value = data.contact_telegram || '';
    document.getElementById('sInstagram').value = data.contact_instagram || '';
    document.getElementById('sEmail').value = data.contact_email || '';
    document.getElementById('sPhone').value = data.contact_phone || '';
    settingsLoaded = true;
  }

  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    settingsStatus.textContent = '';
    const payload = {
      about_heading: val('sAboutHeading'),
      about_text1: val('sAboutText1'),
      about_text2: val('sAboutText2'),
      stat1_value: val('sStat1Value'), stat1_label: val('sStat1Label'),
      stat2_value: val('sStat2Value'), stat2_label: val('sStat2Label'),
      stat3_value: val('sStat3Value'), stat3_label: val('sStat3Label'),
      contact_telegram: val('sTelegram'),
      contact_instagram: val('sInstagram'),
      contact_email: val('sEmail'),
      contact_phone: val('sPhone'),
      updated_at: new Date().toISOString()
    };
    const { error } = await sb.from('site_settings').update(payload).eq('id', 1);
    if (error){
      settingsStatus.textContent = 'Xatolik: ' + error.message;
      settingsStatus.style.color = '#ff8e8e';
      return;
    }
    settingsStatus.style.color = '';
    settingsStatus.textContent = "✓ Saqlandi — saytda yangilanadi.";
  });

  function val(id){ return document.getElementById(id).value.trim(); }

  /* ---------- stats ---------- */
  async function loadStats(){
    const totalEl = document.getElementById('statTotal');
    const uniqueEl = document.getElementById('statUnique');
    const sevenEl = document.getElementById('stat7d');
    const todayEl = document.getElementById('statToday');
    [totalEl, uniqueEl, sevenEl, todayEl].forEach(el => el.textContent = '…');

    const { count: totalCount } = await sb.from('page_views').select('*', { count: 'exact', head: true });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: weekCount } = await sb.from('page_views').select('*', { count: 'exact', head: true }).gte('visited_at', sevenDaysAgo);

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const { count: todayCount } = await sb.from('page_views').select('*', { count: 'exact', head: true }).gte('visited_at', todayStart.toISOString());

    const { data: idsData } = await sb.from('page_views').select('visitor_id').limit(10000);
    const uniqueCount = idsData ? new Set(idsData.map(r => r.visitor_id)).size : 0;

    totalEl.textContent = totalCount ?? 0;
    uniqueEl.textContent = uniqueCount;
    sevenEl.textContent = weekCount ?? 0;
    todayEl.textContent = todayCount ?? 0;
  }

  checkSession();
});
