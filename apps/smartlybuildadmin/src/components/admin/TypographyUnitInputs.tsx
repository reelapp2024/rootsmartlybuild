import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Minus, Plus, RotateCcw } from "lucide-react";

const UNITLESS_VALUE = "__unitless__";

function unitToSelect(unit: string): string {
  return unit === "" ? UNITLESS_VALUE : unit;
}

function selectToUnit(selected: string): string {
  return selected === UNITLESS_VALUE ? "" : selected;
}

function parseCssValue(
  val: string,
  allowedUnits: string[],
  defaultUnit: string
): { num: number | null; unit: string } {
  const fallbackUnit = allowedUnits.includes(defaultUnit)
    ? defaultUnit
    : allowedUnits[0] ?? "";

  if (!val?.trim()) {
    return { num: null, unit: fallbackUnit };
  }

  const trimmed = val.trim();

  if (/^-?[\d.]+$/.test(trimmed)) {
    const num = parseFloat(trimmed);
    return {
      num: Number.isFinite(num) ? num : null,
      unit: fallbackUnit,
    };
  }

  const match = trimmed.match(/^(-?[\d.]+)\s*(px|rem|em|%|vw|vh)?$/i);
  if (!match) {
    return { num: null, unit: fallbackUnit };
  }

  const num = parseFloat(match[1]);
  let unit = (match[2] || fallbackUnit).toLowerCase();
  if (!allowedUnits.includes(unit)) {
    unit = fallbackUnit;
  }

  return {
    num: Number.isFinite(num) ? num : null,
    unit,
  };
}

function formatNumber(num: number): string {
  return Number.isInteger(num) ? String(num) : num.toFixed(3).replace(/\.?0+$/, "");
}

function buildCssValue(num: number | null, unit: string): string {
  if (num === null || Number.isNaN(num)) return "";
  const formatted = formatNumber(num);
  return unit ? `${formatted}${unit}` : formatted;
}

type CssUnitFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  units: string[];
  unitLabels?: Record<string, string>;
  defaultUnit?: string;
  step?: number;
  min?: number;
  max?: number;
  onReset?: () => void;
};

export function CssUnitField({
  label,
  value,
  onChange,
  placeholder,
  units,
  unitLabels,
  defaultUnit,
  step,
  min,
  max,
  onReset,
}: CssUnitFieldProps) {
  const resolvedDefaultUnit = defaultUnit ?? units[0] ?? "rem";
  const parsed = parseCssValue(value, units, resolvedDefaultUnit);
  const placeholderParsed = placeholder
    ? parseCssValue(placeholder, units, resolvedDefaultUnit)
    : null;

  const [displayNum, setDisplayNum] = useState(
    parsed.num !== null ? formatNumber(parsed.num) : ""
  );
  const [selectedUnit, setSelectedUnit] = useState(parsed.unit);

  useEffect(() => {
    const next = parseCssValue(value, units, resolvedDefaultUnit);
    setDisplayNum(next.num !== null ? formatNumber(next.num) : "");
    setSelectedUnit(next.unit);
  }, [value, units, resolvedDefaultUnit]);

  const effStep =
    step ??
    (selectedUnit === "px" ? 1 : selectedUnit === "%" ? 1 : 0.05);

  const clamp = (n: number) => {
    let v = n;
    if (typeof min === "number") v = Math.max(min, v);
    if (typeof max === "number") v = Math.min(max, v);
    return v;
  };

  const emit = (num: number | null, unit: string) => {
    if (num === null) {
      setDisplayNum("");
      onChange("");
      return;
    }
    const next = clamp(num);
    setDisplayNum(formatNumber(next));
    onChange(buildCssValue(next, unit));
  };

  const handleStep = (dir: 1 | -1) => {
    const base = parsed.num ?? placeholderParsed?.num ?? 0;
    const current = displayNum === "" ? base : parseFloat(displayNum);
    if (!Number.isFinite(current)) return;
    emit(current + dir * effStep, selectedUnit);
  };

  const handleNumberChange = (raw: string) => {
    setDisplayNum(raw);
    if (raw === "" || raw === "-") {
      onChange("");
      return;
    }
    const num = parseFloat(raw);
    if (Number.isFinite(num)) {
      onChange(buildCssValue(num, selectedUnit));
    }
  };

  const handleUnitChange = (nextUnit: string) => {
    const unit = selectToUnit(nextUnit);
    setSelectedUnit(unit);
    if (displayNum === "") return;
    const num = parseFloat(displayNum);
    if (Number.isFinite(num)) {
      onChange(buildCssValue(num, unit));
    }
  };

  const hint =
    value ||
    (placeholder ? `Default: ${placeholder}` : "Inherit from theme / website font");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-gray-600">{label}</Label>
        {value && onReset ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 px-2 text-xs text-gray-500"
            title="Reset to inherit"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        ) : null}
      </div>

      <div className="flex items-stretch gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => handleStep(-1)}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="w-3.5 h-3.5" />
        </Button>

        <div className="flex flex-1 min-w-0 items-stretch rounded-md border border-input bg-white overflow-hidden">
          <Input
            type="number"
            inputMode="decimal"
            step={effStep}
            min={min}
            max={max}
            value={displayNum}
            onChange={(e) => handleNumberChange(e.target.value)}
            placeholder={
              placeholderParsed?.num !== null && placeholderParsed?.num !== undefined
                ? formatNumber(placeholderParsed.num)
                : undefined
            }
            className="h-9 border-0 rounded-none shadow-none focus-visible:ring-0 text-center font-mono text-sm"
          />
          {units.length > 0 ? (
            <Select value={unitToSelect(selectedUnit)} onValueChange={handleUnitChange}>
              <SelectTrigger className="h-9 w-[4.5rem] shrink-0 border-0 border-l rounded-none bg-gray-50 px-2 text-xs shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit || UNITLESS_VALUE} value={unitToSelect(unit)}>
                    {unitLabels?.[unit] ?? (unit === "" ? "—" : unit)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => handleStep(1)}
          aria-label={`Increase ${label}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <p className="text-[11px] text-gray-500">
        {value ? (
          <>
            Saved: <span className="font-mono text-gray-700">{value}</span>
          </>
        ) : (
          hint
        )}
      </p>
    </div>
  );
}

export function FontSizeField(props: Omit<CssUnitFieldProps, "units" | "defaultUnit">) {
  return (
    <CssUnitField
      {...props}
      units={["px", "rem", "em"]}
      defaultUnit="rem"
      min={0}
    />
  );
}

export function LineHeightField(props: Omit<CssUnitFieldProps, "units" | "defaultUnit" | "unitLabels">) {
  return (
    <CssUnitField
      {...props}
      units={["", "em", "rem", "%"]}
      unitLabels={{ "": "unitless" }}
      defaultUnit=""
      min={0}
    />
  );
}

export function LetterSpacingField(props: Omit<CssUnitFieldProps, "units" | "defaultUnit">) {
  return (
    <CssUnitField
      {...props}
      units={["em", "px", "rem"]}
      defaultUnit="em"
    />
  );
}

export function RadiusField(props: Omit<CssUnitFieldProps, "units" | "defaultUnit">) {
  return (
    <CssUnitField
      {...props}
      units={["px", "rem", "%"]}
      defaultUnit="rem"
      min={0}
    />
  );
}
