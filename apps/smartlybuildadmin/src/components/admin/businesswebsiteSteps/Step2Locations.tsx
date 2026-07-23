import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, X } from "lucide-react";
import {
  GooglePlacesAutocomplete,
  type GooglePlaceSelection,
} from "@/components/admin/GooglePlacesAutocomplete";

export type LocationItem = {
  id: string;
  address: string;
  createPage: boolean;
  lat?: number | null;
  lng?: number | null;
  googlePlaceId?: string | null;
  formattedAddress?: string | null;
  bounds?: GooglePlaceSelection["bounds"];
  country?: string | null;
  state?: string | null;
  city?: string | null;
};

type Step2LocationsProps = {
  currentLocationInput: string;
  setCurrentLocationInput: (value: string) => void;
  handleAddLocation: (place?: GooglePlaceSelection | null) => void;
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
          Search Google Maps and select each location so we save the exact pin (lat/lng) for your area pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="location-input">Add Location *</Label>
          <div className="flex gap-2">
            <GooglePlacesAutocomplete
              id="location-input"
              value={currentLocationInput}
              onChange={setCurrentLocationInput}
              onPlaceSelect={(place) => handleAddLocation(place)}
              onEnterWithoutSelection={() => handleAddLocation(null)}
              placeholder="Search Google Maps (e.g. Austin, TX)"
            />
            <Button
              type="button"
              onClick={() => handleAddLocation(null)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Prefer picking a Google suggestion — coordinates are saved automatically for the map pin.
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
                        {location.lat != null && location.lng != null
                          ? ` · pin ${Number(location.lat).toFixed(4)}, ${Number(location.lng).toFixed(4)}`
                          : " · map pin pending geocode"}
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
