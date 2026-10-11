/* Teknik Yapı Market — interactions */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const yr = $('#yr');
if (yr) yr.textContent = new Date().getFullYear();

/* ── Opening hours (Europe/Istanbul) ─────────────────────────
   Hafta içi 09:00–18:00, Cumartesi 09:00–17:00, Pazar kapalı.
   Change here if the hours change. 0 = Pazar … 6 = Cumartesi */
const HOURS = { 0: null, 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [9, 17] };

function istanbulNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Istanbul', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, h: Number(get('hour')) % 24, m: Number(get('minute')) };
}

function updateStatus() {
  const el = $('#status');
  if (!el) return;
  const { day, h, m } = istanbulNow();
  const today = HOURS[day];
  const now = h + m / 60;
  const label = el.querySelector('b');
  el.classList.remove('is-open', 'is-closed');
  if (today && now >= today[0] && now < today[1]) {
    el.classList.add('is-open');
    label.textContent = `Şu an açık · ${String(today[1]).padStart(2, '0')}:00'a kadar`;
  } else {
    el.classList.add('is-closed');
    let d = day, tries = 0, next;
    if (today && now < today[0]) next = { day, open: today[0] };
    while (!next && tries < 7) { d = (d + 1) % 7; tries++; if (HOURS[d]) next = { day: d, open: HOURS[d][0] }; }
    const names = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const when = next.day === day ? 'bugün' : (next.day === (day + 1) % 7 ? 'yarın' : names[next.day]);
    label.textContent = `Şu an kapalı · ${when} ${String(next.open).padStart(2, '0')}:00'da açılır`;
  }
}
updateStatus();
setInterval(updateStatus, 60_000);

/* ── Nav, progress bar, action bar, active section ── */
const nav = $('#nav');
const bar = $('#progress');
const actionbar = $('.actionbar');
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 24 || !$('#mobile-menu').hidden);
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  if (actionbar) actionbar.classList.toggle('is-shown', y > innerHeight * 0.6);
  parallax();
  ticking = false;
}
document.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });

const navLinks = $$('.nav__links a');
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${e.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
['top', 'urunler', 'demir', 'nasil', 'magaza', 'subeler', 'teklif'].forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

/* ── Mobile menu ── */
const toggle = $('.nav__toggle');
const menu = $('#mobile-menu');
function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  menu.hidden = !open;
  onScroll();
}
toggle.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', (e) => { if (e.target.tagName === 'A') setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

/* ── Reveal on scroll (staggered per group) ── */
const groups = [
  ['.sec-head', 'reveal'], ['.card', 'reveal'], ['.steel__head', 'reveal'], ['.spec__row', 'reveal'],
  ['.steel__photo', 'reveal-x'], ['.step', 'reveal'], ['.how__banner', 'reveal'], ['.g-item', 'reveal'], ['.branch', 'reveal'], ['.branch-detail', 'reveal'],
  ['.faq__head', 'reveal'], ['.faq__item', 'reveal'],
  ['.quote__copy', 'reveal'], ['.qform', 'reveal'],
];
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
groups.forEach(([sel, cls]) => {
  $$(sel).forEach((el, i) => {
    el.classList.add(cls);
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    io.observe(el);
  });
});

/* ── Parallax on the job-site photo ── */
const plx = $('[data-parallax]');
function parallax() {
  if (!plx || reduceMotion) return;
  const r = plx.parentElement.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1..1
  plx.style.transform = `translateY(${(-8 + p * 8).toFixed(2)}%)`;
}
onScroll();

/* ── Branch tabs → map + actions ── */
const BRANCH_ACTIONS = {
  Mumcular: [
    ['tel:+905384410589', '0538 441 05 89', 'phone'],
    ['tel:+902523736169', '0252 373 61 69', 'phone'],
    ['https://www.google.com/maps/dir/?api=1&destination=37.110053,27.6587734', 'Yol tarifi', 'pin'],
  ],
  Gümbet: [
    ['tel:+902523193335', '0252 319 33 35', 'phone'],
    ['https://www.google.com/maps/dir/?api=1&destination=Teknik+Yapi+Market+Sald%C4%B1r+%C5%9Eeyh+Caddesi+3%2F1+G%C3%BCmbet+Bodrum', 'Yol tarifi', 'pin'],
  ],
  Ortakent: [
    ['tel:+905384410587', '0538 441 05 87', 'phone'],
    ['https://wa.me/905384410587', 'WhatsApp', 'wa'],
    ['https://www.google.com/maps/dir/?api=1&destination=37.0598653,27.340435', 'Yol tarifi', 'pin'],
  ],
};
const mapFrame = $('#map');
const actions = $('#branch-actions');
$$('.branch').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.branch').forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
    const name = btn.querySelector('.branch__name').textContent.trim();
    if (mapFrame.src !== btn.dataset.map) {
      mapFrame.parentElement.classList.add('is-loading');
      mapFrame.src = btn.dataset.map;
    }
    actions.innerHTML = BRANCH_ACTIONS[name].map(([href, label, icon]) => {
      const ext = href.startsWith('http') ? ' target="_blank" rel="noopener"' : '';
      const cls = icon === 'pin' ? 'btn--gold' : 'btn--dark';
      const ico = icon === 'phone' ? 'i-phone' : icon === 'wa' ? 'i-wa' : 'i-pin';
      return `<a class="btn ${cls}" href="${href}"${ext}><svg class="ico" aria-hidden="true"><use href="#${ico}" /></svg>${label}</a>`;
    }).join('');
  });
});
if (mapFrame) mapFrame.addEventListener('load', () => mapFrame.parentElement.classList.remove('is-loading'));

