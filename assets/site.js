/* Shubhi's Bake A Wish — shared site behaviour (nav, cursor, reveals, counters) */
gsap.registerPlugin(ScrollTrigger);

/* custom cursor */
(function(){
  const cursor = document.querySelector('.cursor');
  const ring = document.querySelector('.cursor-ring');
  if(!cursor || !ring) return;
  let mx=0,my=0, rx=0, ry=0;
  window.addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; cursor.style.left=mx+'px'; cursor.style.top=my+'px';
    if(!document.body.classList.contains('cursor-ready')){ rx=mx; ry=my; document.body.classList.add('cursor-ready'); } });
  document.documentElement.addEventListener('mouseleave', ()=>document.body.classList.remove('cursor-ready'));
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
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => {
    const y = self.scroll();
    header.classList.toggle('solid', y > 80);
    const hide = self.direction === 1 && y > 420 && !document.querySelector('.bag.open, nav.links.open');
    header.classList.toggle('hide', hide);
    document.body.classList.toggle('hdr-hidden', hide);
  } });
})();

/* mobile nav */
(function(){
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  if(!burger || !navLinks) return;
  burger.addEventListener('click', ()=>{ navLinks.classList.toggle('open'); });
  navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>navLinks.classList.remove('open')));
})();

/* generic reveal: see V4 reveal system at the end of this file */

/* ================= V2 ================= */
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DESKTOP = window.matchMedia('(min-width: 861px)').matches;

/* ---------- veil between pages: a curved panel carries the next page's name ---------- */
(function(){
  const PAGES = {
    'index.html':['00','Home'], 'story.html':['01','Our Story'], 'menu.html':['02','The Menu'],
    'cafe.html':['03','The Café'], 'visit.html':['04','Visit & Order'], 'track.html':['05','Track Order'], 'admin.html':['—','Orders']
  };
  const veil = document.querySelector('.veil');
  if(!veil || typeof gsap === 'undefined'){ if(veil) veil.classList.remove('is-on'); return; }
  const panel = veil.querySelector('.veil-panel'), cTop = veil.querySelector('.veil-curve.top'), cBot = veil.querySelector('.veil-curve.bot');
  const words = veil.querySelectorAll('.veil-inner > span > span');
  const no = veil.querySelector('.veil-no > span'), title = veil.querySelector('.veil-title > span');
  if(!veil.querySelector('.veil-bar')){ const b = document.createElement('i'); b.className = 'veil-bar'; panel.appendChild(b); }
  const bar = veil.querySelector('.veil-bar');
  const off = () => { veil.classList.remove('is-on'); gsap.set([panel, cTop, cBot, ...words], {clearProps:'all'}); gsap.set(bar, {opacity:0}); };
  let navigating = false;

  /* arriving: the panel is already covering (class is-on in the markup) — lift it */
  let lifted = false;
  const lift = () => {
    if(lifted || !veil.classList.contains('is-on')) return; lifted = true;
    if(REDUCE){ off(); return; }
    gsap.set(panel, {yPercent:0}); gsap.set(bar, {opacity:0});
    const tl = gsap.timeline({onComplete:off});
    tl.to(words, {yPercent:-110, duration:.55, stagger:.05, ease:'power3.in'}, 0)
      .to(cBot, {scaleY:1, duration:.5, ease:'power2.in'}, .3)
      .to(panel, {yPercent:-100, duration:.95, ease:'expo.inOut'}, .32)
      .to(cBot, {scaleY:0, duration:.6, ease:'power2.out'}, .8);
  };
  if(veil.classList.contains('is-on')){
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise(r => setTimeout(r, 1200))]).then(() => requestAnimationFrame(lift));
    setTimeout(lift, 1800);   /* never hold a page hostage */
  }
  window.addEventListener('pageshow', e => { if(e.persisted){ navigating = false; off(); } });

  /* leaving: cover with the destination's number and name, then go */
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if(!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href') || '';
    if(!/^[\w-]+\.html(#[\w-]+)?$/.test(href)) return;
    const [file] = href.split('#');
    const here = location.pathname.split('/').pop() || 'index.html';
    if(file === here) return;
    e.preventDefault();
    if(navigating) return; navigating = true;
    try{ sessionStorage.setItem('sbw-nav', '1'); }catch(_){}
    if(REDUCE){ location.href = href; return; }
    const lab = PAGES[file] || ['', ''];
    no.textContent = lab[0]; title.textContent = lab[1];
    gsap.killTweensOf([panel, cTop, cBot, ...words]);
    veil.classList.add('is-on');
    gsap.set(panel, {yPercent:100}); gsap.set(cTop, {scaleY:0}); gsap.set(words, {yPercent:110}); gsap.set(bar, {opacity:0});
    if(window.__lenis) window.__lenis.stop();
    const tl = gsap.timeline({onComplete:() => { gsap.to(bar, {opacity:1, duration:.3}); location.href = href; }});
    tl.to(cTop, {scaleY:1, duration:.45, ease:'power2.in'}, 0)
      .to(panel, {yPercent:0, duration:.85, ease:'expo.inOut'}, 0)
      .to(cTop, {scaleY:0, duration:.55, ease:'power2.out'}, .5)
      .to(words, {yPercent:0, duration:.7, stagger:.06, ease:'expo.out'}, .45)
      .to({}, {duration:.12});
  });
})();

