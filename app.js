import { readExport, readRoutes } from "./parse.js";
import { yearStats, years, groupOf } from "./stats.js";
import { renderCard, available, units, THEMES } from "./cards.js";

const $ = id => document.getElementById(id);
const st = { data: null, routes: new Map(), routesKey: "", theme: 0, sport: "All", bib: "Distance", mi: false, contours: true, name: "", year: 0 };

function thumb(html, w) {
  const box = document.createElement("div");
  box.className = "thumb";
  box.style.width = w + "px"; box.style.height = w * 16 / 9 + "px";
  box.innerHTML = html;
  box.firstElementChild.style.transform = `scale(${w / 1080})`;
  return box;
}

// Landing: demo cards built from a sample season so the page shows real output.
function demo() {
  let seed = 11; const r = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const acts = [], routes = new Map(), Y = new Date().getUTCFullYear();
  for (let i = 0; i < 212; i++) {
    const day = Math.floor(r() * 330), t = ["Run", "Run", "Ride", "Walk", "Run", "Ride", "Swim"][Math.floor(r() * 7)];
    const km = t === "Ride" ? 12 + r() * 18 : t === "Run" ? 4 + r() * 14 : t === "Swim" ? 1 + r() * 2 : 2 + r() * 6;
    acts.push({ id: "d" + i, date: new Date(Date.UTC(Y, 0, 1 + day, 6)), type: t, name: `Morning ${t.toLowerCase()}`, dist: km * 1000, moving: km / ({ Run: 10.5, Ride: 24, Walk: 5, Swim: 2.4 }[t]) * 3600, elev: t === "Swim" ? 0 : km * (6 + r() * 18), file: "" });
  }
  const L = { id: "long", date: new Date(Date.UTC(Y, 9, 12, 6)), type: "Run", name: "Sunday long run", dist: 32400, moving: 10260, elev: 286, file: "" };
  acts.push(L);
  const pts = []; let la = 19.07, lo = 72.87, h = 0.3, e = 14;
  for (let i = 0; i < 300; i++) { h += (r() - .5) * .35 + .021; la += Math.cos(h) * .0011; lo += Math.sin(h) * .0011; e = Math.max(4, e + (r() - .48) * 4); pts.push([la, lo, e]); }
  routes.set("long", pts);
  return { s: yearStats(acts, Y), routes, Y };
}

function opts(s, routes, name) {
  return { u: units(st.mi), theme: THEMES[st.theme], contours: st.contours, name: name || "Alex", year: s.year, bib: st.bib, routes };
}

function landing() {
  const { s, routes } = demo(), o = opts(s, routes, "Alex");
  const stage = $("stage"), W = Math.min(302, (stage.clientWidth || 900) / 3.2);
  [["results", -11, -1.02], ["route", 10, 1.02], ["bib", -3, 0]].forEach(([k, rot, off], i) => {
    const t = thumb(renderCard(k, s, o), W);
    t.classList.add("deal");
    t.style.cssText += `;left:calc(50% + ${off * W - W / 2}px);top:${i === 2 ? 40 : 80}px;--r:${rot}deg;z-index:${i === 2 ? 3 : 2};animation-delay:${.35 + i * .15}s`;
    stage.append(t);
  });
  $("over").append(thumb(renderCard("profile", s, o), 220));
  const sc = $("scatter");
  [["bib", "01 · The bib", 2, 60, -4], ["results", "02 · Official results", 27, 220, 3], ["log", "05 · Training log", 52, 20, -2], ["route", "07 · Longest route", 77, 180, 5]].forEach(([k, label, x, y, rot]) => {
    const d = document.createElement("div"); d.className = "scat"; d.style.cssText = `left:${x}%;top:${y}px;transform:rotate(${rot}deg)`;
    d.append(thumb(renderCard(k, s, o), 240));
    const p = document.createElement("p"); p.textContent = label; d.append(p);
    sc.append(d);
  });
}

// Upload
const status = t => { $("status").textContent = t; $("hstatus").textContent = t; };
async function open(file) {
  if (!file) return;
  status(`Reading ${file.name}…`);
  try {
    const data = await readExport(file);
    if (!data.activities.length) throw new Error("No activities found in this export.");
    st.data = data; st.name = data.firstName || "";
    const ys = years(data.activities); st.year = ys[0];
    $("year").innerHTML = ys.map(y => `<option>${y}</option>`).join("");
    $("nm").value = st.name;
    $("found").textContent = `${data.activities.length} activities found · nothing uploaded`;
    $("landing").hidden = true; $("recap").hidden = false; scrollTo(0, 0);
    await draw();
    status("");
  } catch (e) {
    status(e.message || "Could not read this file. Use the zip Strava emails you.");
  }
}

