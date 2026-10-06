(() => {
  const CDN_CLASS_ART_BASE = 'https://assets.5thedgettrpg.com/class-images';

  function slug(value=''){
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/['’]/g,'')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'');
  }

  function classArtCandidates(classId){
    const id=slug(classId);
    if(!id) return [];
    const base=CDN_CLASS_ART_BASE+'/'+id+'/'+id;
    return [
      base+'.png',
      base+'.webp',
      base+'.jpg',
      base+'.jpeg'
    ];
  }

  function loadImageCandidates(img,candidates,onSuccess){
    let index=0;
    const tryNext=()=>{
      if(index>=candidates.length){
        img.removeAttribute('src');
        img.hidden=true;
        img.onload=null;
        img.onerror=null;
        return;
      }
      img.onload=()=>{
        img.hidden=false;
        img.onerror=null;
        if(onSuccess) onSuccess(img);
      };
      img.onerror=tryNext;
      img.src=candidates[index++];
    };
    tryNext();
  }

  function wireClassHeroArt(){
    const match=location.pathname.match(/^\/classes\/([^/]+)\/?$/);
    if(!match || match[1]==='index') return;
    const classId=decodeURIComponent(match[1]);
    const hero=document.querySelector('.main .hero');
    if(!hero) return;

    let img=hero.querySelector('.class-hero-character');
    if(!img){
      img=document.createElement('img');
      img.className='class-hero-character';
      img.alt='';
      img.hidden=true;
      img.setAttribute('aria-hidden','true');
      hero.appendChild(img);
    }

    loadImageCandidates(img,classArtCandidates(classId),()=>{
      hero.classList.add('has-class-art');
    });
  }

  function wireClassArchiveArt(){
    document.querySelectorAll('a.card[href^="/classes/"]').forEach(card=>{
      const match=card.getAttribute('href')?.match(/^\/classes\/([^/]+)\/?$/);
      if(!match) return;
      const classId=decodeURIComponent(match[1]);
      let img=card.querySelector('.class-card-art');
      if(!img){
        img=document.createElement('img');
        img.className='class-card-art';
        img.alt='';
        img.hidden=true;
        img.setAttribute('aria-hidden','true');
        card.prepend(img);
      }
      loadImageCandidates(img,classArtCandidates(classId),()=>{
        card.classList.add('has-class-art');
      });
    });
  }

  document.querySelectorAll("details.feature").forEach(d=>d.addEventListener("toggle",()=>{
    const p=d.querySelector(".plus");
    if(p)p.textContent=d.open?"−":"+";
  }));

  document.querySelectorAll(".subclass-select").forEach(s=>s.addEventListener("change",()=>{
    const n=s.closest(".subclass")?.querySelector(".subclass-note");
    if(n)n.textContent=s.value==="base"
      ?"Showing base class features."
      :"Subclass features will layer into this page from the subclass data file.";
  }));

  wireClassHeroArt();
  wireClassArchiveArt();
})();