/* ---------- line-mask reveals: [data-lines] holds .ln > span ---------- */
document.querySelectorAll('[data-lines]').forEach(el => {
  const spans = el.querySelectorAll('.ln > span');
  if(REDUCE || !spans.length) return;
  gsap.set(spans, {yPercent:118, rotate:3.5, transformOrigin:'0% 100%'});
  if(el.closest('.ph')) return;                                        /* hero titles run in the entrance below */
  ScrollTrigger.create({ trigger: el, start:'top 88%', once:true,
    onEnter:() => gsap.to(spans, {yPercent:0, rotate:0, duration:1.3, stagger:.1, ease:'expo.out'}) });
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
      .to('.ph-title .ln > span', {yPercent:0, rotate:0, duration:1.4, stagger:.12, ease:'expo.out'}, .25)
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

/* ================= V3 ================= */
const FINE = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

/* ---------- cursor context labels: data-cursor="View" ---------- */
(function(){
  const ring = document.querySelector('.cursor-ring'), dot = document.querySelector('.cursor');
  if(!ring || !FINE) return;
  const lab = document.createElement('span'); lab.className = 'c-label'; ring.appendChild(lab);
  const auto = [['.item-card','View'],['.d-card','Drag'],['.ws','Explore'],['.love-card','Open'],['.ig-cell','♡'],['.mrow','Order']];
  auto.forEach(([sel, t]) => document.querySelectorAll(sel).forEach(el => { if(!el.dataset.cursor) el.dataset.cursor = t; }));
  document.querySelectorAll('[data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => { lab.textContent = el.dataset.cursor; ring.classList.add('labelled'); dot.classList.add('hide'); });
    el.addEventListener('mouseleave', () => { ring.classList.remove('labelled'); dot.classList.remove('hide'); });
  });
})();

/* ---------- photo wipe reveals ---------- */
if(!REDUCE){
  document.querySelectorAll('.frame, .ws, .love-card, .d-card figure, .step figure, .item-photo').forEach(el => {
    el.classList.add('wipe');
    const img = el.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger:{ trigger:el, start:'top 90%', once:true } });
    tl.fromTo(el, {clipPath:'inset(100% 0% 0% 0%)'}, {clipPath:'inset(0% 0% 0% 0%)', duration:1.25, ease:'expo.out'});
    /* photos that already move (parallax, drag gallery, pinned process) keep their own transforms */
    if(img && !img.hasAttribute('data-parallax') && !el.closest('.drag, .step')) tl.fromTo(img, {scale:1.3}, {scale:1, duration:1.6, ease:'expo.out', clearProps:'scale'}, 0);
  });
}

/* ---------- marquee that answers your scroll speed ---------- */
document.querySelectorAll('.marquee-band').forEach(band => {
  const track = band.querySelector('.marquee-track');
  if(!track || REDUCE) return;
  band.classList.add('v');
  let x = 0, vel = 0, skew = 0, dir = 1;
  ScrollTrigger.create({ onUpdate: self => { vel = self.getVelocity(); dir = self.direction; } });
  gsap.ticker.add(() => {
    const half = track.scrollWidth / 2;
    const boost = Math.min(Math.abs(vel)/180, 14);
    x -= (0.6 + boost) * dir;
    if(x <= -half) x += half; if(x > 0) x -= half;
    skew += ((Math.max(-10, Math.min(10, vel/220))) - skew) * 0.1;
    vel *= 0.92;
    track.style.transform = `translate3d(${x}px,0,0) skewX(${(-skew).toFixed(2)}deg)`;
  });
});

/* ---------- footer signature writes itself in ---------- */
document.querySelectorAll('footer .foot-top').forEach(top => {
  if(top.parentElement.querySelector('.foot-sign')) return;
  const s = document.createElement('div');
  s.className = 'foot-sign'; s.setAttribute('aria-hidden','true');
  s.innerHTML = "<span>Shubhi's</span><small>Bake a wish · Prayagraj</small>";
  top.after(s);
  if(REDUCE) return;
  gsap.to(s.querySelector('span'), {clipPath:'inset(0 0% 0 0)', y:0, ease:'none',
    scrollTrigger:{trigger:s, start:'top 100%', end:'bottom bottom', scrub:.8}});
});

