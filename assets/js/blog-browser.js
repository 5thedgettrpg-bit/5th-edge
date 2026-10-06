(() => {
  const panel=document.querySelector('.blog-panel');
  if(!panel) return;

  const links=[...document.querySelectorAll('.blog-topic-links a, .blog-archive-card')];

  function setActive(href){
    document.querySelectorAll('.blog-topic-links a').forEach(a=>{
      a.classList.toggle('active',new URL(a.href,location.origin).pathname===new URL(href,location.origin).pathname);
    });
  }

  async function loadArticle(href,push=true){
    const url=new URL(href,location.origin);
    try{
      panel.classList.add('is-loading');
      const res=await fetch(url.pathname,{cache:'no-store'});
      if(!res.ok) throw new Error('Could not load article');
      const html=await res.text();
      const doc=new DOMParser().parseFromString(html,'text/html');
      const hero=doc.querySelector('.blog-hero');
      const article=doc.querySelector('.article');
      if(!hero || !article) throw new Error('Article layout missing');

      panel.innerHTML=
        '<section class="blog-panel-hero blog-loaded-hero">'+hero.innerHTML+'</section>'+
        '<article class="article blog-loaded-article">'+article.innerHTML+'</article>';

      setActive(url.pathname);
      document.querySelectorAll('.blog-topic').forEach(d=>{
        const has=[...d.querySelectorAll('a')].some(a=>new URL(a.href,location.origin).pathname===url.pathname);
        if(has) d.open=true;
      });
      if(push) history.pushState({blogArticle:url.pathname},'',url.pathname);
      document.title=doc.title || document.title;
      panel.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){
      console.error(err);
      location.href=url.pathname;
    }finally{
      panel.classList.remove('is-loading');
    }
  }

  links.forEach(a=>a.addEventListener('click',ev=>{
    const u=new URL(a.href,location.origin);
    if(u.origin!==location.origin || !u.pathname.startsWith('/blog/')) return;
    ev.preventDefault();
    loadArticle(u.pathname,true);
  }));

  document.querySelectorAll('.blog-topic').forEach(details=>{
    details.addEventListener('toggle',()=>{
      if(!details.open) return;
      document.querySelectorAll('.blog-topic').forEach(other=>{ if(other!==details) other.open=false; });
    });
  });

  window.addEventListener('popstate',()=>{
    if(location.pathname==='/blog/' || location.pathname==='/blog'){
      location.href='/blog/';
      return;
    }
    if(location.pathname.startsWith('/blog/')) loadArticle(location.pathname,false);
  });
})();