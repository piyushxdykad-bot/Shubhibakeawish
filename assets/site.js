/* Shubhi's Bake A Wish — shared site behaviour (nav, cursor, reveals, counters) */
gsap.registerPlugin(ScrollTrigger);

/* custom cursor */
(function(){
  const cursor = document.querySelector('.cursor');
  const ring = document.querySelector('.cursor-ring');
  if(!cursor || !ring) return;
  let mx=0,my=0, rx=0, ry=0;
  window.addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; cursor.style.left=mx+'px'; cursor.style.top=my+'px'; });
  gsap.ticker.add(()=>{ rx += (mx-rx)*0.15; ry += (my-ry)*0.15; ring.style.left=rx+'px'; ring.style.top=ry+'px'; });
  document.querySelectorAll('[data-hover], a, button, .menu-card, .item-card, .w-card, .ig-cell, .g-card').forEach(el=>{
    el.addEventListener('mouseenter', ()=>ring.classList.add('big'));
    el.addEventListener('mouseleave', ()=>ring.classList.remove('big'));
  });
})();

/* header solid on scroll */
(function(){
  const header = document.getElementById('siteHeader');
  if(!header) return;
  ScrollTrigger.create({ start: 80, end: 99999, onUpdate: self => { header.classList.toggle('solid', self.scroll() > 80); } });
})();

/* mobile nav */
(function(){
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  if(!burger || !navLinks) return;
  burger.addEventListener('click', ()=>{ navLinks.classList.toggle('open'); });
  navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>navLinks.classList.remove('open')));
})();

/* generic reveal */
gsap.utils.toArray('.fade-up').forEach(el=>{
  gsap.to(el, {
    opacity:1, y:0, duration:1, ease:'power3.out',
    scrollTrigger:{ trigger: el, start:'top 88%' }
  });
});

/* ================= V2 ================= */
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DESKTOP = window.matchMedia('(min-width: 861px)').matches;

/* ---------- curtain between pages ---------- */
(function(){
  let curtain = document.querySelector('.curtain');
  if(!curtain){
    curtain = document.createElement('div');
    curtain.className = 'curtain';
    curtain.innerHTML = '<span class="script">Shubhi\'s</span>';
    document.body.appendChild(curtain);
  }
  if(REDUCE){ curtain.classList.remove('is-covering'); return; }
  const lift = () => {
    if(!curtain.classList.contains('is-covering')) return;
    gsap.fromTo(curtain, {y:0, yPercent:0}, {yPercent:-100, duration:1.05, ease:'expo.inOut', delay:.15,
      onComplete:() => { curtain.classList.remove('is-covering'); gsap.set(curtain, {clearProps:'transform'}); }});
  };
  if(document.readyState === 'complete') lift(); else window.addEventListener('load', lift);
  window.addEventListener('pageshow', e => { if(e.persisted){ curtain.classList.remove('is-covering'); gsap.set(curtain, {y:0, yPercent:100}); } });

  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if(!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const href = a.getAttribute('href') || '';
    if(!/^[\w-]+\.html(#[\w-]+)?$/.test(href)) return;            /* only our own pages */
    const [file] = href.split('#');
    const here = location.pathname.split('/').pop() || 'index.html';
    if(file === here) return;                                          /* same-page anchors scroll normally */
    e.preventDefault();
    /* y:0 first — otherwise GSAP reads the CSS translateY(100%) as a pixel offset and the curtain never arrives */
    gsap.fromTo(curtain, {y:0, yPercent:100}, {yPercent:0, duration:.8, ease:'expo.inOut', onComplete:() => { location.href = href; }});
  });
})();

/* ---------- line-mask reveals: [data-lines] holds .ln > span ---------- */
document.querySelectorAll('[data-lines]').forEach(el => {
  const spans = el.querySelectorAll('.ln > span');
  if(REDUCE || !spans.length) return;
  gsap.set(spans, {yPercent:115});
  if(el.closest('.ph')) return;                                        /* hero titles run in the entrance below */
  ScrollTrigger.create({ trigger: el, start:'top 86%', once:true,
    onEnter:() => gsap.to(spans, {yPercent:0, duration:1.15, stagger:.09, ease:'power4.out'}) });
});

/* ---------- cinematic page hero: entrance + scroll-out ---------- */
(function(){
  const ph = document.querySelector('.ph');
  if(!ph) return;
  const media = ph.querySelector('.ph-media');
  if(media && media.tagName === 'VIDEO'){
    if(REDUCE){ media.removeAttribute('autoplay'); media.pause(); }
    else { const p = media.play && media.play(); if(p && p.catch) p.catch(() => {}); }
  }
  if(REDUCE) return;
  const intro = () => {
    const tl = gsap.timeline({delay: .55});
    tl.fromTo('header', {y:-30, opacity:0}, {y:0, opacity:1, duration:.7, ease:'power3.out'}, 0)
      .fromTo(media, {scale:1.18}, {scale:1.06, duration:2.4, ease:'expo.out'}, 0)
      .fromTo('.ph-crumb', {opacity:0, y:14}, {opacity:1, y:0, duration:.7, ease:'power3.out'}, .2)
      .to('.ph-title .ln > span', {yPercent:0, duration:1.25, stagger:.1, ease:'power4.out'}, .25)
      .fromTo('.ph-foot > *, .ph-index', {opacity:0, y:22}, {opacity:1, y:0, duration:.9, stagger:.08, ease:'power3.out'}, .7);
  };
  if(document.readyState === 'complete') intro(); else window.addEventListener('load', intro);
  gsap.to(media, {yPercent:12, ease:'none', scrollTrigger:{trigger:ph, start:'top top', end:'bottom top', scrub:true}});
  gsap.to('.ph-inner', {yPercent:-18, opacity:.15, ease:'none', scrollTrigger:{trigger:ph, start:'top top', end:'bottom top', scrub:true}});
})();

/* non-hero pages still get the header entrance */
window.addEventListener('load', () => {
  if(document.querySelector('.ph') || document.getElementById('preloader')) return;
  gsap.fromTo('header', {y:-30, opacity:0}, {y:0, opacity:1, duration:.7, ease:'power3.out'});
});

/* ---------- scroll-lit manifesto ---------- */
document.querySelectorAll('.lit').forEach(p => {
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if(n.nodeType === 3){
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if(!part) return;
          if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if(n.nodeType === 1 && n.tagName === 'EM'){
        n.classList.add('w');
      } else if(n.nodeType === 1){ walk(n); }
    });
  };
  walk(p);
  if(REDUCE) return;
  gsap.to(p.querySelectorAll('.w'), {opacity:1, stagger:.06, ease:'none',
    scrollTrigger:{trigger:p, start:'top 78%', end:'bottom 42%', scrub:.6}});
});

