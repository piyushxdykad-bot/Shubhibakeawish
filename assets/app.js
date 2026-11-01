/* =====================================================================
   App shell: tab bar, header basket, mini basket strip, steppers
   Needs order.js (window.SBW) loaded first.
   ===================================================================== */
(function(){
  const S = window.SBW; if(!S) return;
  const {Basket, CATALOGUE, rupees} = S;
  const here = location.pathname.split('/').pop() || 'index.html';
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = n => (rupees ? rupees(n) : '₹' + n);
  const bump = el => { if(el && window.gsap && !REDUCE) gsap.fromTo(el, {scale:1.3}, {scale:1, duration:.6, ease:'elastic.out(1,.45)'}); };

  /* current page in the header nav */
  document.querySelectorAll('nav.links a').forEach(a => {
    const h = a.getAttribute('href') || '';
    a.classList.remove('current');
    if(h === here && !a.classList.contains('nav-cta')) a.setAttribute('aria-current', 'page');
  });

  /* ---------- tab bar (phones & tablets) ---------- */
  if(here !== 'admin.html'){
    const I = {
      home:'<path d="M4 11 12 4l8 7v8.5a.5.5 0 0 1-.5.5H15v-6H9v6H4.5a.5.5 0 0 1-.5-.5Z"/>',
      menu:'<path d="M6 4v7a2 2 0 0 0 4 0V4M8 11v9M16 20V4c-2 1-3 3.5-3 7h3"/>',
      wish:'<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4Z"/><path d="M18 15l.8 2 2 .8-2 .8L18 21l-.8-2.4-2-.8 2-.8Z"/>',
      orders:'<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
      bag:'<path d="M5.5 8h13l-1.1 12.2H6.6L5.5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'
    };
    const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
    const bar = document.createElement('nav');
    bar.className = 'tabbar'; bar.setAttribute('aria-label', 'App');
    bar.innerHTML =
      `<a href="index.html">${svg('home')}Home</a>` +
      `<a href="menu.html">${svg('menu')}Menu</a>` +
      `<a href="index.html#wish" data-wish>${svg('wish')}Wish</a>` +
      `<a href="track.html">${svg('orders')}Orders</a>` +
      `<button type="button" data-bag aria-label="Basket">${svg('bag')}Basket<span class="tb-count" hidden>0</span></button>`;
    bar.querySelectorAll('a').forEach(a => { if(a.getAttribute('href') === here) a.setAttribute('aria-current', 'page'); });
    document.body.appendChild(bar);
    document.body.classList.add('has-tabbar');
    bar.querySelector('[data-bag]').addEventListener('click', () => S.openBasket && S.openBasket());
  }

  /* ---------- header basket ---------- */
  document.querySelectorAll('.hdr-bag').forEach(b => b.addEventListener('click', () => S.openBasket && S.openBasket()));

  /* ---------- mini basket strip ---------- */
  const mc = document.createElement('div');
  mc.className = 'minicart'; mc.setAttribute('role', 'region'); mc.setAttribute('aria-label', 'Basket summary');
  mc.innerHTML = '<span class="mc-info"><span class="mc-n">0 items</span><b class="mc-t">₹0</b></span><button type="button" class="mc-go">View basket <span aria-hidden="true">→</span></button>';
  const showStrip = !/^(visit|track|admin)\.html$/.test(here);
  if(showStrip) document.body.appendChild(mc);
  mc.querySelector('.mc-go').addEventListener('click', () => S.openBasket && S.openBasket());

  /* basket open state for CSS (hide the strip under the drawer) */
  const bag = document.querySelector('.bag');
  if(bag) new MutationObserver(() => document.body.classList.toggle('bag-is-open', bag.classList.contains('open')))
            .observe(bag, {attributes:true, attributeFilter:['class']});

  let lastCount = Basket.count();
  function syncCounts(){
    const n = Basket.count(), t = Basket.total();
    document.querySelectorAll('.hdr-count, .tb-count').forEach(c => { c.textContent = n; c.hidden = !n; });
    mc.querySelector('.mc-n').textContent = n === 1 ? '1 item' : `${n} items`;
    mc.querySelector('.mc-t').textContent = money(t) + (Basket.hasOnRequest() ? ' +' : '');
    mc.classList.toggle('on', n > 0);
    if(n > lastCount) document.querySelectorAll('.hdr-count, .tb-count').forEach(bump);
    lastCount = n;
  }

  /* ---------- steppers: any [data-slug].stepper-slot ---------- */
  function renderSteppers(root){
    const q = Object.fromEntries(Basket.items().map(l => [l.slug, l.qty]));
    (root || document).querySelectorAll('.stepper-slot[data-slug]').forEach(slot => {
      const slug = slot.dataset.slug, item = CATALOGUE[slug]; if(!item) return;
      const n = q[slug] || 0, name = item.name;
      const key = n ? 'n' + n : 'add';
      if(slot.dataset.k === key) return;
      const was = slot.dataset.k; slot.dataset.k = key;
      if(item.price == null){ slot.innerHTML = '<span class="stepper na">On request</span>'; return; }
      slot.innerHTML = n
        ? `<span class="stepper has"><button type="button" class="st-minus" data-slug="${slug}" aria-label="One less ${name}">−</button><span class="st-n" aria-live="polite">${n}</span><button type="button" class="st-plus" data-slug="${slug}" aria-label="One more ${name}">+</button></span>`
        : `<span class="stepper"><button type="button" class="st-add" data-slug="${slug}" aria-label="Add ${name} to basket"><b>+</b>Add</button></span>`;
      if(was && !REDUCE && window.gsap) gsap.fromTo(slot.firstChild, {scale:.86}, {scale:1, duration:.5, ease:'back.out(2.4)'});
    });
  }
  S.renderSteppers = renderSteppers;

  document.addEventListener('click', e => {
    const b = e.target.closest('.st-add, .st-plus, .st-minus'); if(!b) return;
    e.preventDefault();
    const slug = b.dataset.slug, cur = (Basket.items().find(l => l.slug === slug) || {}).qty || 0;
    if(b.classList.contains('st-minus')) Basket.setQty(slug, cur - 1);
    else { Basket.add(slug); if(!cur && S.toast) S.toast(`${CATALOGUE[slug].name} added to your basket`); }
    /* keep keyboard focus on the control that replaced the one pressed */
    const slot = b.closest('.stepper-slot');
    if(slot) requestAnimationFrame(() => { const f = slot.querySelector(b.classList.contains('st-minus') ? '.st-minus, .st-add' : '.st-plus, .st-add'); if(f) f.focus({preventScroll:true}); });
  });

  S.onChange(() => { syncCounts(); renderSteppers(); });
  syncCounts(); renderSteppers();
  window.addEventListener('pageshow', () => { syncCounts(); renderSteppers(); });
})();