/* ---------- printed menu card: photo follows the cursor ---------- */
document.querySelectorAll('.mcard-list').forEach(list => {
  if(!FINE) return;
  const fl = document.createElement('div'); fl.className = 'mfloat'; fl.setAttribute('aria-hidden','true');
  const imgs = {};
  list.querySelectorAll('.mrow[data-img]').forEach(r => {
    const src = r.dataset.img;
    if(!imgs[src]){ const i = new Image(); i.src = src; i.alt = ''; fl.appendChild(i); imgs[src] = i; }
  });
  document.body.appendChild(fl);
  let mx = innerWidth/2, my = innerHeight/2, fx = mx, fy = my, on = false, rot = 0;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  gsap.ticker.add(() => {
    const dx = mx - fx; fx += dx*0.14; fy += (my - fy)*0.14;
    rot += ((Math.max(-12, Math.min(12, dx*0.08))) - rot)*0.12;
    fl.style.left = fx + 'px'; fl.style.top = fy + 'px';
    fl.style.rotate = rot.toFixed(2) + 'deg';
  });
  list.querySelectorAll('.mrow[data-img]').forEach(r => {
    r.addEventListener('mouseenter', () => {
      Object.values(imgs).forEach(i => i.classList.toggle('on', i === imgs[r.dataset.img]));
      if(!on){ on = true; gsap.to(fl, {opacity:1, scale:1, duration:.5, ease:'expo.out'}); }
    });
  });
  list.addEventListener('mouseleave', () => { on = false; gsap.to(fl, {opacity:0, scale:.6, duration:.4, ease:'power3.in'}); });
});

/* ---------- item cards tilt toward the cursor ---------- */
if(FINE && !REDUCE){
  document.querySelectorAll('.item-card').forEach(c => {
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect(), px = (e.clientX - r.left)/r.width, py = (e.clientY - r.top)/r.height;
      c.style.setProperty('--mx', (px*100).toFixed(1)+'%'); c.style.setProperty('--my', (py*100).toFixed(1)+'%');
      gsap.to(c, {rotateY:(px-.5)*9, rotateX:(.5-py)*9, transformPerspective:900, duration:.5, ease:'power3.out'});
    });
    c.addEventListener('mouseleave', () => gsap.to(c, {rotateY:0, rotateX:0, duration:.8, ease:'elastic.out(1,.5)'}));
  });
}

/* ---------- menu page: grid / menu-card toggle (remembered per visitor) ---------- */
(function(){
  const t = document.querySelector('.view-toggle');
  if(!t) return;
  const btns = t.querySelectorAll('button');
  const set = v => {
    document.body.classList.toggle('view-card', v === 'card');
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
    try{ localStorage.setItem('sbaw-view', v); }catch(_){}
    ScrollTrigger.refresh();
  };
  btns.forEach(b => b.addEventListener('click', () => set(b.dataset.view)));
  let saved = 'grid'; try{ saved = localStorage.getItem('sbaw-view') || 'grid'; }catch(_){}
  set(saved);
})();

/* in-page anchors glide (CSS smooth scrolling is off because it breaks ScrollTrigger's measurements) */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if(!a || a.getAttribute('href').length < 2) return;
  const t = document.querySelector(a.getAttribute('href'));
  if(!t) return;
  e.preventDefault();
  const off = document.querySelector('.cat-bar') ? 130 : 70;
  const top = Math.max(0, t.getBoundingClientRect().top + window.scrollY - off);
  if(window.__lenis){ window.__lenis.resize(); window.__lenis.scrollTo(top, {duration:1.4}); }
  else window.scrollTo({top, behavior: REDUCE ? 'auto' : 'smooth'});
});


/* ================= V4 — motion pass ================= */

/* ---------- inertia scrolling (wheel / trackpad only; touch stays native) ---------- */
(function(){
  /* quirks mode (a page served without <!doctype>) scrolls <body>, not <html>: Lenis can't drive it, so stay native */
  if(REDUCE || typeof Lenis === 'undefined' || document.compatMode !== 'CSS1Compat') return;
  const lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), wheelMultiplier: 1, smoothWheel: true });
  window.__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  window.addEventListener('load', () => { lenis.resize(); });
  ScrollTrigger.addEventListener('refresh', () => lenis.resize());
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('.bag, .bag-list, nav.links, .co-done, .cat-list').forEach(el => el.setAttribute('data-lenis-prevent', ''));
  /* pause page scroll while the basket or mobile menu is open */
  const sync = () => {
    (document.documentElement.classList.contains('is-loading') || document.querySelector('.bag.open, nav.links.open')) ? lenis.stop() : lenis.start();
  };
  const mo = new MutationObserver(sync);
  mo.observe(document.body, {subtree:true, attributes:true, attributeFilter:['class']});
  mo.observe(document.documentElement, {attributes:true, attributeFilter:['class']});
  sync();
})();