/* ---------- pinned horizontal process ---------- */
(function(){
  const sec = document.querySelector('.process');
  if(!sec || REDUCE || !DESKTOP) return;
  const track = sec.querySelector('.process-track');
  const rail = sec.querySelector('.process-rail span');
  const count = sec.querySelector('.process-count b');
  const steps = sec.querySelectorAll('.step');
  const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
  const tl = gsap.timeline({ scrollTrigger:{ trigger:sec, start:'top top', end:() => '+=' + (dist() + window.innerHeight*0.4),
    pin:'.process-pin', scrub:.8, invalidateOnRefresh:true,
    onUpdate:self => { if(count){ const i = Math.min(steps.length, 1 + Math.floor(self.progress * steps.length * 0.999)); count.textContent = String(i).padStart(2,'0'); } } }});
  tl.to(track, {x:() => -dist(), ease:'none'}, 0);
  if(rail) tl.to(rail, {scaleX:1, ease:'none'}, 0);
  steps.forEach(s => {
    const img = s.querySelector('img');
    if(img) tl.fromTo(img, {xPercent:6}, {xPercent:-6, ease:'none'}, 0);
  });
})();

/* ---------- drag gallery: drag to scroll + inner parallax ---------- */
document.querySelectorAll('.drag').forEach(row => {
  let down = false, moved = false, sx = 0, sl = 0;
  row.addEventListener('pointerdown', e => { if(e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = row.scrollLeft; });
  window.addEventListener('pointermove', e => {
    if(!down) return;
    const dx = e.clientX - sx;
    if(Math.abs(dx) > 4){ moved = true; row.classList.add('is-dragging'); }
    row.scrollLeft = sl - dx;
  });
  window.addEventListener('pointerup', () => { if(!down) return; down = false; setTimeout(() => row.classList.remove('is-dragging'), 0); });
  row.addEventListener('click', e => { if(moved){ e.preventDefault(); e.stopPropagation(); } }, true);
  const imgs = row.querySelectorAll('figure img');
  const par = () => {
    const vw = window.innerWidth;
    imgs.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      const c = (r.left + r.width/2 - vw/2) / vw;              /* -0.5 … 0.5 across the screen */
      img.style.transform = `translate3d(${(-c*8).toFixed(2)}%,0,0)`;
    });
  };
  if(!REDUCE){ row.addEventListener('scroll', par, {passive:true}); window.addEventListener('resize', par); par(); }
});

