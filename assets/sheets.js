/* =====================================================================
   Sheets: product details, custom cake builder, checkout, workshop booking
   + veg / egg / non-veg markers. Needs order.js and app.js first.
   ===================================================================== */
(function(){
  const S = window.SBW; if(!S) return;
  const {Basket, CATALOGUE, DIET} = S;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = (window.SBW_CONFIG || {}).whatsapp || '919198453309';
  const money = n => n == null ? 'Price on request' : S.rupees(n);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const img = slug => `assets/${slug}.jpg`;
  const istNow = () => new Date(Date.now() + 5.5 * 3600e3);
  const isoDay = d => d.toISOString().slice(0, 10);
  const addDays = n => isoDay(new Date(istNow().getTime() + n * 864e5));
  const isSunday = iso => new Date(iso + 'T12:00:00Z').getUTCDay() === 0;
  const prettyDay = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', timeZone:'UTC'});

  /* ---------------- diet markers (FSSAI-style) ---------------- */
  function badge(slug, inline){
    const m = CATALOGUE[slug]; if(!m || !m.diet) return null;
    const b = document.createElement('span');
    b.className = `diet d-${m.diet}${inline ? ' inline' : ''}`;
    b.title = DIET[m.diet] + (m.eggless ? ' · eggless available' : '');
    b.setAttribute('role', 'img'); b.setAttribute('aria-label', b.title);
    b.innerHTML = '<i></i>';
    return b;
  }
  const PLACES = [
    ['.pcard', '.pc-img', false], ['.item-card', '.item-photo', false], ['.mrow', '.nm', true],
    ['.hx-float', '.hf-t b', true], ['#todayPick', '.t-body h3', true], ['.search-results li[data-slug]', '.sr-t b', true]
  ];
  function decorate(){
    PLACES.forEach(([card, spot, inline]) => document.querySelectorAll(card).forEach(c => {
      const slot = c.querySelector('.stepper-slot[data-slug]'); const slug = (slot && slot.dataset.slug) || c.dataset.slug; if(!slug || !CATALOGUE[slug]) return;
      if(c.dataset.sheet !== slug){ c.dataset.sheet = slug; c.querySelectorAll('.diet, .egl').forEach(x => x.remove()); }
      const at = c.querySelector(spot); if(!at || at.querySelector(':scope > .diet')) return;
      const b = badge(slug, inline); if(!b) return;
      inline ? at.prepend(b) : at.append(b);
      if(!inline && CATALOGUE[slug].eggless){ const e = document.createElement('span'); e.className = 'egl'; e.textContent = 'Eggless option'; at.append(e); }
      const pic = c.querySelector('.pc-img, .item-photo, .th, img');
      if(pic && !pic.hasAttribute('tabindex') && pic.tagName !== 'IMG'){ pic.setAttribute('tabindex', '0'); pic.setAttribute('role', 'button'); pic.setAttribute('aria-label', `Details of ${CATALOGUE[slug].name}`); }
    }));
  }
  let dt; new MutationObserver(() => { clearTimeout(dt); dt = setTimeout(decorate, 40); }).observe(document.body, {childList:true, subtree:true});
  decorate();

  /* ---------------- sheet shell ---------------- */
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap'; wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = '<div class="sheet-scrim"></div><section class="sheet" role="dialog" aria-modal="true" data-lenis-prevent><span class="sheet-grip" aria-hidden="true"></span><button type="button" class="sheet-x" aria-label="Close">×</button><div class="sheet-in"></div></section>';
  document.body.appendChild(wrap);
  const panel = wrap.querySelector('.sheet'), inner = wrap.querySelector('.sheet-in');
  let lastFocus = null, onClose = null;
  function open(html, opts = {}){
    lastFocus = document.activeElement;
    panel.className = 'sheet ' + (opts.cls || '');
    panel.setAttribute('aria-label', opts.label || 'Details');
    inner.innerHTML = html; inner.scrollTop = 0; panel.scrollTop = 0;
    onClose = opts.onClose || null;
    wrap.classList.add('open'); wrap.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('sheet-open');
    if(window.__lenis) window.__lenis.stop();
    if(!REDUCE && window.gsap){
      const mobile = innerWidth < 760;
      gsap.fromTo(panel, mobile ? {yPercent:100} : {y:40, scale:.96, opacity:0}, mobile ? {yPercent:0, duration:.6, ease:'expo.out'} : {y:0, scale:1, opacity:1, duration:.55, ease:'expo.out'});
      gsap.fromTo(wrap.querySelector('.sheet-scrim'), {opacity:0}, {opacity:1, duration:.4});
      gsap.fromTo(inner.querySelectorAll('[data-in]'), {y:18, opacity:0}, {y:0, opacity:1, duration:.6, stagger:.05, delay:.12, ease:'power3.out', clearProps:'transform,opacity'});
    }
    setTimeout(() => { const f = inner.querySelector('[autofocus]') || panel.querySelector('.sheet-x'); f && f.focus({preventScroll:true}); }, 60);
    return inner;
  }
  function close(){
    if(!wrap.classList.contains('open')) return;
    const done = () => {
      wrap.classList.remove('open'); wrap.setAttribute('aria-hidden', 'true'); inner.innerHTML = '';
      document.documentElement.classList.remove('sheet-open');
      if(window.__lenis && !document.querySelector('.bag.open, nav.links.open')) window.__lenis.start();
      gsap && gsap.set && gsap.set(panel, {clearProps:'all'});
      if(onClose) onClose(); if(lastFocus && lastFocus.focus) lastFocus.focus({preventScroll:true});
      if(location.hash === '#cake') history.replaceState(null, '', location.pathname + location.search);
    };
    if(REDUCE || !window.gsap) return done();
    const mobile = innerWidth < 760;
    gsap.to(panel, mobile ? {yPercent:100, duration:.4, ease:'power3.in', onComplete:done} : {y:30, opacity:0, scale:.97, duration:.3, ease:'power2.in', onComplete:done});
    gsap.to(wrap.querySelector('.sheet-scrim'), {opacity:0, duration:.3});
  }
  wrap.querySelector('.sheet-scrim').addEventListener('click', close);
  wrap.querySelector('.sheet-x').addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if(!wrap.classList.contains('open')) return;
    if(e.key === 'Escape'){ e.stopPropagation(); close(); }
    if(e.key === 'Tab'){ /* keep focus inside */
      const f = [...panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled && x.offsetParent);
      if(!f.length) return; const a = f[0], z = f[f.length - 1];
      if(e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); }
    }
  }, true);
  /* swipe down to close (phones) */
  (function(){
    let y0 = null, dy = 0;
    panel.addEventListener('touchstart', e => { if(panel.scrollTop > 0 || inner.scrollTop > 0) return; y0 = e.touches[0].clientY; dy = 0; }, {passive:true});
    panel.addEventListener('touchmove', e => { if(y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); if(dy > 0) panel.style.transform = `translateY(${dy}px)`; }, {passive:true});
    panel.addEventListener('touchend', () => { if(y0 == null) return; y0 = null; if(dy > 110) close(); else panel.style.transform = ''; });
  })();
  S.sheet = {open, close};
  const flyFrom = el => { const b = el && el.closest('.sheet') ? el : null; if(!b || REDUCE || !window.gsap) return;
    const t = [...document.querySelectorAll('.hdr-bag, .tabbar [data-bag]')].find(x => x.offsetParent); if(t) gsap.fromTo(t, {scale:1.35}, {scale:1, duration:.7, ease:'elastic.out(1,.4)'}); };

  /* ---------------- product sheet ---------------- */
  function productSheet(slug){
    const m = CATALOGUE[slug]; if(!m) return;
    if(slug === 'custom-cake') return cakeBuilder();
    let qty = 1, eggless = false;
    const pairs = Object.keys(CATALOGUE).filter(k => k !== slug && k !== 'custom-cake' && CATALOGUE[k].cat === m.cat).sort(() => Math.random() - .5).slice(0, 3);
    const html = `
      <div class="ps">
        <figure class="ps-img" data-in><img src="${img(slug)}" alt="${esc(m.name)}"><span class="ps-diet"></span></figure>
        <div class="ps-body">
          <span class="kick" data-in>${esc(m.cat)}</span>
          <h2 class="ps-name" data-in>${esc(m.name)}</h2>
          <div class="ps-meta" data-in><b class="ps-price">${money(m.price)}</b>${m.note ? `<span>${esc(m.note)}</span>` : ''}<span class="ps-dl"></span></div>
          <p class="ps-desc" data-in>${esc(m.d || '')}</p>
          ${m.eggless ? `<div class="seg" role="radiogroup" aria-label="Recipe" data-in>
              <button type="button" role="radio" aria-checked="true" data-v="0">Regular</button>
              <button type="button" role="radio" aria-checked="false" data-v="1"><i class="diet d-veg inline"><i></i></i>Eggless</button></div>
            <p class="ps-hint" data-in>Eggless is made to order at the same price.</p>` : ''}
          ${m.i && m.i.length ? `<h4 data-in>Ingredients</h4><div class="chips" data-in>${m.i.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
          ${m.a && m.a.length ? `<h4 data-in>Allergens</h4><div class="chips warn" data-in>${m.a.map(x => `<span>${esc(x)}</span>`).join('')}</div>
            <p class="ps-hint" data-in>Indicative — tell the café about any allergy in your order note.</p>` : ''}
          ${pairs.length ? `<h4 data-in>Pairs well with</h4><div class="ps-pairs" data-in>${pairs.map(k => `<button type="button" data-pair="${k}"><img src="${img(k)}" alt=""><span>${esc(CATALOGUE[k].name)}</span><small>${money(CATALOGUE[k].price)}</small></button>`).join('')}</div>` : ''}
        </div>
        <div class="ps-foot">
          <div class="qbox" aria-label="Quantity"><button type="button" data-q="-1" aria-label="One less">−</button><span aria-live="polite">1</span><button type="button" data-q="1" aria-label="One more">+</button></div>
          <button type="button" class="ps-add">Add to basket <b></b></button>
        </div>
      </div>`;
    const el = open(html, {cls:'is-product', label:m.name});
    const dietSpot = el.querySelector('.ps-diet'), dl = el.querySelector('.ps-dl');
    const paintDiet = () => {
      const d = eggless ? 'veg' : m.diet;
      dietSpot.innerHTML = `<span class="diet d-${d}"><i></i></span>`;
      dl.textContent = eggless ? 'Eggless · Veg' : DIET[m.diet];
    };
    const paint = () => { el.querySelector('.qbox span').textContent = qty; el.querySelector('.ps-add b').textContent = m.price == null ? '· on request' : '· ' + S.rupees(m.price * qty); };
    paintDiet(); paint();
    el.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { qty = Math.max(1, Math.min(20, qty + +b.dataset.q)); paint();
      if(!REDUCE && window.gsap) gsap.fromTo(el.querySelector('.qbox span'), {scale:1.4}, {scale:1, duration:.4, ease:'back.out(3)'}); }));
    el.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
      eggless = b.dataset.v === '1';
      el.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-checked', x === b ? 'true' : 'false'));
      paintDiet();
    }));
    el.querySelectorAll('[data-pair]').forEach(b => b.addEventListener('click', () => { close(); setTimeout(() => productSheet(b.dataset.pair), REDUCE ? 0 : 380); }));
    el.querySelector('.ps-add').addEventListener('click', e => {
      Basket.add(slug, qty, eggless ? 'eggless' : null);
      S.toast && S.toast(`${qty} × ${m.name}${eggless ? ' (eggless)' : ''} added to your basket`);
      flyFrom(e.currentTarget); close();
    });
  }
  S.productSheet = productSheet;
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-sheet]'); if(!c) return;
    if(e.target.closest('button, a, input, .stepper, .stepper-slot, .ct-go')) return;
    if(c.closest('.search-results')) return;   /* search rows add on tap */
    e.preventDefault(); productSheet(c.dataset.sheet);
  });
  document.addEventListener('keydown', e => {
    if(e.key !== 'Enter' && e.key !== ' ') return;
    const p = e.target.closest('[data-sheet] [role="button"]'); if(!p) return;
    e.preventDefault(); productSheet(p.closest('[data-sheet]').dataset.sheet);
  });

  /* ---------------- custom cake builder ---------------- */
  const SIZES = [
    {id:'half', t:'½ kg', s:'Serves 4–6', tiers:1, h:.72},
    {id:'one', t:'1 kg', s:'Serves 8–10', tiers:1, h:1},
    {id:'onehalf', t:'1.5 kg', s:'Serves 12–15', tiers:1, h:1.18},
    {id:'two', t:'2 kg · two tier', s:'Serves 18–22', tiers:2, h:1, lead:2}
  ];
  const FLAVOURS = [
    {id:'choc', t:'Chocolate truffle', c:'#4a2a1d', f:'#5b3424'},
    {id:'vanilla', t:'Vanilla & berries', c:'#f1dfb6', f:'#fbf1dd'},
    {id:'redvelvet', t:'Red velvet', c:'#9d2c33', f:'#fbf1e6'},
    {id:'biscoff', t:'Biscoff caramel', c:'#b77737', f:'#e7c08c'},
    {id:'pineapple', t:'Pineapple cream', c:'#f2d27a', f:'#fff6e2'},
    {id:'rasmalai', t:'Rasmalai', c:'#f0dcae', f:'#fbf0d8'}
  ];
  const FINISHES = [
    {id:'cream', t:'Smooth cream'}, {id:'flowers', t:'Fresh flowers'}, {id:'drip', t:'Chocolate drip'},
    {id:'naked', t:'Naked & rustic'}, {id:'gold', t:'Gold leaf'}
  ];
  function cakeSVG(st){
    const size = SIZES.find(x => x.id === st.size), fl = FLAVOURS.find(x => x.id === st.flavour), fin = st.finish;
    const tiers = size.tiers === 2 ? [{w:200, h:78}, {w:136, h:62}] : [{w:Math.round(150 + 50 * size.h), h:Math.round(60 + 34 * size.h)}];
    let y = 236, out = '';
    const frost = fin === 'naked' ? fl.c : (fin === 'drip' || fl.id === 'choc') && fin !== 'cream' ? fl.f : fl.f;
    tiers.forEach((t, ti) => {
      const x = 150 - t.w / 2, top = y - t.h, rx = t.w / 2, ry = 14;
      out += `<g class="tier" style="--d:${ti}">`;
      out += `<path d="M${x} ${top} v${t.h} a${rx} ${ry} 0 0 0 ${t.w} 0 v-${t.h}" fill="${frost}"/>`;
      if(fin === 'naked'){ for(let k = 1; k < 3; k++) out += `<rect x="${x}" y="${top + t.h * k / 3 - 4}" width="${t.w}" height="7" fill="#fbf1dd" opacity=".9"/>`; }
      out += `<path d="M${x} ${top} v${t.h} a${rx} ${ry} 0 0 0 ${t.w} 0 v-${t.h}" fill="url(#shade)"/>`;
      out += `<ellipse cx="150" cy="${top}" rx="${rx}" ry="${ry}" fill="${fin === 'naked' ? '#fbf1dd' : frost}"/>`;
      out += `<ellipse cx="150" cy="${top}" rx="${rx}" ry="${ry}" fill="url(#gloss)"/>`;
      if(fin === 'drip'){ let p = `M${x} ${top}`; for(let k = 0; k <= 10; k++){ const xx = x + t.w * k / 10, dd = 8 + ((k * 37) % 23); p += ` L${xx} ${top + 4} L${xx + 4} ${top + dd} a4 4 0 0 0 8 0 L${xx + 12} ${top + 4}`; }
        out += `<path d="${p} L${x + t.w} ${top}" fill="#3a2016" opacity=".95"/><ellipse cx="150" cy="${top}" rx="${rx}" ry="${ry}" fill="#3a2016"/>`; }
      if(fin === 'gold'){ for(let k = 0; k < 9; k++) out += `<rect x="${x + 12 + (k * 53) % (t.w - 24)}" y="${top + 10 + (k * 29) % (t.h - 16)}" width="${4 + k % 3}" height="${3 + k % 2}" fill="#d9b25c" transform="rotate(${k * 23} ${x + 12 + (k * 53) % (t.w - 24)} ${top + 10 + (k * 29) % (t.h - 16)})"/>`; }
      if(fin === 'flowers'){ [[-.32, 0], [.28, -.1], [.05, .25]].forEach(([fx, fy], k) => { const cx = 150 + fx * t.w, cy = top + fy * 14;
        out += `<g transform="translate(${cx} ${cy})">${[0, 72, 144, 216, 288].map(r => `<ellipse rx="7" ry="4.2" cx="6" fill="${k % 2 ? '#e9a3a8' : '#f4c7c3'}" transform="rotate(${r})"/>`).join('')}<circle r="3.2" fill="#d9a441"/></g>`; }); }
      out += `<path d="M${x} ${top + 2} q${t.w / 8} 6 ${t.w / 4} 0 t${t.w / 4} 0 t${t.w / 4} 0 t${t.w / 4} 0" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>`;
      out += '</g>';
      y = top + 4;
    });
    const msg = (st.msg || '').trim();
    return `<svg viewBox="0 0 300 300" class="cake-svg" aria-hidden="true">
      <defs><linearGradient id="shade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".35" stop-color="#fff" stop-opacity=".12"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
      <radialGradient id="gloss" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <radialGradient id="flame" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fff6c8"/><stop offset=".5" stop-color="#ffc35a"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="150" cy="258" rx="128" ry="18" fill="#000" opacity=".12"/>
      <ellipse cx="150" cy="250" rx="122" ry="18" fill="#e9dcc4"/><ellipse cx="150" cy="246" rx="122" ry="18" fill="#f7efe1"/>
      ${out}
      <g class="candle"><rect x="147" y="${y - 44}" width="6" height="40" rx="2" fill="#f4e3c1"/><path d="M147 ${y - 34} l6 -5 M147 ${y - 22} l6 -5 M147 ${y - 10} l6 -5" stroke="#d98e7a" stroke-width="2"/>
        <ellipse class="flame" cx="150" cy="${y - 54}" rx="6" ry="11" fill="url(#flame)"/></g>
      ${msg ? `<g class="plaque"><rect x="${150 - Math.min(130, 22 + msg.length * 6.4)}" y="12" width="${Math.min(260, 44 + msg.length * 12.8)}" height="40" rx="20" fill="#fbf5ea" stroke="#c79a4b" stroke-opacity=".5"/>
        <text x="150" y="40" text-anchor="middle" font-family="Mrs Saint Delafield, cursive" font-size="26" fill="#9c4530">${esc(msg)}</text></g>` : ''}
    </svg>`;
  }
  function cakeBuilder(){
    const st = {size:'one', flavour:'choc', eggless:true, finish:'flowers', msg:'', date:addDays(2), time:'4–7 pm', photo:null, note:'', step:0};
    const STEPS = ['Size', 'Flavour', 'Finish', 'When'];
    const html = `
      <div class="cb">
        <div class="cb-stage" data-in><div class="cb-glow"></div><div class="cb-cake"></div><p class="cb-sum"></p></div>
        <div class="cb-panel">
          <span class="kick" data-in>Bake a wish</span>
          <h2 class="cb-h" data-in>Design your <em>cake</em></h2>
          <ol class="cb-steps" data-in>${STEPS.map((t, i) => `<li data-s="${i}"><b>${i + 1}</b><span>${t}</span></li>`).join('')}</ol>
          <div class="cb-body"></div>
          <div class="cb-nav"><button type="button" class="cb-back">Back</button><button type="button" class="cb-next">Next</button></div>
        </div>
      </div>`;
    const el = open(html, {cls:'is-cake', label:'Design your cake'});
    const body = el.querySelector('.cb-body'), cakeBox = el.querySelector('.cb-cake'), sum = el.querySelector('.cb-sum');
    const nextBtn = el.querySelector('.cb-next'), backBtn = el.querySelector('.cb-back');
    const summary = () => [SIZES.find(x => x.id === st.size).t, FLAVOURS.find(x => x.id === st.flavour).t, st.eggless ? 'Eggless' : 'With egg', FINISHES.find(x => x.id === st.finish).t].join(' · ');
    function drawCake(bounce){
      cakeBox.innerHTML = cakeSVG(st); sum.textContent = summary();
      if(bounce && !REDUCE && window.gsap){ gsap.fromTo(cakeBox.querySelectorAll('.tier'), {scaleY:.85, transformOrigin:'50% 100%'}, {scaleY:1, duration:.7, stagger:.08, ease:'elastic.out(1,.5)'});
        gsap.fromTo(cakeBox.querySelector('.plaque'), {y:-10, opacity:0}, {y:0, opacity:1, duration:.5}); }
    }
    const opt = (name, items, cur, sub) => `<div class="opts" role="radiogroup">${items.map(x => `<button type="button" role="radio" class="opt" data-k="${name}" data-v="${x.id}" aria-checked="${x.id === cur}">
        ${x.c ? `<i class="sw" style="background:linear-gradient(135deg, ${x.c} 50%, ${x.f} 50%)"></i>` : ''}<b>${esc(x.t)}</b>${sub && x[sub] ? `<small>${esc(x[sub])}</small>` : ''}</button>`).join('')}</div>`;
    function step(){
      el.querySelectorAll('.cb-steps li').forEach((li, i) => { li.classList.toggle('on', i === st.step); li.classList.toggle('done', i < st.step); });
      backBtn.style.visibility = st.step ? 'visible' : 'hidden';
      nextBtn.textContent = st.step === 3 ? 'Add to basket' : 'Next';
      if(st.step === 0) body.innerHTML = `<h4>How big is the wish?</h4>${opt('size', SIZES, st.size, 's')}<p class="ps-hint">Two-tier cakes need 48 hours' notice.</p>`;
      if(st.step === 1) body.innerHTML = `<h4>Pick a flavour</h4>${opt('flavour', FLAVOURS, st.flavour)}
        <label class="switch"><input type="checkbox" ${st.eggless ? 'checked' : ''} data-egg><span></span><b><i class="diet d-veg inline"><i></i></i>Make it eggless</b></label>`;
      if(st.step === 2) body.innerHTML = `<h4>Choose a finish</h4>${opt('finish', FINISHES, st.finish)}
        <h4>Message on the cake</h4><div class="field"><input type="text" maxlength="24" placeholder="Happy birthday, Riya" value="${esc(st.msg)}" data-msg aria-label="Message on the cake"><small class="cnt">${st.msg.length}/24</small></div>`;
      if(st.step === 3){
        const min = addDays(st.size === 'two' ? 2 : 1);
        if(st.date < min) st.date = min;
        body.innerHTML = `<h4>When do you need it?</h4>
          <div class="row2"><div class="field"><label for="cb-d">Date</label><input id="cb-d" type="date" min="${min}" max="${addDays(60)}" value="${st.date}" data-date></div>
          <div class="field"><label for="cb-t">Time</label><select id="cb-t" data-time>${['9–11 am', '11 am–1 pm', '1–4 pm', '4–7 pm', '7–9 pm'].map(t => `<option ${t === st.time ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
          <p class="ps-hint cb-sun" ${isSunday(st.date) ? '' : 'hidden'}>The café is closed on Sundays — please pick another day.</p>
          <h4>Reference photo <small>(optional)</small></h4>
          <label class="drop"><input type="file" accept="image/*" data-photo hidden><span class="drop-in">${st.photo ? `<img src="${st.photo}" alt="Your reference photo">` : '<b>+</b> Add a photo of a cake you love'}</span></label>
          <p class="ps-hint">After ordering you'll send it to the café on WhatsApp in one tap.</p>
          <h4>Anything else?</h4><div class="field"><textarea rows="2" maxlength="240" placeholder="Theme, colours, allergies…" data-note>${esc(st.note)}</textarea></div>`;
      }
      if(!REDUCE && window.gsap) gsap.fromTo(body.children, {x:24, opacity:0}, {x:0, opacity:1, duration:.45, stagger:.04, ease:'power3.out', clearProps:'transform,opacity'});
      body.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => { st[b.dataset.k] = b.dataset.v; body.querySelectorAll(`.opt[data-k="${b.dataset.k}"]`).forEach(x => x.setAttribute('aria-checked', x === b)); drawCake(true); }));
      const egg = body.querySelector('[data-egg]'); if(egg) egg.addEventListener('change', () => { st.eggless = egg.checked; drawCake(false); });
      const msg = body.querySelector('[data-msg]'); if(msg) msg.addEventListener('input', () => { st.msg = msg.value; body.querySelector('.cnt').textContent = `${st.msg.length}/24`; drawCake(false); });
      const d = body.querySelector('[data-date]'); if(d) d.addEventListener('change', () => { st.date = d.value; body.querySelector('.cb-sun').hidden = !isSunday(st.date); });
      const tm = body.querySelector('[data-time]'); if(tm) tm.addEventListener('change', () => { st.time = tm.value; });
      const nt = body.querySelector('[data-note]'); if(nt) nt.addEventListener('input', () => { st.note = nt.value; });
      const ph = body.querySelector('[data-photo]'); if(ph) ph.addEventListener('change', () => {
        const f = ph.files && ph.files[0]; if(!f) return;
        const r = new FileReader(); r.onload = () => { st.photo = r.result; body.querySelector('.drop-in').innerHTML = `<img src="${st.photo}" alt="Your reference photo">`; }; r.readAsDataURL(f);
      });
    }
    nextBtn.addEventListener('click', () => {
      if(st.step < 3){ st.step++; step(); return; }
      if(!st.date || isSunday(st.date)){ const s = body.querySelector('.cb-sun'); if(s){ s.hidden = false; s.classList.add('err'); } return; }
      const meta = {size:st.size, flavour:st.flavour, eggless:st.eggless, finish:st.finish, msg:st.msg.trim(), date:st.date, time:st.time, photo:!!st.photo, note:st.note.trim()};
      meta.summary = summary() + (meta.msg ? ` · "${meta.msg}"` : '') + ` · for ${prettyDay(st.date)}, ${st.time}` + (meta.photo ? ' · reference photo on WhatsApp' : '') + (meta.note ? ` · ${meta.note}` : '');
      Basket.add('custom-cake', 1, 'cc-' + Date.now().toString(36), meta);
      try{ if(st.photo) sessionStorage.setItem('sbw-cake-photo', '1'); }catch(_){}
      S.toast && S.toast('Your custom cake is in the basket — the café confirms the price');
      flyFrom(nextBtn); close();
    });
    backBtn.addEventListener('click', () => { if(st.step){ st.step--; step(); } });
    el.querySelectorAll('.cb-steps li').forEach(li => li.addEventListener('click', () => { const i = +li.dataset.s; if(i <= st.step){ st.step = i; step(); } }));
    drawCake(true); step();
  }
  S.cakeBuilder = cakeBuilder;
  document.addEventListener('click', e => { const a = e.target.closest('a[href$="#cake"], [data-cake]'); if(!a) return; e.preventDefault(); cakeBuilder(); });
  if(location.hash === '#cake') setTimeout(cakeBuilder, document.documentElement.classList.contains('is-loading') ? 4200 : 900);

  /* ---------------- checkout ---------------- */
  const SLOTS = ['9–11 am', '11 am–1 pm', '1–4 pm', '4–7 pm', '7–9 pm'];
  function checkout(){
    const saved = (() => { try{ return JSON.parse(localStorage.getItem('sbw-details') || '{}'); }catch(_){ return {}; } })();
    const hasCake = () => Basket.items().some(l => l.slug === 'custom-cake');
    const st = {step:0, ful:'pickup', date:'', time:'4–7 pm', addr:saved.addr || '', name:saved.name || '', phone:saved.phone || '', note:'', pay:'Pay at pickup / on delivery'};
    const minDate = () => addDays(hasCake() ? (Basket.items().some(l => l.meta && l.meta.size === 'two') ? 2 : 1) : 0);
    st.date = minDate(); if(isSunday(st.date)) st.date = addDays(hasCake() ? 2 : 1);
    const html = `
      <div class="co">
        <div class="co-top" data-in><span class="kick">Checkout</span><h2>Almost <em>yours.</em></h2>
          <div class="co-prog"><i></i></div><ol class="co-steps"><li>Basket</li><li>Pickup or delivery</li><li>Your details</li></ol>
          ${S.API.live ? '' : '<span class="demo-flag">Demo mode · orders stay in this browser</span>'}</div>
        <div class="co-body"></div>
        <p class="form-err" role="alert"></p>
        <div class="co-foot"><button type="button" class="co-back">Back</button><div class="co-tot"><small>Subtotal</small><b></b></div><button type="button" class="co-next">Continue</button></div>
      </div>`;
    const el = open(html, {cls:'is-checkout', label:'Checkout'});
    const body = el.querySelector('.co-body'), err = el.querySelector('.form-err'), next = el.querySelector('.co-next'), back = el.querySelector('.co-back');
    const tot = () => { el.querySelector('.co-tot b').textContent = S.rupees(Basket.total()) + (Basket.hasOnRequest() ? ' +' : ''); };
    function view(){
      err.textContent = '';
      el.querySelectorAll('.co-steps li').forEach((li, i) => { li.classList.toggle('on', i === st.step); li.classList.toggle('done', i < st.step); });
      const bar = el.querySelector('.co-prog i');
      if(window.gsap && !REDUCE) gsap.to(bar, {scaleX:(st.step + 1) / 3, duration:.6, ease:'expo.out'}); else bar.style.transform = `scaleX(${(st.step + 1) / 3})`;
      back.style.visibility = st.step ? 'visible' : 'hidden';
      next.textContent = st.step === 2 ? 'Place order' : 'Continue';
      tot();
      if(st.step === 0){
        const items = Basket.items();
        body.innerHTML = items.length ? `<ul class="co-lines">${items.map((l, i) => { const m = CATALOGUE[l.slug];
          return `<li><img src="${img(l.slug)}" alt=""><div><b>${esc(m.name)}</b><small>${esc(Basket.label(l) || m.note || '')}</small></div>
            <div class="qbox sm"><button type="button" data-i="${i}" data-d="-1" aria-label="One less ${esc(m.name)}">−</button><span>${l.qty}</span><button type="button" data-i="${i}" data-d="1" aria-label="One more ${esc(m.name)}">+</button></div>
            <span class="p">${m.price == null ? 'on request' : S.rupees(m.price * l.qty)}</span></li>`; }).join('')}</ul>
          <p class="ps-hint">${Basket.hasOnRequest() ? 'Items priced on request (like custom cakes) are confirmed by the café before baking.' : 'Delivery charges, if any, are confirmed by the café.'}</p>`
          : `<div class="co-empty"><p>Your basket is empty.</p><a href="menu.html" class="btn btn-solid">Browse the menu</a></div>`;
        body.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { const l = Basket.items()[+b.dataset.i]; Basket.setQty(l.slug, l.qty + +b.dataset.d, l.opt || null); view(); }));
        next.disabled = !items.length;
      }
      if(st.step === 1){
        const min = minDate();
        if(st.date < min) st.date = min;
        body.innerHTML = `<div class="seg big" role="radiogroup" aria-label="Pickup or delivery">
            <button type="button" role="radio" data-f="pickup" aria-checked="${st.ful === 'pickup'}"><b>Pick up</b><small>From the café, George Town</small></button>
            <button type="button" role="radio" data-f="delivery" aria-checked="${st.ful === 'delivery'}"><b>Delivery</b><small>Within ~6 km · charge confirmed by café</small></button></div>
          <div class="field" ${st.ful === 'delivery' ? '' : 'hidden'} data-addr><label for="co-a">Delivery address</label><textarea id="co-a" rows="2" placeholder="House, street, landmark, area">${esc(st.addr)}</textarea></div>
          <div class="row2"><div class="field"><label for="co-d">Date</label><input id="co-d" type="date" min="${min}" max="${addDays(60)}" value="${st.date}"></div>
          <div class="field"><label for="co-t">Time</label><select id="co-t">${SLOTS.map(t => `<option ${t === st.time ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
          <p class="ps-hint co-sun" ${isSunday(st.date) ? '' : 'hidden'}>The café is closed on Sundays — please pick another day.</p>
          ${hasCake() ? '<p class="ps-hint">Custom cakes need at least a day (two-tier: two days).</p>' : ''}`;
        body.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { st.ful = b.dataset.f; body.querySelectorAll('[data-f]').forEach(x => x.setAttribute('aria-checked', x === b)); body.querySelector('[data-addr]').hidden = st.ful !== 'delivery'; }));
        body.querySelector('#co-a').addEventListener('input', e => { st.addr = e.target.value; });
        body.querySelector('#co-d').addEventListener('change', e => { st.date = e.target.value; body.querySelector('.co-sun').hidden = !isSunday(st.date); });
        body.querySelector('#co-t').addEventListener('change', e => { st.time = e.target.value; });
        next.disabled = false;
      }
      if(st.step === 2){
        body.innerHTML = `<div class="field"><label for="co-n">Your name</label><input id="co-n" autocomplete="name" value="${esc(st.name)}" placeholder="Full name"></div>
          <div class="field"><label for="co-p">Phone (WhatsApp)</label><input id="co-p" type="tel" inputmode="tel" autocomplete="tel" value="${esc(st.phone)}" placeholder="98765 43210"></div>
          <div class="field"><label for="co-x">A little note <small>(optional)</small></label><textarea id="co-x" rows="2" placeholder="Message on the box, allergies, occasion…">${esc(st.note)}</textarea></div>
          <div class="seg" role="radiogroup" aria-label="Payment">${['Pay at pickup / on delivery', 'UPI after the café confirms'].map(p => `<button type="button" role="radio" data-p="${p}" aria-checked="${p === st.pay}">${p}</button>`).join('')}</div>
          <div class="co-recap"><span>${st.ful === 'delivery' ? 'Delivery' : 'Pickup'}</span><b>${prettyDay(st.date)} · ${esc(st.time)}</b></div>`;
        ['n:name', 'p:phone', 'x:note'].forEach(k => { const [id, key] = k.split(':'); body.querySelector('#co-' + id).addEventListener('input', e => { st[key] = e.target.value; }); });
        body.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { st.pay = b.dataset.p; body.querySelectorAll('[data-p]').forEach(x => x.setAttribute('aria-checked', x === b)); }));
        next.disabled = false;
      }
      if(!REDUCE && window.gsap) gsap.fromTo(body.children, {y:16, opacity:0}, {y:0, opacity:1, duration:.45, stagger:.04, ease:'power3.out', clearProps:'transform,opacity'});
    }
    const bad = (msg, sel) => { err.textContent = msg; const f = sel && body.querySelector(sel); if(f) f.focus(); if(!REDUCE && window.gsap) gsap.fromTo(err, {x:-8}, {x:0, duration:.5, ease:'elastic.out(1,.3)'}); };
    next.addEventListener('click', async () => {
      if(st.step === 0){ if(!Basket.count()) return; st.step = 1; return view(); }
      if(st.step === 1){
        if(st.ful === 'delivery' && st.addr.trim().length < 8) return bad('Add a delivery address, or choose pickup.', '#co-a');
        if(!st.date) return bad('Choose the date you need it.', '#co-d');
        if(isSunday(st.date)) return bad('The café is closed on Sundays — choose another day.', '#co-d');
        st.step = 2; return view();
      }
      const phone = st.phone.replace(/\D/g, '');
      if(st.name.trim().length < 2) return bad('Add your name so the café knows who the order is for.', '#co-n');
      if(!/^[0-9]{10,13}$/.test(phone)) return bad('Add a 10-digit phone number — the café confirms on WhatsApp.', '#co-p');
      next.disabled = true; next.textContent = 'Placing…';
      try{
        const lines = Basket.items().map(l => `${l.qty} × ${CATALOGUE[l.slug].name}${l.opt ? ' (' + Basket.label(l) + ')' : ''}`).join(', ');
        const photo = Basket.items().some(l => l.meta && l.meta.photo);
        const res = await S.API.placeOrder({name:st.name, phone, fulfilment:st.ful, address:st.addr, date:st.date, time:st.time, note:[st.note.trim(), 'Payment: ' + st.pay].filter(Boolean).join(' · ')});
        try{ localStorage.setItem('sbw-details', JSON.stringify({name:st.name.trim(), phone:st.phone.trim(), addr:st.addr.trim()})); }catch(_){}
        S.API.rememberOrder(res.code, phone.slice(-4));
        Basket.clear();
        const wa = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(`Hi Shubhi's Bake A Wish! I just placed order ${res.code} on the website: ${lines}.` + (photo ? ' Sharing my reference photo for the cake here.' : ''));
        el.querySelector('.co').innerHTML = `<div class="co-done2">
            <svg class="tick" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36"/><path d="M24 41l11 11 21-24"/></svg>
            <span class="script">Wish received</span><h2>Thank you, ${esc(st.name.trim().split(/\s+/)[0])}.</h2>
            <p>Your order code</p><div class="code"><b>${res.code}</b><button type="button" class="copy">Copy</button></div>
            <p class="ps-hint">${res.hasOnRequest ? 'Total so far ' + S.rupees(res.total) + ' plus items priced on request.' : 'Total ' + S.rupees(res.total) + '.'} Track it with this code and the last 4 digits of your phone (${phone.slice(-4)}).${S.API.live ? '' : ' Demo mode: this order is not sent to the café.'}</p>
            <div class="row"><a class="btn btn-solid" href="track.html#${res.code}">Track live</a><a class="btn btn-outline" href="${wa}" target="_blank" rel="noopener">${photo ? 'Send photo on WhatsApp' : 'Message on WhatsApp'}</a></div></div>`;
        const done = el.querySelector('.co-done2');
        done.querySelector('.copy').addEventListener('click', e => { try{ navigator.clipboard.writeText(res.code).then(() => { e.target.textContent = 'Copied'; }); }catch(_){} });
        if(!REDUCE && window.gsap){ gsap.fromTo(done.querySelector('.tick circle'), {strokeDashoffset:230}, {strokeDashoffset:0, duration:.9, ease:'power2.out'});
          gsap.fromTo(done.querySelector('.tick path'), {strokeDashoffset:60}, {strokeDashoffset:0, duration:.5, delay:.6, ease:'power2.out'});
          gsap.fromTo(done.querySelectorAll(':scope > *:not(svg)'), {y:20, opacity:0}, {y:0, opacity:1, stagger:.07, delay:.4, duration:.6, ease:'power3.out'}); }
      }catch(ex){ next.disabled = false; next.textContent = 'Place order'; bad(ex.message || 'Something went wrong — please try again.'); }
    });
    back.addEventListener('click', () => { if(st.step){ st.step--; view(); } });
    view();
  }
  S.checkout = checkout;
  document.addEventListener('click', e => {
    const a = e.target.closest('.bag-go, [data-checkout], a[href="visit.html#order"]'); if(!a) return;
    if(a.closest('#wishCard')) return;   /* the candle's "Order this wish" adds its bake first (order.js) */
    if(!a.classList.contains('bag-go') && !a.hasAttribute('data-checkout') && !Basket.count()) return;   /* nothing to check out → normal link */
    e.preventDefault(); e.stopImmediatePropagation();
    const bag = document.querySelector('.bag.open'); if(bag){ bag.querySelector('.bag-x').click(); }
    setTimeout(checkout, bag ? 380 : 0);
  }, true);

  /* ---------------- workshop booking ---------------- */
  S.bookWorkshop = function(w){
    const html = `<div class="wb">
        <figure class="ps-img" data-in><img src="${esc(w.img)}" alt=""></figure>
        <div class="ps-body"><span class="kick" data-in>${esc(w.tag)}</span><h2 class="ps-name" data-in>${esc(w.t)}</h2>
          <div class="ps-meta" data-in><b class="ps-price">${S.rupees(w.price)}</b><span>per seat</span><span>${prettyDay(w.date)} · ${esc(w.time)}</span></div>
          <p class="ps-desc" data-in>${esc(w.d)}</p>
          <div class="wb-form" data-in>
            <div class="row2"><div class="field"><label for="wb-n">Name</label><input id="wb-n" autocomplete="name"></div><div class="field"><label for="wb-p">Phone (WhatsApp)</label><input id="wb-p" type="tel" inputmode="tel"></div></div>
            <div class="wb-seats"><span>Seats</span><div class="qbox"><button type="button" data-q="-1" aria-label="One seat less">−</button><span>1</span><button type="button" data-q="1" aria-label="One seat more">+</button></div><small>${w.left} left</small></div>
            <p class="form-err" role="alert"></p>
          </div></div>
        <div class="ps-foot"><button type="button" class="ps-add">Book seats <b></b></button></div></div>`;
    const el = open(html, {cls:'is-product', label:'Book ' + w.t});
    const saved = (() => { try{ return JSON.parse(localStorage.getItem('sbw-details') || '{}'); }catch(_){ return {}; } })();
    el.querySelector('#wb-n').value = saved.name || ''; el.querySelector('#wb-p').value = saved.phone || '';
    let n = 1; const paint = () => { el.querySelector('.wb-seats .qbox span').textContent = n; el.querySelector('.ps-add b').textContent = '· ' + S.rupees(w.price * n); };
    el.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { n = Math.max(1, Math.min(w.left, n + +b.dataset.q)); paint(); })); paint();
    el.querySelector('.ps-add').addEventListener('click', () => {
      const name = el.querySelector('#wb-n').value.trim(), phone = el.querySelector('#wb-p').value.replace(/\D/g, ''), err = el.querySelector('.form-err');
      if(name.length < 2){ err.textContent = 'Add your name.'; return; }
      if(!/^[0-9]{10,13}$/.test(phone)){ err.textContent = 'Add a 10-digit phone number.'; return; }
      try{ const b = JSON.parse(localStorage.getItem('sbw-bookings') || '{}'); b[w.id] = (b[w.id] || 0) + n; localStorage.setItem('sbw-bookings', JSON.stringify(b)); }catch(_){}
      const wa = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(`Hi! I'd like to book ${n} seat${n > 1 ? 's' : ''} for "${w.t}" on ${prettyDay(w.date)} (${w.time}). Name: ${name}.`);
      el.querySelector('.wb').innerHTML = `<div class="co-done2"><svg class="tick" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36"/><path d="M24 41l11 11 21-24"/></svg>
        <span class="script">See you there</span><h2>${n} seat${n > 1 ? 's' : ''} held for you.</h2>
        <p class="ps-hint">${esc(w.t)} · ${prettyDay(w.date)} · ${esc(w.time)}. Confirm on WhatsApp and pay at the café.${S.API.live ? '' : ' Demo mode: the booking is saved in this browser.'}</p>
        <div class="row"><a class="btn btn-solid" href="${wa}" target="_blank" rel="noopener">Confirm on WhatsApp</a></div></div>`;
      document.dispatchEvent(new CustomEvent('sbw:booked'));
    });
  };
})();