/* ---------- headings rise word by word from behind a mask ---------- */
(function(){
  const heads = [...document.querySelectorAll('main h2, section h2, section h3.wh-cap, .cat-head h2, .ig-top h2')]
    .filter(h => !h.hasAttribute('data-lines') && !h.closest('.ph, .wh, .wish-card, .co-done, .bag, .card, .oc, .login, .garden-end') && !h.dataset.words);
  heads.forEach(h => {
    h.dataset.words = '1';
    const wrapWord = node => { const o = document.createElement('span'); o.className = 'wd'; const i = document.createElement('span'); i.append(node); o.append(i); return o; };
    const walk = parent => {
      [...parent.childNodes].forEach(n => {
        if(n.nodeType === 3){
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if(!part) return;
            if(/^\s+$/.test(part)) frag.append(document.createTextNode(part));
            else frag.append(wrapWord(document.createTextNode(part)));
          });
          n.replaceWith(frag);
        } else if(n.nodeType === 1 && n.tagName !== 'BR'){
          n.replaceWith(wrapWord(n.cloneNode(true)));
        }
      });
    };
    walk(h);
    h.classList.remove('fade-up'); h.style.opacity = 1; h.style.transform = 'none';
    if(REDUCE) return;
    const inner = h.querySelectorAll('.wd > span');
    gsap.set(inner, {yPercent:110, rotate:4, transformOrigin:'0% 100%'});
    ScrollTrigger.create({ trigger:h, start:'top 90%', once:true,
      onEnter:() => gsap.to(inner, {yPercent:0, rotate:0, duration:1.2, stagger:.045, ease:'expo.out'}) });
  });
})();

/* ---------- everything else: batched, staggered; text comes into focus ---------- */
(function(){
  const els = gsap.utils.toArray('.fade-up');
  if(REDUCE){ gsap.set(els, {opacity:1, y:0, clearProps:'filter'}); return; }
  const isText = el => /^(P|SPAN|LI|UL|A|BLOCKQUOTE|FIGURE|DIV)$/.test(el.tagName) && !el.querySelector('img, video, canvas') && !el.classList.contains('item-card');
  els.forEach(el => { if(isText(el)) el.classList.add('fu-text'); });
  ScrollTrigger.batch(els, {
    start:'top 90%', once:true,
    onEnter: batch => gsap.to(batch, {opacity:1, y:0, filter:'blur(0px)', duration:1.1, ease:'expo.out', stagger:{each:.085, from:'start'},
      /* drop the blurred starting class first — clearing the inline filter alone lets the stylesheet blur come back */
      onComplete(){ this.targets().forEach(t => t.classList.remove('fu-text')); gsap.set(this.targets(), {clearProps:'filter'}); }})
  });
  /* anything already on screen at load (e.g. after a reload mid-page) */
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

/* ---------- buttons and nav links: label rolls to a fresh copy ---------- */
(function(){
  const roll = el => {
    if(el.dataset.roll || el.children.length || !el.textContent.trim()) return;
    const t = el.textContent.trim();
    el.dataset.roll = '1'; el.textContent = '';
    const r = document.createElement('span'); r.className = 'roll'; r.setAttribute('data-t', t);
    const i = document.createElement('span'); i.textContent = t; r.append(i); el.append(r);
    el.setAttribute('aria-label', el.getAttribute('aria-label') || t);
  };
  document.querySelectorAll('.btn, nav.links a').forEach(roll);
  /* buttons whose text the page rewrites later (e.g. "Placing your order…") simply lose the roll — harmless */
})();

/* ---------- dark bands open out of a rounded panel as they arrive ---------- */
(function(){
  if(REDUCE) return;
  const lum = c => { const m = (c || '').match(/\d+(\.\d+)?/g); if(!m || (m[3] !== undefined && +m[3] === 0)) return 1; return (0.299*m[0] + 0.587*m[1] + 0.114*m[2]) / 255; };
  document.querySelectorAll('section.manifesto, section.feature, section.gallery, section.love, section.ig-strip, section.space, section.cafe, section.wish, section.words').forEach(sec => {
    const prev = sec.previousElementSibling;
    if(!prev || lum(getComputedStyle(prev).backgroundColor) < 0.35) return;   /* dark after dark: no gap */
    gsap.fromTo(sec, {clipPath:'inset(3.5% 3% 0% 3% round 34px)'}, {clipPath:'inset(0% 0% 0% 0% round 0px)', ease:'none',
      scrollTrigger:{ trigger:sec, start:'top bottom', end:'top 30%', scrub:.6 }});
  });
})();