async function draw() {
  const s = yearStats(st.data.activities, st.year, st.sport);
  const key = st.year + st.sport;
  if (st.routesKey !== key) {
    const need = s.longest ? [s.longest] : [];
    st.routes = await readRoutes(st.data.zip, st.data.base, need);
    st.routesKey = key;
  }
  $("ptitle").textContent = `${st.name || "Your"}${st.name ? "'s" : ""} ${st.year},`;
  const o = opts(s, st.routes, st.name || "Athlete");
  const grid = $("grid"), W = Math.max(200, Math.min(320, (grid.clientWidth - 56) / 3));
  const list = s.count ? available(s, st.routes) : [];
  $("saveall").textContent = `Save all ${list.length} cards`;
  grid.replaceChildren(...list.map(([k, label], i) => {
    const box = document.createElement("div"); box.className = "cardbox"; box.style.animationDelay = i * .08 + "s";
    const t = thumb(renderCard(k, s, o), W); t.setAttribute("role", "img"); t.setAttribute("aria-label", label + " card");
    const row = document.createElement("div"); row.className = "cb-row";
    row.innerHTML = `<span>0${i + 1} · ${label}</span>`;
    const b = document.createElement("button"); b.className = "op"; b.textContent = "Save";
    b.onclick = () => save(k, s, o, `${st.year}-${i + 1}-${k}.png`);
    row.append(b); box.append(t, row); return box;
  }));
  if (!list.length) grid.innerHTML = `<p class="muted">No ${st.sport === "All" ? "" : st.sport.toLowerCase() + " "}activities in ${st.year}.</p>`;
  st.last = { s, o, list };
}

async function png(k, s, o) {
  const host = $("render"); host.innerHTML = renderCard(k, s, o);
  await document.fonts.ready;
  const blob = await htmlToImage.toBlob(host.firstElementChild, { width: 1080, height: 1920, pixelRatio: 1, cacheBust: true });
  host.innerHTML = "";
  return blob;
}
async function save(k, s, o, name) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(await png(k, s, o)); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// Controls
function radio(el, values, cur, onPick, render) {
  el.replaceChildren(...values.map((v, i) => {
    const b = render(v, i); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(cur() === v));
    b.onclick = () => { onPick(v); [...el.children].forEach((c, j) => c.setAttribute("aria-checked", String(j === i))); draw(); };
    return b;
  }));
}
function controls() {
  radio($("themes"), THEMES.map((_, i) => i), () => st.theme, v => { st.theme = v; $("tname").textContent = THEMES[v].name; }, (v) => {
    const b = document.createElement("button"); b.className = "sw"; b.style.background = THEMES[v].ground; b.setAttribute("aria-label", THEMES[v].name);
    b.innerHTML = `<i style="background:${THEMES[v].accent}"></i>`; return b;
  });
  $("tname").textContent = THEMES[0].name;
  const pill = v => { const b = document.createElement("button"); b.className = "op"; b.textContent = v; return b; };
  radio($("sports"), ["All", "Run", "Ride", "Walk", "Swim"], () => st.sport, v => { st.sport = v; }, pill);
  radio($("bibs"), ["Distance", "Hours", "Activities"], () => st.bib, v => { st.bib = v; }, pill);
  $("year").onchange = e => { st.year = +e.target.value; draw(); };
  $("unit").onchange = e => { st.mi = e.target.value === "1"; draw(); };
  let tm; $("nm").oninput = e => { st.name = e.target.value.trim(); clearTimeout(tm); tm = setTimeout(draw, 250); };
  $("contours").onclick = e => { st.contours = !st.contours; e.currentTarget.setAttribute("aria-checked", String(st.contours)); draw(); };
  $("saveall").onclick = async () => {
    const { s, o, list } = st.last;
    for (const [i, [k]] of list.entries()) { await save(k, s, o, `${st.year}-${i + 1}-${k}.png`); await new Promise(r => setTimeout(r, 300)); }
  };
  if (navigator.canShare && navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] })) {
    $("shareall").hidden = false;
    $("shareall").onclick = async () => {
      const { s, o, list } = st.last;
      const files = await Promise.all(list.map(async ([k], i) => new File([await png(k, s, o)], `${st.year}-${i + 1}-${k}.png`, { type: "image/png" })));
      navigator.share({ files }).catch(() => {});
    };
  }
  const back = e => { e.preventDefault(); $("recap").hidden = true; $("landing").hidden = false; st.data = null; status(""); $("file").value = ""; };
  $("again").onclick = back; $("home").onclick = back;
}

const dz = $("dropzone"), over = $("dropall");
$("file").addEventListener("change", e => open(e.target.files[0]));
let depth = 0;
const hasFile = e => [...(e.dataTransfer?.types || [])].includes("Files");
addEventListener("dragenter", e => { if (!hasFile(e) || !$("recap").hidden) return; e.preventDefault(); if (++depth === 1) over.hidden = false; });
addEventListener("dragover", e => { if (hasFile(e)) e.preventDefault(); });
addEventListener("dragleave", e => { if (!hasFile(e)) return; if (--depth <= 0) { depth = 0; over.hidden = true; } });
addEventListener("drop", e => { if (!hasFile(e)) return; e.preventDefault(); depth = 0; over.hidden = true; dz.classList.remove("over"); if ($("recap").hidden) open(e.dataTransfer.files[0]); });
addEventListener("resize", () => { if (st.data) draw(); });
document.fonts.ready.then(landing);
controls();
export { groupOf };
