/**
 * Structured business availability (AboutUs.businessHours).
 * mode "same"  — selected days share one open/close
 * mode "custom"— each day may have its own open/close (or closed)
 */

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function emptyDay(day, overrides = {}) {
  return {
    day,
    enabled: false,
    open: "07:00",
    close: "20:00",
    ...overrides,
  };
}

function defaultBusinessHours() {
  return {
    mode: "same",
    open: "07:00",
    close: "20:00",
    note: "",
    days: DAY_ORDER.map((day) =>
      emptyDay(day, {
        enabled: day !== "sun",
        open: "07:00",
        close: "20:00",
      })
    ),
  };
}

function normalizeTime(raw, fallback = "09:00") {
  const s = String(raw || "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallback;
  let h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  let min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function formatTime12(hhmm) {
  const [hs, ms] = String(hhmm || "").split(":");
  let h = parseInt(hs, 10);
  const min = ms || "00";
  if (!Number.isFinite(h)) return String(hhmm || "").trim();
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return min === "00" ? `${h}${ap}` : `${h}:${min}${ap}`;
}

function normalizeBusinessHours(input) {
  const base = defaultBusinessHours();
  if (!input || typeof input !== "object") return base;

  const mode = String(input.mode || "").toLowerCase() === "custom" ? "custom" : "same";
  const open = normalizeTime(input.open, base.open);
  const close = normalizeTime(input.close, base.close);
  const note = String(input.note || "").trim();

  const byDay = {};
  if (Array.isArray(input.days)) {
    for (const row of input.days) {
      const day = String(row?.day || "").toLowerCase().slice(0, 3);
      if (!DAY_ORDER.includes(day)) continue;
      byDay[day] = {
        day,
        enabled: row?.enabled !== false && row?.enabled !== 0 && row?.closed !== true,
        open: normalizeTime(row?.open, open),
        close: normalizeTime(row?.close, close),
      };
      if (row?.enabled === false || row?.closed === true) byDay[day].enabled = false;
    }
  }

  const days = DAY_ORDER.map((day) => {
    if (byDay[day]) {
      if (mode === "same") {
        return { ...byDay[day], open, close };
      }
      return byDay[day];
    }
    return emptyDay(day, {
      enabled: mode === "same" ? day !== "sun" : false,
      open,
      close,
    });
  });

  return { mode, open, close, note, days };
}

/**
 * Compact display line for contact cards / footer.
 * Examples:
 *  - "Mon–Sat: 7am – 8pm"
 *  - "Mon–Fri: 8am – 5pm · Sat: 9am – 1pm · Sun: Closed"
 */
function formatBusinessHoursText(rawHours) {
  const hours = normalizeBusinessHours(rawHours);
  const enabled = hours.days.filter((d) => d.enabled);

  if (!enabled.length) {
    return hours.note || "Hours by appointment";
  }

  if (hours.mode === "same") {
    const labels = enabled.map((d) => DAY_LABEL[d.day]);
    const range = formatDayRange(labels);
    const time = `${formatTime12(hours.open)} – ${formatTime12(hours.close)}`;
    const line = `${range}: ${time}`;
    return hours.note ? `${line}. ${hours.note}` : line;
  }

  // Group consecutive same open/close days
  const groups = [];
  let cur = null;
  for (const d of hours.days) {
    if (!d.enabled) {
      if (cur) {
        groups.push(cur);
        cur = null;
      }
      groups.push({ type: "closed", days: [DAY_LABEL[d.day]] });
      continue;
    }
    const key = `${d.open}|${d.close}`;
    if (cur && cur.key === key) {
      cur.days.push(DAY_LABEL[d.day]);
    } else {
      if (cur) groups.push(cur);
      cur = { type: "open", key, days: [DAY_LABEL[d.day]], open: d.open, close: d.close };
    }
  }
  if (cur) groups.push(cur);

  // Merge lone closed days into one "Sun: Closed" style appendages; keep open groups rich
  const parts = groups
    .filter((g) => g.type === "open")
    .map((g) => `${formatDayRange(g.days)}: ${formatTime12(g.open)} – ${formatTime12(g.close)}`);

  const closedDays = groups.filter((g) => g.type === "closed").flatMap((g) => g.days);
  if (closedDays.length) {
    parts.push(`${formatDayRange(closedDays)}: Closed`);
  }

  const line = parts.join(" · ");
  return hours.note ? `${line}. ${hours.note}` : line;
}

function formatDayRange(labels) {
  if (!labels.length) return "";
  if (labels.length === 1) return labels[0];
  // Consecutive in WEEK order using DAY_ORDER labels
  const idxs = labels
    .map((l) => Object.values(DAY_LABEL).indexOf(l))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  const consecutive =
    idxs.length === labels.length &&
    idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1);
  if (consecutive) return `${labels[0]}–${labels[labels.length - 1]}`;
  return labels.join(", ");
}

function formatBusinessHoursSub(rawHours) {
  const hours = normalizeBusinessHours(rawHours);
  return String(hours.note || "").trim();
}

module.exports = {
  DAY_ORDER,
  DAY_LABEL,
  defaultBusinessHours,
  normalizeBusinessHours,
  formatBusinessHoursText,
  formatBusinessHoursSub,
  formatTime12,
};
