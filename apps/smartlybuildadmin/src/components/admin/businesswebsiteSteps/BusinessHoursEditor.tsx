import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import {
  DAY_LABEL,
  DAY_ORDER,
  formatBusinessHoursText,
  type BusinessHours,
  type DayKey,
} from "./businessHoursUtils";

type Props = {
  value: BusinessHours;
  onChange: (next: BusinessHours) => void;
};

const TIME_OPTIONS = (() => {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return opts;
})();

function formatOptionLabel(hhmm: string) {
  const [hs, ms] = hhmm.split(":");
  let h = parseInt(hs, 10);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${ms} ${ap}`;
}

/**
 * Availability editor — same hours for selected days, or custom per day.
 */
export function BusinessHoursEditor({ value, onChange }: Props) {
  const hours = value;

  const setMode = (mode: "same" | "custom") => {
    if (mode === "same") {
      onChange({
        ...hours,
        mode,
        days: hours.days.map((d) => ({ ...d, open: hours.open, close: hours.close })),
      });
    } else {
      onChange({ ...hours, mode });
    }
  };

  const toggleDay = (day: DayKey, enabled: boolean) => {
    onChange({
      ...hours,
      days: hours.days.map((d) => (d.day === day ? { ...d, enabled } : d)),
    });
  };

  const setSharedTime = (field: "open" | "close", time: string) => {
    onChange({
      ...hours,
      [field]: time,
      days: hours.days.map((d) => (d.enabled ? { ...d, [field]: time } : d)),
    });
  };

  const setDayTime = (day: DayKey, field: "open" | "close", time: string) => {
    onChange({
      ...hours,
      days: hours.days.map((d) => (d.day === day ? { ...d, [field]: time } : d)),
    });
  };

  const preview = formatBusinessHoursText(hours);

  return (
    <div className="space-y-4 pt-2 border-t">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <Label className="text-base">Business availability</Label>
      </div>
      <p className="text-sm text-muted-foreground">
        Set office hours once — they appear on the Contact page and in the Footer whenever hours are shown.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("same")}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            hours.mode === "same"
              ? "border-primary bg-primary/5 font-medium text-primary"
              : "border-input bg-background text-muted-foreground"
          }`}
        >
          Same hours for selected days
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            hours.mode === "custom"
              ? "border-primary bg-primary/5 font-medium text-primary"
              : "border-input bg-background text-muted-foreground"
          }`}
        >
          Custom times per day
        </button>
      </div>

      {hours.mode === "same" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Opens</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={hours.open}
              onChange={(e) => setSharedTime("open", e.target.value)}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={`open-${t}`} value={t}>
                  {formatOptionLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Closes</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={hours.close}
              onChange={(e) => setSharedTime("close", e.target.value)}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={`close-${t}`} value={t}>
                  {formatOptionLabel(t)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Open days</Label>
        <div className="space-y-2 rounded-md border p-3">
          {DAY_ORDER.map((day) => {
            const row = hours.days.find((d) => d.day === day)!;
            return (
              <div
                key={day}
                className="grid grid-cols-12 items-center gap-2 border-b border-dashed border-gray-100 pb-2 last:border-0 last:pb-0"
              >
                <div className="col-span-4 flex items-center gap-2 sm:col-span-3">
                  <Checkbox
                    checked={row.enabled}
                    onCheckedChange={(checked) => toggleDay(day, checked === true)}
                    id={`bh-day-${day}`}
                  />
                  <Label htmlFor={`bh-day-${day}`} className="text-sm font-medium">
                    {DAY_LABEL[day]}
                  </Label>
                </div>
                {hours.mode === "custom" ? (
                  <div className="col-span-8 grid grid-cols-2 gap-2 sm:col-span-9">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                      disabled={!row.enabled}
                      value={row.open}
                      onChange={(e) => setDayTime(day, "open", e.target.value)}
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={`${day}-o-${t}`} value={t}>
                          {formatOptionLabel(t)}
                        </option>
                      ))}
                    </select>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
                      disabled={!row.enabled}
                      value={row.close}
                      onChange={(e) => setDayTime(day, "close", e.target.value)}
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={`${day}-c-${t}`} value={t}>
                          {formatOptionLabel(t)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="col-span-8 text-xs text-muted-foreground sm:col-span-9">
                    {row.enabled
                      ? `${formatOptionLabel(hours.open)} – ${formatOptionLabel(hours.close)}`
                      : "Closed"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bh-note" className="text-xs">
          Extra note (optional)
        </Label>
        <Input
          id="bh-note"
          placeholder="e.g. Sunday: emergency only"
          value={hours.note}
          onChange={(e) => onChange({ ...hours, note: e.target.value })}
        />
      </div>

      <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        Preview: <span className="font-medium text-foreground">{preview}</span>
      </p>
    </div>
  );
}
