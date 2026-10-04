/* Daybook dates: every date in the app is a 'YYYY-MM-DD' string.
   Strings in that shape sort and compare correctly as plain text, so `a < b` means
   "a is earlier". There is no date library and no time-zone maths: arithmetic is done
   on whole day numbers, and only today() ever looks at the clock.
   Pure functions; tests/run.js runs them under Node. */
(function (root) {
  'use strict';
  const D = (root.Daybook = root.Daybook || {});

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const DAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  const MS_PER_DAY = 86400000;

  const pad = n => (n < 10 ? '0' : '') + n;
  const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

  /* 'YYYY-MM-DD' -> [year, month 1-12, day], or null when it is not a real date. */
  function parts(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof s === 'string' ? s : '');
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    const t = new Date(Date.UTC(y, mo - 1, d));
    if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
    return [y, mo, d];
  }

  const isValid = s => parts(s) !== null;

  /* Days since 1 Jan 1970. UTC is used only as a calendar that has no daylight saving. */
  function toDays(s) {
    const p = parts(s);
    if (!p) throw new Error('Not a date: ' + s);
    return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / MS_PER_DAY);
  }

  function fromDays(n) {
    const t = new Date(n * MS_PER_DAY);
    return ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  }

  const add = (s, n) => fromDays(toDays(s) + n);

  /* Whole days from b to a: positive when a is later. */
  const diff = (a, b) => toDays(a) - toDays(b);

  /* 0 = Monday ... 6 = Sunday. (1 Jan 1970 was a Thursday.) */
  const weekday = s => (((toDays(s) + 3) % 7) + 7) % 7;

  const startOfWeek = s => add(s, -weekday(s));
  const startOfMonth = s => s.slice(0, 8) + '01';

  /* First day of the month that is n months away. */
  function addMonths(s, n) {
    const p = parts(s);
    const t = new Date(Date.UTC(p[0], p[1] - 1 + n, 1));
    return ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, 1);
  }

  function daysInMonth(s) {
    const p = parts(s);
    return new Date(Date.UTC(p[0], p[1], 0)).getUTCDate();
  }

  /* Today on this computer's own clock. toISOString() would give the UTC date, which is
     the wrong day for a few hours around midnight anywhere that is not on UTC. */
  function today() {
    const t = api.now();
    return ymd(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }

  /* ---------- formats: fixed English, written the way the design system asks ---------- */

  const short = s => `${DAYS[weekday(s)]} ${parts(s)[2]} ${MONTHS[parts(s)[1] - 1]}`;           // Tue 6 Oct
  const withYear = s => `${short(s)} ${parts(s)[0]}`;                                           // Tue 6 Oct 2026
  const long = s => `${DAYS_LONG[weekday(s)]} ${parts(s)[2]} ${MONTHS_LONG[parts(s)[1] - 1]} ${parts(s)[0]}`;
  const dayMonth = s => `${parts(s)[2]} ${MONTHS[parts(s)[1] - 1]}`;                            // 6 Oct
  const dayMonthYear = s => `${dayMonth(s)} ${parts(s)[0]}`;                                    // 6 Oct 2026
  const monthYear = s => `${MONTHS_LONG[parts(s)[1] - 1]} ${parts(s)[0]}`;                      // October 2026
  const dayName = s => DAYS[weekday(s)];
  const dayNameLong = s => DAYS_LONG[weekday(s)];
  const dayNumber = s => parts(s)[2];

  /* 5 – 11 October 2026 · 28 Sep – 4 Oct 2026 · 28 Dec 2026 – 3 Jan 2027 */
  function range(a, b) {
    const pa = parts(a), pb = parts(b);
    if (pa[0] !== pb[0]) return `${dayMonthYear(a)} – ${dayMonthYear(b)}`;
    if (pa[1] !== pb[1]) return `${dayMonth(a)} – ${dayMonth(b)} ${pb[0]}`;
    return `${pa[2]} – ${pb[2]} ${MONTHS_LONG[pb[1] - 1]} ${pb[0]}`;
  }

  /* The label that sits beside a due date: Today, Tomorrow, in 3 days, 3 days late. */
  function relative(s, t) {
    const n = diff(s, t);
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n > 1) return `in ${n} days`;
    return n === -1 ? '1 day late' : `${-n} days late`;
  }

  const api = {
    DAYS, DAYS_LONG, MONTHS, MONTHS_LONG,
    isValid, parts, add, diff, weekday, startOfWeek, startOfMonth, addMonths, daysInMonth,
    /* The clock. Tests replace `now` to pin the date. */
    now: () => new Date(),
    today,
    short, withYear, long, dayMonth, dayMonthYear, monthYear, dayName, dayNameLong, dayNumber,
    range, relative
  };
  D.dates = api;
})(typeof window !== 'undefined' ? window : globalThis);
