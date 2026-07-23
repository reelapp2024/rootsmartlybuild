import CreatableSelect from "react-select/creatable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, ImageIcon, Loader2, Wand2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type SectionImageOrigin = 1 | 2 | 4 | 5;

type Step1BasicInfoProps = {
  businessName: string;
  setBusinessName: (value: string) => void;
  sectionImageOrigin: SectionImageOrigin;
  setSectionImageOrigin: (value: SectionImageOrigin) => void;
  selectedCategory: any;
  setSelectedCategory: (value: any) => void;
  categories: Array<{ _id: string; name: string }>;
  selectedSubCategories: string[];
  setSelectedSubCategories: (value: string[] | ((prev: string[]) => string[])) => void;
  manualSubCategories: string[];
  setManualSubCategories: (value: string[]) => void;
  subCategories: Array<{ _id: string; name: string }>;
  manualMicroCategories: string[];
  setManualMicroCategories: (value: string[] | ((prev: string[]) => string[])) => void;
  focusKeyword: string;
  setFocusKeyword: (value: string) => void;
  generatingFK: boolean;
  generateFocusKeyword: () => void;
  projectKeywordsText: string;
  setProjectKeywordsText: (value: string) => void;
  generatingPK: boolean;
  handleGenerateProjectKeywords: () => void;
  serviceType: string;
};

