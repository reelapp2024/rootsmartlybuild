import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, X } from "lucide-react";
import {
  GooglePlacesAutocomplete,
  type GooglePlaceSelection,
} from "@/components/admin/GooglePlacesAutocomplete";

type LocalArea = {
  id: string;
  name: string;
  createPage: boolean;
  lat?: number | null;
  lng?: number | null;
  googlePlaceId?: string | null;
  formattedAddress?: string | null;
  bounds?: GooglePlaceSelection["bounds"];
};

type LocationWithAreas = {
  locationId: string;
  locationName?: string;
  localAreas: LocalArea[];
  localAreaInput: string;
  generatingAreas?: boolean;
};

type Step3LocalAreasProps = {
  locationsWithAreas: LocationWithAreas[];
  setLocationsWithAreas: (value: LocationWithAreas[] | ((prev: LocationWithAreas[]) => LocationWithAreas[])) => void;
  handleToggleLocalAreaPage: (locationId: string, areaId: string) => void;
};

function addLocalArea(
  locationsWithAreas: LocationWithAreas[],
  locationId: string,
  name: string,
  place?: GooglePlaceSelection | null
) {
  const trimmed = name.trim();
  if (!trimmed) return locationsWithAreas;
  const newArea: LocalArea = {
    id: `${Date.now()}-${Math.random()}`,
    name: place?.name || trimmed,
    createPage: true,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    googlePlaceId: place?.placeId || null,
    formattedAddress: place?.formattedAddress || null,
    bounds: place?.bounds || null,
  };
  return locationsWithAreas.map((l) =>
    l.locationId === locationId
      ? {
          ...l,
          localAreas: [...l.localAreas, newArea],
          localAreaInput: "",
        }
      : l
  );
}

export function Step3LocalAreas({
  locationsWithAreas,
  setLocationsWithAreas,
  handleToggleLocalAreaPage,
}: Step3LocalAreasProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Local Areas (Optional)</CardTitle>
        <CardDescription>
          Add local areas with Google Maps so each area page can show an accurate map pin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {locationsWithAreas.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg bg-gray-50">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">No locations found</p>
            <p className="text-gray-400 text-xs mt-1">Please add locations in Step 2 first</p>
          </div>
        ) : (
          locationsWithAreas.map((locationArea) => {
            const locationName = locationArea.locationName || locationArea.locationId;

            return (
              <div key={locationArea.locationId} className="border-2 border-blue-100 rounded-xl p-6 bg-gradient-to-br from-blue-50/50 to-white space-y-5 shadow-sm">
                <div className="flex items-center space-x-3 pb-3 border-b border-blue-100">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{locationName}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {locationArea.localAreas.length > 0
                        ? `${locationArea.localAreas.length} local area${locationArea.localAreas.length > 1 ? "s" : ""} added`
                        : "No local areas added yet"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`local-area-${locationArea.locationId}`}>Add Local Area</Label>
                  <div className="flex gap-2">
                    <GooglePlacesAutocomplete
                      id={`local-area-${locationArea.locationId}`}
                      value={locationArea.localAreaInput}
                      onChange={(v) => {
                        setLocationsWithAreas(
                          locationsWithAreas.map((l) =>
                            l.locationId === locationArea.locationId
                              ? { ...l, localAreaInput: v }
                              : l
                          )
                        );
                      }}
                      onPlaceSelect={(place) => {
                        setLocationsWithAreas((prev) =>
                          addLocalArea(prev, locationArea.locationId, place.name, place)
                        );
                      }}
                      onEnterWithoutSelection={() => {
                        setLocationsWithAreas((prev) => {
                          const current = prev.find((l) => l.locationId === locationArea.locationId);
                          return addLocalArea(
                            prev,
                            locationArea.locationId,
                            current?.localAreaInput || "",
                            null
                          );
                        });
                      }}
                      placeholder={`Search area near ${locationName}`}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        setLocationsWithAreas((prev) =>
                          addLocalArea(
                            prev,
                            locationArea.locationId,
                            locationArea.localAreaInput,
                            null
                          )
                        );
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Select from Google Maps for the best map pin accuracy.
                  </p>
                </div>

                {locationArea.localAreas.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-white">
                    {locationArea.localAreas.map((area) => (
                      <div
                        key={area.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Checkbox
                            checked={area.createPage}
                            onCheckedChange={() =>
                              handleToggleLocalAreaPage(locationArea.locationId, area.id)
                            }
                          />
                          <div className="min-w-0">
                            <span className="text-sm font-medium block truncate">{area.name}</span>
                            {area.lat != null && area.lng != null ? (
                              <span className="text-[11px] text-green-600">
                                Pin saved
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-600">
                                Will geocode on save
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLocationsWithAreas(
                              locationsWithAreas.map((l) =>
                                l.locationId === locationArea.locationId
                                  ? {
                                      ...l,
                                      localAreas: l.localAreas.filter((a) => a.id !== area.id),
                                    }
                                  : l
                              )
                            );
                          }}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
