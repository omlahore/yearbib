import { EVEREST_M } from "./stats.js";

export const THEMES = [
  { name: "Olive and moss", ground: "#282C20", accent: "#B2C73A" },
  { name: "Night and volt", ground: "#121418", accent: "#D2FF00" },
  { name: "Ocean and ice", ground: "#14253A", accent: "#7FD4FF" },
  { name: "Plum and lilac", ground: "#2A1F33", accent: "#E3A8FF" },
];
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = n => Math.round(n).toLocaleString("en");
const hm = s => `${Math.floor(s / 3600)} h ${String(Math.round(s % 3600 / 60)).padStart(2, "0")} m`;
const hrs = s => s >= 36000 ? fmt(s / 3600) : (s / 3600).toFixed(1).replace(/\.0$/, "");
const dayName = d => `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;

export function units(mi) {
  const k = mi ? 1609.344 : 1000;
  return {
    short: mi ? "mi" : "km", long: mi ? "Miles" : "Kilometres",
    d: (m, dp) => { const v = m / k; return dp != null ? v.toLocaleString("en", { minimumFractionDigits: dp, maximumFractionDigits: dp }) : v >= 100 ? fmt(v) : v.toFixed(1); },
    e: m => mi ? `${fmt(m * 3.28084)} ft` : `${fmt(m)} m`,
    k,
  };
}

function frame(o, n, kicker, l1, l2, body) {
  return `<div class="yb-card${o.contours ? " topo" : ""}" style="--ground:${o.theme.ground};--accent:${o.theme.accent}">
<div class="yb-top"><span class="yb-wm"><i></i>yearbib<i></i></span><span class="yb-cap">${esc(o.name)} · Season ${o.year}</span></div>
<p class="yb-kick">${kicker}</p>
<h1 class="yb-h"><span>${l1}</span><span class="w">${l2}</span></h1>
${body}
<div class="yb-foot"><span class="yb-cap">yearbib.com</span><span class="yb-tag">0${n} / 07</span></div>
</div>`;
}

const PIN = `<svg class="pin" viewBox="0 0 220 60" aria-hidden="true"><defs><linearGradient id="pw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBFBF6"/><stop offset=".45" stop-color="#C9CAC2"/><stop offset="1" stop-color="#7C7E74"/></linearGradient><linearGradient id="ph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EDEDE6"/><stop offset="1" stop-color="#8E9086"/></linearGradient></defs><path d="M176 14 L32 14 C6 14 6 46 32 46 L180 46" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="5" transform="translate(3 5)"/><path d="M176 14 L32 14 C6 14 6 46 32 46 L180 46" fill="none" stroke="url(#pw)" stroke-width="4.5" stroke-linecap="round"/><circle cx="22" cy="30" r="9" fill="none" stroke="url(#pw)" stroke-width="4"/><rect x="166" y="6" width="46" height="48" rx="12" fill="url(#ph)" stroke="#6E7068" stroke-width="1.5"/><path d="M174 18 H204" stroke="rgba(255,255,255,.7)" stroke-width="2"/></svg>`;

const CARDS = {
  bib(s, o) {
    const u = o.u;
    const [num, label] = o.bib === "Hours" ? [hrs(s.moving), "Hours moving"] : o.bib === "Activities" ? [String(s.count), "Activities"] : [u.d(s.dist), u.long];
    return frame(o, 1, "My year in sport", "Every kilometre,", "on one bib.", `