/* Hero branch cards → open that branch on the map below */
$$('[data-branch]').forEach((link) => {
  link.addEventListener('click', () => {
    const tab = $$('.branch').find((b) => b.querySelector('.branch__name').textContent.trim() === link.dataset.branch);
    if (tab) tab.click();
  });
});

/* ── Product shortcuts → pre-select in the quote form ── */
const form = $('#qform');
const hint = $('#qhint');
if (form) $$('[data-groups]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const want = el.dataset.groups.split('|');
    $$('input[name="g"]', form).forEach((cb) => { cb.checked = want.includes(cb.value); });
    form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    form.classList.remove('is-flash'); void form.offsetWidth; form.classList.add('is-flash');
    hint.textContent = `${want.join(', ')} seçildi. Miktarı yazıp gönderin.`;
    setTimeout(() => form.detail.focus({ preventScroll: true }), 650);
  });
});

/* ── Quote form → WhatsApp message to the Ortakent wholesale line ── */
const WA_NUMBER = '905384410587';
if (form) form.addEventListener('submit', (e) => {
  e.preventDefault();
  const groupsSel = $$('input[name="g"]:checked', form).map((i) => i.value);
  const detail = form.detail.value.trim();
  const name = form.name.value.trim();
  const loc = form.loc.value.trim();
  if (!groupsSel.length && !detail) {
    hint.textContent = 'Lütfen en az bir ürün grubu seçin ya da ihtiyacınızı yazın.';
    return;
  }
  const lines = ['Merhaba, Teknik Yapı Market web sitesinden teklif istiyorum.'];
  if (groupsSel.length) lines.push(`Ürün grubu: ${groupsSel.join(', ')}`);
  if (detail) lines.push(`Ürünler / miktar: ${detail}`);
  if (loc) lines.push(`Şantiye konumu: ${loc}`);
  if (name) lines.push(`Ad / firma: ${name}`);
  hint.textContent = 'WhatsApp açılıyor…';
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
});

/* ── Live FX ticker (TRY per 1 USD/EUR/GBP) ──
   Live: Coinbase spot (CORS-open, ~1 min fresh), open.er-api.com (daily) as fallback.
   Daily change + 30-day sparkline: ECB closes via api.frankfurter.dev. */
