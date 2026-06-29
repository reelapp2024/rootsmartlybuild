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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RotateCcw, Heading, AlignLeft, Link2, MousePointer } from "lucide-react";
import { PRESET_FONT_OPTIONS } from "./businesswebsiteSteps/designConfig";
import {
  FontSizeField,
  LineHeightField,
  LetterSpacingField,
  RadiusField,
} from "./TypographyUnitInputs";

/** Radix Select disallows empty string item values — use this for "inherit / theme default". */
const INHERIT_VALUE = "__inherit__";

export interface HeadingLevelStyle {
  color?: string;
  colorLight?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  highlightColor?: string;
  highlightColorLight?: string;
}

export interface TextLevelStyle {
  color?: string;
  colorLight?: string;
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontWeight?: string;
}

export interface ButtonStyle {
  backgroundColor?: string;
  color?: string;
  hoverBackgroundColor?: string;
  hoverColor?: string;
  borderRadius?: string;
  padding?: string;
  fontWeight?: string;
  fontFamily?: string;
  fontSize?: string;
  letterSpacing?: string;
}

export interface LinkStyle {
  color?: string;
  hoverColor?: string;
  underline?: "always" | "hover" | "none";
  fontFamily?: string;
  fontWeight?: string;
}

export interface GlobalElementStyles {
  headings?: {
    all?: HeadingLevelStyle;
    h1?: HeadingLevelStyle;
    h2?: HeadingLevelStyle;
    h3?: HeadingLevelStyle;
    h4?: HeadingLevelStyle;
    h5?: HeadingLevelStyle;
    h6?: HeadingLevelStyle;
  };
  text?: {
    base?: TextLevelStyle;
    small?: TextLevelStyle;
    large?: TextLevelStyle;
    xl?: TextLevelStyle;
  };
  button?: ButtonStyle;
  link?: LinkStyle;
}

const FONT_OPTIONS = [
  { label: "Theme Default", value: INHERIT_VALUE },
  ...PRESET_FONT_OPTIONS.map((f) => ({ label: f.name, value: f.value })),
];

const FONT_WEIGHT_OPTIONS = [
  { label: "Theme Default", value: INHERIT_VALUE },
  { label: "Light (300)", value: "300" },
  { label: "Regular (400)", value: "400" },
  { label: "Medium (500)", value: "500" },
  { label: "Semibold (600)", value: "600" },
  { label: "Bold (700)", value: "700" },
  { label: "Extra Bold (800)", value: "800" },
  { label: "Black (900)", value: "900" },
];

const UNDERLINE_OPTIONS = [
  { label: "Theme Default", value: INHERIT_VALUE },
  { label: "Always", value: "always" },
  { label: "On Hover", value: "hover" },
  { label: "Never", value: "none" },
];

function toSelectValue(stored: string | undefined): string {
  return stored ? stored : INHERIT_VALUE;
}

function fromSelectValue(selected: string): string {
  return selected === INHERIT_VALUE ? "" : selected;
}

const DEFAULT_HEADING_SIZES: Record<string, string> = {
  h1: "3rem",
  h2: "2.25rem",
  h3: "1.875rem",
  h4: "1.5rem",
  h5: "1.25rem",
  h6: "1rem",
};

const DEFAULT_TEXT_SIZES: Record<string, string> = {
  base: "1rem",
  small: "0.875rem",
  large: "1.125rem",
  xl: "1.25rem",
};

interface TypographyStylesPanelProps {
  value: GlobalElementStyles | undefined;
  onChange: (next: GlobalElementStyles) => void;
}

