import React from 'react';
import { AccordionGroup, ColorInput, FontSizeInput, SelectInput } from '../inputs';
import { PRESET_THEMES, PRESET_FONTS } from '../../../constants';
import type { DefaultSizes, DefaultTypography } from '../state/themeSettingsHelpers';
import type { WebsiteData, SEOMetadata, WebsitePage, Section } from '../../../types';
import { SeoPanel } from './SeoPanel';
import { PagesPanel } from './PagesPanel';
import { SectionsListPanel } from './SectionsListPanel';

type GlobalTab = 'typography' | 'seo' | 'pages' | 'sections';
type GlobalColors = WebsiteData['globalStyles']['colors'];
type GlobalColorKey = keyof GlobalColors;

interface GlobalThemePanelProps {
  globalTab: GlobalTab;
  onGlobalTabChange: (tab: GlobalTab) => void;
  selectedPresetId: string | null;
  onPresetSelect: (theme: typeof PRESET_THEMES[0], presetIdx: number) => void;
  globalColors: GlobalColors;
  onGlobalColorChange: (key: GlobalColorKey, value: string) => void;
  defaultTypography: DefaultTypography;
  setDefaultTypography: React.Dispatch<React.SetStateAction<DefaultTypography>>;
  defaultSizes: DefaultSizes;
  setDefaultSizes: React.Dispatch<React.SetStateAction<DefaultSizes>>;
  savingTheme: boolean;
  onSaveTheme: () => void;
  seo: SEOMetadata;
  onSeoChange: (patch: Partial<SEOMetadata>) => void;
  onSeoUpload?: (field: 'ogImage' | 'favicon') => void;
  /** POST /generateWebsitePageSeo — AI fills SEO for the current WebsitePage. */
  onSeoRegenerate?: () => Promise<void> | void;
  // Pages
  pages?: WebsitePage[];
  currentPageId?: string;
  onSelectPage?: (pageId: string) => void;
  onAddPage?: (name: string, slug: string) => void;
  onRenamePage?: (pageId: string, name: string, slug: string) => void;
  onDeletePage?: (pageId: string) => void;
  onReorderPage?: (pageId: string, direction: 'up' | 'down') => void;
  // Sections list
  globalSections?: Section[];
  pageSections?: Section[];
  currentPageName?: string;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  onMoveSection?: (sectionId: string, direction: 'up' | 'down') => void;
  onDuplicateSection?: (sectionId: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  // Canvas prefs
  showSectionOutlines?: boolean;
  onToggleSectionOutlines?: (next: boolean) => void;
}

export const GlobalThemePanel: React.FC<GlobalThemePanelProps> = ({
  globalTab,
  onGlobalTabChange,
  selectedPresetId,
  onPresetSelect,
  globalColors,
  onGlobalColorChange,
  defaultTypography,
  setDefaultTypography,
  defaultSizes,
  setDefaultSizes,
  savingTheme,
  onSaveTheme,
  seo,
  onSeoChange,
  onSeoUpload,
  onSeoRegenerate,
  pages,
  currentPageId,
  onSelectPage,
  onAddPage,
  onRenamePage,
  onDeletePage,
  onReorderPage,
  globalSections,
  pageSections,
  currentPageName,
  selectedSectionId,
  onSelectSection,
  onMoveSection,
  onDuplicateSection,
  onDeleteSection,
  showSectionOutlines,
  onToggleSectionOutlines,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <h2 className="font-bold text-xs uppercase tracking-widest text-white/50 mb-3">Global Settings</h2>
        <div role="tablist" aria-label="Global settings tabs" className="flex bg-[#151515] p-1 rounded gap-0.5">
          <button
            type="button"
            role="tab"
            aria-selected={globalTab === 'pages'}
            onClick={() => onGlobalTabChange('pages')}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${globalTab === 'pages' ? 'bg-[#222] text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >Pages</button>
          <button
            type="button"
            role="tab"
            aria-selected={globalTab === 'sections'}
            onClick={() => onGlobalTabChange('sections')}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${globalTab === 'sections' ? 'bg-[#222] text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >Sections</button>
          <button
            type="button"
            role="tab"
            aria-selected={globalTab === 'typography'}
            onClick={() => onGlobalTabChange('typography')}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${globalTab === 'typography' ? 'bg-[#222] text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >Typography</button>
          <button
            type="button"
            role="tab"
            aria-selected={globalTab === 'seo'}
            onClick={() => onGlobalTabChange('seo')}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${globalTab === 'seo' ? 'bg-[#222] text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >SEO</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-20">
        {globalTab === 'typography' && (
          <div className="space-y-6">
            {/* GLOBAL COLORS — change once, applies site-wide (Elementor-style).
                Elements that read theme colors (accent/title/text/etc.) update
                everywhere when these change. */}
            <AccordionGroup title="Global Colors" defaultOpen={true}>
              <div className="space-y-3">
                <p className="text-[10px] text-white/40 leading-relaxed">
                  These are your site's core colors. Change one here and every
                  element using it updates across the whole site.
                </p>
                {([
                  { key: 'accentColor',          label: 'Accent / Primary' },
                  { key: 'backgroundColor',      label: 'Page Background' },
                  { key: 'titleColor',           label: 'Headings' },
                  { key: 'textColor',            label: 'Body Text' },
                  { key: 'subheadingColor',      label: 'Sub-headings' },
                  { key: 'buttonBackgroundColor',label: 'Button Background' },
                  { key: 'buttonTextColor',      label: 'Button Text' },
                  { key: 'linkColor',            label: 'Links' },
                  { key: 'cardBackgroundColor',  label: 'Card Background' },
                  { key: 'cardBorderColor',      label: 'Card Border' },
                ] as { key: GlobalColorKey; label: string }[]).map(({ key, label }) => (
                  <ColorInput
                    key={key}
                    label={label}
                    value={(globalColors as any)[key] || ''}
                    onChange={(v) => onGlobalColorChange(key, v)}
                    onReset={() => onGlobalColorChange(key, '')}
                  />
                ))}
              </div>
            </AccordionGroup>
            <AccordionGroup title="Default Fonts" defaultOpen={true}>
              <div className="space-y-4">
                <SelectInput
                  label="Title Font"
                  value={defaultTypography.titleFontFamily}
                  options={PRESET_FONTS.map(f => ({ label: f.name, value: f.value }))}
                  onChange={(v: string) => setDefaultTypography(prev => ({
                    ...prev,
                    titleFontFamily: v,
                    subtitleFontFamily: v,
                  }))}
                />
                <SelectInput
                  label="Body Font"
                  value={defaultTypography.descriptionFontFamily}
                  options={PRESET_FONTS.map(f => ({ label: f.name, value: f.value }))}
                  onChange={(v: string) => setDefaultTypography(prev => ({
                    ...prev,
                    descriptionFontFamily: v,
                  }))}
                />
                <SelectInput
                  label="Button Font"
                  value={defaultTypography.buttonFontFamily}
                  options={PRESET_FONTS.map(f => ({ label: f.name, value: f.value }))}
                  onChange={(v: string) => setDefaultTypography(prev => ({ ...prev, buttonFontFamily: v }))}
                />
              </div>
            </AccordionGroup>
            <AccordionGroup title="Heading Sizes" defaultOpen={true}>
              <div className="space-y-3">
                <FontSizeInput label="H1 (Default: 3rem / 48px)" value={defaultSizes.h1} onChange={(v) => setDefaultSizes(prev => ({ ...prev, h1: v }))} placeholder="3rem" />
                <FontSizeInput label="H2 (Default: 2.5rem / 40px)" value={defaultSizes.h2} onChange={(v) => setDefaultSizes(prev => ({ ...prev, h2: v }))} placeholder="2.5rem" />
                <FontSizeInput label="H3 (Default: 2rem / 32px)" value={defaultSizes.h3} onChange={(v) => setDefaultSizes(prev => ({ ...prev, h3: v }))} placeholder="2rem" />
                <FontSizeInput label="H4 (Default: 1.5rem / 24px)" value={defaultSizes.h4} onChange={(v) => setDefaultSizes(prev => ({ ...prev, h4: v }))} placeholder="1.5rem" />
                <FontSizeInput label="H5 (Default: 1.25rem / 20px)" value={defaultSizes.h5} onChange={(v) => setDefaultSizes(prev => ({ ...prev, h5: v }))} placeholder="1.25rem" />
                <FontSizeInput label="H6 (Default: 1rem / 16px)" value={defaultSizes.h6} onChange={(v) => setDefaultSizes(prev => ({ ...prev, h6: v }))} placeholder="1rem" />
              </div>
            </AccordionGroup>
            <AccordionGroup title="Text Sizes" defaultOpen={true}>
              <div className="space-y-3">
                <FontSizeInput label="Base Text (Default: 1rem / 16px)" value={defaultSizes.text} onChange={(v) => setDefaultSizes(prev => ({ ...prev, text: v }))} placeholder="1rem" />
                <FontSizeInput label="Small Text (Default: 0.875rem / 14px)" value={defaultSizes.textSmall} onChange={(v) => setDefaultSizes(prev => ({ ...prev, textSmall: v }))} placeholder="0.875rem" />
                <FontSizeInput label="Large Text (Default: 1.125rem / 18px)" value={defaultSizes.textLarge} onChange={(v) => setDefaultSizes(prev => ({ ...prev, textLarge: v }))} placeholder="1.125rem" />
                <FontSizeInput label="XL Text (Default: 1.25rem / 20px)" value={defaultSizes.textXl} onChange={(v) => setDefaultSizes(prev => ({ ...prev, textXl: v }))} placeholder="1.25rem" />
              </div>
            </AccordionGroup>
          </div>
        )}
        {globalTab === 'seo' && (
          <SeoPanel seo={seo} onSeoChange={onSeoChange} onUpload={onSeoUpload} onRegenerate={onSeoRegenerate} />
        )}
        {globalTab === 'pages' && pages && currentPageId && onSelectPage && onAddPage && onRenamePage && onDeletePage && onReorderPage && (
          <PagesPanel
            pages={pages}
            currentPageId={currentPageId}
            onSelectPage={onSelectPage}
            onAddPage={onAddPage}
            onRenamePage={onRenamePage}
            onDeletePage={onDeletePage}
            onReorderPage={onReorderPage}
          />
        )}
        {globalTab === 'sections' && onSelectSection && onMoveSection && onDuplicateSection && onDeleteSection && (
          <div className="space-y-4">
            {onToggleSectionOutlines && (
              <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white">Show section outlines</div>
                  <div className="text-[10px] text-white/40 mt-0.5">Draw a dashed border around every section on canvas so boundaries are easy to see.</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!showSectionOutlines}
                  aria-label="Toggle section outlines on canvas"
                  onClick={() => onToggleSectionOutlines(!showSectionOutlines)}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151515] ${showSectionOutlines ? 'bg-blue-500' : 'bg-[#333]'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showSectionOutlines ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            )}
            <SectionsListPanel
              globalSections={globalSections || []}
              pageSections={pageSections || []}
              currentPageName={currentPageName}
              selectedSectionId={selectedSectionId || null}
              onSelect={onSelectSection}
              onMove={onMoveSection}
              onDuplicate={onDuplicateSection}
              onDelete={onDeleteSection}
            />
          </div>
        )}
      </div>
      <div className="p-4 border-t border-white/10 bg-[#080808]">
        <button
          onClick={onSaveTheme}
          disabled={savingTheme}
          className={`w-full px-4 py-2 rounded text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
            savingTheme
              ? 'bg-gray-600 border-gray-600 text-white cursor-not-allowed'
              : 'bg-green-600 border-green-600 text-white hover:bg-green-700'
          }`}
        >
          {savingTheme ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <i className="fa-solid fa-save"></i>
              Save Theme Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};
