import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { httpFile } from "@/config";
import { cn } from "@/lib/utils";

export type GooglePlaceSelection = {
  name: string;
  formattedAddress: string;
  placeId: string;
  lat: number | null;
  lng: number | null;
  bounds?: {
    southwest: { lat: number; lng: number };
    northeast: { lat: number; lng: number };
  } | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
};

type Prediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

type GooglePlacesAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: GooglePlaceSelection) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  /** Called when user presses Enter without picking a suggestion (manual add). */
  onEnterWithoutSelection?: () => void;
};

function newSessionToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Google Places Autocomplete input (server-proxied).
 * Selecting a suggestion resolves lat/lng via Place Details.
 */
export function GooglePlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search Google Maps for a location…",
  id,
  className,
  disabled,
  onEnterWithoutSelection,
}: GooglePlacesAutocompleteProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [highlight, setHighlight] = useState(0);
  const sessionRef = useRef(newSessionToken());
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFetchRef = useRef(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    "Content-Type": "application/json",
  });

  const fetchPredictions = useCallback(async (input: string) => {
    const q = input.trim();
    if (q.length < 2) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await httpFile.post(
        "/places/autocomplete",
        { input: q, sessionToken: sessionRef.current },
        { headers: authHeaders() }
      );
      const list: Prediction[] = Array.isArray(res.data?.predictions)
        ? res.data.predictions
        : [];
      setPredictions(list);
      setHighlight(0);
      setOpen(list.length > 0);
    } catch {
      setPredictions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchPredictions(value);
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchPredictions]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectPrediction = async (p: Prediction) => {
    setResolving(true);
    setOpen(false);
    try {
      const res = await httpFile.post(
        "/places/details",
        { placeId: p.placeId, sessionToken: sessionRef.current },
        { headers: authHeaders() }
      );
      const place = res.data?.place;
      const name = String(
        place?.name || place?.formattedAddress || p.mainText || p.description || ""
      ).trim();
      skipFetchRef.current = true;
      onChange(name);
      onPlaceSelect({
        name,
        formattedAddress: String(place?.formattedAddress || p.description || name).trim(),
        placeId: String(place?.placeId || p.placeId),
        lat: place?.lat ?? null,
        lng: place?.lng ?? null,
        bounds: place?.bounds || null,
        country: place?.country || null,
        state: place?.state || null,
        city: place?.city || null,
      });
      sessionRef.current = newSessionToken();
      setPredictions([]);
    } catch {
      // Fallback: use description only; server will geocode on save
      skipFetchRef.current = true;
      onChange(p.mainText || p.description);
      onPlaceSelect({
        name: p.mainText || p.description,
        formattedAddress: p.description,
        placeId: p.placeId,
        lat: null,
        lng: null,
      });
    } finally {
      setResolving(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative flex-1">
      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled || resolving}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (predictions.length) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, Math.max(predictions.length - 1, 0)));
            setOpen(true);
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
            return;
          }
          if (e.key === "Escape") {
            setOpen(false);
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            if (open && predictions[highlight]) {
              void selectPrediction(predictions[highlight]);
            } else if (onEnterWithoutSelection) {
              onEnterWithoutSelection();
            }
          }
        }}
        className={cn("w-full pl-10 pr-10", className)}
        autoComplete="off"
      />
      {(loading || resolving) && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
      )}
      {open && predictions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-white shadow-lg"
        >
          {predictions.map((p, i) => (
            <li
              key={p.placeId}
              role="option"
              aria-selected={i === highlight}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm border-b last:border-0",
                i === highlight ? "bg-blue-50" : "hover:bg-gray-50"
              )}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                void selectPrediction(p);
              }}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.mainText}</p>
                  {p.secondaryText ? (
                    <p className="text-xs text-gray-500 truncate">{p.secondaryText}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GooglePlacesAutocomplete;
