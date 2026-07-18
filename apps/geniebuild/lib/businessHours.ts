/** Structured business hours formatting (mirrors backend/services/businessHours.js). */

export type BusinessHoursDay = {
  day: string;
  enabled?: boolean;
  open?: string;
  close?: string;
};

export type BusinessHours = {
  mode?: 'same' | 'custom';
  open?: string;
  close?: string;
  note?: string;
  days?: BusinessHoursDay[];
};

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABEL: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

function normalizeTime(raw: unknown, fallback = '09:00'): string {
  const s = String(raw || '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallback;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function formatTime12(hhmm: string): string {
  const [hs, ms] = String(hhmm || '').split(':');
  let h = parseInt(hs, 10);
  const min = ms || '00';
  if (!Number.isFinite(h)) return String(hhmm || '').trim();
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  if (h === 0) h = 12;
  return min === '00' ? `${h}${ap}` : `${h}:${min}${ap}`;
}

function formatDayRange(labels: string[]): string {
  if (!labels.length) return '';
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
  return ordered.join(', ');
}

export function formatBusinessHoursText(rawHours: BusinessHours | null | undefined): string {
  if (!rawHours || typeof rawHours !== 'object') return '';
  const mode = String(rawHours.mode || '').toLowerCase() === 'custom' ? 'custom' : 'same';
  const open = normalizeTime(rawHours.open, '07:00');
  const close = normalizeTime(rawHours.close, '20:00');
  const note = String(rawHours.note || '').trim();

  const byDay: Record<string, { day: string; enabled: boolean; open: string; close: string }> = {};
  for (const row of Array.isArray(rawHours.days) ? rawHours.days : []) {
    const day = String(row?.day || '').toLowerCase().slice(0, 3);
    if (!(DAY_ORDER as readonly string[]).includes(day)) continue;
    byDay[day] = {
      day,
      enabled: row?.enabled !== false,
      open: normalizeTime(row?.open, open),
      close: normalizeTime(row?.close, close),
    };
  }

  const days = DAY_ORDER.map((day) => {
    if (byDay[day]) {
      return mode === 'same' ? { ...byDay[day], open, close } : byDay[day];
    }
    return { day, enabled: false, open, close };
  });

  const enabled = days.filter((d) => d.enabled);
  if (!enabled.length) return note || '';

  if (mode === 'same') {
    const labels = enabled.map((d) => DAY_LABEL[d.day]);
    const line = `${formatDayRange(labels)}: ${formatTime12(open)} – ${formatTime12(close)}`;
    return note ? `${line}. ${note}` : line;
  }

  const parts: string[] = [];
  let cur: { days: string[]; open: string; close: string } | null = null;
  const closed: string[] = [];

  for (const d of days) {
    if (!d.enabled) {
      if (cur) {
        parts.push(
          `${formatDayRange(cur.days)}: ${formatTime12(cur.open)} – ${formatTime12(cur.close)}`
        );
        cur = null;
      }
      closed.push(DAY_LABEL[d.day]);
      continue;
    }
    const key = `${d.open}|${d.close}`;
    if (cur && `${cur.open}|${cur.close}` === key) {
      cur.days.push(DAY_LABEL[d.day]);
    } else {
      if (cur) {
        parts.push(
          `${formatDayRange(cur.days)}: ${formatTime12(cur.open)} – ${formatTime12(cur.close)}`
        );
      }
      cur = { days: [DAY_LABEL[d.day]], open: d.open, close: d.close };
    }
  }
  if (cur) {
    parts.push(`${formatDayRange(cur.days)}: ${formatTime12(cur.open)} – ${formatTime12(cur.close)}`);
  }
  if (closed.length) parts.push(`${formatDayRange(closed)}: Closed`);

  const line = parts.join(' · ');
  return note ? `${line}. ${note}` : line;
}