<div class="yb-mid"><div class="bib">
<div class="paper bibp">
<div class="band"><span>Yearbib</span><b>${s.year}</b></div>
<div class="bnum"><span class="n" style="font-size:${num.length > 5 ? 290 : num.length > 4 ? 330 : 360}px">${num}</span><span class="l">${label}</span><span class="who">${esc(o.name).toUpperCase()}</span></div>
<div class="holes">${"<i></i>".repeat(32)}</div>
<div class="strip"><div><b>${s.count}</b><small>Activities</small></div><div><b>${hrs(s.moving)} h</b><small>Moving</small></div><div><b>${s.activeDays}</b><small>Active days</small></div></div>
</div>
<span class="p1">${PIN}</span><span class="p2">${PIN}</span><span class="p3">${PIN}</span><span class="p4">${PIN}</span>
</div></div>`).replace("Every kilometre,", o.u.short === "mi" ? "Every mile," : "Every kilometre,");
  },

  results(s, o) {
    const u = o.u, ev = s.elev / EVEREST_M;
    const rows = [["Moving time", hm(s.moving)], ["Elevation gain", u.e(s.elev)], ["Activities", s.count], ["Active days", s.activeDays], ["Longest streak", `${s.streak} day${s.streak === 1 ? "" : "s"}`], ["Weekly average", `${u.d(s.weekly / 1, 1)} ${u.short}`]];
    let seed = 7; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
    const bars = Array.from({ length: 46 }, () => `<i style="width:${rnd() < .35 ? 7 : 3}px"></i>`).join("");
    return frame(o, 2, "Official results", "The year,", "in numbers.", `
<div class="yb-mid gap"><div class="paper slip">
<div class="sh"><span class="t1">YEARBIB TIMING</span><span class="t2">Season ${s.year} · ${esc(o.name)}</span></div>
<div class="dash"></div>
<div class="tot"><span class="t2">Total distance</span><b>${u.d(s.dist, 1)} ${u.short}</b></div>
<div class="dash"></div>
${rows.map(([l, v]) => `<div class="row"><span>${l}</span><i></i><b>${v}</b></div>`).join("")}
${ev >= 0.1 ? `<div class="dash"></div><div class="ev"><span>All that climbing, in Everests</span><b>${ev.toFixed(1)}×</b></div>` : ""}
<div class="bars">${bars}</div>
<span class="t2 c">Printed by yearbib.com</span>
</div></div>`);
  },

  sport(s, o) {
    const list = s.sports.slice(0, 4), max = list[0]?.moving || 1, topS = list[0];
    const verb = { Run: "running", Ride: "riding", Walk: "walking", Swim: "swimming", Other: "training" };
    return frame(o, 3, "By sport", "Where the", "hours went.", `
