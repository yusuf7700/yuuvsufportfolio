// ===== Yuuvsuf Portfolio — interactions =====

document.addEventListener('DOMContentLoaded', () => {

  const navLinks = document.getElementById('navLinks');
  const heroHome = document.getElementById('heroHome');
  const body = document.body;

  /* ---------- theme toggle (dark / light) ---------- */
  const themeToggle = document.getElementById('themeToggle');
  let currentTheme = 'dark';
  applyTheme(currentTheme);

  themeToggle?.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
  });

  function applyTheme(theme){
    body.setAttribute('data-theme', theme);
  }

  /* ---------- shared Supabase client (content + settings + analytics) ---------- */
  const sbClient = (typeof SUPABASE_IS_CONFIGURED !== 'undefined' && SUPABASE_IS_CONFIGURED && typeof supabase !== 'undefined')
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  /* ---------- anonymous view tracking ---------- */
  function getVisitorId(){
    try{
      let id = localStorage.getItem('yuuvsuf_visitor_id');
      if (!id){
        id = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('yuuvsuf_visitor_id', id);
      }
      return id;
    } catch(e){
      return 'v_anon';
    }
  }

  function logPageView(){
    if (!sbClient) return;
    sbClient.from('page_views').insert({ visitor_id: getVisitorId() }).then(() => {}).catch(() => {});
  }
  logPageView();

  /* ---------- site settings (About + Contact), loaded from Supabase if available ---------- */
  async function loadSiteSettings(){
    if (!sbClient) return;
    try{
      const { data, error } = await sbClient.from('site_settings').select('*').eq('id', 1).single();
      if (error || !data) return;

      const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el && value) el.textContent = value;
      };
      setText('aboutHeading', data.about_heading);
      setText('aboutText1', data.about_text1);
      setText('aboutText2', data.about_text2);

      const statRow = document.getElementById('statRow');
      const stats = [
        [data.stat1_value, data.stat1_label],
        [data.stat2_value, data.stat2_label],
        [data.stat3_value, data.stat3_label]
      ].filter(([v, l]) => v && l);
      if (statRow && stats.length){
        statRow.innerHTML = stats.map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');
      }

      const contactMap = {
        telegram: { link: v => `https://t.me/${v.replace('@','')}`, label: v => v },
        instagram: { link: v => `https://instagram.com/${v.replace('@','')}`, label: v => v },
        email: { link: v => `mailto:${v}`, label: v => v },
        phone: { link: v => `tel:${v.replace(/\s/g,'')}`, label: v => v }
      };
      document.querySelectorAll('[data-contact]').forEach(card => {
        const key = card.getAttribute('data-contact');
        const value = data[`contact_${key}`];
        if (value && contactMap[key]){
          card.href = contactMap[key].link(value);
          const span = card.querySelector('[data-field="value"]');
          if (span) span.textContent = contactMap[key].label(value);
        }
      });
    } catch(e){
      console.warn('Site settings could not be loaded', e);
    }
  }
  loadSiteSettings();

  /* ---------- generic tab controller ----------
     Works for the main header nav (controls top-level .tab-panel
     elements inside <main class="tab-shell">) and for any nested
     [data-tabs] block (e.g. Posterlar / Muqovalar / Avatarlar). */

  function switchPanel(panelsRoot, buttonsRoot, targetName){
    panelsRoot.forEach(panel => {
      const match = panel.getAttribute('data-tab-panel') === targetName;
      panel.classList.toggle('active', match);
    });
    buttonsRoot.forEach(btn => {
      const match = btn.getAttribute('data-tab-target') === targetName;
      btn.classList.toggle('active', match);
      if (btn.hasAttribute('aria-selected')) btn.setAttribute('aria-selected', String(match));
    });
  }

  // --- main tab shell (controlled by header nav + overview cards) ---
  const mainPanels = document.querySelectorAll('.tab-shell > .container > [data-tab-panel]');

  function goToMainTab(target){
    switchPanel(mainPanels, document.querySelectorAll('#navLinks [data-tab-target], .brand[data-tab-target]'), target);
    heroHome?.classList.toggle('is-hidden', target !== 'home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-tab-target]').forEach(el => {
    const target = el.getAttribute('data-tab-target');
    const isTopLevel = document.querySelector(`.tab-shell > .container > [data-tab-panel="${target}"]`);
    if (isTopLevel){
      el.addEventListener('click', () => goToMainTab(target));
    }
  });

  // --- nested sub-tabs (Design: Posterlar/Muqovalar/Avatarlar, AI Video: Reels/Multfilmlar) ---
  document.querySelectorAll('[data-tabs]').forEach(tabsBlock => {
    const buttons = tabsBlock.querySelectorAll(':scope > .tab-buttons > .tab-btn');
    const panels = tabsBlock.querySelectorAll(':scope > .tab-panels > [data-tab-panel]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab-target');
        switchPanel(panels, buttons, target);
      });
    });
  });

  /* ---------- content source: Supabase (live) with local data.js fallback ---------- */
  function emptyStructure(){
    return {
      websites: [],
      design: { posterlar: [], muqovalar: [], avatarlar: [] },
      aivideo: { reels: [], multfilmlar: [] }
    };
  }

  async function loadRemoteData(){
    if (!sbClient) return null;
    try{
      const { data, error } = await sbClient
        .from('portfolio_items')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error || !data) return null;

      const grouped = emptyStructure();
      data.forEach(row => {
        const isYoutube = row.type === 'youtube';
        const item = {
          title: row.title,
          type: row.type,
          src: isYoutube ? '' : row.media_url,
          link: isYoutube ? row.media_url : (row.link || '')
        };
        if (row.category === 'websites') grouped.websites.push(item);
        else if (row.category === 'design' && grouped.design[row.subcategory]) grouped.design[row.subcategory].push(item);
        else if (row.category === 'aivideo' && grouped.aivideo[row.subcategory]) grouped.aivideo[row.subcategory].push(item);
      });
      return grouped;
    } catch(e){
      console.warn('Supabase content fetch failed, using local data.js', e);
      return null;
    }
  }

  /* ---------- YouTube helper ---------- */
  function extractYouTubeId(url){
    const m = (url || '').match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]+)/);
    return m ? m[1] : '';
  }

  /* ---------- lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxContent = document.getElementById('lightboxContent');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(item){
    let html = '';
    if (item.type === 'image'){
      html = `<img src="${item.src}" alt="${item.title}">`;
    } else if (item.type === 'video'){
      html = `<video src="${item.src}" controls autoplay playsinline></video>`;
    } else if (item.type === 'youtube'){
      const id = extractYouTubeId(item.link);
      html = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    }
    if (!html) return;
    lightboxContent.innerHTML = html;
    lightbox.classList.add('open');
  }

  function closeLightbox(){
    lightbox.classList.remove('open');
    lightboxContent.innerHTML = ''; // stops video/audio playback
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* ---------- render content ---------- */
  function mediaFor(item){
    if (item.type === 'video'){
      return `<video src="${item.src}" muted loop playsinline preload="metadata" onmouseover="this.play()" onmouseout="this.pause()" onerror="this.closest('.card-media').classList.add('media-missing')"></video>
        <span class="play-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>`;
    }
    if (item.type === 'youtube'){
      const id = extractYouTubeId(item.link);
      return `<img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="${item.title}" loading="lazy" onerror="this.closest('.card-media').classList.add('media-missing')">
        <span class="play-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>`;
    }
    return `<img src="${item.src}" alt="${item.title}" loading="lazy" onerror="this.closest('.card-media').classList.add('media-missing')">`;
  }

  function renderGrid(container, items){
    const path = container.getAttribute('data-render');
    const isWebsites = path === 'websites';
    const aspectClass = container.dataset.aspect ? `aspect-${container.dataset.aspect}` : '';

    if (!items || !items.length){
      container.innerHTML = `
        <div class="glass note-card" style="grid-column: 1 / -1; justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
          Hozircha bu bo'limda ish yo'q — tez orada qo'shiladi.
        </div>`;
      return;
    }

    container.innerHTML = items.map((item, idx) => {
      const playable = (item.type === 'video' || item.type === 'youtube') && !isWebsites;
      const mediaAttr = playable ? ' data-playable="1"' : '';
      const cardInner = `
        <div class="card-media ${aspectClass}"${mediaAttr}>${mediaFor(item)}</div>
        <h3>${item.title}</h3>`;
      if (isWebsites && item.link){
        return `<a class="glass card" href="${item.link}" target="_blank" rel="noopener">${cardInner}</a>`;
      }
      if (!isWebsites){
        return `<article class="glass card" data-clickable="1" data-idx="${idx}">${cardInner}</article>`;
      }
      return `<article class="glass card">${cardInner}</article>`;
    }).join('');

    if (!isWebsites){
      container.querySelectorAll('[data-clickable]').forEach(card => {
        const idx = Number(card.getAttribute('data-idx'));
        card.addEventListener('click', () => openLightbox(items[idx]));
      });
    }
  }

  function getPath(obj, path){
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  }

  if (typeof PORTFOLIO_DATA !== 'undefined'){
    renderAll(PORTFOLIO_DATA); // instant local fallback so the page never looks empty
  }
  loadRemoteData().then(remote => {
    if (!remote) return;
    // merge: use remote items for a section only if that section actually has content;
    // otherwise keep showing the local data.js placeholder for that section.
    document.querySelectorAll('[data-render]').forEach(container => {
      const path = container.getAttribute('data-render');
      const remoteItems = getPath(remote, path);
      if (remoteItems && remoteItems.length){
        renderGrid(container, remoteItems);
      }
    });
  });

  function renderAll(source){
    document.querySelectorAll('[data-render]').forEach(container => {
      const path = container.getAttribute('data-render');
      const items = getPath(source, path);
      renderGrid(container, items);
    });
  }

  /* ---------- subtle parallax on background strands ---------- */
  const strandField = document.querySelector('.strand-field');
  let ticking = false;
  window.addEventListener('mousemove', (e) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 14;
      if (strandField) strandField.style.transform = `translate(${x}px, ${y}px)`;
      ticking = false;
    });
  });

});
