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

  /* ---------- render content from data.js ---------- */
  function mediaFor(item){
    if (item.type === 'video'){
      return `<video src="${item.src}" muted loop playsinline preload="metadata" onmouseover="this.play()" onmouseout="this.pause()" onerror="this.closest('.card-media').classList.add('media-missing')"></video>`;
    }
    return `<img src="${item.src}" alt="${item.title}" loading="lazy" onerror="this.closest('.card-media').classList.add('media-missing')">`;
  }

  function renderGrid(container, items){
    if (!items || !items.length){
      container.innerHTML = `
        <div class="glass note-card" style="grid-column: 1 / -1; justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
          Hozircha bu bo'limda ish yo'q — tez orada qo'shiladi.
        </div>`;
      return;
    }
    container.innerHTML = items.map(item => {
      const mediaClass = item.type === 'video' ? ' data-video="1"' : '';
      const cardInner = `
        <div class="card-media"${mediaClass}>${mediaFor(item)}</div>
        <h3>${item.title}</h3>`;
      if (item.link){
        return `<a class="glass card" href="${item.link}" target="_blank" rel="noopener">${cardInner}</a>`;
      }
      return `<article class="glass card">${cardInner}</article>`;
    }).join('');
  }

  function getPath(obj, path){
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  }

  if (typeof PORTFOLIO_DATA !== 'undefined'){
    document.querySelectorAll('[data-render]').forEach(container => {
      const path = container.getAttribute('data-render');
      const items = getPath(PORTFOLIO_DATA, path);
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