<div class="yb-mid"><div class="lanes">
${list.map((sp, i) => `<div class="lane"><span class="ln">${i + 1}</span><div class="lc"><div class="lt"><b>${sp.name}</b><span>${hrs(sp.moving)} h · ${sp.dist > 0 ? `${o.u.d(sp.dist)} ${o.u.short} · ` : ""}${sp.count}×</span></div><div class="yb-track"><div style="width:${Math.max(3, Math.round(sp.moving / max * 100))}%;background:${i === 0 ? "var(--accent)" : "#DDE1D2"}"></div></div></div></div>`).join("")}
</div></div>
<p class="yb-note">Most of your year went to <b>${verb[topS?.name] || "training"}, ${hrs(topS?.moving || 0)} hours.</b></p>`);
  },

  profile(s, o) {
    const W = 912, H = 760, h = s.months.map(m => m.moving / 3600), max = Math.max(...h, 1) * 1.08;
    const pts = h.map((v, i) => [38 + i * (W - 76) / 11, H - v / max * (H - 40)]);
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < 12; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2; d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`; }
    const b = s.bestMonth, p = pts[b.m], ratio = s.avgMonth ? b.moving / s.avgMonth : 1;
    const rel = ratio >= 1.9 && ratio < 2.2 ? "double your usual month" : ratio >= 1.2 ? `${ratio.toFixed(1)} times your usual month` : "your busiest month";
    return frame(o, 4, "Your season's profile", `${MON[b.m]} was`, "the summit.", `
<div class="yb-mid col"><div class="prof">
<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="M0 190H912M0 380H912M0 570H912" stroke="rgba(221,225,210,.25)" stroke-width="2" stroke-dasharray="4 10"/><path d="${d} L${pts[11][0]} ${H} L${pts[0][0]} ${H}Z" fill="var(--accent)" fill-opacity=".2"/><path d="${d}" fill="none" stroke="var(--accent)" stroke-width="5"/></svg>
<div class="flag" style="left:${p[0] / W * 100}%;top:${p[1] / H * 100}%"><b>${hrs(b.moving)} h</b><i></i><em></em></div>
</div><div class="ml">${"JFMAMJJASOND".split("").map((c, i) => `<span${i === b.m ? ' class="on"' : ""}>${c}</span>`).join("")}</div></div>
<p class="yb-note">${hrs(b.moving)} hours across ${b.count} activities, <b>${rel}.</b></p>`);
  },

  log(s, o) {
    const lvl = sec => !sec ? 0 : sec < 3240 ? 1 : sec < 6120 ? 2 : 3;
    const fills = ["rgba(221,225,210,.12)", "#6C7553", "#A9B36E", "#D4E27A"];
    const st = s.streakStart?.getTime(), en = s.streakEnd?.getTime();
    const months = MON.map((name, m) => {
      const len = new Date(Date.UTC(s.year, m + 1, 0)).getUTCDate(), lead = (new Date(Date.UTC(s.year, m, 1)).getUTCDay() + 6) % 7;
      let c = "<i></i>".repeat(lead);
      for (let dd = 1; dd <= len; dd++) {
        const t = Date.UTC(s.year, m, dd), k = new Date(t).toISOString().slice(0, 10);
        c += `<i style="background:${fills[lvl(s.perDay.get(k))]}${t >= st && t <= en && s.streak > 1 ? ";box-shadow:0 0 0 3px #D2FF00" : ""}"></i>`;
      }
      return `<div class="mo"><span>${name.slice(0, 3)}</span><div class="g">${c}</div></div>`;
    }).join("");
    return frame(o, 5, "Your training log", `${s.activeDays} days out,`, `of ${s.daysInYear}.`, `
<div class="yb-mid"><div class="cal">${months}</div></div>
<div class="legend"><span>Longest streak: <b>${s.streak} day${s.streak === 1 ? "" : "s"}${s.streakEnd ? ` in ${MON[s.streakEnd.getUTCMonth()]}` : ""}</b></span><span class="sc">Less${fills.map(f => `<i style="background:${f}"></i>`).join("")}More</span></div>`);
  },

  big(s, o) {
    const u = o.u, medal = (size, tone, kind, val, unit, cls) => `<div class="medal ${cls}"><div class="rib"><i style="background:${tone}"></i><i style="background:#F4F4ED"></i></div><div class="disc" style="width:${size}px;height:${size}px;background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.75) 0,${tone} 34%,color-mix(in srgb,${tone} 62%,#000) 100%);box-shadow:inset 0 0 0 ${Math.round(size * .035)}px color-mix(in srgb,${tone} 70%,#000),inset 0 0 0 ${Math.round(size * .06)}px rgba(255,255,255,.35),0 30px 50px rgba(0,0,0,.45)"><span class="k">${kind}</span><b>${val}</b><span class="un">${unit}</span></div></div>`;
    const cap = a => `<span class="nm">${esc(a.name || a.type)}</span><span class="dt">${dayName(a.date)}</span>`;
    const L = s.longest, C = s.biggestClimb, T = s.longestTime;
    return frame(o, 6, "Big days", "The ones you", "remember.", `
<div class="yb-mid col yb-big">
<div class="bigone">${medal(360, "var(--accent)", "Longest", u.d(L.dist), u.short.toUpperCase(), "lg")}${cap(L)}</div>
<div class="two">
${C && C.elev > 0 ? `<div>${medal(250, "#DDE1D2", "Most climbing", u.e(C.elev).replace(/ (m|ft)$/, ""), o.u.short === "mi" ? "FT" : "M", "sm")}${cap(C)}</div>` : ""}
<div>${medal(250, "#C9A77C", "Longest time", hm(T.moving).replace(" h ", ":").replace(" m", ""), "HOURS", "sm")}${cap(T)}</div>
</div></div>`);
  },

  route(s, o) {
    const a = s.longest, pts = o.routes.get(a.id);
    const k = Math.cos(pts[0][0] * Math.PI / 180), W = 880, H = 600;
    const xs = pts.map(p => p[1] * k), ys = pts.map(p => -p[0]);
    const x1 = Math.min(...xs), x2 = Math.max(...xs), y1 = Math.min(...ys), y2 = Math.max(...ys);
    const sc = Math.min((W - 60) / (x2 - x1 || 1e-9), (H - 60) / (y2 - y1 || 1e-9));
    const ox = (W - (x2 - x1) * sc) / 2, oy = (H - (y2 - y1) * sc) / 2;
    const P = pts.map((p, i) => [ox + (xs[i] - x1) * sc, oy + (ys[i] - y1) * sc]);
    const d = "M" + P.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
    const hav = (p, q) => { const r = Math.PI / 180, dl = (q[0] - p[0]) * r, dn = (q[1] - p[1]) * r, x = Math.sin(dl / 2) ** 2 + Math.cos(p[0] * r) * Math.cos(q[0] * r) * Math.sin(dn / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(x)); };
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + hav(pts[i - 1], pts[i]));
    const tot = cum[cum.length - 1] || 1, unitM = o.u.k, step = Math.max(1, Math.ceil(a.dist / unitM / 6 / 5) * 5);
    let marks = "";
    for (let m = step; m * unitM < a.dist; m += step) { const t = m * unitM / a.dist * tot, i = cum.findIndex(c => c >= t); if (i > 0) marks += `<span class="km" style="left:${P[i][0] / W * 100}%;top:${P[i][1] / H * 100}%">${m}</span>`; }
    const el = pts.map(p => p[2]).filter(v => v != null);
    let prof = "";
    if (el.length > 10) {
      const lo = Math.min(...el), hi = Math.max(...el) || 1, n = el.length;
      const line = "M" + el.map((v, i) => `${(i / (n - 1) * 880).toFixed(1)} ${(140 - (v - lo) / (hi - lo || 1) * 120).toFixed(1)}`).join(" L");
      prof = `<svg class="elev" viewBox="0 0 880 150" preserveAspectRatio="none" aria-hidden="true"><path d="${line} L880 150 L0 150Z" fill="var(--accent)" fill-opacity=".22"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="3"/></svg>`;
    }
    const pace = a.dist > 0 ? a.moving / (a.dist / unitM) : 0;
    const [l1, ...rest] = (a.name || a.type).split(" ");
    return frame(o, 7, `Longest activity · ${dayName(a.date)}`, rest.length ? esc(l1) : "Your longest", esc(rest.length ? rest.join(" ") + "." : (a.name || a.type) + "."), `
<div class="yb-mid"><div class="map"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${d}" fill="none" stroke="var(--accent)" stroke-opacity=".22" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#F4F4ED" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>${marks}<span class="start" style="left:${P[0][0] / W * 100}%;top:${P[0][1] / H * 100}%"></span></div></div>
${prof}
<div class="rstats"><div><b>${o.u.d(a.dist, 1)} ${o.u.short}</b><small>Distance</small></div><div><b>${Math.floor(a.moving / 3600)}:${String(Math.round(a.moving % 3600 / 60)).padStart(2, "0")}</b><small>Moving time</small></div><div><b>${o.u.e(a.elev)}</b><small>Climbed</small></div><div><b>${Math.floor(pace / 60)}:${String(Math.round(pace % 60)).padStart(2, "0")}</b><small>Per ${o.u.short}</small></div></div>`);
  },
};

export const CARD_LIST = [
  ["bib", "The bib"], ["results", "Official results"], ["sport", "By sport"], ["profile", "Season profile"],
  ["log", "Training log"], ["big", "Big days"], ["route", "Longest route"],
];

export function available(s, routes) {
  return CARD_LIST.filter(([k]) => k !== "route" || (s.longest && routes.has(s.longest.id)))
    .filter(([k]) => k !== "big" || (s.longest && s.longest.dist > 0))
    .filter(([k]) => k !== "sport" || s.sports.length > 0);
}

export function renderCard(kind, s, o) { return CARDS[kind](s, o); }
