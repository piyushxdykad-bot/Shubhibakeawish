/* Shubhi's Bake A Wish — basket, checkout API, tracking API (shared by every page) */
(function(){
const CATALOGUE = {"jowar-joy": {"name": "Jowar Joy", "note": "100g", "price": 169, "cat": "Millet Range"}, "ragi-rich": {"name": "Ragi Rich", "note": "100g", "price": 169, "cat": "Millet Range"}, "multigrain-magic": {"name": "Multigrain Magic", "note": "100g", "price": 169, "cat": "Millet Range"}, "millet-laddo": {"name": "Millet Laddo", "note": "200g", "price": 320, "cat": "Millet Range"}, "millet-samosa": {"name": "Millet Samosa", "note": "200g", "price": 320, "cat": "Millet Range"}, "apple-pie": {"name": "Apple Pie", "note": "", "price": 230, "cat": "Desserts"}, "tiramisu": {"name": "Tiramisu", "note": "a slice", "price": 250, "cat": "Desserts"}, "strawberry-cheesecake": {"name": "Strawberry Cheesecake", "note": "", "price": 250, "cat": "Desserts"}, "blueberry-cheesecake": {"name": "Blueberry Cheesecake", "note": "", "price": 250, "cat": "Desserts"}, "biscoff-cheesecake": {"name": "Biscoff Cheesecake", "note": "", "price": 250, "cat": "Desserts"}, "classic-tres-leches": {"name": "Classic Tres Leches", "note": "per slice", "price": 220, "cat": "Desserts"}, "lemon-chiffon": {"name": "Lemon Chiffon", "note": "", "price": 190, "cat": "Desserts"}, "hummingbird-cake": {"name": "Hummingbird Cake", "note": "slice", "price": 250, "cat": "Desserts"}, "chocolate-eclair": {"name": "Chocolate Eclair", "note": "", "price": 120, "cat": "Desserts"}, "cinnabon": {"name": "Cinnabon", "note": "", "price": 150, "cat": "Desserts"}, "almond-raisin-cookie": {"name": "Almond Raisin Cookie", "note": "100g", "price": 149, "cat": "Desserts"}, "butter-coconut-cookies": {"name": "Butter Coconut Cookies", "note": "100g", "price": 149, "cat": "Desserts"}, "potato-pinwheels": {"name": "Potato Pinwheels", "note": "", "price": 90, "cat": "Savouries"}, "minced-lamb-toast": {"name": "Minced Lamb on Toast", "note": "", "price": 185, "cat": "Savouries"}, "mushroom-toast": {"name": "Mushroom on Toast", "note": "", "price": 130, "cat": "Savouries"}, "scrambled-egg-toast": {"name": "Scrambled Egg on Toast", "note": "", "price": 110, "cat": "Savouries"}, "cottage-cheese-cutlet": {"name": "Cottage Cheese Cutlet", "note": "", "price": 140, "cat": "Savouries"}, "cheese-garlic-bread": {"name": "Cheese Garlic Bread", "note": "", "price": 100, "cat": "Savouries"}, "garlic-bites": {"name": "Garlic Bites", "note": "", "price": 60, "cat": "Savouries"}, "mushroom-croissant": {"name": "Mushroom Croissant", "note": "", "price": 190, "cat": "Bakes & More"}, "cheese-corn-bun": {"name": "Cheese Corn Bun", "note": "", "price": null, "cat": "Bakes & More"}, "smoothie-bowl": {"name": "Smoothie Bowl", "note": "", "price": 130, "cat": "Bakes & More"}};
const CFG = window.SBW_CONFIG || {};
const LIVE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const rupees = n => '₹' + Number(n).toLocaleString('en-IN');
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(_){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(_){} }
};

/* ---------------- basket ---------------- */
const Basket = {
  items(){ return store.get('sbw-basket', []).filter(l => CATALOGUE[l.slug]); },
  save(list){ store.set('sbw-basket', list); emit(); },
  add(slug, qty = 1){
    if(!CATALOGUE[slug]) return;
    const list = this.items(); const l = list.find(x => x.slug === slug);
    if(l) l.qty = Math.min(20, l.qty + qty); else list.push({slug, qty});
    this.save(list);
  },
  setQty(slug, qty){
    let list = this.items();
    if(qty <= 0) list = list.filter(l => l.slug !== slug);
    else { const l = list.find(x => x.slug === slug); if(l) l.qty = Math.min(20, qty); }
    this.save(list);
  },
  clear(){ this.save([]); },
  count(){ return this.items().reduce((a, l) => a + l.qty, 0); },
  total(){ return this.items().reduce((a, l) => a + (CATALOGUE[l.slug].price || 0) * l.qty, 0); },
  hasOnRequest(){ return this.items().some(l => CATALOGUE[l.slug].price == null); }
};
const listeners = new Set();
function emit(){ listeners.forEach(f => { try{ f(); }catch(e){ console.error(e); } }); }
window.addEventListener('storage', e => { if(e.key === 'sbw-basket') emit(); });

/* ---------------- backend: Supabase or demo ---------------- */
const STATUSES = ['received','confirmed','baking','ready','out_for_delivery','completed','cancelled'];
async function rpc(fn, body, token){
  const r = await fetch(CFG.supabaseUrl.replace(/\/$/,'') + '/rest/v1/rpc/' + fn, {
    method:'POST',
    headers:{'apikey':CFG.supabaseAnonKey, 'Authorization':'Bearer ' + (token || CFG.supabaseAnonKey), 'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  const txt = await r.text(); let data = null; try{ data = txt ? JSON.parse(txt) : null; }catch(_){}
  if(!r.ok) throw new Error((data && (data.message || data.hint)) || 'The café could not be reached. Please try again or message on WhatsApp.');
  return data;
}

const Demo = {
  all(){ return store.get('sbw-demo-orders', []); },
  put(list){ store.set('sbw-demo-orders', list); },
  code(){ const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let c = 'SBW-'; const r = new Uint8Array(6); crypto.getRandomValues(r); r.forEach(b => c += a[b % a.length]); return c; },
  /* demo orders move along on their own so the tracking page has something to show */
  advance(o){
    if(o.manual || ['completed','cancelled'].includes(o.status)) return o;
    const mins = (Date.now() - new Date(o.created_at).getTime()) / 60000;
    const path = ['received','confirmed','baking', o.fulfilment === 'delivery' ? 'out_for_delivery' : 'ready'];
    const at = [0, 0.5, 1.5, 3];
    let idx = 0; at.forEach((m, i) => { if(mins >= m) idx = i; });
    for(let i = o.events.length; i <= idx; i++) o.events.push({status:path[i], at:new Date(new Date(o.created_at).getTime() + at[i]*60000).toISOString()});
    o.status = path[idx];
    return o;
  }
};

const API = {
  live: LIVE,
  statuses: STATUSES,
  async placeOrder(f){
    const items = Basket.items().map(l => ({slug:l.slug, qty:l.qty}));
    if(LIVE){
      const res = await rpc('place_order', {p_name:f.name, p_phone:f.phone, p_fulfilment:f.fulfilment, p_address:f.address || null,
        p_date:f.date, p_time:f.time || null, p_note:f.note || null, p_items:items});
      return {code:res.code, total:res.total_paise/100, hasOnRequest:res.has_on_request};
    }
    const phone = (f.phone || '').replace(/\D/g,'');
    if(!items.length) throw new Error('Your basket is empty');
    if((f.name||'').trim().length < 2) throw new Error('Please add your name');
    if(!/^[0-9]{10,13}$/.test(phone)) throw new Error('Please add a valid phone number');
    if(f.fulfilment === 'delivery' && (f.address||'').trim().length < 8) throw new Error('Please add a delivery address');
    const lines = items.map(l => ({slug:l.slug, name:CATALOGUE[l.slug].name, qty:l.qty, unit_paise: CATALOGUE[l.slug].price == null ? null : CATALOGUE[l.slug].price*100}));
    const o = {code:Demo.code(), status:'received', created_at:new Date().toISOString(), fulfilment:f.fulfilment, wanted_date:f.date, wanted_time:f.time||null,
      items:lines, total_paise:Basket.total()*100, has_on_request:Basket.hasOnRequest(), first_name:f.name.trim().split(/\s+/)[0], phone, name:f.name.trim(),
      address:f.fulfilment === 'delivery' ? f.address.trim() : null, note:f.note || null, message:null, events:[{status:'received', at:new Date().toISOString()}]};
    const all = Demo.all(); all.unshift(o); Demo.put(all.slice(0, 50));
    return {code:o.code, total:o.total_paise/100, hasOnRequest:o.has_on_request};
  },
  async track(code, last4){
    code = (code || '').trim().toUpperCase(); last4 = (last4 || '').replace(/\D/g,'');
    if(LIVE) return await rpc('track_order', {p_code:code, p_last4:last4});
    const all = Demo.all(); const o = all.find(x => x.code === code && x.phone.slice(-4) === last4);
    if(!o) return null;
    Demo.advance(o); Demo.put(all);
    const {phone, name, address, note, ...pub} = o;
    return pub;
  },
  rememberOrder(code, last4){
    const list = store.get('sbw-my-orders', []).filter(o => o.code !== code);
    list.unshift({code, last4, at:Date.now()}); store.set('sbw-my-orders', list.slice(0, 8));
  },
  myOrders(){ return store.get('sbw-my-orders', []); },
  /* ----- staff (admin page) ----- */
  async signIn(email, password){
    const r = await fetch(CFG.supabaseUrl.replace(/\/$/,'') + '/auth/v1/token?grant_type=password', {
      method:'POST', headers:{'apikey':CFG.supabaseAnonKey, 'Content-Type':'application/json'}, body:JSON.stringify({email, password})});
    const d = await r.json().catch(() => ({}));
    if(!r.ok) throw new Error(d.error_description || d.msg || 'Sign-in failed');
    return d;
  },
  async staffOrders(token){
    if(!LIVE) return Demo.all().map(o => Demo.advance(o));
    const base = CFG.supabaseUrl.replace(/\/$/,'') + '/rest/v1/';
    const r = await fetch(base + 'orders?select=*&order=created_at.desc&limit=200', {headers:{'apikey':CFG.supabaseAnonKey, 'Authorization':'Bearer ' + token}});
    if(r.status === 401) throw Object.assign(new Error('Your session expired — sign in again.'), {expired:true});
    if(!r.ok) throw new Error('Could not load orders');
    return (await r.json()).map(o => ({...o, name:o.customer_name, message:o.staff_message}));
  },
  async staffUpdate(token, code, status, message){
    if(!LIVE){
      const all = Demo.all(); const o = all.find(x => x.code === code); if(!o) return;
      Demo.advance(o); o.manual = true;
      if(status && status !== o.status){ o.status = status; o.events.push({status, at:new Date().toISOString()}); }
      if(message !== undefined) o.message = message || null;
      Demo.put(all); return;
    }
    const body = {}; if(status) body.status = status; if(message !== undefined) body.staff_message = message || null;
    const r = await fetch(CFG.supabaseUrl.replace(/\/$/,'') + '/rest/v1/orders?code=eq.' + encodeURIComponent(code), {
      method:'PATCH', headers:{'apikey':CFG.supabaseAnonKey, 'Authorization':'Bearer ' + token, 'Content-Type':'application/json', 'Prefer':'return=minimal'},
      body:JSON.stringify(body)});
    if(r.status === 401) throw Object.assign(new Error('Your session expired — sign in again.'), {expired:true});
    if(!r.ok) throw new Error('Could not update the order');
  }
};

/* ---------------- basket drawer + floating bag ---------------- */
function el(tag, cls, text){ const e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }

function buildDrawer(){
  const fab = el('button', 'bag-fab'); fab.type = 'button'; fab.setAttribute('aria-label', 'Open basket');
  fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span class="bag-count">0</span>';
  const scrim = el('div', 'bag-scrim');
  const d = el('aside', 'bag'); d.setAttribute('aria-label', 'Your basket'); d.setAttribute('aria-hidden', 'true');
  d.innerHTML = `
    <div class="bag-head"><div><span class="script">Your basket</span><small class="bag-sub"></small></div><button type="button" class="bag-x" aria-label="Close basket">×</button></div>
    <ul class="bag-list"></ul>
    <div class="bag-empty"><p>Your basket is empty.</p><a href="menu.html" class="btn btn-outline">Browse the menu</a></div>
    <div class="bag-foot">
      <div class="bag-total"><span>Subtotal</span><b class="bag-sum">₹0</b></div>
      <p class="bag-fine"></p>
      <a href="visit.html#order" class="btn btn-solid bag-go">Checkout →</a>
      <a href="track.html" class="bag-track">Track an order</a>
    </div>`;
  document.body.append(fab, scrim, d);
  const open = () => { d.classList.add('open'); scrim.classList.add('open'); d.setAttribute('aria-hidden','false'); d.querySelector('.bag-x').focus(); };
  const close = () => { d.classList.remove('open'); scrim.classList.remove('open'); d.setAttribute('aria-hidden','true'); };
  fab.addEventListener('click', open); scrim.addEventListener('click', close); d.querySelector('.bag-x').addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
  d.querySelector('.bag-go').addEventListener('click', close);
  window.SBW.openBasket = open;

  const render = () => {
    const items = Basket.items(), n = Basket.count();
    fab.querySelector('.bag-count').textContent = n;
    fab.classList.toggle('has', n > 0);
    d.querySelector('.bag-sub').textContent = n ? `${n} item${n > 1 ? 's' : ''}` : '';
    d.querySelector('.bag-empty').hidden = n > 0;
    d.querySelector('.bag-foot').hidden = n === 0;
    const ul = d.querySelector('.bag-list'); ul.textContent = '';
    items.forEach(l => {
      const m = CATALOGUE[l.slug];
      const li = el('li', 'bag-line');
      const img = el('img'); img.src = `assets/${l.slug}.jpg`; img.alt = ''; img.loading = 'lazy';
      const mid = el('div', 'bag-mid'); mid.append(el('b', '', m.name), el('small', '', [m.note, m.price == null ? 'price on request' : rupees(m.price)].filter(Boolean).join(' · ')));
      const q = el('div', 'qty');
      const minus = el('button', '', '−'); minus.type = 'button'; minus.setAttribute('aria-label', `One fewer ${m.name}`);
      const val = el('span', '', String(l.qty));
      const plus = el('button', '', '+'); plus.type = 'button'; plus.setAttribute('aria-label', `One more ${m.name}`);
      minus.onclick = () => Basket.setQty(l.slug, l.qty - 1); plus.onclick = () => Basket.setQty(l.slug, l.qty + 1);
      q.append(minus, val, plus); mid.append(q);
      const pr = el('span', 'bag-pr', m.price == null ? '—' : rupees(m.price * l.qty));
      li.append(img, mid, pr); ul.append(li);
    });
    d.querySelector('.bag-sum').textContent = rupees(Basket.total());
    d.querySelector('.bag-fine').textContent = Basket.hasOnRequest() ? 'Includes an item priced on request — the café confirms its price.' : 'Pay at pickup or on delivery, or by UPI once the café confirms.';
  };
  listeners.add(render); render();
}

/* "Add" buttons on every menu item that shows a photo of a catalogued bake */
function addButtons(){
  const slugOf = src => { const m = /assets\/([\w-]+)\.jpg/.exec(src || ''); return m && CATALOGUE[m[1]] ? m[1] : null; };
  document.querySelectorAll('.item-card').forEach(card => {
    const slug = slugOf(card.querySelector('img') && card.querySelector('img').getAttribute('src'));
    if(!slug || card.querySelector('.add')) return;
    const b = el('button', 'add', 'Add'); b.type = 'button'; b.dataset.slug = slug; b.setAttribute('aria-label', `Add ${CATALOGUE[slug].name} to basket`);
    card.querySelector('.item-body').append(b);
  });
  document.querySelectorAll('div.mrow[data-img]').forEach(row => {
    const slug = slugOf(row.dataset.img);
    if(!slug || row.querySelector('.add')) return;
    const b = el('button', 'add', '+'); b.type = 'button'; b.dataset.slug = slug; b.setAttribute('aria-label', `Add ${CATALOGUE[slug].name} to basket`);
    row.append(b); row.classList.add('has-add');
  });
  const counts = () => {
    const q = Object.fromEntries(Basket.items().map(l => [l.slug, l.qty]));
    document.querySelectorAll('button.add').forEach(b => { const n = q[b.dataset.slug]; b.classList.toggle('in', !!n); b.dataset.n = n || ''; });
  };
  listeners.add(counts); counts();
}

function toast(msg){
  let t = document.querySelector('.sbw-toast');
  if(!t){ t = el('div', 'sbw-toast'); t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200);
}

document.addEventListener('click', e => {
  const b = e.target.closest('button.add');
  if(b){
    e.preventDefault(); e.stopPropagation();
    Basket.add(b.dataset.slug);
    toast(`${CATALOGUE[b.dataset.slug].name} added to your basket`);
    const fab = document.querySelector('.bag-fab');
    if(fab && window.gsap) gsap.fromTo(fab, {scale:1.25}, {scale:1, duration:.6, ease:'elastic.out(1,.4)'});
    return;
  }
  /* the candle wish's "Order this wish" puts that bake in the basket */
  const w = e.target.closest('#wishCard .btn-solid');
  if(w){
    const slug = (/assets\/([\w-]+)\.jpg/.exec(document.getElementById('wcImg').getAttribute('src')) || [])[1];
    if(slug && CATALOGUE[slug]){ e.preventDefault(); Basket.add(slug); window.SBW.openBasket && window.SBW.openBasket(); }
  }
});

window.SBW = {Basket, API, CATALOGUE, rupees, onChange: f => { listeners.add(f); }, toast};
const boot = () => { buildDrawer(); addButtons(); };
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
