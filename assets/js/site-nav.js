(() => {
  const headerInner = document.querySelector('.site-header-inner, .header-inner');
  if (!headerInner || headerInner.dataset.edgeNavReady === '1') return;
  headerInner.dataset.edgeNavReady = '1';

  function ensureSiteHeadAssets(){
    const head=document.head;
    const ensureLink=(rel,href,attrs={})=>{
      let el=[...head.querySelectorAll('link')].find(x=>x.rel===rel && x.getAttribute('href')===href);
      if(!el){ el=document.createElement('link'); el.rel=rel; el.href=href; head.appendChild(el); }
      Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    };
    ensureLink('manifest','/site.webmanifest');
    if(!head.querySelector('link[rel="icon"]')) ensureLink('icon','/favicon.svg',{type:'image/svg+xml'});
    if(!head.querySelector('link[rel="apple-touch-icon"]')) ensureLink('apple-touch-icon','/assets/brand/5th-edge-logo.png');
    if(!head.querySelector('meta[name="theme-color"]')){
      const meta=document.createElement('meta'); meta.name='theme-color'; meta.content='#8f241f'; head.appendChild(meta);
    }
  }
  ensureSiteHeadAssets();

  headerInner.querySelector('.site-links, .primary-nav')?.remove();
  headerInner.querySelector('.mobile-menu')?.remove();

  function normalizeFooterLegal(){
    document.querySelectorAll('.footer-col').forEach(col=>{
      const h=col.querySelector('h3');
      if(!h || h.textContent.trim().toLowerCase()!=='legal') return;
      col.innerHTML='<h3>Legal</h3>'+[
        ['Legal & Licensing','/legal/'],
        ['Sitemap','/sitemap.xml'],
        ['System Reference Documents','https://www.dndbeyond.com/srd'],
        ['CC BY 4.0','https://creativecommons.org/licenses/by/4.0/']
      ].map(([label,href])=>'<a href="'+href+'">'+label+'</a>').join('');
    });
  }
  normalizeFooterLegal();

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
  addDirect('Races','/race');
  addMega('Character Options',[
    {title:'Character Options',links:[
      ['Backgrounds','/backgrounds/'],
      ['Feats','/feats/'],
      ['Fighting Styles','/fighting-styles/'],
      ['Eldritch Invocations','/eldritch-invocations/'],
      ['Spells','/spells/']
    ]}
  ],'edge-nav-panel-character-options');
  addMega('Rules and Content',[
    {title:'Rules Library',links:[['Rules','/rules/'],['Blog','/blog/']]},
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
    {title:'Browse',links:[['Home','/'],['Races','/race']]},
    {title:'Classes',links:classLinks},
    {title:'Character Options',links:[
      ['Backgrounds','/backgrounds/'],
      ['Feats','/feats/'],
      ['Fighting Styles','/fighting-styles/'],
      ['Eldritch Invocations','/eldritch-invocations/'],
      ['Spells','/spells/'],
      ['Character Builder','https://play.familiararcanattrpg.com']
    ]},
    {title:'Rules and Content',links:[['Rules','/rules/'],['Blog','/blog/'],['Legal & Licensing','/legal/']]}
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

  // Keep the footer identical across every page that loads the shared navigation.
  if(!document.body.dataset.edgeFooterReady){
    document.body.dataset.edgeFooterReady='1';
    const oldFooter=document.querySelector('.site-footer');
    const footer=document.createElement('footer');
    footer.className='site-footer';
    footer.innerHTML=`
      <div class="site-footer-inner">
        <div class="footer-brand">
          <img src="/assets/brand/5th-edge-logo.png" alt="5th Edge">
          <p>An independent fifth-edition compatible tabletop rules project with revised classes, character options, reference pages, and digital tools.</p>
          <span class="compat-badge">5E Compatible</span>
        </div>
        <div class="footer-columns">
          <div class="footer-col"><h3>Explore</h3><a href="/classes/">Classes</a><a href="/race">Races</a><a href="/backgrounds/">Backgrounds</a><a href="/feats/">Feats</a><a href="/spells/">Spells</a><a href="/rules/">Rules</a><a href="/blog/">Blog</a></div>
          <div class="footer-col"><h3>Build</h3><a href="https://play.familiararcanattrpg.com">Character Builder</a><a href="/classes/wizard/">Wizard</a><a href="/classes/ranger/">Ranger</a><a href="/classes/rogue/">Rogue</a><a href="/classes/barbarian/">Barbarian</a></div>
          <div class="footer-col"><h3>Legal</h3><a href="/legal/">Legal &amp; Licensing</a><a href="/sitemap.xml">Sitemap</a><a href="https://www.dndbeyond.com/srd">System Reference Documents</a><a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></div>
        </div>
      </div>
      <div class="footer-legal"><div class="footer-legal-inner">
        <p>Contains material from SRD 5.1 and, where used, SRD 5.2.1. Both are available under the Creative Commons Attribution 4.0 International license. See <a href="/legal/">Legal &amp; Licensing</a> for source and attribution details.</p>
        <span class="footer-copy">© 2026 5th Edge</span>
      </div></div>`;
    if(oldFooter) oldFooter.replaceWith(footer); else document.body.appendChild(footer);
  }
})();
