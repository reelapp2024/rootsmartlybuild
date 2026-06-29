import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, X } from "lucide-react";

type LocationItem = {
  id: string;
  address: string;
  createPage: boolean;
};

type Step2LocationsProps = {
  currentLocationInput: string;
  setCurrentLocationInput: (value: string) => void;
  handleAddLocation: () => void;
  locations: LocationItem[];
  setLocations: (value: LocationItem[]) => void;
  handleToggleCreatePage: (locationId: string) => void;
  handleRemoveLocation: (locationId: string) => void;
};

export function Step2Locations({
  currentLocationInput,
  setCurrentLocationInput,
  handleAddLocation,
  locations,
  setLocations,
  handleToggleCreatePage,
  handleRemoveLocation,
}: Step2LocationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Business Locations</CardTitle>
        <CardDescription>
          Add locations for your business. You can add multiple locations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="location-input">Add Location *</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="location-input"
                placeholder="Enter location name (e.g., New York, NY or California, USA)"
                value={currentLocationInput}
                onChange={(e) => setCurrentLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLocation();
                  }
                }}
                className="w-full pl-10"
              />
            </div>
            <Button
              type="button"
              onClick={handleAddLocation}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Enter location name and press Enter or click Add to add it to the list
          </p>
        </div>

        {locations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Selected Locations ({locations.length})</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLocations(locations.map((loc) => ({ ...loc, createPage: true })));
                  }}
                >
                  Select All Pages
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLocations(locations.map((loc) => ({ ...loc, createPage: false })));
                  }}
                >
                  Deselect All Pages
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 bg-white rounded border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <Checkbox
                      id={`page-${location.id}`}
                      checked={location.createPage}
                      onCheckedChange={() => handleToggleCreatePage(location.id)}
                    />
                    <label
                      htmlFor={`page-${location.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{location.address}</span>
                      </div>
                      <span
                        className={`text-xs ml-6 ${
                          location.createPage ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {location.createPage ? "Page will be created" : "No page"}
                      </span>
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLocation(location.id)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

