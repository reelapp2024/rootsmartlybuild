import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { httpFile } from "../../../config.js";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Search } from "lucide-react";

export type BulkGeoLocationPanelHandle = {
  saveCurrentStep: () => Promise<boolean>;
};

type CountryRow = { countryId?: string; name: string; status: number };
type StateRow = { id: string; name: string; countryId: string; manual?: boolean; status?: number };
type CityRow = { id: string; name: string; status?: number };
type LocalAreaRow = { id: string; name: string };

type BulkGeoLocationPanelProps = {
  step: 2 | 3 | 4 | 5;
  projectId: string | null;
};

export const BulkGeoLocationPanel = forwardRef<
  BulkGeoLocationPanelHandle,
  BulkGeoLocationPanelProps
>(function BulkGeoLocationPanel({ step, projectId }, ref) {
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const lastCitiesFetchKey = useRef("");
  const [countrySearch, setCountrySearch] = useState("");
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<CountryRow[]>([]);

  const [statesByCountry, setStatesByCountry] = useState<Record<string, StateRow[]>>({});
  const [selectedStates, setSelectedStates] = useState<Record<string, string[]>>({});

  const [citiesByState, setCitiesByState] = useState<Record<string, CityRow[]>>({});
  const [selectedCities, setSelectedCities] = useState<Record<string, string[]>>({});

  const [localAreas, setLocalAreas] = useState<Record<string, LocalAreaRow[]>>({});
  const [localAreaInput, setLocalAreaInput] = useState<Record<string, string>>({});

  const token = () => localStorage.getItem("token");
  const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

  const loadProjectGeo = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await httpFile.post(
        "/my_site",
        { projectId, pageType: "home" },
        { headers: authHeaders() }
      );
      const loc = res.data?.projectInfo?.locations || {};
      if (Array.isArray(loc.country)) {
        setSelectedCountries(
          loc.country.map((c: any) => ({
            countryId: String(c.countryId || c.id || ""),
            name: c.name,
            status: Number(c.status) === 1 ? 1 : 0,
          }))
        );
      }
      if (Array.isArray(loc.state)) {
        const byCountry: Record<string, string[]> = {};
        for (const s of loc.state) {
          const country = loc.country?.find((c: any) => String(c.countryId) === String(s.countryId));
          const countryName = country?.name;
          if (!countryName) continue;
          if (!byCountry[countryName]) byCountry[countryName] = [];
          if (Number(s.status) === 1) byCountry[countryName].push(s.name);
        }
        setSelectedStates(byCountry);
      }
      if (Array.isArray(loc.city)) {
        const byState: Record<string, string[]> = {};
        for (const c of loc.city) {
          const state = loc.state?.find((s: any) => String(s.stateId) === String(c.stateId));
          const stateName = state?.name;
          if (!stateName) continue;
          if (!byState[stateName]) byState[stateName] = [];
          if (Number(c.status) === 1) byState[stateName].push(c.name);
        }
        setSelectedCities(byState);
      }
      if (Array.isArray(loc.localArea)) {
        const grouped: Record<string, LocalAreaRow[]> = {};
        for (const la of loc.localArea) {
          const city = loc.city?.find((c: any) => String(c.cityId) === String(la.cityId));
          const cityName = city?.name;
          if (!cityName) continue;
          if (!grouped[cityName]) grouped[cityName] = [];
          grouped[cityName].push({
            id: String(la.localAreaId || la.id || `${cityName}-${la.name}`),
            name: la.name,
          });
        }
        setLocalAreas(grouped);
      }
    } catch (e) {
      console.warn("[BulkGeoLocationPanel] loadProjectGeo:", e);
    }
  }, [projectId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await httpFile.get("/fetch_countries", { headers: authHeaders() });
        const list = (res.data?.data || []).map((item: any) => ({
          countryId: String(item.id),
          name: item.name,
          status: 0,
        }));
        setCountries(list);
      } catch {
        toast({ title: "Error", description: "Failed to load countries", variant: "destructive" });
      }
    })();
  }, []);

  useEffect(() => {
    if (projectId) loadProjectGeo();
  }, [projectId, loadProjectGeo]);

  useEffect(() => {
    if (!countries.length || !selectedCountries.length) return;
    const needsBackfill = selectedCountries.some((c) => !c.countryId && c.name);
    if (!needsBackfill) return;
    setSelectedCountries((prev) =>
      prev.map((c) => {
        if (c.countryId) return c;
        const match = countries.find((x) => x.name === c.name);
        return match?.countryId ? { ...c, countryId: match.countryId } : c;
      })
    );
  }, [countries, selectedCountries]);

  useEffect(() => {
    if (step !== 3 || !selectedCountries.length) return;

    let cancelled = false;
    setLoadingStates(true);
    (async () => {
      const grouped: Record<string, StateRow[]> = {};

      await Promise.all(
        selectedCountries.map(async (country) => {
          const countryId = String(country.countryId || "").trim();
          if (!countryId) return;
          try {
            const res = await httpFile.get("/fetch_states", {
              headers: authHeaders(),
              params: { country_ids: countryId },
            });
            if (cancelled) return;
            grouped[countryId] = (res.data?.data || []).map((item: any) => ({
              id: String(item.id),
              name: item.name,
              countryId,
              manual: item.manual === 1,
              status: 0,
            }));
          } catch {
            if (!cancelled) grouped[countryId] = [];
          }
        })
      );

      if (!cancelled) {
        setStatesByCountry((prev) => ({ ...prev, ...grouped }));
        setLoadingStates(false);
      }
    })();

    return () => {
      cancelled = true;
      setLoadingStates(false);
    };
  }, [step, selectedCountries]);

  useEffect(() => {
    if (step < 3) {
      lastCitiesFetchKey.current = "";
      return;
    }

    const flatStates = Object.values(statesByCountry).flat();
    const stateEntries = Object.values(selectedStates)
      .flat()
      .map((name) => flatStates.find((s) => s.name === name))
      .filter((s): s is StateRow => !!s?.id);

    const fetchKey = stateEntries
      .map((s) => s.id)
      .sort()
      .join(",");
    if (!fetchKey || fetchKey === lastCitiesFetchKey.current) return;

    let cancelled = false;
    if (step === 4) setLoadingCities(true);

    (async () => {
      const idToName = new Map(stateEntries.map((s) => [s.id, s.name]));
      try {
        const res = await httpFile.get("/fetch_cities", {
          headers: authHeaders(),
          params: { state_ids: fetchKey },
        });
        if (cancelled) return;

        const grouped: Record<string, CityRow[]> = {};
        for (const entry of stateEntries) {
          grouped[entry.name] = [];
        }
        for (const item of res.data?.data || []) {
          const sid = String(item.state_id || item.stateId || "");
          const stateName = idToName.get(sid);
          if (!stateName) continue;
          grouped[stateName].push({
            id: String(item.id),
            name: item.name,
            status: 0,
          });
        }

        setCitiesByState((prev) => ({ ...prev, ...grouped }));
        lastCitiesFetchKey.current = fetchKey;
      } catch {
        if (!cancelled && step === 4) {
          toast({
            title: "Error",
            description: "Failed to load cities",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled && step === 4) setLoadingCities(false);
      }
    })();

    return () => {
      cancelled = true;
      if (step === 4) setLoadingCities(false);
    };
  }, [step, selectedStates, statesByCountry]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q));
  }, [countries, countrySearch]);

  const toggleCountry = (row: CountryRow) => {
    setSelectedCountries((prev) => {
      const exists = prev.some((c) => c.name === row.name);
      if (exists) return prev.filter((c) => c.name !== row.name);
      return [...prev, { ...row, status: 1 }];
    });
  };

  const toggleCountryPage = (name: string) => {
    setSelectedCountries((prev) =>
      prev.map((c) =>
        c.name === name ? { ...c, status: c.status === 1 ? 0 : 1 } : c
      )
    );
  };

  const toggleState = (countryName: string, stateName: string) => {
    setSelectedStates((prev) => {
      const list = prev[countryName] || [];
      const exists = list.includes(stateName);
      const nextList = exists ? list.filter((n) => n !== stateName) : [...list, stateName];
      return { ...prev, [countryName]: nextList };
    });
  };

  const toggleCity = (stateName: string, cityName: string) => {
    setSelectedCities((prev) => {
      const list = prev[stateName] || [];
      const exists = list.includes(cityName);
      const nextList = exists ? list.filter((n) => n !== cityName) : [...list, cityName];
      return { ...prev, [stateName]: nextList };
    });
  };

  const addLocalArea = (cityName: string) => {
    const raw = (localAreaInput[cityName] || "").trim();
    if (!raw) return;
    setLocalAreas((prev) => ({
      ...prev,
      [cityName]: [
        ...(prev[cityName] || []),
        { id: `manual-${Date.now()}`, name: raw },
      ],
    }));
    setLocalAreaInput((prev) => ({ ...prev, [cityName]: "" }));
  };

  const saveStep = async (): Promise<boolean> => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is missing. Complete basic info first.",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      if (step === 2) {
        if (!selectedCountries.length) {
          toast({
            title: "Validation",
            description: "Select at least one country.",
            variant: "destructive",
          });
          return false;
        }
        const countriesPayload = selectedCountries.filter((c) => c.countryId);
        const manualPayload = selectedCountries.filter((c) => !c.countryId);
        await httpFile.post(
          "/updateCountryInProject",
          { projectId, countries: countriesPayload, manualCountries: manualPayload },
          { headers: { ...authHeaders(), "Content-Type": "application/json" } }
        );
        toast({ title: "Success", description: "Countries saved." });
        return true;
      }

      if (step === 3) {
        const statesPayload: {
          countryId: string;
          stateId?: string;
          name: string;
          status: number;
        }[] = [];
        const manualStatesPayload: { countryId: string; name: string; status: number }[] = [];

        Object.entries(selectedStates).forEach(([countryName, stateNames]) => {
          const country = selectedCountries.find((c) => c.name === countryName);
          if (!country?.countryId) return;
          const countryStates = statesByCountry[country.countryId] || [];
          stateNames.forEach((stateName) => {
            const st = countryStates.find((s) => s.name === stateName);
            if (!st) return;
            const status = 1;
            if (st.manual) {
              manualStatesPayload.push({ countryId: country.countryId!, name: stateName, status });
            } else {
              statesPayload.push({
                countryId: country.countryId!,
                stateId: st.id,
                name: stateName,
                status,
              });
            }
          });
        });

        if (!statesPayload.length && !manualStatesPayload.length) {
          toast({
            title: "Validation",
            description: "Select at least one state.",
            variant: "destructive",
          });
          return false;
        }

        await httpFile.post(
          "/updateStateInProject",
          { projectId, states: statesPayload, manualStates: manualStatesPayload },
          { headers: { ...authHeaders(), "Content-Type": "application/json" } }
        );
        toast({ title: "Success", description: "States saved." });
        return true;
      }

      if (step === 4) {
        const citiesPayload: {
          stateId: string;
          cityId?: string;
          name: string;
          status: number;
        }[] = [];
        const manualCitiesPayload: { stateId: string; name: string; status: number }[] = [];

        Object.entries(selectedCities).forEach(([stateName, cityNames]) => {
          const stateEntry = Object.values(statesByCountry)
            .flat()
            .find((s) => s.name === stateName);
          if (!stateEntry?.id) return;
          const stateCities = citiesByState[stateName] || [];
          cityNames.forEach((cityName) => {
            const city = stateCities.find((c) => c.name === cityName);
            if (city?.id) {
              citiesPayload.push({
                stateId: stateEntry.id,
                cityId: city.id,
                name: cityName,
                status: 1,
              });
            } else {
              manualCitiesPayload.push({ stateId: stateEntry.id, name: cityName, status: 1 });
            }
          });
        });

        if (!citiesPayload.length && !manualCitiesPayload.length) {
          toast({
            title: "Validation",
            description: "Select at least one city.",
            variant: "destructive",
          });
          return false;
        }

        await httpFile.post(
          "/updateCityInProject",
          { projectId, cities: citiesPayload, manualCities: manualCitiesPayload },
          { headers: { ...authHeaders(), "Content-Type": "application/json" } }
        );
        toast({ title: "Success", description: "Cities saved." });
        return true;
      }

      if (step === 5) {
        const formatted = Object.entries(localAreas).flatMap(([cityName, areas]) => {
          const stateName = Object.keys(selectedCities).find((st) =>
            (selectedCities[st] || []).includes(cityName)
          );
          const stateEntry = stateName
            ? Object.values(statesByCountry)
                .flat()
                .find((s) => s.name === stateName)
            : null;
          const city = stateName ? (citiesByState[stateName] || []).find((c) => c.name === cityName) : null;
          const cityId = city?.id || null;
          return (areas || []).map((a) => ({ name: a.name, cityId }));
        });

        if (!formatted.length) {
          toast({
            title: "Validation",
            description: "Add at least one local area or use Skip.",
            variant: "destructive",
          });
          return false;
        }

        await httpFile.post(
          "/updateLocalAreaInProject",
          { projectId, localAreas: formatted },
          { headers: { ...authHeaders(), "Content-Type": "application/json" } }
        );
        toast({ title: "Success", description: "Local areas saved." });
        return true;
      }

      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to save locations",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({ saveCurrentStep: saveStep }), [saveStep]);

  if (step === 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Countries</CardTitle>
          <CardDescription>Select countries for your bulk pages website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search countries..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
            />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2 border rounded-lg p-3">
            {filteredCountries.map((c) => {
              const selected = selectedCountries.some((x) => x.name === c.name);
              const sel = selectedCountries.find((x) => x.name === c.name);
              return (
                <div key={c.countryId || c.name} className="flex items-center justify-between gap-2 p-2 rounded border">
                  <button
                    type="button"
                    className="text-left flex-1 text-sm font-medium"
                    onClick={() => toggleCountry(c)}
                  >
                    {c.name} {selected ? "✓" : ""}
                  </button>
                  {selected && (
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={sel?.status === 1}
                        onCheckedChange={() => toggleCountryPage(c.name)}
                      />
                      Create page
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardContent>
      </Card>
    );
  }

  if (step === 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>States</CardTitle>
          <CardDescription>Select states for each chosen country.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingStates && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading states…
            </div>
          )}
          {selectedCountries.map((country) => {
            const list = statesByCountry[country.countryId || ""] || [];
            const picked = selectedStates[country.name] || [];
            const missingCountryId = !country.countryId;
            return (
              <div key={country.name} className="space-y-2">
                <Label>{country.name}</Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto border rounded p-2">
                  {list.map((st) => (
                    <label key={st.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={picked.includes(st.name)}
                        onCheckedChange={() => toggleState(country.name, st.name)}
                      />
                      {st.name}
                    </label>
                  ))}
                  {!loadingStates && missingCountryId && (
                    <p className="text-xs text-muted-foreground">
                      Country ID missing — re-save countries in the previous step.
                    </p>
                  )}
                  {!loadingStates && !missingCountryId && !list.length && (
                    <p className="text-xs text-muted-foreground">No states loaded for this country.</p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  if (step === 4) {
    const stateNames = Object.entries(selectedStates).flatMap(([, names]) => names);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cities</CardTitle>
          <CardDescription>Select cities for each chosen state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingCities && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading cities…
            </div>
          )}
          {stateNames.map((stateName) => {
            const list = citiesByState[stateName] || [];
            const picked = selectedCities[stateName] || [];
            return (
              <div key={stateName} className="space-y-2">
                <Label>{stateName}</Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto border rounded p-2">
                  {list.map((city) => (
                    <label key={city.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={picked.includes(city.name)}
                        onCheckedChange={() => toggleCity(stateName, city.name)}
                      />
                      {city.name}
                    </label>
                  ))}
                  {!loadingCities && !list.length && (
                    <p className="text-xs text-muted-foreground">No cities found for this state.</p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  const cityNames = Object.entries(selectedCities).flatMap(([, names]) => names);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Local Areas</CardTitle>
        <CardDescription>Add local areas under each selected city (optional — you can skip).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {cityNames.map((cityName) => (
          <div key={cityName} className="space-y-2 border rounded-lg p-3">
            <Label>{cityName}</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Local area name"
                value={localAreaInput[cityName] || ""}
                onChange={(e) =>
                  setLocalAreaInput((prev) => ({ ...prev, [cityName]: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && addLocalArea(cityName)}
              />
              <Button type="button" variant="outline" onClick={() => addLocalArea(cityName)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="text-sm space-y-1">
              {(localAreas[cityName] || []).map((a) => (
                <li key={a.id} className="text-gray-700">
                  • {a.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!cityNames.length && (
          <p className="text-sm text-muted-foreground">Select cities in the previous step first.</p>
        )}
      </CardContent>
    </Card>
  );
});
