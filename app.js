import { readExport, readRoutes } from "./parse.js";
import { yearStats, years } from "./stats.js";
import { renderCard, cardKinds, loadFonts, units } from "./cards.js";

const BRAND = "YEARBIB";
const $ = id => document.getElementById(id);
let data = null, routes = new Map(), routesYear = null, mi = false;

const demo = { year: new Date().getFullYear(), dist: 1846200, moving: 640800, count: 212, activeDays: 168, elev: 18400, acts: [] };
loadFonts().then(() => {
  const cv = renderCard("bib", demo, { u: units(false), brand: BRAND, name: "You" });
  $("sample").getContext("2d").drawImage(cv, 0, 0);
});

const status = t => ($("status").textContent = t);

async function open(file) {
  if (!file) return;
  status("Reading " + file.name + "…");
  try {
    data = await readExport(file);
    if (!data.activities.length) throw new Error("No activities found in this export.");
    const ys = years(data.activities);
    $("year").innerHTML = ys.map(y => `<option>${y}</option>`).join("");
    status(`Found ${data.activities.length} activities.`);
    $("result").hidden = false;
    await draw();
    $("result").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  } catch (e) {
    status(e.message || "Could not read this file. Use the zip Strava emails you.");
  }
}

async function draw() {
  const year = +$("year").value, s = yearStats(data.activities, year);
  if (routesYear !== year) {
    routes = await readRoutes(data.zip, data.base, s.acts, (d, n) => status(`Drawing routes ${d} of ${n}…`));
    routesYear = year;
    status(`${s.count} activities in ${year}.`);
  }
  await loadFonts();
  const opt = { u: units(mi), brand: BRAND, name: data.firstName, routes };
  $("cards").replaceChildren(...cardKinds(s, routes).map(kind => {
    const cv = renderCard(kind, s, opt);
    cv.setAttribute("role", "img"); cv.setAttribute("aria-label", `${kind} card`);
    const wrap = document.createElement("div"); wrap.className = "card";
    const acts = document.createElement("div"); acts.className = "acts";
    const save = button("Save", () => download(cv, `${year}-${kind}.png`));
    acts.append(save);
    if (navigator.canShare) acts.append(button("Share", () => share(cv, `${year}-${kind}.png`)));
    wrap.append(cv, acts);
    return wrap;
  }));
}

function button(label, fn) { const b = document.createElement("button"); b.textContent = label; b.onclick = fn; return b; }
const blob = cv => new Promise(r => cv.toBlob(r, "image/png"));
async function download(cv, name) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(await blob(cv)); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function share(cv, name) {
  const f = new File([await blob(cv)], name, { type: "image/png" });
  if (navigator.canShare({ files: [f] })) navigator.share({ files: [f] }).catch(() => {});
  else download(cv, name);
}

$("file").addEventListener("change", e => open(e.target.files[0]));
const drop = $("drop");
drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("over"); });
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", e => { e.preventDefault(); drop.classList.remove("over"); open(e.dataTransfer.files[0]); });
drop.addEventListener("click", () => $("file").click());
drop.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("file").click(); } });
$("year").addEventListener("change", draw);
document.querySelectorAll(".units button").forEach(b => b.onclick = () => {
  mi = b.dataset.mi === "1";
  document.querySelectorAll(".units button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  if (data) draw();
});
$("saveall").onclick = async () => {
  for (const [i, cv] of [...document.querySelectorAll(".card canvas")].entries()) { await download(cv, `${$("year").value}-${i + 1}.png`); await new Promise(r => setTimeout(r, 300)); }
};
