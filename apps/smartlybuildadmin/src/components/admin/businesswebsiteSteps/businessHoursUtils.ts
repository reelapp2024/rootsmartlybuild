/**
 * Mirror of backend/services/businessHours.js for admin + geniebuild clients.
 */

export const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_ORDER)[number];

export const DAY_LABEL: Record<DayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export type BusinessHoursDay = {
  day: DayKey;
  enabled: boolean;
  open: string;
  close: string;
};

export type BusinessHours = {
  mode: "same" | "custom";
  open: string;
  close: string;
  note: string;
  days: BusinessHoursDay[];
};

function emptyDay(day: DayKey, overrides: Partial<BusinessHoursDay> = {}): BusinessHoursDay {
  return {
    day,
    enabled: false,
    open: "07:00",
    close: "20:00",
    ...overrides,
  };
}

export function defaultBusinessHours(): BusinessHours {
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

function normalizeTime(raw: unknown, fallback = "09:00"): string {
  const s = String(raw || "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallback;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function formatTime12(hhmm: string): string {
  const [hs, ms] = String(hhmm || "").split(":");
  let h = parseInt(hs, 10);
  const min = ms || "00";
  if (!Number.isFinite(h)) return String(hhmm || "").trim();
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return min === "00" ? `${h}${ap}` : `${h}:${min}${ap}`;
}

export function normalizeBusinessHours(input: unknown): BusinessHours {
  const base = defaultBusinessHours();
  if (!input || typeof input !== "object") return base;
  const raw = input as Partial<BusinessHours> & { days?: any[] };

  const mode = String(raw.mode || "").toLowerCase() === "custom" ? "custom" : "same";
  const open = normalizeTime(raw.open, base.open);
  const close = normalizeTime(raw.close, base.close);
  const note = String(raw.note || "").trim();

  const byDay: Partial<Record<DayKey, BusinessHoursDay>> = {};
  if (Array.isArray(raw.days)) {
    for (const row of raw.days) {
      const day = String(row?.day || "")
        .toLowerCase()
        .slice(0, 3) as DayKey;
      if (!DAY_ORDER.includes(day)) continue;
      byDay[day] = {
        day,
        enabled: row?.enabled !== false && row?.closed !== true,
        open: normalizeTime(row?.open, open),
        close: normalizeTime(row?.close, close),
      };
      if (row?.enabled === false || row?.closed === true) byDay[day]!.enabled = false;
    }
  }

  const days = DAY_ORDER.map((day) => {
    if (byDay[day]) {
      if (mode === "same") return { ...byDay[day]!, open, close };
      return byDay[day]!;
    }
    return emptyDay(day, {
      enabled: mode === "same" ? day !== "sun" : false,
      open,
      close,
    });
  });

  return { mode, open, close, note, days };
}

function formatDayRange(labels: string[]): string {
  if (!labels.length) return "";
  if (labels.length === 1) return labels[0];
  const allLabels = Object.values(DAY_LABEL);
  const idxs = labels
    .map((l) => allLabels.indexOf(l))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  const ordered = idxs.map((i) => allLabels[i]);
  const consecutive =
    idxs.length === labels.length && idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1);
  if (consecutive) return `${ordered[0]}–${ordered[ordered.length - 1]}`;
  return ordered.join(", ");
}

export function formatBusinessHoursText(rawHours: unknown): string {
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

  const groups: Array<
    | { type: "open"; key: string; days: string[]; open: string; close: string }
    | { type: "closed"; days: string[] }
  > = [];
  let cur: { type: "open"; key: string; days: string[]; open: string; close: string } | null = null;

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

  const parts = groups
    .filter((g): g is Extract<typeof g, { type: "open" }> => g.type === "open")
    .map((g) => `${formatDayRange(g.days)}: ${formatTime12(g.open)} – ${formatTime12(g.close)}`);

  const closedDays = groups.filter((g) => g.type === "closed").flatMap((g) => g.days);
  if (closedDays.length) {
    parts.push(`${formatDayRange(closedDays)}: Closed`);
  }

  const line = parts.join(" · ");
  return hours.note ? `${line}. ${hours.note}` : line;
}