const ticker = $('.ticker');
if (ticker) {
  const CODES = ['USD', 'EUR', 'GBP'];
  const rows = Object.fromEntries(CODES.map((c) => [c, $(`.tk[data-c="${c}"]`, ticker)]));
  const fmt = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' });
  const clock = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date()); // YYYY-MM-DD
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* storage blocked */ } },
  };
  let live = store.get('tym-fx-live');
  let hist = store.get('tym-fx-hist');
  if (!hist || hist.day !== today) hist = null;

  const fromCoinbase = async () => {
    const r = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=TRY', { cache: 'no-store' });
    const { data } = await r.json();
    return Object.fromEntries(CODES.map((c) => [c, 1 / Number(data.rates[c])]));
  };
  const fromErApi = async () => {
    const r = await fetch('https://open.er-api.com/v6/latest/TRY');
    const { rates } = await r.json();
    return Object.fromEntries(CODES.map((c) => [c, 1 / Number(rates[c])]));
  };
  const valid = (o) => o && CODES.every((c) => Number.isFinite(o[c]) && o[c] > 0);

  async function loadHistory() {
    if (hist) return;
    const start = new Date(Date.now() - 45 * 864e5).toISOString().slice(0, 10);
    try {
      const series = await Promise.all(CODES.map(async (c) => {
        const r = await fetch(`https://api.frankfurter.dev/v1/${start}..?base=${c}&symbols=TRY`);
        const { rates } = await r.json();
        return Object.entries(rates).sort(([a], [b]) => (a < b ? -1 : 1)).map(([d, v]) => [d, v.TRY]);
      }));
      hist = { day: today, closes: Object.fromEntries(CODES.map((c, i) => [c, series[i]])) };
      store.set('tym-fx-hist', hist);
    } catch (_) { hist = null; }
  }

  function spark(el, values) {
    const pl = $('polyline', el);
    if (values.length < 2) { pl.setAttribute('points', ''); return; }
    const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
    pl.setAttribute('points', values.map((v, i) => `${((i / (values.length - 1)) * 64).toFixed(1)},${(20 - ((v - min) / span) * 18).toFixed(1)}`).join(' '));
  }

  function paint(rates, prev) {
    CODES.forEach((c) => {
      const row = rows[c], v = rates[c];
      if (!row || !Number.isFinite(v)) return;
      const vEl = $('.tk__v', row);
      vEl.textContent = fmt.format(v);
      if (prev && Number.isFinite(prev[c]) && Math.abs(v - prev[c]) >= 0.005) {
        const cls = v > prev[c] ? 'flash-up' : 'flash-down';
        vEl.classList.add(cls);
        setTimeout(() => vEl.classList.remove(cls), 900);
      }
      // daily change vs. the last close before today
      const closes = hist && hist.closes[c] ? hist.closes[c].filter(([d]) => d < today) : [];
      const base = closes.length ? closes[closes.length - 1][1] : null;
      row.classList.remove('is-up', 'is-down');
      const ch = $('.tk__ch', row);
      if (base) {
        const change = ((v - base) / base) * 100;
        if (Math.abs(change) >= 0.01) row.classList.add(change > 0 ? 'is-up' : 'is-down');
        ch.textContent = `${change > 0 ? '▲' : change < 0 ? '▼' : '■'} %${pct.format(Math.abs(change) < 0.005 ? 0 : change).replace(/^[+-]/, '')}`;
        ch.setAttribute('aria-label', `Günlük değişim yüzde ${pct.format(change)}`);
      } else {
        ch.textContent = '';
      }
      spark($('.tk__spark', row), [...closes.slice(-30).map(([, x]) => x), v]);
    });
  }

  async function loadLive() {
    let rates = null;
    for (const src of [fromCoinbase, fromErApi]) {
      try { rates = await src(); if (valid(rates)) break; rates = null; } catch (_) { rates = null; }
    }
    if (!rates) return;
    const prev = live && live.rates;
    live = { rates, at: Date.now() };
    store.set('tym-fx-live', live);
    paint(rates, prev);
    ticker.classList.add('is-live');
    $('#fx-time', ticker).textContent = clock.format(new Date(live.at));
  }

  if (live && valid(live.rates)) paint(live.rates, null);
  loadHistory().then(() => { if (live && valid(live.rates)) paint(live.rates, null); });
  loadLive();
  setInterval(() => { if (!document.hidden) loadLive(); }, 60_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loadLive(); });
}

/* ── Gallery: filters + lightbox ── */
const grid = $('#g-grid');
if (grid) {
  const items = $$('.g-item', grid);
  const filters = $$('.g-filter');
  // Masonry on a CSS grid: each tile spans enough 8px rows for its aspect ratio, so order stays row-by-row.
  function layout() {
    const first = items.find((it) => !it.hidden);
    if (!first) return;
    const cs = getComputedStyle(grid);
    const rowH = parseFloat(cs.gridAutoRows) || 8;
    const gap = parseFloat(cs.getPropertyValue('--g-gap')) || 14;
    const colW = first.getBoundingClientRect().width;
    items.forEach((it) => {
      if (it.hidden) return;
      const img = $('img', it);
      const ratio = Number(img.getAttribute('height')) / Number(img.getAttribute('width')) || 1;
      it.style.setProperty('--span', Math.ceil((colW * ratio + gap) / rowH));
    });
  }
  layout();
  let raf = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); });
  filters.forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filters.forEach((b) => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
    items.forEach((it) => {
      const show = f === 'all' || it.dataset.cat.split(' ').includes(f);
      if (show && it.hidden) { it.classList.remove('is-entering'); void it.offsetWidth; it.classList.add('is-entering'); }
      it.hidden = !show;
    });
    layout();
  }));

  const lb = $('#lb');
  const lbImg = $('#lb-img');
  let list = [], idx = 0;
  const visibleLinks = () => items.filter((it) => !it.hidden).map((it) => $('.g-link', it));
  function show(i) {
    idx = (i + list.length) % list.length;
    const a = list[idx];
    lbImg.src = a.getAttribute('href');
    lbImg.alt = $('img', a).alt;
    lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
    $('#lb-title').textContent = a.dataset.title;
    $('#lb-tag').textContent = a.dataset.tag;
    $('#lb-count').textContent = `${String(idx + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    [idx + 1, idx - 1].forEach((n) => { const p = list[(n + list.length) % list.length]; if (p) new Image().src = p.getAttribute('href'); });
  }
  if (lb && typeof lb.showModal === 'function') {
    grid.addEventListener('click', (e) => {
      const a = e.target.closest('.g-link');
      if (!a) return;
      e.preventDefault();
      list = visibleLinks();
      show(list.indexOf(a));
      lb.showModal();
    });
    lb.addEventListener('click', (e) => {
      const act = e.target.closest('[data-lb]');
      if (act) { const k = act.dataset.lb; if (k === 'close') lb.close(); else show(idx + (k === 'next' ? 1 : -1)); return; }
      if (e.target === lb || e.target.classList.contains('lb__fig')) lb.close();
    });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowLeft') show(idx - 1);
    });
    let x0 = null;
    lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
    lb.addEventListener('close', () => { lbImg.removeAttribute('src'); });
  }
}
