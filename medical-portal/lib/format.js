const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEK = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Parse a YYYY-MM-DD string as a local date (avoids UTC off-by-one).
export function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function fmtParts(iso) {
  const dt = parseDate(iso);
  return { mo: MONTHS[dt.getMonth()], day: dt.getDate(), wd: WEEK[dt.getDay()] };
}

export function fmtLong(iso) {
  const dt = parseDate(iso);
  return `${WEEK[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
}

export function fmtDob(iso) {
  const dt = parseDate(iso);
  return `${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
}
