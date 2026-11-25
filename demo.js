import { yearStats } from "./stats.js";

// Landing: demo cards built from a sample season so the page shows real output.
export function demo() {
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
  return { s: yearStats(acts, Y), routes, Y, acts };
}

