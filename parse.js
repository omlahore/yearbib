import { gunzipSync, strFromU8 } from "./vendor/fflate.js";
import { openZip } from "./zip.js";

export function parseCSV(text) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(f); rows.push(row); row = []; f = "";
    } else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
export function parseDate(s) {
  const m = /^([A-Za-z]{3})\w*\.? (\d{1,2}), (\d{4}),? (\d{1,2}):(\d{2}):(\d{2})\s*([AP]M)?/i.exec(s.trim());
  if (m && m[1].toLowerCase() in MON) {
    let h = +m[4]; const ap = (m[7] || "").toUpperCase();
    if (ap === "PM" && h < 12) h += 12; if (ap === "AM" && h === 12) h = 0;
    return new Date(Date.UTC(+m[3], MON[m[1].toLowerCase()], +m[2], h, +m[5], +m[6]));
  }
  const t = Date.parse(s);
  return isNaN(t) ? null : new Date(t);
}

const num = s => { const v = parseFloat(String(s || "").replace(/,/g, "")); return isNaN(v) ? 0 : v; };

// Strava's activities.csv repeats some headers (Distance in km, then in metres; Elapsed Time twice).
export function activitiesFromCSV(text) {
  const [head, ...rows] = parseCSV(text);
  const cols = {};
  head.forEach((h, i) => (cols[h.trim()] ??= []).push(i));
  const get = (r, name, k = 0) => { const ix = cols[name]; return ix && ix[Math.min(k, ix.length - 1)] != null ? r[ix[Math.min(k, ix.length - 1)]] : ""; };
  const out = []; let skipped = 0;
  for (const r of rows) {
    if (r.length < 4) continue;
    const date = parseDate(get(r, "Activity Date"));
    if (!date) { skipped++; continue; }
    const type = get(r, "Activity Type") || "Other";
    const metres = (cols["Distance"] || []).length > 1 ? num(get(r, "Distance", 1)) : num(get(r, "Distance")) * (type === "Swim" ? 1 : 1000);
    out.push({
      id: get(r, "Activity ID"), date, type, name: get(r, "Activity Name"),
      dist: metres,
      moving: num(get(r, "Moving Time")) || num(get(r, "Elapsed Time", 1)) || num(get(r, "Elapsed Time")),
      elev: num(get(r, "Elevation Gain")),
      file: get(r, "Filename"),
    });
  }
  return { activities: out, skipped };
}

export async function readExport(blob) {
  const zip = await openZip(blob);
  const key = zip.names.filter(n => n.endsWith("activities.csv")).sort((a, b) => a.length - b.length)[0];
  if (!key) throw new Error("No activities.csv in this zip. Is it the Strava bulk export?");
  const base = key.slice(0, -"activities.csv".length);
  let firstName = "";
  const prof = await zip.read(base + "profile.csv");
  if (prof) { const [h, r] = parseCSV(strFromU8(prof)); const i = h.indexOf("First Name"); if (i >= 0 && r) firstName = r[i]; }
  return { ...activitiesFromCSV(strFromU8(await zip.read(key))), firstName, base, zip };
}

// Route points for the given activities. Returns Map id -> [[lat, lon], ...]
export async function readRoutes(zip, base, acts, onProgress = () => {}) {
  const todo = acts.filter(a => a.file);
  let fitDecode = null;
  const routes = new Map(); let done = 0;
  for (const a of todo) {
    try {
      const raw = await zip.read(base + a.file);
      if (raw) {
        const bytes = a.file.endsWith(".gz") ? gunzipSync(raw) : raw;
        const n = a.file.replace(/\.gz$/, "");
        let pts = [];
        if (n.endsWith(".gpx")) pts = gpxPoints(strFromU8(bytes));
        else if (n.endsWith(".tcx")) pts = tcxPoints(strFromU8(bytes));
        else if (n.endsWith(".fit")) { fitDecode ??= await loadFit(); pts = fitDecode(bytes); }
        if (pts.length > 1) routes.set(a.id, thin(pts, 300));
      }
    } catch { /* skip unreadable file */ }
    if (++done % 10 === 0) onProgress(done, todo.length);
  }
  onProgress(todo.length, todo.length);
  return routes;
}

export function gpxPoints(x) {
  const pts = [];
  for (const m of x.matchAll(/<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>|<trkpt\b([^>]*)\/>/g)) {
    const a = m[1] ?? m[3];
    const la = /lat="([-\d.]+)"/.exec(a), lo = /lon="([-\d.]+)"/.exec(a);
    const el = m[2] && /<ele>([-\d.]+)<\/ele>/.exec(m[2]);
    if (la && lo) pts.push([+la[1], +lo[1], el ? +el[1] : null]);
  }
  return pts;
}
export function tcxPoints(x) {
  const pts = [];
  for (const m of x.matchAll(/<Trackpoint>([\s\S]*?)<\/Trackpoint>/g)) {
    const la = /<LatitudeDegrees>([-\d.]+)</.exec(m[1]), lo = /<LongitudeDegrees>([-\d.]+)</.exec(m[1]);
    const el = /<AltitudeMeters>([-\d.]+)</.exec(m[1]);
    if (la && lo) pts.push([+la[1], +lo[1], el ? +el[1] : null]);
  }
  return pts;
}
async function loadFit() {
  const { Decoder, Stream } = await import("./vendor/src/index.js");
  const k = 180 / 2 ** 31;
  return bytes => {
    const { messages } = new Decoder(Stream.fromByteArray(bytes)).read({ applyScaleAndOffset: true, convertDateTimesToDates: false });
    return (messages.recordMesgs || []).filter(r => r.positionLat != null && r.positionLong != null).map(r => [r.positionLat * k, r.positionLong * k, r.enhancedAltitude ?? r.altitude ?? null]);
  };
}
const thin = (p, max) => p.length <= max ? p : Array.from({ length: max }, (_, i) => p[Math.round(i * (p.length - 1) / (max - 1))]);
