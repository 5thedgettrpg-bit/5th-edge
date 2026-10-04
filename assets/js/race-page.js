(() => {
  const state = { manifest:null, current:null, variantId:null };

  const $ = (sel,root=document)=>root.querySelector(sel);

  const RACE_HERO_ART = {
    'elf:eladrin': {
      src:'/assets/images/species/eladrin-character.png',
      alt:'Eladrin Elf'
    },
    'dragonborn:chromatic': {
      src:'https://assets.5thedgettrpg.com/race-images/dragonkin/dragonborn/chromatic/chromatic-dragonborn.png',
      alt:'Chromatic Dragonborn'
    },
    'dwarf:standard': {
      src:'https://assets.5thedgettrpg.com/race-images/common-folk/dwarf/dwarf.png',
      alt:'Dwarf'
    },
    'dwarf:mark-of-warding': {
      src:'https://assets.5thedgettrpg.com/race-images/common-folk/dwarf/mark-of-warding/mark-of-finding-dwarf.png',
      alt:'Mark of Warding Dwarf'
    },
    'kobold:base': {
      src:'https://assets.5thedgettrpg.com/race-images/dragonkin/kobold/kobold.png',
      alt:'Kobold'
    },
    'avian:aarakocra': {
      src:'https://assets.5thedgettrpg.com/race-images/wildborn/avian/aarakocra/aarakocra.png',
      alt:'Aarakocra'
    }
  };

  const esc = (s='') => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function categoryClass(name){
    const map={
      'Common Folk':'icon-common-folk',
      'Goblinoids':'icon-goblinoids',
      'Dragonkin':'icon-dragonkin',
      'Otherworldly':'icon-otherworldly',
      'Wildborn':'icon-wildborn',
      'Deepfolk':'icon-deepfolk',
      'Constructed':'icon-constructed',
      'Undead':'icon-undead',
      'Fey Folk':'icon-fey-folk',
      'Nomads':'icon-nomads',
      'Custom':'icon-custom'
    };
    return map[name] || 'icon-common-folk';
  }

  async function loadManifest(){
    const res = await fetch('/data/races/index.json',{cache:'no-store'});
    if(!res.ok) throw new Error('Could not load species index');
    state.manifest = await res.json();
  }

  function currentFromUrl(){
    const p = new URLSearchParams(location.search);
    const m = location.pathname.match(/^\/(?:race|races)\/([^/]+)(?:\/([^/]+))?\/?$/);
    const species = m ? decodeURIComponent(m[1]) : (p.get('race') || p.get('species') || null);
    return {
      species,
      variant:m?.[2] ? decodeURIComponent(m[2]) : (p.get('variant') || null)
    };
  }

  function raceUrl(species,variant){
    const p = new URLSearchParams();
    if(variant) p.set('variant',variant);
    const qs=p.toString();
    return '/races/'+encodeURIComponent(species)+'/' + (qs ? '?'+qs : '');
  }

  function pushUrl(species,variant){
    history.pushState({},'',raceUrl(species,variant));
  }

  function renderSidebar(){
    const host = $('#speciesAccordion');
    host.innerHTML = '';
    const byCat = new Map();
    for(const c of state.manifest.categories) byCat.set(c.name,[]);
    for(const s of state.manifest.species){
      if(!byCat.has(s.category)) byCat.set(s.category,[]);
      byCat.get(s.category).push(s);
    }

    const activeSpecies=state.manifest.species.find(x=>x.id===state.current);
    const activeCategory=activeSpecies?.category || null;

    const sortedCategories=[...state.manifest.categories].sort((a,b)=>{ if(a.name==='Custom') return 1; if(b.name==='Custom') return -1; return a.name.localeCompare(b.name); });
    for(const c of sortedCategories){
      const items=(byCat.get(c.name)||[]).sort((a,b)=>a.name.localeCompare(b.name));
      const details=document.createElement('details');
      details.className='species-group';
      details.dataset.category=c.name;
      details.open = activeCategory ? c.name === activeCategory : false;
      details.innerHTML =
        '<summary>'+
          '<span class="species-category-icon '+categoryClass(c.name)+'" aria-hidden="true"></span>'+
          '<span class="species-group-name">'+esc(c.name)+'</span>'+
          '<span class="species-group-count">'+items.length+'</span>'+
        '</summary><div class="species-group-list"></div>';
      details.addEventListener('toggle',()=>{
        if(!details.open) return;
        host.querySelectorAll('.species-group').forEach(other=>{
          if(other!==details) other.open=false;
        });
      });
      const list=$('.species-group-list',details);
      for(const item of items){
        const a=document.createElement('a');
        a.href=raceUrl(item.id,null);
        a.textContent=item.name;
        a.dataset.species=item.id;
        if(item.id===state.current) a.classList.add('active');
        a.addEventListener('click',ev=>{
          ev.preventDefault();
          selectSpecies(item.id,null,true);
        });
        list.appendChild(a);
      }
      host.appendChild(details);
    }
  }

  function renderRaceLanding(){
    state.current=null;
    state.variantId=null;
    renderSidebar();
    $('#speciesKicker').textContent='5th Edge';
    $('#speciesTitle').textContent='Races';
    $('#speciesIntro').textContent='Choose a race from the list to view its subraces, racial features, ability scores, movement, languages, and traits.';
    $('#variantWrap').hidden=true;
    $('#variantWrap').style.display='none';
    $('#speciesHeroCharacter')?.classList.add('is-hidden');
    $('.species-hero-approved')?.classList.remove('is-eladrin');
    const meta=$('#speciesMeta');
    const title=$('#speciesVariantName');
    const source=$('#speciesSource');
    const features=$('#speciesFeatures');
    if(meta) meta.innerHTML='';
    if(title) title.textContent='Choose a Race';
    if(source) source.textContent='';
    if(features) features.innerHTML='<div class="species-empty">Choose a race from the left to begin.</div>';
  }

  async function selectSpecies(id,variantId=null,updateUrl=false){
    state.current=id;
    const res=await fetch('/data/races/'+encodeURIComponent(id)+'.json',{cache:'no-store'});
    if(!res.ok) throw new Error('Could not load species data');
    const data=await res.json();
    const variants=data.variants || [];
    const chosen = variants.find(v=>v.id===variantId) || variants[0] || null;
    state.variantId=chosen?.id || null;
    if(updateUrl) pushUrl(id, variants.length > 1 ? state.variantId : null);
    renderSidebar();
    renderSpecies(data,chosen);
  }

  function racialFeature(title,body,open=false){
    return '<details class="species-core-feature" '+(open?'open':'')+'>'+
      '<summary><span class="species-core-heading"><b>'+esc(title)+'</b></span><span class="plus">+</span></summary>'+
      '<div class="species-core-body">'+body+'</div>'+
    '</details>';
  }

  function racialLine(label,value){
    return '<p><b>'+esc(label)+':</b> '+esc(value || '-')+'</p>';
  }

  function languageLongText(value){
    const raw=String(value || '').trim();
    if(!raw) return '-';

    const normalized=raw.replace(/\.$/,'').replace(/,\s+and one$/i,' and one');

    if(/^Common and one$/i.test(normalized)){
      return 'Your character can speak, read, and write Common and one other language that you and your DM agree is appropriate for the character.';
    }

    if(/\band one$/i.test(normalized)){
      const fixed=normalized.replace(/\band one$/i,'one other language that you and your DM agree is appropriate for the character');
      return 'Your character can speak, read, and write '+fixed+'.';
    }

    return 'Your character can speak, read, and write '+normalized+'.';
  }

  function abilityScoreDescription(data,variant){
    const primary=variant.abilityScores?.primary || null;
    const secondary=variant.abilityScores?.secondary || null;

    if(data?.id==='human' && primary==='Constitution' && secondary==='All'){
      return 'Your Constitution score increases by 2, and your Strength, Dexterity, Wisdom, Intelligence, and Charisma scores each increase by 1.';
    }

    if(primary && secondary && secondary !== 'Any' && secondary !== 'All'){
      return 'Your '+primary+' score increases by 2, and your '+secondary+' score increases by 1.';
    }

    if(primary && secondary==='Any'){
      return 'Your '+primary+' score increases by 2, and one other ability score of your choice increases by 1.';
    }

    if(primary==='Any' && !secondary){
      return 'One ability score of your choice increases by 2.';
    }

    if(primary && secondary==='All'){
      return 'Your '+primary+' score increases by 2, and each of your other ability scores increases by 1.';
    }

    if(primary){
      return 'Your '+primary+' score increases by 2.';
    }

    return 'Your ability scores increase as described by this race.';
  }

  function darkvisionDescription(distance){
    return 'You can see in dim light within '+distance+' feet of you as if it were bright light, and in darkness as if it were dim light. You can\'t discern color in darkness, only shades of gray.';
  }

  function featureTable(table){
    if(!table?.columns?.length || !table?.rows?.length) return '';
    const head='<thead><tr>'+table.columns.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead>';
    const body='<tbody>'+table.rows.map(row=>'<tr>'+row.map(cell=>'<td>'+esc(cell)+'</td>').join('')+'</tr>').join('')+'</tbody>';
    return '<div class="species-table-wrap"><table class="species-data-table">'+head+body+'</table></div>';
  }

  function featureBody(f){
    const blocks=Array.isArray(f.descriptionBlocks) && f.descriptionBlocks.length
      ? f.descriptionBlocks
      : [f.description || ''];
    const prose=blocks.filter(Boolean).map(p=>'<p>'+esc(p)+'</p>').join('');
    return prose + featureTable(f.table);
  }

  function featureCard(f,i){
    return '<details class="species-feature" '+(i===0?'open':'')+'><summary>'+esc(f.name || 'Feature')+'<span>+</span></summary><div>'+featureBody(f)+'</div></details>';
  }

  function renderHeroArt(data,variant){
    const character=$('#speciesHeroCharacter');
    const hero=$('.species-hero-approved');
    if(!character || !hero) return;

    const key=data?.id && variant?.id ? data.id+':'+variant.id : null;
    const art=key ? RACE_HERO_ART[key] : null;

    character.classList.toggle('is-hidden',!art);
    hero.classList.toggle('has-race-art',!!art);
    hero.classList.toggle('is-eladrin',key==='elf:eladrin');

    if(art){
      character.src=art.src;
      character.alt=art.alt || '';
    }else{
      character.removeAttribute('src');
      character.alt='';
    }
  }

  function renderSpecies(data,variant){
    renderHeroArt(data,variant);
    const variants=data.variants || [];
    const hasRealVariants = variants.length > 1 || (variants.length === 1 && variants[0]?.id !== 'base' && variants[0]?.name);
    $('#speciesTitle').textContent = data.name;
    $('#speciesIntro').textContent = variants.length > 1
      ? 'Choose a variant to view its traits, movement, senses, languages, and revised features.'
      : 'Review this species\' traits, movement, senses, languages, and revised features.';

    const selectorWrap=$('#variantWrap');
    const selector=$('#variantSelect');
    selector.innerHTML='';
    if(hasRealVariants){
      selectorWrap.hidden=false;
      selectorWrap.style.display='';
      for(const v of variants){
        const opt=document.createElement('option');
        opt.value=v.id;
        opt.textContent=v.name || 'Standard';
        if(v.id===variant?.id) opt.selected=true;
        selector.appendChild(opt);
      }
    } else {
      selectorWrap.hidden=true;
      selectorWrap.style.display='none';
    }

    if(!variant){
      $('#speciesBody').innerHTML='<div class="species-empty">No species data found.</div>';
      return;
    }

    const ability=abilityScoreDescription(data,variant);
    const size=(variant.size||[]).join(' or ');
    const darkvision=variant.darkvision ? darkvisionDescription(variant.darkvision) : null;
    const speed=variant.speed?.raw || (variant.speed?.walk ? variant.speed.walk+' ft' : '-');
    const sourceBits=[...(variant.basedOn||[]), variant.source].filter(Boolean).join(' • ');
    $('#speciesKicker').textContent = sourceBits || '5th Edge Race';

    const racialBasics =
      racialLine('Creature Type',variant.creatureType) +
      racialLine('Size',size) +
      racialLine('Speed',speed) +
      racialLine('Languages',languageLongText(variant.languages));

    $('#speciesMeta').innerHTML =
      racialFeature('Racial Features',racialBasics,true) +
      racialFeature('Ability Scores','<p>'+esc(ability)+'</p>') +
      (darkvision ? racialFeature('Darkvision','<p>'+esc(darkvision)+'</p>') : '');

    $('#speciesSource').textContent = '';
    $('#speciesVariantName').textContent = variant.name ? variant.name+' '+data.name : data.name;
    $('#speciesFeatures').innerHTML = (variant.features||[]).map(featureCard).join('');
  }

  function wireSearch(){
    const input=$('#speciesSearch');
    input.addEventListener('input',()=>{
      const q=input.value.trim().toLowerCase();
      let firstMatch=null;
      document.querySelectorAll('.species-group').forEach(group=>{
        let visible=0;
        group.querySelectorAll('.species-group-list a').forEach(a=>{
          const match=!q || a.textContent.toLowerCase().includes(q);
          a.hidden=!match;
          if(match) visible++;
        });
        group.hidden = visible===0;
        if(q && visible && !firstMatch) firstMatch=group;
      });
      if(q && firstMatch){
        document.querySelectorAll('.species-group').forEach(group=>group.open = group===firstMatch);
      }
    });
  }

  window.addEventListener('popstate',()=>{
    const q=currentFromUrl();
    selectSpecies(q.species,q.variant,false);
  });

  document.addEventListener('DOMContentLoaded',async()=>{
    try{
      await loadManifest();
      wireSearch();
      $('#variantSelect').addEventListener('change',e=>{
        state.variantId=e.target.value;
        pushUrl(state.current,state.variantId);
        selectSpecies(state.current,state.variantId,false);
      });
      const q=currentFromUrl();
      if(q.species){
        await selectSpecies(q.species,q.variant,false);
      }else{
        renderRaceLanding();
      }
    }catch(err){
      console.error(err);
      $('#speciesBody').innerHTML='<div class="species-empty">Species data could not be loaded.</div>';
    }
  });
})();