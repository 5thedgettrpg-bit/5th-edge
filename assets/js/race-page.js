(() => {
  const state = { manifest:null, current:null, variantId:null, finderEntries:null, finderOpen:false };

  const $ = (sel,root=document)=>root.querySelector(sel);

  const CDN_RACE_ART_BASE='https://assets.5thedgettrpg.com/race-images';
  const LEGACY_RACE_ALIASES = {
  "aasimar":"celestari",
  "autognome":"clockwork",
  "giff":"potamid",
  "hadozee":"vanara",
  "harengon":"pooka",
  "halfling":"hin",
  "gith":"syncladi",
  "amalgam":"syncladi",
  "todarian":"syncladi",
  "vandar":"syncladi",
  "syndran":"elf",
  "ordan":"hin",
  "wanderhin":"hin",
  "reborn":"remnant",
  "auto-remnant":"remnant",
  "human-remnant":"remnant",
  "kalashtar":"elf",
  "kender":"hin",
  "kor":"hin",
  "leonin":"kaji",
  "loxodon":"mastodon",
  "plasmoid":"slimefolk",
  "simic-hybrid":"syncladi",
  "tabaxi":"tabby",
  "thri-kreen":"mantis",
  "vedalken":"syncladi",
  "verdan":"syncladi",
  "warforged":"remnant",
  "yuan-ti":"parsel",
  "zombie":"remnant"
};
  const LEGACY_RACE_DEFAULT_VARIANTS = {
    "gith":"kithrak",
    "amalgam":"amalgam",
    "todarian":"todarian",
    "vandar":"vandar",
    "syndran":"syndran",
    "ordan":"ordan",
    "wanderhin":"wander",
    "reborn":"ghostwise",
    "auto-remnant":"auto",
    "human-remnant":"human",
    "kalashtar":"syndran",
    "kender":"wander",
    "kor":"ordan",
    "simic-hybrid":"amalgam",
    "vedalken":"todarian",
    "verdan":"vandar",
    "warforged":"auto",
    "zombie":"human"
  };
  const LEGACY_VARIANT_ALIASES = {
  "avian:aarakocra": "tengu",
  "elf:eladrin": "seelie-elf",
  "elf:shadar-kai": "shadow-elf",
  "elf:mark-of-shadow": "way-of-the-veil",
  "gith:githyanki": "kithrak",
  "syncladi:githyanki": "kithrak",
  "gith:githzerai": "zerth",
  "syncladi:githzerai": "zerth",
  "tiefling:fierna": "phlegethos",
  "tiefling:glasya": "malbolge",
  "tiefling:levistus": "stygia",
  "tiefling:zariel": "bel",
  "half-elf:mark-of-detection": "way-of-sight",
  "half-elf:mark-of-storm": "way-of-the-tempest",
  "half-orc:mark-of-finding": "way-of-the-trail",
  "human:mark-of-finding": "way-of-the-trail",
  "human:mark-of-handling": "way-of-the-beast",
  "human:way-of-beasts": "way-of-the-beast",
  "human:mark-of-making": "way-of-the-craft",
  "human:way-of-craft": "way-of-the-craft",
  "human:mark-of-passage": "way-of-the-road",
  "human:mark-of-sentinel": "way-of-the-watch",
  "halfling:mark-of-healing": "way-of-mercy",
  "hin:mark-of-healing": "way-of-mercy",
  "halfling:mark-of-hospitality": "way-of-the-hearth",
  "hin:mark-of-hospitality": "way-of-the-hearth",
  "gnome:mark-of-scribing": "way-of-the-quill",
  "dwarf:mark-of-warding": "way-of-the-ward"
};
  function normalizeRaceId(id){ return id ? (LEGACY_RACE_ALIASES[id] || id) : id; }
  function normalizeVariantId(raceId,variantId){ return variantId ? (LEGACY_VARIANT_ALIASES[(raceId||'')+':'+variantId] || variantId) : variantId; }


  const RACE_HERO_ART_OVERRIDES = {
    'elf:seelie-elf': {
      src:'/assets/images/species/eladrin-character.png',
      alt:'Eladrin Elf'
    },
    // Temporary filename exception in Drive/R2. Rename the source file later and this can be removed.
    'dwarf:way-of-the-ward': {
      src:CDN_RACE_ART_BASE+'/common-folk/dwarf/way-of-the-ward/way-of-the-ward-dwarf.png',
      alt:'Mark of Warding Dwarf'
    }
  };

  function artSlug(value=''){
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/['’]/g,'')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'');
  }

  function raceHeroArtCandidates(data,variant){
    if(!data?.id || !variant?.id) return [];

    const key=data.id+':'+variant.id;
    const override=RACE_HERO_ART_OVERRIDES[key];
    const manifestEntry=state.manifest?.species?.find(item=>item.id===data.id);
    const category=artSlug(manifestEntry?.category || '');
    const race=artSlug(data.id);
    const variantSlug=artSlug(variant.id);
    const alt=variant?.name ? variant.name+' '+data.name : data.name;

    const candidates=[];
    if(override) candidates.push(override);
    if(!category || !race) return candidates;

    const base=CDN_RACE_ART_BASE+'/'+category+'/'+race;
    if(variantSlug==='base' || variantSlug==='standard'){
      const standardFolder=base+'/'+variantSlug;
      candidates.push(
        {src:standardFolder+'/'+race+'.png',alt},
        {src:standardFolder+'/'+race+'.webp',alt},
        {src:standardFolder+'/'+race+'.jpg',alt},
        {src:standardFolder+'/'+race+'.jpeg',alt},
        {src:base+'/'+race+'.png',alt},
        {src:base+'/'+race+'.webp',alt},
        {src:base+'/'+race+'.jpg',alt},
        {src:base+'/'+race+'.jpeg',alt}
      );
    }else{
      const folder=base+'/'+variantSlug;
      candidates.push(
        {src:folder+'/'+variantSlug+'-'+race+'.png',alt},
        {src:folder+'/'+variantSlug+'.png',alt},
        {src:folder+'/'+race+'.png',alt},
        {src:folder+'/'+variantSlug+'-'+race+'.webp',alt},
        {src:folder+'/'+variantSlug+'.webp',alt},
        {src:folder+'/'+variantSlug+'-'+race+'.jpg',alt},
        {src:folder+'/'+variantSlug+'.jpg',alt}
      );

      // Dragonborn variant folders may use a specific ancestry color/material as the representative hero art.
      if(race==='dragonborn'){
        const dragonbornRepresentatives={
          metallic:['gold','silver','bronze','brass','copper'],
          chromatic:['red','blue','green','black','white'],
          gem:['ruby','amethyst','crystal','emerald','sapphire','topaz']
        };
        for(const subtype of (dragonbornRepresentatives[variantSlug] || [])){
          candidates.push(
            {src:folder+'/'+subtype+'-dragonborn.png',alt},
            {src:folder+'/'+subtype+'-dragonborn.webp',alt},
            {src:folder+'/'+subtype+'-dragonborn.jpg',alt},
            {src:folder+'/'+subtype+'.png',alt},
            {src:folder+'/'+subtype+'.webp',alt},
            {src:folder+'/'+subtype+'.jpg',alt}
          );
        }
      }
    }

    return [...new Map(candidates.map(item=>[item.src,item])).values()];
  }

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
    const rawSpecies = m ? decodeURIComponent(m[1]) : (p.get('race') || p.get('species') || null);
    const species = normalizeRaceId(rawSpecies);
    const rawVariant = m?.[2] ? decodeURIComponent(m[2]) : (p.get('variant') || null);
    const impliedVariant = !rawVariant && rawSpecies ? (LEGACY_RACE_DEFAULT_VARIANTS[rawSpecies] || null) : null;
    return { species, variant: normalizeVariantId(rawSpecies || species,rawVariant || impliedVariant) };
  }

  function raceUrl(species,variant){
    return '/race/'+encodeURIComponent(species)+(variant ? '/'+encodeURIComponent(variant) : '');
  }

  function syncCanonicalUrl(species,variant){
    const path=raceUrl(species,variant);
    const href='https://www.5thedgettrpg.com'+path;
    const canonical=document.querySelector('link[rel="canonical"]');
    if(canonical) canonical.setAttribute('href',href);
    const ogUrl=document.querySelector('meta[property="og:url"]');
    if(ogUrl) ogUrl.setAttribute('content',href);
  }

  function pushUrl(species,variant){
    const path=raceUrl(species,variant);
    history.pushState({},'',path);
    syncCanonicalUrl(species,variant);
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
    state.finderOpen=false;
    const rawId=id;
    id=normalizeRaceId(id);
    variantId=normalizeVariantId(rawId || id,variantId);
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
    syncCanonicalUrl(id, variants.length > 1 ? state.variantId : null);
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

    const key=data?.id && variant?.id ? data.id+':'+variant.id : '';
    const candidates=raceHeroArtCandidates(data,variant);
    character.dataset.artKey=key;
    character.classList.add('is-hidden');
    hero.classList.remove('has-race-art');
    hero.classList.toggle('is-eladrin',key==='elf:seelie-elf');
    character.alt='';

    let index=0;
    const tryNext=()=>{
      if(character.dataset.artKey!==key) return;
      if(index>=candidates.length){
        character.removeAttribute('src');
        character.onerror=null;
        character.onload=null;
        return;
      }
      const art=candidates[index++];
      character.onload=()=>{
        if(character.dataset.artKey!==key) return;
        character.alt=art.alt || '';
        character.classList.remove('is-hidden');
        hero.classList.add('has-race-art');
      };
      character.onerror=tryNext;
      character.src=art.src;
    };
    tryNext();
  }

  function ensureSpeciesBodyShell(){
    const body=$('#speciesBody');
    if(!body) return;
    if($('#speciesMeta') && $('#speciesVariantName') && $('#speciesSource') && $('#speciesFeatures')) return;
    body.innerHTML=
      '<div id="speciesMeta" class="species-overview"></div>'+
      '<div class="species-section-title"><h2 id="speciesVariantName">Racial Features</h2><div id="speciesSource" class="species-source"></div></div>'+
      '<div id="speciesFeatures"></div>';
  }

  function renderSpecies(data,variant){
    ensureSpeciesBodyShell();
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


  const RACE_ARCHETYPES = {
    'strength-martial': {
      label:'Strength Martial',
      description:'Front-line weapon users who value Strength and durability.',
      stats:{Strength:5,Constitution:2},
      keywords:['powerful build','natural weapon','brutal','critical','athletics','carrying capacity']
    },
    'finesse-martial': {
      label:'Finesse / Ranged Martial',
      description:'Dexterity-focused attackers who value mobility and precision.',
      stats:{Dexterity:5,Constitution:1,Wisdom:1},
      keywords:['initiative','nimble','stealth','speed','mobile','movement']
    },
    'defender': {
      label:'Defender / Tank',
      description:'Durable characters looking for Constitution and defensive traits.',
      stats:{Constitution:5,Strength:1},
      keywords:['natural armor','armor class','resistance','immune','immunity','temporary hit points','toughness','relentless']
    },
    'int-caster': {
      label:'Intelligence Caster',
      description:'Arcane scholars and Intelligence-based spellcasters.',
      stats:{Intelligence:5,Constitution:1},
      keywords:['arcana','magic','spell','cantrip','identify']
    },
    'wis-caster': {
      label:'Wisdom Caster',
      description:'Divine, primal, perceptive, and Wisdom-based characters.',
      stats:{Wisdom:5,Constitution:1},
      keywords:['perception','insight','survival','nature','spell','cantrip']
    },
    'cha-caster': {
      label:'Charisma Caster / Face',
      description:'Charisma spellcasters and social specialists.',
      stats:{Charisma:5,Constitution:1},
      keywords:['persuasion','deception','performance','intimidation','spell','cantrip']
    },
    'scout': {
      label:'Scout / Explorer',
      description:'Mobile, perceptive characters who value Dexterity, Wisdom, senses, and movement.',
      stats:{Dexterity:3,Wisdom:3},
      keywords:['darkvision','perception','stealth','survival','climb','swim','fly','speed','movement']
    },
    'skill-expert': {
      label:'Skill Expert / Versatile',
      description:'Flexible characters looking for skills, expertise, tool choices, or open ability bonuses.',
      stats:{},
      keywords:['proficiency','expertise','skill','tool','choice','feat','any ability']
    }
  };

  function initRaceTools(){
    const head=$('.species-sidebar-head');
    if(!head || head.querySelector('.species-tools')) return;
    const tools=document.createElement('div');
    tools.className='species-tools';
    tools.innerHTML='<button type="button" class="species-tool-btn primary" id="raceFinderBtn">◆ Find a Race</button>'+
      '<button type="button" class="species-tool-btn" id="randomRaceBtn">↻ Surprise Me</button>';
    head.appendChild(tools);
    $('#raceFinderBtn')?.addEventListener('click',()=>openRaceFinder());
    $('#randomRaceBtn')?.addEventListener('click',()=>pickRandomRace());
  }

  async function loadFinderEntries(){
    if(state.finderEntries) return state.finderEntries;
    const entries=[];
    const races=state.manifest?.species || [];
    const dataList=await Promise.all(races.map(async item=>{
      try{
        const res=await fetch('/data/races/'+encodeURIComponent(item.id)+'.json',{cache:'no-store'});
        if(!res.ok) return null;
        return await res.json();
      }catch(_){ return null; }
    }));
    dataList.filter(Boolean).forEach(data=>{
      (data.variants || []).forEach(variant=>{
        entries.push({
          raceId:data.id,
          raceName:data.name,
          category:(state.manifest?.species || []).find(x=>x.id===data.id)?.category || data.category || '',
          variantId:variant.id,
          variantName:variant.name || 'Standard',
          variant,
          data
        });
      });
    });
    state.finderEntries=entries;
    return entries;
  }

  function variantText(entry){
    return (entry.variant.features || []).map(f=>(f.name || '')+' '+(f.description || '')).join(' ').toLowerCase();
  }

  function abilityMatches(entry,ability){
    if(!ability) return true;
    const a=entry.variant.abilityScores || {};
    return a.primary===ability || a.secondary===ability || a.primary==='Any' || a.secondary==='Any' || a.secondary==='All';
  }

  function traitFlags(entry){
    const v=entry.variant;
    const text=variantText(entry);
    const speed=v.speed || {};
    return {
      darkvision:Boolean(v.darkvision),
      magic:(v.features || []).some(f=>f.racialSpellcasting) || /\b(cantrip|cast .* spell|spellcasting)\b/i.test(text),
      defense:/\b(resistance|resistant|immune|immunity|natural armor|armor class|temporary hit points|toughness)\b/i.test(text),
      flight:Boolean(speed.fly) || /\bflying speed\b/i.test(text),
      swim:Boolean(speed.swim) || /\bswimming speed\b/i.test(text),
      skills:/\b(proficiency|expertise)\b/i.test(text),
      feat:/\bfeat\b/i.test(text)
    };
  }

  function archetypeScore(entry,key){
    if(!key || !RACE_ARCHETYPES[key]) return {score:0,reasons:[]};
    const profile=RACE_ARCHETYPES[key];
    const a=entry.variant.abilityScores || {};
    const reasons=[];
    let score=0;
    for(const [stat,weight] of Object.entries(profile.stats)){
      if(a.primary===stat){ score+=weight; reasons.push('+2 '+stat); }
      else if(a.secondary===stat){ score+=Math.max(1,Math.round(weight*.6)); reasons.push('+1 '+stat); }
      else if(a.primary==='Any' || a.secondary==='Any'){ score+=1; reasons.push('Flexible ability bonus'); }
      else if(a.secondary==='All'){ score+=1; reasons.push('Broad ability bonuses'); }
    }
    const text=variantText(entry);
    const keywordHits=profile.keywords.filter(k=>text.includes(k));
    score+=Math.min(4,keywordHits.length);
    if(keywordHits.length){
      reasons.push(...keywordHits.slice(0,2).map(k=>k.replace(/\b\w/g,c=>c.toUpperCase())));
    }
    const flags=traitFlags(entry);
    if(key==='defender' && flags.defense){ score+=2; reasons.push('Defensive trait'); }
    if(key==='scout' && flags.darkvision){ score+=1; reasons.push('Darkvision'); }
    if(key==='scout' && (flags.flight || flags.swim)){ score+=2; reasons.push(flags.flight?'Flight':'Swim speed'); }
    if((key==='int-caster' || key==='wis-caster' || key==='cha-caster') && flags.magic){ score+=1; reasons.push('Racial magic'); }
    if(key==='skill-expert' && flags.skills){ score+=2; reasons.push('Skill/tool training'); }
    if(key==='skill-expert' && flags.feat){ score+=2; reasons.push('Feat access'); }
    return {score,reasons:[...new Set(reasons)]};
  }

  function abilityLabel(entry){
    const a=entry.variant.abilityScores || {};
    if(!a.primary && !a.secondary) return '—';
    const out=[];
    if(a.primary==='Any') out.push('+2 Any');
    else if(a.primary) out.push('+2 '+a.primary);
    if(a.secondary==='All') out.push('+1 All Others');
    else if(a.secondary==='Any') out.push('+1 Any');
    else if(a.secondary) out.push('+1 '+a.secondary);
    return out.join(' · ');
  }

  function finderCard(entry,archetypeKey){
    const scoreInfo=archetypeScore(entry,archetypeKey);
    const flags=traitFlags(entry);
    const chips=[...scoreInfo.reasons.slice(0,3)];
    if(!chips.length){
      if(flags.darkvision) chips.push('Darkvision');
      if(flags.magic) chips.push('Racial Magic');
      if(flags.defense) chips.push('Defensive Trait');
    }
    const name=entry.variantId==='base' || !entry.variant.variantName
      ? entry.raceName
      : entry.variantName+' '+entry.raceName;
    const displayName=(entry.variantName==='Standard') ? entry.raceName : entry.variantName+' '+entry.raceName;
    return '<button type="button" class="race-finder-card" data-race="'+esc(entry.raceId)+'" data-variant="'+esc(entry.variantId)+'">'+
      '<span class="race-finder-card-top"><small>'+esc(entry.category)+'</small>'+
      (archetypeKey ? '<b>'+scoreInfo.score+' match</b>' : '')+'</span>'+
      '<strong>'+esc(displayName)+'</strong>'+
      '<span class="race-finder-asi">'+esc(abilityLabel(entry))+'</span>'+
      '<span class="race-finder-traits">'+chips.map(c=>'<i>'+esc(c)+'</i>').join('')+'</span>'+
      '</button>';
  }

  async function openRaceFinder(){
    state.finderOpen=true;
    state.current=null;
    state.variantId=null;
    renderSidebar();
    $('#speciesKicker').textContent='5th Edge Race Tools';
    $('#speciesTitle').textContent='Race Finder';
    $('#speciesIntro').textContent='Find strong race and subrace options by archetype, ability bonuses, and racial traits. Recommendations are based on your 5th Edge race data, not a fixed tier list.';
    $('#variantWrap').hidden=true;
    $('#variantWrap').style.display='none';
    $('#speciesHeroCharacter')?.classList.add('is-hidden');
    $('.species-hero-approved')?.classList.remove('has-race-art','is-eladrin');

    const body=$('#speciesBody');
    body.innerHTML=
      '<div class="race-finder">'+
        '<div class="race-finder-controls">'+
          '<label><span>Archetype</span><select id="finderArchetype"><option value="">Any archetype</option>'+
            Object.entries(RACE_ARCHETYPES).map(([k,v])=>'<option value="'+k+'">'+esc(v.label)+'</option>').join('')+
          '</select></label>'+
          '<label><span>Ability Bonus</span><select id="finderAbility"><option value="">Any ability</option>'+
            ['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'].map(x=>'<option>'+x+'</option>').join('')+
          '</select></label>'+
          '<label><span>Lineage Group</span><select id="finderCategory"><option value="">Any group</option>'+
            (state.manifest?.categories || []).map(c=>'<option>'+esc(c.name)+'</option>').join('')+
          '</select></label>'+
          '<label><span>Sort</span><select id="finderSort"><option value="match">Best Match</option><option value="alpha">Alphabetical</option></select></label>'+
        '</div>'+
        '<div class="race-finder-trait-filter"><span>Traits</span>'+
          [['darkvision','Darkvision'],['magic','Racial Magic'],['defense','Defense / Resistance'],['flight','Flight'],['swim','Swim Speed'],['skills','Skill / Tool Training'],['feat','Feat Access']].map(([k,l])=>'<label><input type="checkbox" value="'+k+'"> '+l+'</label>').join('')+
        '</div>'+
        '<div class="race-finder-actions"><button type="button" id="finderClear">Clear Filters</button><span id="finderCount">Loading races…</span></div>'+
        '<div id="finderResults" class="race-finder-results"><div class="species-empty">Loading race data…</div></div>'+
      '</div>';

    const entries=await loadFinderEntries();
    const rerender=()=>renderFinderResults(entries);
    ['finderArchetype','finderAbility','finderCategory','finderSort'].forEach(id=>$('#'+id)?.addEventListener('change',rerender));
    document.querySelectorAll('.race-finder-trait-filter input').forEach(input=>input.addEventListener('change',rerender));
    $('#finderClear')?.addEventListener('click',()=>{
      ['finderArchetype','finderAbility','finderCategory'].forEach(id=>{ const el=$('#'+id); if(el) el.value=''; });
      const sort=$('#finderSort'); if(sort) sort.value='match';
      document.querySelectorAll('.race-finder-trait-filter input').forEach(input=>input.checked=false);
      rerender();
    });
    rerender();
  }

  function renderFinderResults(entries){
    const host=$('#finderResults');
    if(!host) return;
    const archetype=$('#finderArchetype')?.value || '';
    const ability=$('#finderAbility')?.value || '';
    const category=$('#finderCategory')?.value || '';
    const sort=$('#finderSort')?.value || 'match';
    const requiredTraits=[...document.querySelectorAll('.race-finder-trait-filter input:checked')].map(x=>x.value);

    let filtered=entries.filter(entry=>{
      if(category && entry.category!==category) return false;
      if(!abilityMatches(entry,ability)) return false;
      const flags=traitFlags(entry);
      if(requiredTraits.some(t=>!flags[t])) return false;
      return true;
    });

    if(sort==='alpha' || !archetype){
      filtered.sort((a,b)=>(a.raceName+' '+a.variantName).localeCompare(b.raceName+' '+b.variantName));
    }else{
      filtered.sort((a,b)=>{
        const diff=archetypeScore(b,archetype).score-archetypeScore(a,archetype).score;
        return diff || (a.raceName+' '+a.variantName).localeCompare(b.raceName+' '+b.variantName);
      });
    }

    const count=$('#finderCount');
    if(count) count.textContent=filtered.length+' option'+(filtered.length===1?'':'s');

    host.innerHTML=filtered.length
      ? filtered.map(e=>finderCard(e,archetype)).join('')
      : '<div class="species-empty">No race options match those filters.</div>';

    host.querySelectorAll('.race-finder-card').forEach(btn=>btn.addEventListener('click',()=>{
      state.finderOpen=false;
      selectSpecies(btn.dataset.race,btn.dataset.variant,true);
    }));
  }

  async function pickRandomRace(){
    const entries=await loadFinderEntries();
    if(!entries.length) return;
    const pick=entries[Math.floor(Math.random()*entries.length)];
    state.finderOpen=false;
    selectSpecies(pick.raceId,pick.variantId,true);
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
      initRaceTools();
      wireSearch();
      $('#variantSelect').addEventListener('change',e=>{
        state.variantId=e.target.value;
        pushUrl(state.current,state.variantId);
        selectSpecies(state.current,state.variantId,false);
      });
      const q=currentFromUrl();
      if(q.species){
        await selectSpecies(q.species,q.variant,false);
        const canonical=raceUrl(state.current,document.querySelector('#variantWrap')?.hidden===false ? state.variantId : null);
        if(location.pathname!==canonical || location.search) history.replaceState({},'',canonical);
      }else{
        renderRaceLanding();
      }
    }catch(err){
      console.error(err);
      $('#speciesBody').innerHTML='<div class="species-empty">Species data could not be loaded.</div>';
    }
  });
})();