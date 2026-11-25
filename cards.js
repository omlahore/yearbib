import { EVEREST_M, EARTH_KM } from "./stats.js";

export const C = { track: "#3D2A7A", trackDeep: "#2A1C58", lane: "#B9A8F0", bib: "#FFFFFF", ink: "#121018", soft: "#6B6480", tape: "#FFD23F" };
export const F = { display: "Big Shoulders Display", body: "Familjen Grotesk", mono: "Martian Mono" };
const W = 1080, H = 1920;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

export async function loadFonts() {
  await Promise.all([`900 100px "${F.display}"`, `700 100px "${F.display}"`, `400 40px "${F.body}"`, `600 40px "${F.body}"`, `400 30px "${F.mono}"`, `600 30px "${F.mono}"`].map(f => document.fonts.load(f)));
}

export function units(mi) {
  const k = mi ? 1609.344 : 1000;
  return {
    mi, name: mi ? "miles" : "kilometres", short: mi ? "mi" : "km",
    d: m => { const v = m / k; return v >= 100 ? Math.round(v).toLocaleString("en") : v.toFixed(1); },
    e: m => mi ? Math.round(m * 3.28084).toLocaleString("en") + " ft" : Math.round(m).toLocaleString("en") + " m",
  };
}
const hrs = s => s >= 36000 ? Math.round(s / 3600).toLocaleString("en") : (s / 3600).toFixed(1);

function font(ctx, w, size, fam) { ctx.font = `${w} ${size}px "${fam}"`; }
function fit(ctx, text, w, max, fam, maxW) {
  let s = max; font(ctx, w, s, fam);
  while (ctx.measureText(text).width > maxW && s > 10) { s -= 4; font(ctx, w, s, fam); }
  return s;
}
function txt(ctx, s, x, y, { w = 400, size = 40, fam = F.body, color = C.ink, align = "left", track = 0 } = {}) {
  font(ctx, w, size, fam); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
  if ("letterSpacing" in ctx) ctx.letterSpacing = track + "px";
  ctx.fillText(s, x, y);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

function ground(ctx, year, brand) {
  ctx.fillStyle = C.track; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.strokeStyle = C.lane; ctx.globalAlpha = .18; ctx.lineWidth = 4;
  for (let i = -6; i < 14; i++) { ctx.beginPath(); ctx.moveTo(i * 150, H); ctx.lineTo(i * 150 + 700, 0); ctx.stroke(); }
  ctx.restore();
  txt(ctx, brand, 72, H - 64, { fam: F.mono, size: 26, color: C.lane, w: 600, track: 2 });
  txt(ctx, String(year), W - 72, H - 64, { fam: F.mono, size: 26, color: C.lane, w: 600, align: "right", track: 2 });
}

// The signature object: a race bib with safety-pin holes and a tear-off strip.
function bib(ctx, x, y, w, h) {
  ctx.save(); ctx.shadowColor = "rgba(10,5,30,.45)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  rr(ctx, x, y, w, h, 22); ctx.fillStyle = C.bib; ctx.fill(); ctx.restore();
}
function pins(ctx, x, y, w, h) {
  for (const [px, py] of [[x + 42, y + 42], [x + w - 42, y + 42], [x + 42, y + h - 42], [x + w - 42, y + h - 42]]) {
    ctx.beginPath(); ctx.arc(px, py, 13, 0, 7); ctx.fillStyle = C.track; ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, 19, 0, 7); ctx.strokeStyle = "#D9D4E6"; ctx.lineWidth = 3; ctx.stroke();
  }
}
function perf(ctx, x1, x2, y) {
  ctx.save(); ctx.setLineDash([10, 12]); ctx.strokeStyle = "#C9C3D8"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); ctx.restore();
}
function header(ctx, kicker, title) {
  txt(ctx, kicker, 72, 170, { fam: F.mono, size: 28, color: C.lane, w: 600, track: 3 });
  const s = fit(ctx, title, 900, 150, F.display, W - 144);
  txt(ctx, title, 72, 170 + s * 0.95 + 20, { fam: F.display, w: 900, size: s, color: "#fff" });
}

export function renderCard(kind, s, opt) {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d"), u = opt.u, brand = opt.brand;
  ground(ctx, s.year, brand);
  CARDS[kind](ctx, s, u, opt);
  return cv;
}

export function cardKinds(s, routes) {
  const k = ["bib", "slip", "sports", "months", "habits"];
  if (s.longest && s.longest.dist > 0) k.push("bigdays");
  if (routes && routes.size >= 4) k.push("routes");
  return k;
}

