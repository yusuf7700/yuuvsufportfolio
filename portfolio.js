// ===== Yuuvsuf Portfolio — interactions =====

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- mobile nav toggle ---------- */
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    navToggle?.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  
    /* ---------- theme toggle (dark / light) ---------- */
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
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
      navLinks.classList.remove('open');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  
    document.querySelectorAll('[data-tab-target]').forEach(el => {
      // only wire elements that target a top-level panel (home, websites, design, ai-video, about, contact)
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