export function Step1BasicInfo(props: Step1BasicInfoProps) {
  const {
    businessName,
    setBusinessName,
    sectionImageOrigin,
    setSectionImageOrigin,
    selectedCategory,
    setSelectedCategory,
    categories,
    selectedSubCategories,
    setSelectedSubCategories,
    manualSubCategories,
    setManualSubCategories,
    subCategories,
    manualMicroCategories,
    setManualMicroCategories,
    focusKeyword,
    setFocusKeyword,
    generatingFK,
    generateFocusKeyword,
    projectKeywordsText,
    setProjectKeywordsText,
    generatingPK,
    handleGenerateProjectKeywords,
    serviceType,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Basic Information</CardTitle>
        <CardDescription>
          Enter the basic details for your new business website.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            placeholder="Enter business name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>

        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-violet-600" />
            <Label className="text-base font-semibold text-gray-900">Image engine</Label>
          </div>
          <p className="text-xs text-gray-500">
            Used when server <code className="rounded bg-muted px-1">images_mode=1</code>. Freepik uses keyword/stock search; Gemini, Leonardo, and Flux use AI prompts.
          </p>
          <RadioGroup
            value={String(sectionImageOrigin)}
            onValueChange={(v) => {
              const n = Number(v);
              if (n === 1 || n === 2 || n === 4 || n === 5) setSectionImageOrigin(n);
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label
              htmlFor="img-engine-freepik"
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${sectionImageOrigin === 1 ? "border-violet-500 bg-violet-50/50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <RadioGroupItem value="1" id="img-engine-freepik" className="mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Freepik</div>
                <div className="text-sm text-gray-600">Stock search from keyword prompts</div>
              </div>
            </label>
            <label
              htmlFor="img-engine-gemini"
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${sectionImageOrigin === 2 ? "border-violet-500 bg-violet-50/50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <RadioGroupItem value="2" id="img-engine-gemini" className="mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Gemini AI</div>
                <div className="text-sm text-gray-600">Gemini-generated images from AI prompts</div>
              </div>
            </label>
            <label
              htmlFor="img-engine-leonardo"
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${sectionImageOrigin === 4 ? "border-violet-500 bg-violet-50/50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <RadioGroupItem value="4" id="img-engine-leonardo" className="mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Leonardo Lucid</div>
                <div className="text-sm text-gray-600">Leonardo Lucid Origin AI images from detailed prompts</div>
              </div>
            </label>
            <label
              htmlFor="img-engine-flux"
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${sectionImageOrigin === 5 ? "border-violet-500 bg-violet-50/50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <RadioGroupItem value="5" id="img-engine-flux" className="mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Flux 1 Schnell</div>
                <div className="text-sm text-gray-600">Fast Flux.1 Schnell AI images from detailed prompts</div>
              </div>
            </label>
          </RadioGroup>
        </div>

        <div className="space-y-4 pt-2 border-t">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <Label className="text-base font-semibold text-gray-900">Category & Classification</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <CreatableSelect
                id="category"
                isClearable={true}
                placeholder="Select or type category"
                value={selectedCategory ? { label: selectedCategory.name, value: selectedCategory._id || selectedCategory.name } : null}
                options={categories.map(c => ({ label: c.name, value: c._id, data: c }))}
                onChange={(option: any) => {
                  if (option) {
                    const found = categories.find(c => c._id === option.value);
                    if (found) setSelectedCategory(found);
                    else setSelectedCategory({ _id: "", name: option.value });
                  } else setSelectedCategory(null);
                }}
                onCreateOption={(inputValue: string) => setSelectedCategory({ _id: "", name: inputValue })}
                styles={{
                  control: (base: any) => ({
                    ...base,
                    borderColor: "#e5e7eb",
                    "&:hover": {
                      borderColor: "#3b82f6",
                    },
                    minHeight: "42px",
                  }),
                  placeholder: (base: any) => ({
                    ...base,
                    color: "#9ca3af",
                  }),
                }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Select an existing category or create a new one
            </p>
          </div>

          {selectedCategory && (
            <div className="space-y-2">
              <Label htmlFor="subCategory" className="text-sm font-medium text-gray-700">
                Sub Categories <span className="text-gray-400 text-xs">(Multiple Selection)</span>
              </Label>
              <CreatableSelect
                id="subCategory"
                isMulti={true}
                placeholder="Select or type subcategories"
                value={[
                  ...selectedSubCategories.map(name => ({ label: name, value: name })),
                  ...manualSubCategories.map(name => ({ label: name, value: name }))
                ]}
                options={subCategories.map(sc => ({ label: sc.name, value: sc.name }))}
                onChange={(options: any) => {
                  const values = Array.isArray(options) ? options.map((o: any) => o.value) : [];
                  setSelectedSubCategories(values);
                  setManualSubCategories([]);
                }}
                onCreateOption={(inputValue: string) => setSelectedSubCategories(prev => [...prev, inputValue])}
                styles={{
                  control: (base: any) => ({
                    ...base,
                    borderColor: "#e5e7eb",
                    "&:hover": {
                      borderColor: "#3b82f6",
                    },
                    minHeight: "42px",
                  }),
                  placeholder: (base: any) => ({
                    ...base,
                    color: "#9ca3af",
                  }),
                  multiValue: (base: any) => ({
                    ...base,
                    backgroundColor: "#dbeafe",
                    borderRadius: "6px",
                  }),
                  multiValueLabel: (base: any) => ({
                    ...base,
                    color: "#1e40af",
                    fontWeight: "500",
                  }),
                }}
              />
              <p className="text-xs text-gray-500">
                Add multiple subcategories to better classify your project
              </p>
            </div>
          )}

          {selectedCategory && (
            <div className="space-y-2">
              <Label htmlFor="microCategory" className="text-sm font-medium text-gray-700">
                Micro Categories <span className="text-gray-400 text-xs">(Optional, Multiple)</span>
              </Label>
              <CreatableSelect
                id="microCategory"
                isMulti={true}
                placeholder="Type micro categories"
                value={manualMicroCategories.map(name => ({ label: name, value: name }))}
                options={[]}
                onChange={(options: any) => {
                  const values = Array.isArray(options) ? options.map((o: any) => o.value) : [];
                  setManualMicroCategories(values);
                }}
                onCreateOption={(inputValue: string) => setManualMicroCategories(prev => [...prev, inputValue])}
                styles={{
                  control: (base: any) => ({
                    ...base,
                    borderColor: "#e5e7eb",
                    "&:hover": {
                      borderColor: "#3b82f6",
                    },
                    minHeight: "42px",
                  }),
                  placeholder: (base: any) => ({
                    ...base,
                    color: "#9ca3af",
                  }),
                  multiValue: (base: any) => ({
                    ...base,
                    backgroundColor: "#f0fdf4",
                    borderRadius: "6px",
                  }),
                  multiValueLabel: (base: any) => ({
                    ...base,
                    color: "#166534",
                    fontWeight: "500",
                  }),
                }}
              />
              <p className="text-xs text-gray-500">
                Add specific micro categories for detailed classification (optional)
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label htmlFor="focusKeyword">Main Focus Keyword</Label>
            <div className="flex gap-2">
              <Input
                id="focusKeyword"
                placeholder="e.g., emergency electrician"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={generateFocusKeyword} disabled={generatingFK}>
                {generatingFK ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Generate</span>
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              One primary keyword to focus your SEO (you can edit it).
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="projectKeywords">Project Keywords (comma-separated)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateProjectKeywords}
                disabled={generatingPK || !businessName || !serviceType}
                className="text-xs"
              >
                {generatingPK ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3 w-3 mr-1" />
                    AI Generate
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="projectKeywords"
              placeholder="e.g., 24 hour electrician, circuit breaker repair, wiring service"
              value={projectKeywordsText}
              onChange={(e) => setProjectKeywordsText(e.target.value)}
              className="w-full min-h-[100px]"
            />
            <p className="text-xs text-gray-500">
              Comma-separated keywords related to your business
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

