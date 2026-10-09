/* Teknik Yapı Market — interactions */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

$('#yr').textContent = new Date().getFullYear();

/* ── Opening hours (Europe/Istanbul) ─────────────────────────
   Pazartesi–Cumartesi 07:00–20:00, Pazar kapalı.
   Change here if the hours change. 0 = Pazar … 6 = Cumartesi */
const HOURS = { 0: null, 1: [7, 20], 2: [7, 20], 3: [7, 20], 4: [7, 20], 5: [7, 20], 6: [7, 20] };

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
  actionbar.classList.toggle('is-shown', y > innerHeight * 0.6);
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
['top', 'urunler', 'demir', 'nasil', 'subeler', 'teklif'].forEach((id) => spy.observe(document.getElementById(id)));

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
  ['.steel__photo', 'reveal-x'], ['.step', 'reveal'], ['.branch', 'reveal'], ['.branch-detail', 'reveal'],
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
    ['tel:+902523736169', '0252 373 61 69', 'phone'],
    ['tel:+905384410589', '0538 441 05 89', 'phone'],
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
mapFrame.addEventListener('load', () => mapFrame.parentElement.classList.remove('is-loading'));

/* ── Product shortcuts → pre-select in the quote form ── */
const form = $('#qform');
const hint = $('#qhint');
$$('[data-groups]').forEach((el) => {
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
form.addEventListener('submit', (e) => {
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
