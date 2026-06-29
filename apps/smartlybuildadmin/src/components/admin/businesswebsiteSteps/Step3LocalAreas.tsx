import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, X } from "lucide-react";

type Step3LocalAreasProps = {
  locationsWithAreas: any[];
  setLocationsWithAreas: (value: any[] | ((prev: any[]) => any[])) => void;
  handleToggleLocalAreaPage: (locationId: string, areaId: string) => void;
};

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
          Add local areas for each location. This step is optional - you can skip it.
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
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id={`local-area-${locationArea.locationId}`}
                        placeholder="Type to search or enter local area name"
                        value={locationArea.localAreaInput}
                        onChange={(e) => {
                          setLocationsWithAreas(locationsWithAreas.map((l) =>
                            l.locationId === locationArea.locationId
                              ? { ...l, localAreaInput: e.target.value }
                              : l
                          ));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const input = e.currentTarget.value.trim();
                            if (input) {
                              const newArea = {
                                id: `${Date.now()}-${Math.random()}`,
                                name: input,
                                createPage: true,
                              };
                              setLocationsWithAreas(locationsWithAreas.map((l) =>
                                l.locationId === locationArea.locationId
                                  ? {
                                      ...l,
                                      localAreas: [...l.localAreas, newArea],
                                      localAreaInput: "",
                                    }
                                  : l
                              ));
                            }
                          }
                        }}
                        className="w-full pl-10"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        const input = locationArea.localAreaInput.trim();
                        if (input) {
                          const newArea = {
                            id: `${Date.now()}-${Math.random()}`,
                            name: input,
                            createPage: true,
                          };
                          setLocationsWithAreas(locationsWithAreas.map((l) =>
                            l.locationId === locationArea.locationId
                              ? {
                                  ...l,
                                  localAreas: [...l.localAreas, newArea],
                                  localAreaInput: "",
                                }
                              : l
                          ));
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter local area name and press Enter or click Add to add it to the list
                  </p>
                </div>

                {locationArea.localAreas.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-white">
                    {locationArea.localAreas.map((area: any) => (
                      <div
                        key={area.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                      >
                        <div className="flex items-center space-x-2 flex-1">
                          <Checkbox
                            checked={area.createPage}
                            onCheckedChange={() => handleToggleLocalAreaPage(locationArea.locationId, area.id)}
                          />
                          <span className="text-sm font-medium">{area.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLocationsWithAreas(locationsWithAreas.map((l) =>
                              l.locationId === locationArea.locationId
                                ? {
                                    ...l,
                                    localAreas: l.localAreas.filter((a: any) => a.id !== area.id),
                                  }
                                : l
                            ));
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

