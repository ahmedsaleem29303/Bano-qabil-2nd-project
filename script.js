// ---- Night sky: slider runs from 19:30 to 05:30 ----
const root = document.documentElement;
const slider = document.getElementById('time');
const clock = document.getElementById('clock');
const cap = document.getElementById('cap');
const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const stops = [ // [t, top, bottom]
  [0,    [47,74,124],  [242,166,90]],
  [0.2,  [29,44,90],   [123,90,138]],
  [0.4,  [11,18,48],   [26,37,80]],
  [0.7,  [7,11,31],    [20,28,68]],
  [0.9,  [26,37,80],   [90,111,160]],
  [1,    [53,80,138],  [240,178,122]]
];
const captions = [
  [0.00, 'Sunset. The last light leaves the ridge and the lanterns come on.'],
  [0.18, 'Twilight. The brightest planets show first.'],
  [0.38, 'Full dark. Your eyes need about twenty minutes to catch up.'],
  [0.60, 'Past midnight. The Milky Way stands straight overhead.'],
  [0.86, 'Pre-dawn. The stars thin out as the east turns pale blue.'],
  [0.95, 'First light. Coffee on the deck, the woodstove still warm.']
];
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const rgb = c => `rgb(${c.join(',')})`;

function palette(t) {
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, a0, b0] = stops[i], [t1, a1, b1] = stops[i + 1];
    if (t <= t1) { const k = (t - t0) / (t1 - t0); return [mix(a0, a1, k), mix(b0, b1, k)]; }
  }
  return [stops.at(-1)[1], stops.at(-1)[2]];
}
const starAlpha = t => t < 0.4 ? t / 0.4 : t < 0.85 ? 1 : Math.max(0, (1 - t) / 0.15);

let stars = [], t = 0;
function seed() {
  const r = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  canvas.width = r.width * dpr; canvas.height = r.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.round(r.width * r.height / 4500);
  stars = Array.from({ length: n }, () => ({
    x: Math.random() * r.width, y: Math.random() * r.height * 0.8,
    r: Math.random() * 1.3 + 0.3, p: Math.random() * 6.28, s: Math.random() * 2 + 0.5
  }));
  draw(performance.now());
}
function draw(now) {
  const r = canvas.getBoundingClientRect(), a = starAlpha(t);
  ctx.clearRect(0, 0, r.width, r.height);
  for (const s of stars) {
    const tw = reduce ? 1 : 0.65 + 0.35 * Math.sin(now / 1000 * s.s + s.p);
    ctx.globalAlpha = a * tw;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
  }
}
function loop(now) { draw(now); requestAnimationFrame(loop); }

function update() {
  const m = Number(slider.value);
  t = m / 600;
  const total = 19 * 60 + 30 + m, h = Math.floor(total / 60) % 24, mm = total % 60;
  clock.textContent = String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  const [top, bot] = palette(t);
  root.style.setProperty('--sky-top', rgb(top));
  root.style.setProperty('--sky-bot', rgb(bot));
  root.style.setProperty('--glow', Math.min(1, starAlpha(t) * 1.4 + (t > 0.9 ? 0.3 : 0)).toFixed(2));
  cap.textContent = captions.filter(c => t >= c[0]).at(-1)[1];
  if (reduce) draw(0);
}
slider.addEventListener('input', update);
addEventListener('resize', seed);
update(); seed();
if (!reduce) requestAnimationFrame(loop);

// ---- Booking form ----
const form = document.getElementById('form');
const cabin = document.getElementById('cabin');
const inD = document.getElementById('in'), outD = document.getElementById('outd');
const guests = document.getElementById('guests');
const total = document.getElementById('total'), msg = document.getElementById('msg');
const iso = d => d.toISOString().slice(0, 10);
inD.min = outD.min = iso(new Date());

function quote() {
  const o = cabin.selectedOptions[0], rate = +o.dataset.rate, cap = +o.dataset.cap;
  guests.max = cap;
  const nights = Math.round((new Date(outD.value) - new Date(inD.value)) / 864e5);
  const problems = [];
  if (!inD.value || !outD.value) problems.push('Choose your check in and check out dates.');
  else if (nights < 1) problems.push('Check out must be after check in.');
  if (!(+guests.value >= 1) || +guests.value > cap) problems.push(`${o.value} sleeps up to ${cap} guests.`);
  guests.setAttribute('aria-invalid', +guests.value > cap || +guests.value < 1);
  if (problems.length) { total.textContent = problems[0]; return null; }
  const sum = nights * rate + 40;
  total.textContent = `${nights} night${nights > 1 ? 's' : ''} in ${o.value}: $${sum} (includes a $40 cleaning fee).`;
  return { nights, sum };
}
[cabin, inD, outD, guests].forEach(el => el.addEventListener('input', () => { msg.textContent = ''; quote(); }));
form.addEventListener('submit', e => {
  e.preventDefault();
  const q = quote();
  msg.classList.toggle('err', !q);
  msg.textContent = q ? `Request sent for ${cabin.value}. We will reply within one day.` : 'Fix the details above, then send again.';
});
