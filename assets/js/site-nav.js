(() => {
  const headerInner = document.querySelector('.site-header-inner, .header-inner');
  if (!headerInner || headerInner.dataset.edgeNavReady === '1') return;
  headerInner.dataset.edgeNavReady = '1';

  const oldNav = headerInner.querySelector('.site-links, .primary-nav');
  const oldMobile = headerInner.querySelector('.mobile-menu');
  if (oldNav) oldNav.remove();
  if (oldMobile) oldMobile.remove();

  const groups = [
    {
      label: 'Character Options',
      sections: [
        {title:'Build a Character', links:[['Classes','/classes/'],['Race','/race/'],['Backgrounds','/backgrounds/'],['Feats','/feats/']]},
        {title:'Popular Classes', links:[['Barbarian','/classes/barbarian/'],['Paladin','/classes/paladin/'],['Ranger','/classes/ranger/'],['Rogue','/classes/rogue/']]},
        {title:'Tools', links:[['Character Builder','/character-builder/']]}
      ]
    },
    {
      label: 'Rules & Content',
      sections: [
        {title:'Rules Library', links:[['Rules','/rules/'],['Spells','/spells/']]},
        {title:'Browse', links:[['Classes','/classes/'],['Race','/race/'],['Backgrounds','/backgrounds/'],['Feats','/feats/']]},
        {title:'Project', links:[['Legal & Licensing','/legal/'],['Home','/']]}
      ]
    }
  ];

  const nav = document.createElement('nav');
  nav.className = 'edge-nav';
  nav.setAttribute('aria-label','Primary navigation');

  groups.forEach((g,gi) => {
    const wrap = document.createElement('div');
    wrap.className = 'edge-nav-group';
    const btn = document.createElement('button');
    btn.className = 'edge-nav-trigger';
    btn.type = 'button';
    btn.textContent = g.label;
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-controls','edge-nav-panel-'+gi);

    const panel = document.createElement('div');
    panel.className = 'edge-nav-panel';
    panel.id = 'edge-nav-panel-'+gi;

    g.sections.forEach(s => {
      const sec = document.createElement('div');
      sec.className = 'edge-nav-section';
      const h = document.createElement('h3');
      h.textContent = s.title;
      sec.appendChild(h);
      s.links.forEach(([label,href]) => {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        sec.appendChild(a);
      });
      panel.appendChild(sec);
    });

    btn.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.edge-nav-group').forEach(x => {
        if (x !== wrap) {
          x.classList.remove('open');
          x.querySelector('.edge-nav-trigger')?.setAttribute('aria-expanded','false');
        }
      });
      const open = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });

    wrap.append(btn,panel);
    nav.appendChild(wrap);
  });

  const builder = document.createElement('a');
  builder.className = 'edge-nav-builder';
  builder.href = '/character-builder/';
  builder.textContent = 'Character Builder';
  nav.appendChild(builder);

  const toggle = document.createElement('button');
  toggle.className = 'edge-nav-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded','false');
  toggle.textContent = '☰ Menu';

  const drawer = document.createElement('div');
  drawer.className = 'edge-mobile-drawer';
  drawer.setAttribute('aria-label','Mobile navigation');

  const mobileSections = [
    {title:'Character Options',links:[['Classes','/classes/'],['Race','/race/'],['Backgrounds','/backgrounds/'],['Feats','/feats/']]},
    {title:'Rules & Content',links:[['Spells','/spells/'],['Rules','/rules/']]},
    {title:'Tools',links:[['Character Builder','/character-builder/'],['Legal & Licensing','/legal/']]}
  ];

  mobileSections.forEach(s => {
    const sec = document.createElement('div');
    sec.className = 'edge-mobile-section';
    const h = document.createElement('h3');
    h.textContent = s.title;
    sec.appendChild(h);
    s.links.forEach(([label,href]) => {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      if (label === 'Character Builder') a.className = 'edge-nav-builder';
      sec.appendChild(a);
    });
    drawer.appendChild(sec);
  });

  toggle.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '✕ Close' : '☰ Menu';
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.edge-nav-group').forEach(x => {
      x.classList.remove('open');
      x.querySelector('.edge-nav-trigger')?.setAttribute('aria-expanded','false');
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      drawer.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      toggle.textContent = '☰ Menu';
      document.querySelectorAll('.edge-nav-group').forEach(x => {
        x.classList.remove('open');
        x.querySelector('.edge-nav-trigger')?.setAttribute('aria-expanded','false');
      });
    }
  });

  headerInner.append(nav,toggle,drawer);
})();
