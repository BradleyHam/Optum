  // smooth momentum scroll (graceful fallback + reduced-motion aware)
  (function(){
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce||!window.Lenis)return;
    const lenis=new Lenis({lerp:0.085,wheelMultiplier:1,smoothWheel:true,touchMultiplier:1.6});
    function raf(t){lenis.raf(t);requestAnimationFrame(raf);}
    requestAnimationFrame(raf);
    // route in-page anchor links through lenis (with fixed-header offset)
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
    script.src='assets/js/consultation-modal.js?v=6';
    script.defer=true;
    document.body.appendChild(script);
  })();

  // hero video: force muted autoplay (reliable across browsers)
  (function(){
    const hv=document.querySelector('video.hero-img');
    if(!hv)return;
    hv.muted=true;hv.defaultMuted=true;hv.setAttribute('muted','');
    const tryPlay=()=>{const p=hv.play();if(p&&p.catch)p.catch(()=>{});};
    if(hv.readyState>=2)tryPlay();
    hv.addEventListener('loadeddata',tryPlay,{once:true});
    hv.addEventListener('canplay',tryPlay,{once:true});
    // fallback: kick off on first user interaction if still paused
    const once=()=>{if(hv.paused)tryPlay();window.removeEventListener('pointerdown',once);window.removeEventListener('scroll',once);};
    window.addEventListener('pointerdown',once,{once:true});
    window.addEventListener('scroll',once,{once:true,passive:true});
  })();

  // closing CTA video: muted autoplay loop (clip already trimmed to start 5s in)
  (function(){
    const cv=document.getElementById('closingVid');
    if(!cv)return;
    cv.muted=true;cv.defaultMuted=true;cv.setAttribute('muted','');
    const RATE=0.6;                       // slow the fire loop down
    const setRate=()=>{try{cv.playbackRate=RATE;}catch(e){}};
    setRate();
    cv.addEventListener('loadedmetadata',setRate);
    cv.addEventListener('play',setRate);
    const tryPlay=()=>{setRate();const p=cv.play();if(p&&p.catch)p.catch(()=>{});};
    if(cv.readyState>=2)tryPlay();
    cv.addEventListener('loadeddata',tryPlay,{once:true});
    cv.addEventListener('canplay',tryPlay,{once:true});
    const once=()=>{if(cv.paused)tryPlay();};
    window.addEventListener('pointerdown',once,{once:true});
    window.addEventListener('scroll',once,{once:true,passive:true});
  })();

  // project carousel (case study)
  (function(){
    const slides=[...document.querySelectorAll('.case-slide')];
    const imgs=[...document.querySelectorAll('.case .media .case-img')];
    const prev=document.getElementById('casePrev'), next=document.getElementById('caseNext');
    const nav=document.querySelector('.case-nav');
    const current=document.getElementById('caseCurrent');
    const total=document.getElementById('caseTotal');
    if(!slides.length||!prev||!next)return;
    let i=0;
    const format=n=>String(n).padStart(2,'0');
    if(total)total.textContent=format(slides.length);
    const show=n=>{
      i=(n+slides.length)%slides.length;
      slides.forEach((s,x)=>{
        const active=x===i;
        s.classList.toggle('is-active',active);
        s.setAttribute('aria-hidden',String(!active));
      });
      imgs.forEach((im,x)=>{
        const active=x===i;
        im.classList.toggle('is-active',active);
        im.setAttribute('aria-hidden',String(!active));
      });
      if(current)current.textContent=format(i+1);
    };
    prev.addEventListener('click',()=>show(i-1));
    next.addEventListener('click',()=>show(i+1));
    if(nav)nav.addEventListener('keydown',e=>{
      if(e.key==='ArrowLeft'){e.preventDefault();show(i-1);prev.focus();}
      if(e.key==='ArrowRight'){e.preventDefault();show(i+1);next.focus();}
    });
    show(0);
  })();

  // header shadow on scroll
  const header=document.querySelector('.site-header');
  const heroEl=document.querySelector('.hero');
  const onScroll=()=>{
    const headerH=header.offsetHeight||74;
    const trigger=(heroEl?heroEl.offsetHeight:window.innerHeight)-headerH-2;
    header.classList.toggle('scrolled',window.scrollY>=trigger);
  };
  onScroll();window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);

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

  // reviews carousel
  (function(){
    const track=document.getElementById('reviewsTrack');
    if(!track)return;
    const prev=document.getElementById('rvPrev'), next=document.getElementById('rvNext');
    const step=()=>{
      const card=[...track.querySelectorAll('.rv-card')].find(item=>item.offsetParent!==null);
      const gap=parseFloat(getComputedStyle(track).columnGap||getComputedStyle(track).gap)||24;
      return card?card.offsetWidth+gap:track.clientWidth*0.8;
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

    // video play
    const vid=document.getElementById('rvVideo'), playBtn=document.getElementById('rvPlay');
    if(vid&&playBtn){
      playBtn.addEventListener('click',()=>{
        vid.setAttribute('controls','');
        vid.play();
        playBtn.style.display='none';
      });
      vid.addEventListener('pause',()=>{if(vid.currentTime>0&&!vid.ended){/* keep controls */}});
    }
  })();
