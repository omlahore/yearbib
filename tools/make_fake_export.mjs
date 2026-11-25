// Builds a fake Strava bulk export zip for testing: node tools/make_fake_export.mjs out.zip
import { writeFileSync } from "node:fs";
import { zipSync, gzipSync, strToU8 } from "../vendor/fflate.js";
import { Encoder, Profile } from "../vendor/src/index.js";

const out = process.argv[2] || "fake-export.zip";
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const H = "Activity ID,Activity Date,Activity Name,Activity Type,Activity Description,Elapsed Time,Distance,Max Heart Rate,Relative Effort,Commute,Activity Private Note,Activity Gear,Filename,Athlete Weight,Bike Weight,Elapsed Time,Moving Time,Distance,Max Speed,Average Speed,Elevation Gain,Elevation Loss,Elevation Low,Elevation High,Max Grade,Average Grade,Calories";
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = d => {
  let h = d.getUTCHours(); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
  const p = n => String(n).padStart(2, "0");
  return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${h}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} ${ap}`;
};
const q = s => `"${String(s).replace(/"/g, '""')}"`;

function track(n, km) {
  const pts = []; let lat = 19.07 + (rnd() - .5) * .1, lon = 72.87 + (rnd() - .5) * .1, hdg = rnd() * 6.28;
  const step = km / n / 111;
  for (let i = 0; i < n; i++) { hdg += (rnd() - .5) * .5 + (i > n / 2 ? .04 : 0); lat += Math.cos(hdg) * step; lon += Math.sin(hdg) * step; pts.push([lat, lon]); }
  return pts;
}
const gpx = (pts, t0) => `<?xml version="1.0"?><gpx version="1.1" creator="fake"><trk><trkseg>${pts.map((p, i) => `<trkpt lat="${p[0].toFixed(6)}" lon="${p[1].toFixed(6)}"><time>${new Date(t0 + i * 10000).toISOString()}</time></trkpt>`).join("")}</trkseg></trk></gpx>`;
function fit(pts, t0) {
  const e = new Encoder();
  const ts = t => new Date(t);
  e.onMesg(Profile.MesgNum.FILE_ID, { type: "activity", manufacturer: "development", product: 0, timeCreated: ts(t0), serialNumber: 1234 });
  pts.forEach((p, i) => e.onMesg(Profile.MesgNum.RECORD, { timestamp: ts(t0 + i * 10000), positionLat: Math.round(p[0] * 2 ** 31 / 180), positionLong: Math.round(p[1] * 2 ** 31 / 180) }));
  return e.close();
}

const files = {}; const rows = [H];
let id = 1000000000;
const types = [["Run", .5, 4, 21], ["Ride", .3, 15, 90], ["Walk", .12, 2, 8], ["Swim", .04, .8, 2.5], ["Workout", .04, 0, 0]];
for (const year of [2025, 2026]) {
  const n = year === 2026 ? 214 : 160;
  for (let k = 0; k < n; k++) {
    const day = Math.floor(rnd() * (year === 2026 ? 330 : 365));
    const d = new Date(Date.UTC(year, 0, 1 + day, 0, 30 + Math.floor(rnd() * 900), Math.floor(rnd() * 60)));
    let r = rnd(), t = types[0]; for (const ty of types) { if ((r -= ty[1]) <= 0) { t = ty; break; } }
    const km = t[2] + rnd() * (t[3] - t[2]);
    const speed = { Run: 10.5, Ride: 24, Walk: 5, Swim: 2.4, Workout: 1 }[t[0]];
    const moving = t[0] === "Workout" ? 1800 + rnd() * 2400 : km / speed * 3600;
    const elev = t[0] === "Swim" || t[0] === "Workout" ? 0 : km * (5 + rnd() * 25);
    const aid = id++;
    let fname = "";
    if (t[0] !== "Workout" && t[0] !== "Swim") {
      const pts = track(120 + Math.floor(rnd() * 200), km);
      if (rnd() < .5) { fname = `activities/${aid}.gpx`; files[fname] = strToU8(gpx(pts, d.getTime())); }
      else { fname = `activities/${aid}.fit.gz`; files[fname] = gzipSync(fit(pts, d.getTime())); }
    }
    const name = `${["Morning", "Lunch", "Afternoon", "Evening"][Math.floor(rnd() * 4)]} ${t[0]}`;
    rows.push([aid, q(fmtDate(d)), q(name), t[0], q(""), Math.round(moving * 1.1), km.toFixed(2), "", "", "false", q(""), q(""), fname, "", "", Math.round(moving * 1.1), Math.round(moving), (km * 1000).toFixed(1), "", (km * 1000 / moving).toFixed(3), elev.toFixed(1), elev.toFixed(1), "", "", "", "", Math.round(km * 60)].join(","));
  }
}
files["activities.csv"] = strToU8(rows.join("\n"));
files["profile.csv"] = strToU8("Athlete ID,Email Address,First Name,Last Name\n42,a@b.c,Om,L");
writeFileSync(out, zipSync(files));
console.log("wrote", out, Object.keys(files).length, "files");
