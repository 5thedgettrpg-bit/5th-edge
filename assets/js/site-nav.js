(() => {
  const headerInner = document.querySelector('.site-header-inner, .header-inner');
  if (!headerInner || headerInner.dataset.edgeNavReady === '1') return;
  headerInner.dataset.edgeNavReady = '1';

  headerInner.querySelector('.site-links, .primary-nav')?.remove();
  headerInner.querySelector('.mobile-menu')?.remove();

  const classLinks = [
    ['Artificer','/classes/artificer/'],
    ['Barbarian','/classes/barbarian/'],
    ['Bard','/classes/bard/'],
    ['Cleric','/classes/cleric/'],
    ['Druid','/classes/druid/'],
    ['Fighter','/classes/fighter/'],
    ['Monk','/classes/monk/'],
    ['Paladin','/classes/paladin/'],
    ['Ranger','/classes/ranger/'],
    ['Rogue','/classes/rogue/'],
    ['Sorcerer','/classes/sorcerer/'],
    ['Warlock','/classes/warlock/'],
    ['Wizard','/classes/wizard/']
  ];

  const nav = document.createElement('nav');
  nav.className = 'edge-nav';
  nav.setAttribute('aria-label','Primary navigation');

  function addDirect(label,href){
    const a=document.createElement('a');
    a.className='edge-nav-direct';
    a.href=href;
    a.textContent=label;
    nav.appendChild(a);
  }

  function addMega(label,sections,panelClass=''){
    const gi=nav.querySelectorAll('.edge-nav-group').length;
    const wrap=document.createElement('div');
    wrap.className='edge-nav-group';

    const btn=document.createElement('button');
    btn.className='edge-nav-trigger';
    btn.type='button';
    btn.textContent=label;
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-controls','edge-nav-panel-'+gi);

    const panel=document.createElement('div');
    panel.className='edge-nav-panel'+(panelClass ? ' '+panelClass : '');
    panel.id='edge-nav-panel-'+gi;

    sections.forEach(section=>{
      const sec=document.createElement('div');
      sec.className='edge-nav-section';
      const h=document.createElement('h3');
      h.textContent=section.title;
      sec.appendChild(h);
      section.links.forEach(([text,href])=>{
        const a=document.createElement('a');
        a.href=href;
        a.textContent=text;
        sec.appendChild(a);
      });
      panel.appendChild(sec);
    });

    btn.addEventListener('click',e=>{
      e.stopPropagation();
      document.querySelectorAll('.edge-nav-group').forEach(x=>{
        if(x!==wrap){
          x.classList.remove('open');
          x.querySelector('.edge-nav-trigger')?.setAttribute('aria-expanded','false');
        }
      });
      const open=wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded',String(open));
    });

    wrap.append(btn,panel);
    nav.appendChild(wrap);
  }

  addDirect('Home','/');
  addMega('Classes',[{title:'Classes',links:classLinks}],'edge-nav-panel-classes');
  addDirect('Races','/races/');
  addDirect('Backgrounds','/backgrounds/');
  addDirect('Feats','/feats/');
  addMega('Character Options',[
    {title:'Build',links:[['Character Builder','https://play.familiararcanattrpg.com']]},
    {title:'Popular Classes',links:[['Barbarian','/classes/barbarian/'],['Paladin','/classes/paladin/'],['Ranger','/classes/ranger/'],['Rogue','/classes/rogue/']]}
  ]);
  addMega('Rules and Content',[
    {title:'Rules Library',links:[['Rules','/rules/'],['Spells','/spells/']]},
    {title:'Project',links:[['Legal & Licensing','/legal/']]}
  ]);

  const builder=document.createElement('a');
  builder.className='edge-nav-builder';
  builder.href='https://play.familiararcanattrpg.com';
  builder.textContent='Character Builder';
  nav.appendChild(builder);

  const toggle=document.createElement('button');
  toggle.className='edge-nav-toggle';
  toggle.type='button';
  toggle.setAttribute('aria-expanded','false');
  toggle.textContent='☰ Menu';

  const drawer=document.createElement('div');
  drawer.className='edge-mobile-drawer';
  drawer.setAttribute('aria-label','Mobile navigation');

  const mobileSections=[
    {title:'Browse',links:[['Home','/'],['Races','/races/'],['Backgrounds','/backgrounds/'],['Feats','/feats/']]},
    {title:'Classes',links:classLinks},
    {title:'Character Options',links:[['Character Builder','https://play.familiararcanattrpg.com']]},
    {title:'Rules and Content',links:[['Rules','/rules/'],['Spells','/spells/'],['Legal & Licensing','/legal/']]}
  ];

  mobileSections.forEach(section=>{
    const sec=document.createElement('div');
    sec.className='edge-mobile-section';
    const h=document.createElement('h3');
    h.textContent=section.title;
    sec.appendChild(h);
    section.links.forEach(([label,href])=>{
      const a=document.createElement('a');
      a.href=href;
      a.textContent=label;
      if(label==='Character Builder') a.className='edge-nav-builder';
      sec.appendChild(a);
    });
    drawer.appendChild(sec);
  });

  toggle.addEventListener('click',()=>{
    const open=drawer.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
    toggle.textContent=open ? '✕ Close' : '☰ Menu';
  });

  document.addEventListener('click',()=>{
    document.querySelectorAll('.edge-nav-group').forEach(x=>{
      x.classList.remove('open');
      x.querySelector('.edge-nav-trigger')?.setAttribute('aria-expanded','false');
    });
  });

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      drawer.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      toggle.textContent='☰ Menu';
      document.querySelectorAll('.edge-nav-group').forEach(x=>{
        x.classList.remove('open');
        x.querySelector('.edge-nav-trigger')?.setAttribute('aria-expanded','false');
      });
    }
  });

  headerInner.append(nav,toggle,drawer);
})();
