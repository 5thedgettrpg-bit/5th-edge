(() => {
  const state = { manifest:null, current:null, variantId:null };

  const $ = (sel,root=document)=>root.querySelector(sel);
  const esc = (s='') => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  async function loadManifest(){
    const res = await fetch('/data/species/index.json',{cache:'no-store'});
    if(!res.ok) throw new Error('Could not load species index');
    state.manifest = await res.json();
  }

  function currentFromUrl(){
    const p = new URLSearchParams(location.search);
    return {species:p.get('species') || 'human', variant:p.get('variant') || null};
  }

  function pushUrl(species,variant){
    const p = new URLSearchParams();
    p.set('species',species);
    if(variant) p.set('variant',variant);
    history.pushState({},'',location.pathname+'?'+p.toString());
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
    const activeCategory=activeSpecies?.category || 'Common Folk';

    for(const c of state.manifest.categories){
      const items=(byCat.get(c.name)||[]).sort((a,b)=>a.name.localeCompare(b.name));
      const details=document.createElement('details');
      details.className='species-group';
      details.dataset.category=c.name;
      details.open = c.name === activeCategory;
      details.innerHTML = '<summary>'+esc(c.name)+'<span>'+items.length+'</span></summary><div class="species-group-list"></div>';
      details.addEventListener('toggle',()=>{
        if(!details.open) return;
        host.querySelectorAll('.species-group').forEach(other=>{
          if(other!==details) other.open=false;
        });
      });
      const list=$('.species-group-list',details);
      for(const item of items){
        const a=document.createElement('a');
        a.href='/species/?species='+encodeURIComponent(item.id);
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

  async function selectSpecies(id,variantId=null,updateUrl=false){
    state.current=id;
    const res=await fetch('/data/species/'+encodeURIComponent(id)+'.json',{cache:'no-store'});
    if(!res.ok) throw new Error('Could not load species data');
    const data=await res.json();
    const variants=data.variants || [];
    const chosen = variants.find(v=>v.id===variantId) || variants[0] || null;
    state.variantId=chosen?.id || null;
    if(updateUrl) pushUrl(id, variants.length > 1 ? state.variantId : null);
    renderSidebar();
    renderSpecies(data,chosen);
  }

  function stat(label,value){
    return '<div class="species-stat"><span>'+esc(label)+'</span><strong>'+esc(value || '—')+'</strong></div>';
  }

  function featureCard(f,i){
    return '<details class="species-feature" '+(i===0?'open':'')+'><summary>'+esc(f.name || 'Feature')+'<span>+</span></summary><div>'+esc(f.description || '')+'</div></details>';
  }

  function renderSpecies(data,variant){
    const variants=data.variants || [];
    const hasRealVariants = variants.length > 1 || (variants.length === 1 && variants[0]?.id !== 'base' && variants[0]?.name);
    $('#speciesKicker').textContent = data.category || 'Species';
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

    const abilityParts=[];
    if(variant.abilityScores?.primary) abilityParts.push(variant.abilityScores.primary+' +2');
    if(variant.abilityScores?.secondary) abilityParts.push(variant.abilityScores.secondary+' +1');
    const ability=abilityParts.join(', ');
    const size=(variant.size||[]).join(' or ');
    const darkvision=variant.darkvision ? variant.darkvision+' ft' : 'None';
    const sourceBits=[...(variant.basedOn||[]), variant.source].filter(Boolean).join(' • ');

    $('#speciesMeta').innerHTML =
      stat('Ability Scores',ability) +
      stat('Creature Type',variant.creatureType) +
      stat('Size',size) +
      stat('Speed',variant.speed?.raw || (variant.speed?.walk ? variant.speed.walk+' ft' : '—')) +
      stat('Darkvision',darkvision) +
      stat('Languages',variant.languages);

    $('#speciesSource').textContent = sourceBits || '';
    $('#speciesVariantName').textContent = variant.name ? data.name+' • '+variant.name : data.name;
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
      await selectSpecies(q.species,q.variant,false);
    }catch(err){
      console.error(err);
      $('#speciesBody').innerHTML='<div class="species-empty">Species data could not be loaded.</div>';
    }
  });
})();