function ColorInput({
  label,
  value,
  onChange,
  onReset,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-gray-600">{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 border border-gray-300 rounded cursor-pointer"
        />
        <Input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Inherit"
          className="flex-1 h-9 text-sm"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 px-2"
            title="Reset to default"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-gray-600">{label}</Label>
      <Select
        value={toSelectValue(value)}
        onValueChange={(selected) => onChange(fromSelectValue(selected))}
      >
        <SelectTrigger className="w-full h-9 bg-white">
          <SelectValue placeholder={options[0]?.label || "Select"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function InputField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-gray-600">{label}</Label>
      <Input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-sm"
      />
    </div>
  );
}

function HeadingLevelEditor({
  level,
  title,
  description,
  value,
  onPatch,
  showSize = true,
  defaultSize,
}: {
  level: string;
  title: string;
  description: string;
  value: HeadingLevelStyle;
  onPatch: (patch: Partial<HeadingLevelStyle>) => void;
  showSize?: boolean;
  defaultSize?: string;
}) {
  return (
    <AccordionItem value={level} className="border rounded-lg mb-2">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <p className="text-xs text-gray-500 mb-4">{description}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorInput
            label="Color (Dark Sections)"
            value={value.color || ""}
            onChange={(c) => onPatch({ color: c })}
            onReset={() => onPatch({ color: "" })}
          />
          <ColorInput
            label="Color (Light Sections)"
            value={value.colorLight || ""}
            onChange={(c) => onPatch({ colorLight: c })}
            onReset={() => onPatch({ colorLight: "" })}
          />
          <SelectField
            label="Font Family"
            value={value.fontFamily || ""}
            options={FONT_OPTIONS}
            onChange={(val) => onPatch({ fontFamily: val })}
          />
          <SelectField
            label="Font Weight"
            value={value.fontWeight || ""}
            options={FONT_WEIGHT_OPTIONS}
            onChange={(val) => onPatch({ fontWeight: val })}
          />
          {showSize && (
            <FontSizeField
              label="Font Size"
              value={value.fontSize || ""}
              placeholder={defaultSize || "1rem"}
              onChange={(val) => onPatch({ fontSize: val })}
              onReset={() => onPatch({ fontSize: "" })}
            />
          )}
          <LineHeightField
            label="Line Height"
            value={value.lineHeight || ""}
            placeholder="1.2"
            onChange={(val) => onPatch({ lineHeight: val })}
            onReset={() => onPatch({ lineHeight: "" })}
          />
          <LetterSpacingField
            label="Letter Spacing"
            value={value.letterSpacing || ""}
            placeholder="0em"
            onChange={(val) => onPatch({ letterSpacing: val })}
            onReset={() => onPatch({ letterSpacing: "" })}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function TextLevelEditor({
  level,
  title,
  description,
  value,
  onPatch,
  defaultSize,
}: {
  level: string;
  title: string;
  description: string;
  value: TextLevelStyle;
  onPatch: (patch: Partial<TextLevelStyle>) => void;
  defaultSize?: string;
}) {
  return (
    <AccordionItem value={level} className="border rounded-lg mb-2">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <p className="text-xs text-gray-500 mb-4">{description}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorInput
            label="Color (Dark Sections)"
            value={value.color || ""}
            onChange={(c) => onPatch({ color: c })}
            onReset={() => onPatch({ color: "" })}
          />
          <ColorInput
            label="Color (Light Sections)"
            value={value.colorLight || ""}
            onChange={(c) => onPatch({ colorLight: c })}
            onReset={() => onPatch({ colorLight: "" })}
          />
          <SelectField
            label="Font Family"
            value={value.fontFamily || ""}
            options={FONT_OPTIONS}
            onChange={(val) => onPatch({ fontFamily: val })}
          />
          <SelectField
            label="Font Weight"
            value={value.fontWeight || ""}
            options={FONT_WEIGHT_OPTIONS}
            onChange={(val) => onPatch({ fontWeight: val })}
          />
          <FontSizeField
            label="Font Size"
            value={value.fontSize || ""}
            placeholder={defaultSize || "1rem"}
            onChange={(val) => onPatch({ fontSize: val })}
            onReset={() => onPatch({ fontSize: "" })}
          />
          <LineHeightField
            label="Line Height"
            value={value.lineHeight || ""}
            placeholder="1.6"
            onChange={(val) => onPatch({ lineHeight: val })}
            onReset={() => onPatch({ lineHeight: "" })}
          />
          <LetterSpacingField
            label="Letter Spacing"
            value={value.letterSpacing || ""}
            placeholder="0em"
            onChange={(val) => onPatch({ letterSpacing: val })}
            onReset={() => onPatch({ letterSpacing: "" })}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function TypographyStylesPanel({ value, onChange }: TypographyStylesPanelProps) {
  const v: GlobalElementStyles = value || {};

  const patchHeading = (
    level: "all" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
    patch: Partial<HeadingLevelStyle>
  ) => {
    onChange({
      ...v,
      headings: {
        ...v.headings,
        [level]: { ...(v.headings?.[level] || {}), ...patch },
      },
    });
  };

  const patchText = (
    level: "base" | "small" | "large" | "xl",
    patch: Partial<TextLevelStyle>
  ) => {
    onChange({
      ...v,
      text: {
        ...v.text,
        [level]: { ...(v.text?.[level] || {}), ...patch },
      },
    });
  };

  const patchButton = (patch: Partial<ButtonStyle>) => {
    onChange({
      ...v,
      button: { ...(v.button || {}), ...patch },
    });
  };

  const patchLink = (patch: Partial<LinkStyle>) => {
    onChange({
      ...v,
      link: { ...(v.link || {}), ...patch },
    });
  };

  const resetAll = () => onChange({});

  const headingLevels = [
    { key: "all", title: "All Headings (defaults)", description: "Applies to every heading unless a specific level overrides it.", showSize: false },
    { key: "h1", title: "H1", description: "Largest heading — usually one per page (hero title)." },
    { key: "h2", title: "H2", description: "Section titles." },
    { key: "h3", title: "H3", description: "Sub-section / card titles." },
    { key: "h4", title: "H4", description: "Smaller card / list-group titles." },
    { key: "h5", title: "H5", description: "Detail-level headings." },
    { key: "h6", title: "H6", description: "Smallest heading." },
  ] as const;

  const textLevels = [
    { key: "base", title: "Base Text", description: "Default body text size." },
    { key: "small", title: "Small Text", description: "Smaller text for captions, labels, etc." },
    { key: "large", title: "Large Text", description: "Larger text for emphasis." },
    { key: "xl", title: "XL Text", description: "Extra large text for featured content." },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Set site-wide typography defaults for each element type. These apply <strong>everywhere</strong> on the site
          unless an element has its own override in GenieBuild. This allows you to maintain consistent styling across your website.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetAll}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset All Styles
        </Button>
      </div>

      {/* Headings Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Heading className="w-5 h-5 text-gray-700" />
          <h3 className="text-base font-semibold text-gray-900">Headings (H1 – H6)</h3>
        </div>
        <p className="text-xs text-gray-500">
          Each level (h1–h6) is configurable independently with separate color slots for dark and light sections.
          Set "All Headings" first for shared defaults, then tweak per-level as needed.
        </p>
        <Accordion type="multiple" className="space-y-1" defaultValue={["all"]}>
          {headingLevels.map((lvl) => (
            <HeadingLevelEditor
              key={lvl.key}
              level={lvl.key}
              title={lvl.title}
              description={lvl.description}
              value={v.headings?.[lvl.key] || {}}
              onPatch={(patch) => patchHeading(lvl.key, patch)}
              showSize={lvl.showSize !== false}
              defaultSize={DEFAULT_HEADING_SIZES[lvl.key]}
            />
          ))}
        </Accordion>
      </div>

      {/* Body Text Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlignLeft className="w-5 h-5 text-gray-700" />
          <h3 className="text-base font-semibold text-gray-900">Body Text</h3>
        </div>
        <p className="text-xs text-gray-500">
          Configure different text sizes used throughout your website.
        </p>
        <Accordion type="multiple" className="space-y-1" defaultValue={["base"]}>
          {textLevels.map((lvl) => (
            <TextLevelEditor
              key={lvl.key}
              level={lvl.key}
              title={lvl.title}
              description={lvl.description}
              value={v.text?.[lvl.key] || {}}
              onPatch={(patch) => patchText(lvl.key, patch)}
              defaultSize={DEFAULT_TEXT_SIZES[lvl.key]}
            />
          ))}
        </Accordion>
      </div>

      {/* Buttons Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MousePointer className="w-5 h-5 text-gray-700" />
          <h3 className="text-base font-semibold text-gray-900">Buttons</h3>
        </div>
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorInput
              label="Background Color"
              value={v.button?.backgroundColor || ""}
              onChange={(c) => patchButton({ backgroundColor: c })}
              onReset={() => patchButton({ backgroundColor: "" })}
            />
            <ColorInput
              label="Text Color"
              value={v.button?.color || ""}
              onChange={(c) => patchButton({ color: c })}
              onReset={() => patchButton({ color: "" })}
            />
            <ColorInput
              label="Hover Background"
              value={v.button?.hoverBackgroundColor || ""}
              onChange={(c) => patchButton({ hoverBackgroundColor: c })}
              onReset={() => patchButton({ hoverBackgroundColor: "" })}
            />
            <ColorInput
              label="Hover Text"
              value={v.button?.hoverColor || ""}
              onChange={(c) => patchButton({ hoverColor: c })}
              onReset={() => patchButton({ hoverColor: "" })}
            />
            <SelectField
              label="Font Family"
              value={v.button?.fontFamily || ""}
              options={FONT_OPTIONS}
              onChange={(val) => patchButton({ fontFamily: val })}
            />
            <SelectField
              label="Font Weight"
              value={v.button?.fontWeight || ""}
              options={FONT_WEIGHT_OPTIONS}
              onChange={(val) => patchButton({ fontWeight: val })}
            />
            <FontSizeField
              label="Font Size"
              value={v.button?.fontSize || ""}
              placeholder="1rem"
              onChange={(val) => patchButton({ fontSize: val })}
              onReset={() => patchButton({ fontSize: "" })}
            />
            <RadiusField
              label="Border Radius"
              value={v.button?.borderRadius || ""}
              placeholder="0.5rem"
              onChange={(val) => patchButton({ borderRadius: val })}
              onReset={() => patchButton({ borderRadius: "" })}
            />
            <InputField
              label="Padding"
              value={v.button?.padding || ""}
              placeholder="0.625rem 1.25rem"
              onChange={(val) => patchButton({ padding: val })}
            />
            <LetterSpacingField
              label="Letter Spacing"
              value={v.button?.letterSpacing || ""}
              placeholder="0em"
              onChange={(val) => patchButton({ letterSpacing: val })}
              onReset={() => patchButton({ letterSpacing: "" })}
            />
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-gray-700" />
          <h3 className="text-base font-semibold text-gray-900">Links</h3>
        </div>
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorInput
              label="Link Color"
              value={v.link?.color || ""}
              onChange={(c) => patchLink({ color: c })}
              onReset={() => patchLink({ color: "" })}
            />
            <ColorInput
              label="Hover Color"
              value={v.link?.hoverColor || ""}
              onChange={(c) => patchLink({ hoverColor: c })}
              onReset={() => patchLink({ hoverColor: "" })}
            />
            <SelectField
              label="Font Family"
              value={v.link?.fontFamily || ""}
              options={FONT_OPTIONS}
              onChange={(val) => patchLink({ fontFamily: val })}
            />
            <SelectField
              label="Font Weight"
              value={v.link?.fontWeight || ""}
              options={FONT_WEIGHT_OPTIONS}
              onChange={(val) => patchLink({ fontWeight: val })}
            />
            <SelectField
              label="Underline"
              value={v.link?.underline || ""}
              options={UNDERLINE_OPTIONS}
              onChange={(val) => patchLink({ underline: val as "always" | "hover" | "none" })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
