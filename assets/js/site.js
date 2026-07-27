  // transparent header over the hero, solid after the hero
  const header=document.querySelector('.site-header');
  const heroEl=document.querySelector('.page-hero');
  if(header&&heroEl){
    const updateHeader=()=>{
      const headerH=header.offsetHeight||74;
      const trigger=heroEl.offsetHeight-headerH-2;
      header.classList.toggle('scrolled',window.scrollY>=trigger);
    };
    updateHeader();
    window.addEventListener('scroll',updateHeader,{passive:true});
    window.addEventListener('resize',updateHeader);
  }

  // smooth momentum scroll
  (function(){
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){
      document.querySelectorAll('video[autoplay]').forEach(video=>video.pause());
    }
    if(reduce||!window.Lenis)return;
    const lenis=new Lenis({lerp:0.085,wheelMultiplier:1,smoothWheel:true,touchMultiplier:1.6});
    function raf(t){lenis.raf(t);requestAnimationFrame(raf);}
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click',e=>{
        if(a.getAttribute('aria-haspopup')==='dialog')return;
        const id=a.getAttribute('href');
        if(id.length>1){const el=document.querySelector(id);if(el){e.preventDefault();lenis.scrollTo(el,{offset:-88});}}
      });
    });
  })();

  // shared consultation modal
  (function(){
    const script=document.createElement('script');
    script.src='assets/js/consultation-modal.js?v=4';
    script.defer=true;
    document.body.appendChild(script);
  })();

  // heating review carousel
  (function(){
    const track=document.getElementById('heatingReviewsTrack');
    if(!track)return;

    const prev=document.getElementById('heatingRvPrev');
    const next=document.getElementById('heatingRvNext');
    const step=()=>{
      const card=track.querySelector('.heating-rv-card');
      const styles=getComputedStyle(track);
      const gap=parseFloat(styles.columnGap||styles.gap)||24;
      return card?card.offsetWidth+gap:track.clientWidth*.8;
    };
    const update=()=>{
      const max=track.scrollWidth-track.clientWidth-2;
      prev.disabled=track.scrollLeft<=2;
      next.disabled=track.scrollLeft>=max;
    };

    prev.addEventListener('click',()=>track.scrollBy({left:-step(),behavior:'smooth'}));
    next.addEventListener('click',()=>track.scrollBy({left:step(),behavior:'smooth'}));
    track.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    update();
  })();

  // mobile drawer
  const drawer=document.getElementById('drawer');
  const menuBtn=document.getElementById('menuBtn');
  const closeBtn=document.getElementById('drawerClose');
  const setDrawer=(open)=>{
    drawer.classList.toggle('open',open);
    drawer.setAttribute('aria-hidden',String(!open));
    menuBtn.setAttribute('aria-expanded',String(open));
    document.body.style.overflow=open?'hidden':'';
  };
  menuBtn.addEventListener('click',()=>setDrawer(true));
  closeBtn.addEventListener('click',()=>setDrawer(false));
  drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setDrawer(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setDrawer(false);});

  // scroll reveal
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
  },{threshold:.14,rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach((el,i)=>{
    el.style.transitionDelay=(Math.min(i%4,3)*90)+'ms';
    io.observe(el);
  });

  // desktop heating-services image explorer
  (function(){
    const explorer=document.querySelector('.svc-explorer');
    if(!explorer||!window.matchMedia('(min-width:1040px)').matches)return;

    const rows=[...explorer.querySelectorAll('.svc-row[data-preview-image]')];
    const preview=explorer.querySelector('.svc-preview');
    const card=explorer.querySelector('.svc-preview-card');
    const tilt=explorer.querySelector('.svc-preview-tilt');
    const layers=[...explorer.querySelectorAll('.svc-preview-image')];
    const label=explorer.querySelector('.svc-preview-label');
    const count=explorer.querySelector('.svc-preview-count');
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let activeIndex=0;
    let activeLayer=0;
    let swapToken=0;

    rows.forEach(row=>{const image=new Image();image.src=row.dataset.previewImage;});
    layers.forEach(layer=>{layer.style.objectPosition=rows[0].dataset.previewPosition||'center';});

    const activate=(index)=>{
      if(index<0||index>=rows.length)return;
      rows.forEach((row,i)=>row.classList.toggle('is-preview-active',i===index));
      if(index===activeIndex)return;

      activeIndex=index;
      const token=++swapToken;
      preview.classList.add('is-switching');
      const nextLayer=activeLayer===0?1:0;
      const next=layers[nextLayer];
      next.classList.remove('is-active');
      next.src=rows[index].dataset.previewImage;
      next.style.objectPosition=rows[index].dataset.previewPosition||'center';
      window.setTimeout(()=>{
        if(token!==swapToken)return;
        label.textContent=rows[index].dataset.previewLabel;
        count.textContent=String(index+1).padStart(2,'0')+' / '+String(rows.length).padStart(2,'0');
      },170);
      const reveal=()=>{
        if(token!==swapToken)return;
        requestAnimationFrame(()=>{
          layers[activeLayer].classList.remove('is-active');
          next.classList.add('is-active');
          activeLayer=nextLayer;
          window.setTimeout(()=>{if(token===swapToken)preview.classList.remove('is-switching');},220);
        });
      };
      if(next.complete)reveal();else next.addEventListener('load',reveal,{once:true});
    };

    rows.forEach((row,index)=>row.addEventListener('mouseenter',()=>activate(index)));
    activate(0);

    const previewObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>preview.classList.toggle('is-visible',entry.isIntersecting));
    },{threshold:.08});
    previewObserver.observe(explorer);

    const rowObserver=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>Math.abs(a.boundingClientRect.top-innerHeight*.44)-Math.abs(b.boundingClientRect.top-innerHeight*.44));
      if(visible[0])activate(rows.indexOf(visible[0].target));
    },{rootMargin:'-36% 0px -46% 0px',threshold:0});
    rows.forEach(row=>rowObserver.observe(row));

    if(reduce){preview.classList.add('is-visible');return;}

    tilt.addEventListener('pointermove',event=>{
      const rect=tilt.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width-.5;
      const y=(event.clientY-rect.top)/rect.height-.5;
      tilt.style.setProperty('--rx',(-y*4).toFixed(2)+'deg');
      tilt.style.setProperty('--ry',(x*5).toFixed(2)+'deg');
    });
    tilt.addEventListener('pointerleave',()=>{
      tilt.style.setProperty('--rx','0deg');
      tilt.style.setProperty('--ry','0deg');
    });

    let ticking=false;
    const updateDrift=()=>{
      const rect=explorer.getBoundingClientRect();
      const progress=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));
      card.style.setProperty('--scroll-y',((progress-.5)*24).toFixed(1)+'px');
      card.style.setProperty('--scroll-r',((progress-.5)*1.1).toFixed(2)+'deg');
      ticking=false;
    };
    window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateDrift);ticking=true;}},{passive:true});
    updateDrift();
  })();
