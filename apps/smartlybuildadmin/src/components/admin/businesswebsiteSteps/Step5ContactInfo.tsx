import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Plus, Share2, X } from "lucide-react";
import { BusinessHoursEditor } from "./BusinessHoursEditor";
import type { BusinessHours } from "./businessHoursUtils";

type Step5ContactInfoProps = {
  title?: string;
  description?: string;
  emails: any[];
  phones: any[];
  addContactField: (type: "email" | "phone") => void;
  updateContactValue: (type: "email" | "phone", index: number, value: string) => void;
  setPrimaryContact: (type: "email" | "phone", index: number) => void;
  removeContactField: (type: "email" | "phone", index: number) => void;
  socialPlatforms: ReadonlyArray<{ key: string; label: string; placeholder: string }>;
  presetSocialUrls: Record<string, string>;
  setPresetSocialUrls: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  customSocialLinks: Array<{ id: string; label: string; url: string }>;
  setCustomSocialLinks: (value: Array<{ id: string; label: string; url: string }> | ((prev: Array<{ id: string; label: string; url: string }>) => Array<{ id: string; label: string; url: string }>)) => void;
  businessHours: BusinessHours;
  setBusinessHours: (value: BusinessHours | ((prev: BusinessHours) => BusinessHours)) => void;
};

export function Step5ContactInfo({
  title = "Step 5: Contact Information",
  description = "Enter contact methods, availability, and optional social links.",
  emails,
  phones,
  addContactField,
  updateContactValue,
  setPrimaryContact,
  removeContactField,
  socialPlatforms,
  presetSocialUrls,
  setPresetSocialUrls,
  customSocialLinks,
  setCustomSocialLinks,
  businessHours,
  setBusinessHours,
}: Step5ContactInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Emails *</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addContactField("email")}>
              <Plus className="h-4 w-4 mr-1" />
              Add Email
            </Button>
          </div>
          {emails.map((item, index) => (
            <div key={`email-${index}`} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-8 relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder="e.g., contact@mybusiness.com"
                  value={item.value}
                  onChange={(e) => updateContactValue("email", index, e.target.value)}
                  className="w-full pl-10"
                />
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <Checkbox
                  checked={item.is_primary}
                  onCheckedChange={() => setPrimaryContact("email", index)}
                />
                <span className="text-xs text-gray-600">Primary</span>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeContactField("email", index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Phones *</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addContactField("phone")}>
              <Plus className="h-4 w-4 mr-1" />
              Add Phone
            </Button>
          </div>
          {phones.map((item, index) => (
            <div key={`phone-${index}`} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-8 relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="e.g., +1 (555) 123-4567"
                  value={item.value}
                  onChange={(e) => updateContactValue("phone", index, e.target.value)}
                  className="w-full pl-10"
                />
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <Checkbox
                  checked={item.is_primary}
                  onCheckedChange={() => setPrimaryContact("phone", index)}
                />
                <span className="text-xs text-gray-600">Primary</span>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeContactField("phone", index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <BusinessHoursEditor value={businessHours} onChange={setBusinessHours} />

        <div className="space-y-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-gray-500" />
            <Label className="text-base">Social media (optional)</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Add profile URLs for common platforms. If yours is not listed, use &quot;Custom links&quot; below - you can add multiple names and URLs.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {socialPlatforms.map((p) => (
              <div key={p.key} className="space-y-1.5">
                <Label htmlFor={`social-${p.key}`} className="text-xs font-medium text-gray-700">
                  {p.label}
                </Label>
                <Input
                  id={`social-${p.key}`}
                  type="url"
                  inputMode="url"
                  placeholder={p.placeholder}
                  value={presetSocialUrls[p.key] || ""}
                  onChange={(e) =>
                    setPresetSocialUrls((prev) => ({ ...prev, [p.key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-sm font-medium text-gray-800">Custom links</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCustomSocialLinks((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), label: "", url: "" },
                  ])
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Add custom
              </Button>
            </div>
            {customSocialLinks.length > 0 && (
              <div className="space-y-2">
                {customSocialLinks.map((row) => (
                  <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <Input
                        placeholder="Platform name"
                        value={row.label}
                        onChange={(e) =>
                          setCustomSocialLinks((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r))
                          )
                        }
                      />
                    </div>
                    <div className="col-span-7">
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={row.url}
                        onChange={(e) =>
                          setCustomSocialLinks((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, url: e.target.value } : r))
                          )
                        }
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setCustomSocialLinks((prev) => prev.filter((r) => r.id !== row.id))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