const CARDS = {
  bib(ctx, s, u, o) {
    const x = 90, y = 420, w = W - 180, h = 1020;
    bib(ctx, x, y, w, h);
    rr(ctx, x, y, w, 150, [22, 22, 0, 0]); ctx.fillStyle = C.ink; ctx.fill();
    pins(ctx, x, y, w, h);
    txt(ctx, "THE YEAR", x + 90, y + 98, { fam: F.display, w: 700, size: 64, color: "#fff", track: 4 });
    txt(ctx, String(s.year), x + w - 90, y + 98, { fam: F.display, w: 700, size: 64, color: C.tape, align: "right", track: 4 });
    const n = u.d(s.dist);
    const sz = fit(ctx, n, 900, 460, F.display, w - 160);
    txt(ctx, n, x + w / 2, y + 230 + sz * 0.82, { fam: F.display, w: 900, size: sz, align: "center" });
    txt(ctx, u.name.toUpperCase(), x + w / 2, y + 300 + sz * 0.82, { fam: F.mono, size: 34, w: 600, color: C.soft, align: "center", track: 8 });
    const who = o.name ? `${o.name.toUpperCase()}` : "ATHLETE";
    txt(ctx, who, x + w / 2, y + 395 + sz * 0.82, { fam: F.display, size: 72, w: 700, align: "center", track: 2 });
    perf(ctx, x + 30, x + w - 30, y + h - 260);
    const cols = [[String(s.count), "ACTIVITIES"], [hrs(s.moving), "HOURS"], [String(s.activeDays), "ACTIVE DAYS"]];
    cols.forEach(([v, l], i) => {
      const cx = x + w / 6 + i * w / 3;
      txt(ctx, v, cx, y + h - 130, { fam: F.display, w: 900, size: 92, align: "center" });
      txt(ctx, l, cx, y + h - 78, { fam: F.mono, size: 22, w: 600, color: C.soft, align: "center", track: 3 });
    });
  },

  slip(ctx, s, u) {
    header(ctx, "RESULTS", "The full year.");
    const x = 120, y = 470, w = W - 240;
    const rows = [
      ["Distance", `${u.d(s.dist)} ${u.short}`],
      ["Moving time", `${hrs(s.moving)} h`],
      ["Climbing", u.e(s.elev)],
      ["Activities", String(s.count)],
      ["Active days", `${s.activeDays} of ${daysIn(s.year)}`],
      ["Longest streak", `${s.streak} day${s.streak === 1 ? "" : "s"}`],
    ];
    const h = 220 + rows.length * 120;
    ctx.save(); ctx.shadowColor = "rgba(10,5,30,.45)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
    ctx.fillStyle = C.bib; ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h);
    for (let i = 0; i <= 24; i++) ctx.lineTo(x + w - i * w / 24, y + h - (i % 2 ? 18 : 0));
    ctx.closePath(); ctx.fill(); ctx.restore();
    txt(ctx, "OFFICIAL TIMING", x + w / 2, y + 90, { fam: F.mono, size: 26, w: 600, color: C.soft, align: "center", track: 6 });
    perf(ctx, x + 40, x + w - 40, y + 140);
    rows.forEach(([l, v], i) => {
      const ry = y + 240 + i * 120;
      txt(ctx, l, x + 60, ry, { fam: F.mono, size: 30, color: C.soft });
      txt(ctx, v, x + w - 60, ry, { fam: F.display, w: 900, size: 72, align: "right" });
    });
    const ev = s.elev / EVEREST_M, earth = s.dist / 1000 / EARTH_KM;
    const line = ev >= 1 ? `That climbing is ${ev.toFixed(1)} times up Everest.` : earth >= 0.05 ? `That distance is ${Math.round(earth * 100)}% of the way around the Earth.` : "";
    if (line) txt(ctx, line, 72, y + h + 130, { fam: F.body, size: 44, w: 600, color: "#fff" });
  },

  sports(ctx, s, u) {
    header(ctx, "BY SPORT", "Where the hours went.");
    const list = s.sports.slice(0, 5), max = list[0]?.moving || 1;
    const y0 = 560, lh = 230;
    list.forEach((sp, i) => {
      const y = y0 + i * lh;
      txt(ctx, sp.name.toUpperCase(), 72, y, { fam: F.display, w: 900, size: 96, color: "#fff" });
      const meta = `${sp.count} × · ${hrs(sp.moving)} h${sp.dist > 0 ? ` · ${u.d(sp.dist)} ${u.short}` : ""}`;
      txt(ctx, meta, W - 72, y, { fam: F.mono, size: 28, color: C.lane, align: "right" });
      const bw = Math.max(24, (W - 144) * sp.moving / max);
      rr(ctx, 72, y + 34, bw, 46, 23); ctx.fillStyle = i === 0 ? C.tape : C.lane; ctx.fill();
    });
  },

  months(ctx, s) {
    header(ctx, "BY MONTH", `${MON[s.bestMonth.m]} was the big one.`);
    const max = Math.max(...s.months.map(m => m.moving), 1);
    const x0 = 72, bw = 62, gap = (W - 144 - bw * 12) / 11, base = 1560, top = 620;
    s.months.forEach((m, i) => {
      const x = x0 + i * (bw + gap), h = Math.max(6, (base - top) * m.moving / max);
      rr(ctx, x, base - h, bw, h, 12); ctx.fillStyle = m.m === s.bestMonth.m ? C.tape : C.lane; ctx.fill();
      txt(ctx, MON[i][0], x + bw / 2, base + 56, { fam: F.mono, size: 30, w: 600, color: "#fff", align: "center" });
    });
    txt(ctx, `${hrs(s.bestMonth.moving)} hours in ${MON[s.bestMonth.m]}, across ${s.bestMonth.count} activities.`, 72, base + 160, { fam: F.body, size: 40, w: 600, color: "#fff" });
  },

  habits(ctx, s) {
    header(ctx, "HABITS", "You kept showing up.");
    const x = 90, y = 520, w = W - 180, h = 560;
    bib(ctx, x, y, w, h); pins(ctx, x, y, w, h);
    txt(ctx, String(s.streak), x + w / 2, y + 330, { fam: F.display, w: 900, size: 300, align: "center" });
    txt(ctx, "DAYS IN A ROW, YOUR LONGEST STREAK", x + w / 2, y + 420, { fam: F.mono, size: 26, w: 600, color: C.soft, align: "center", track: 3 });
    if (s.streakEnd) {
      const d = new Date(s.streakEnd + "T00:00:00Z");
      txt(ctx, `It ended on ${MON[d.getUTCMonth()]} ${d.getUTCDate()}.`, x + w / 2, y + 480, { fam: F.body, size: 34, color: C.soft, align: "center" });
    }
    txt(ctx, "Favourite day to go", 72, y + h + 160, { fam: F.mono, size: 28, color: C.lane, track: 2 });
    txt(ctx, DAYS[s.favDay], 72, y + h + 290, { fam: F.display, w: 900, size: 130, color: "#fff" });
    txt(ctx, `${s.weekdays[s.favDay]} activities on ${DAYS[s.favDay]} this year.`, 72, y + h + 370, { fam: F.body, size: 38, color: "#fff" });
  },

  bigdays(ctx, s, u) {
    header(ctx, "BIG DAYS", "The ones you remember.");
    const items = [];
    if (s.longest?.dist > 0) items.push(["LONGEST", s.longest, `${u.d(s.longest.dist)} ${u.short}`]);
    if (s.biggestClimb?.elev > 0 && s.biggestClimb !== s.longest) items.push(["MOST CLIMBING", s.biggestClimb, u.e(s.biggestClimb.elev)]);
    if (s.longestTime && !items.some(i => i[1] === s.longestTime)) items.push(["LONGEST TIME OUT", s.longestTime, `${hrs(s.longestTime.moving)} h`]);
    items.slice(0, 3).forEach(([k, a, v], i) => {
      const y = 520 + i * 400, x = 90, w = W - 180;
      bib(ctx, x, y, w, 340); pins(ctx, x, y, w, 340);
      txt(ctx, k, x + 80, y + 100, { fam: F.mono, size: 24, w: 600, color: C.soft, track: 4 });
      const sz = fit(ctx, v, 900, 130, F.display, w - 160);
      txt(ctx, v, x + 80, y + 100 + sz * 0.95, { fam: F.display, w: 900, size: sz });
      const d = a.date, nm = (a.name || a.type).slice(0, 40);
      txt(ctx, `${nm}, ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`, x + 80, y + 290, { fam: F.body, size: 34, color: C.soft });
    });
  },

  routes(ctx, s, u, o) {
    header(ctx, "EVERY ROUTE", `${o.routes.size} routes drawn.`);
    const list = s.acts.filter(a => o.routes.has(a.id)).sort((a, b) => b.dist - a.dist).slice(0, 120);
    const n = list.length, cols = Math.ceil(Math.sqrt(n * (W - 144) / 1150)), rows = Math.ceil(n / cols);
    const cw = (W - 144) / cols, ch = Math.min(cw, 1150 / rows), y0 = 520;
    ctx.strokeStyle = "#fff"; ctx.lineJoin = ctx.lineCap = "round";
    list.forEach((a, i) => {
      const p = o.routes.get(a.id), cx = 72 + (i % cols) * cw, cy = y0 + Math.floor(i / cols) * ch;
      const k = Math.cos(p[0][0] * Math.PI / 180);
      let x1 = 1e9, x2 = -1e9, y1 = 1e9, y2 = -1e9;
      for (const [la, lo] of p) { const x = lo * k; x1 = Math.min(x1, x); x2 = Math.max(x2, x); y1 = Math.min(y1, la); y2 = Math.max(y2, la); }
      const sc = Math.min((cw - 18) / (x2 - x1 || 1e-9), (ch - 18) / (y2 - y1 || 1e-9));
      const ox = cx + (cw - (x2 - x1) * sc) / 2, oy = cy + (ch - (y2 - y1) * sc) / 2;
      ctx.lineWidth = Math.max(2.5, cw / 38); ctx.strokeStyle = i === 0 ? C.tape : "#fff";
      ctx.beginPath();
      p.forEach(([la, lo], j) => { const X = ox + (lo * k - x1) * sc, Y = oy + (y2 - la) * sc; j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.stroke();
    });
    txt(ctx, `Yellow is the longest: ${list[0].name}, ${u.d(list[0].dist)} ${u.short}.`, 72, 1720, { fam: F.body, size: 36, w: 600, color: "#fff" });
  },
};

const daysIn = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