/* ---------- sticky menu bar scrollspy ---------- */
(function(){
  const bar = document.querySelector('.cat-list');
  if(!bar) return;
  const links = [...bar.querySelectorAll('a')];
  const set = id => links.forEach(a => {
    const on = a.getAttribute('href') === '#' + id;
    a.classList.toggle('on', on);
    if(on){ const l = a.offsetLeft - 12; bar.scrollTo({left:l, behavior: REDUCE ? 'auto' : 'smooth'}); }
  });
  links.forEach(a => {
    const sec = document.querySelector(a.getAttribute('href'));
    if(sec) ScrollTrigger.create({ trigger:sec, start:'top 55%', end:'bottom 55%', onToggle:self => { if(self.isActive) set(sec.id); } });
  });
})();

/* ---------- framed photos drift inside their frames ---------- */
if(!REDUCE){
  document.querySelectorAll('[data-parallax]').forEach(img => {
    gsap.fromTo(img, {yPercent:-6}, {yPercent:6, ease:'none',
      scrollTrigger:{trigger:img.parentElement, start:'top bottom', end:'bottom top', scrub:true}});
  });
}

/* ---------- magnetic buttons ---------- */
if(!REDUCE && window.matchMedia('(hover:hover)').matches){
  document.querySelectorAll('.btn').forEach(b => {
    b.addEventListener('mousemove', e => {
      const r = b.getBoundingClientRect();
      gsap.to(b, {x:(e.clientX - r.left - r.width/2)*0.22, y:(e.clientY - r.top - r.height/2)*0.32, duration:.4, ease:'power3.out'});
    });
    b.addEventListener('mouseleave', () => gsap.to(b, {x:0, y:0, duration:.7, ease:'elastic.out(1,.45)'}));
  });
}

/* menu tabs: switch visible panel (used on home + menu page) */
document.querySelectorAll('.menu-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.menu-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.getAttribute('data-panel');
    document.querySelectorAll('.menu-panel').forEach(p=>{
      p.classList.toggle('active', p.getAttribute('data-panel') === target);
    });
    document.querySelectorAll(`.menu-panel[data-panel="${target}"] .item-card`).forEach((card,i)=>{
      gsap.fromTo(card, {opacity:0, y:22}, {opacity:1, y:0, duration:.6, delay:i*0.04, ease:'power2.out'});
    });
  });
});

/* counters */
document.querySelectorAll('.about-stats b, .hero-meta b, .values b').forEach(el=>{
  const text = el.textContent.trim();
  const match = text.match(/[\d.]+/);
  if(!match) return;
  const num = parseFloat(match[0]);
  const suffix = text.replace(match[0],'');
  if (text.toLowerCase().includes('prayagraj')) return;
  let obj = {val:0};
  ScrollTrigger.create({
    trigger: el, start:'top 90%', once:true,
    onEnter:()=> gsap.to(obj, {val:num, duration:1.6, ease:'power2.out', onUpdate:()=>{
      el.textContent = (num % 1 === 0 ? Math.floor(obj.val) : obj.val.toFixed(1)) + suffix;
    }})
  });
});

/* parallax: cafe cards + gallery */
if(document.querySelector('.cafe-visual')){
  gsap.to('.cafe-card.cc1', { y: -30, ease:'none', scrollTrigger:{ trigger:'.cafe-visual', start:'top bottom', end:'bottom top', scrub:true }});
  gsap.to('.cafe-card.cc2', { y: 30, ease:'none', scrollTrigger:{ trigger:'.cafe-visual', start:'top bottom', end:'bottom top', scrub:true }});
}

/* menu card stagger reveal refinement */
gsap.utils.toArray('.menu-card').forEach((card,i)=>{
  gsap.from(card, { opacity:0, y:50, duration:.8, delay:i*0.06, ease:'power3.out', scrollTrigger:{ trigger:card, start:'top 92%' }});
});
