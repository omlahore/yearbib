export const groupOf = t => /run/i.test(t) ? "Run" : /ride|bike|cycl|velomobile|handcycle/i.test(t) ? "Ride" : /walk|hike/i.test(t) ? "Walk" : /swim/i.test(t) ? "Swim" : "Other";
export const EVEREST_M = 8849;
const DAY = 864e5;
const dayKey = d => d.toISOString().slice(0, 10);

export function years(acts) {
  return [...new Set(acts.map(a => a.date.getUTCFullYear()))].sort((a, b) => b - a);
}

export function yearStats(all, year, sport = "All") {
  const acts = all
    .filter(a => a.date.getUTCFullYear() === year && (sport === "All" || groupOf(a.type) === sport))
    .sort((a, b) => a.date - b.date);
  const sum = (xs, k) => xs.reduce((s, a) => s + a[k], 0);

  const perDay = new Map();
  for (const a of acts) perDay.set(dayKey(a.date), (perDay.get(dayKey(a.date)) || 0) + a.moving);
  const days = [...perDay.keys()].sort();
  let best = 0, run = 0, prev = null, bestEnd = null;
  for (const d of days) {
    const t = Date.parse(d);
    run = prev !== null && t - prev === DAY ? run + 1 : 1;
    if (run > best) { best = run; bestEnd = d; }
    prev = t;
  }
  const streakEnd = bestEnd ? new Date(bestEnd + "T00:00:00Z") : null;
  const streakStart = streakEnd ? new Date(streakEnd - (best - 1) * DAY) : null;

  const months = Array.from({ length: 12 }, (_, m) => {
    const xs = acts.filter(a => a.date.getUTCMonth() === m);
    return { m, dist: sum(xs, "dist"), moving: sum(xs, "moving"), count: xs.length };
  });
  const active = months.filter(m => m.count);
  const avgMonth = active.length ? active.reduce((s, m) => s + m.moving, 0) / active.length : 0;

  const sports = {};
  for (const a of acts) {
    const g = groupOf(a.type);
    sports[g] ??= { name: g, count: 0, dist: 0, moving: 0 };
    sports[g].count++; sports[g].dist += a.dist; sports[g].moving += a.moving;
  }
  const top = k => acts.reduce((b, a) => (!b || a[k] > b[k] ? a : b), null);
  const dist = sum(acts, "dist");
  const weeks = year === new Date().getUTCFullYear() ? Math.max(1, (Date.now() - Date.UTC(year, 0, 1)) / (7 * DAY)) : 52.14;

  return {
    year, sport, acts,
    count: acts.length, dist, moving: sum(acts, "moving"), elev: sum(acts, "elev"),
    activeDays: days.length, daysInYear: (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365,
    perDay, streak: best, streakStart, streakEnd,
    months, bestMonth: months.reduce((b, m) => (m.moving > b.moving ? m : b), months[0]), avgMonth,
    weekly: dist / Math.min(weeks, 52.14),
    sports: Object.values(sports).sort((a, b) => b.moving - a.moving),
    longest: top("dist"), longestTime: top("moving"), biggestClimb: top("elev"),
  };
}
