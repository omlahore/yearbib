const GROUP = t => /run/i.test(t) ? "Run" : /ride|bike|cycl|velomobile|handcycle/i.test(t) ? "Ride" : /walk|hike/i.test(t) ? "Walk" : /swim/i.test(t) ? "Swim" : "Other";
const dayKey = d => d.toISOString().slice(0, 10);

export function years(acts) {
  return [...new Set(acts.map(a => a.date.getUTCFullYear()))].sort((a, b) => b - a);
}

export function yearStats(all, year) {
  const acts = all.filter(a => a.date.getUTCFullYear() === year).sort((a, b) => a.date - b.date);
  const sum = (xs, k) => xs.reduce((s, a) => s + a[k], 0);
  const days = [...new Set(acts.map(a => dayKey(a.date)))].sort();
  let best = 0, run = 0, prev = null, bestEnd = null;
  for (const d of days) {
    const t = Date.parse(d);
    run = prev !== null && t - prev === 864e5 ? run + 1 : 1;
    if (run > best) { best = run; bestEnd = d; }
    prev = t;
  }
  const months = Array.from({ length: 12 }, (_, m) => {
    const xs = acts.filter(a => a.date.getUTCMonth() === m);
    return { m, dist: sum(xs, "dist"), moving: sum(xs, "moving"), count: xs.length };
  });
  const weekdays = Array.from({ length: 7 }, (_, w) => acts.filter(a => a.date.getUTCDay() === w).length);
  const sports = {};
  for (const a of acts) {
    const g = GROUP(a.type);
    sports[g] ??= { name: g, count: 0, dist: 0, moving: 0, elev: 0 };
    sports[g].count++; sports[g].dist += a.dist; sports[g].moving += a.moving; sports[g].elev += a.elev;
  }
  const top = k => acts.reduce((b, a) => (!b || a[k] > b[k] ? a : b), null);
  return {
    year, acts,
    count: acts.length,
    dist: sum(acts, "dist"), moving: sum(acts, "moving"), elev: sum(acts, "elev"),
    activeDays: days.length,
    streak: best, streakEnd: bestEnd,
    months, bestMonth: months.reduce((b, m) => (m.moving > b.moving ? m : b), months[0]),
    weekdays, favDay: weekdays.indexOf(Math.max(...weekdays)),
    sports: Object.values(sports).sort((a, b) => b.moving - a.moving),
    longest: top("dist"), longestTime: top("moving"), biggestClimb: top("elev"),
    first: acts[0], last: acts[acts.length - 1],
  };
}

export const EARTH_KM = 40075, EVEREST_M = 8849;
export const groupOf = GROUP;
