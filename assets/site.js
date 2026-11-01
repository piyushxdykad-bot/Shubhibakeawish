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

/* page entrance (non-home pages: simple fade, no preloader) */
window.addEventListener('load', () => {
  gsap.fromTo('header', {y:-30, opacity:0}, {y:0, opacity:1, duration:.7, ease:'power3.out'});
  if(document.querySelector('.page-banner')){
    gsap.fromTo('.page-banner .crumb, .page-banner h1, .page-banner p', {opacity:0, y:24}, {opacity:1, y:0, duration:.9, stagger:.08, ease:'power3.out', delay:.1});
  }
});

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
document.querySelectorAll('.about-stats b, .hero-meta b').forEach(el=>{
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
