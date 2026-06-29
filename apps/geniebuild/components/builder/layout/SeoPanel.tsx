import React from 'react';
import type { SEOMetadata } from '../../../types';
import { AccordionGroup, TextInput, TextAreaInput, SelectInput, ImageControl } from '../inputs';

interface SeoPanelProps {
  seo: SEOMetadata;
  onSeoChange: (patch: Partial<SEOMetadata>) => void;
  /** Called when user clicks the image upload button on ogImage/favicon. */
  onUpload?: (field: 'ogImage' | 'favicon') => void;
  /** Parent calls POST /generateWebsitePageSeo and merges result via onSeoChange. */
  onRegenerate?: () => Promise<void> | void;
}

const TITLE_MAX = 60;
const DESC_MAX = 160;

// Approximates Google's actual truncation behaviour. Google measures pixel
// width, not characters, but ~580px ≈ 60 chars for title and ~990px ≈ 160 for
// description, so character truncation is a close enough preview.
function truncateForSerp(s: string, max: number) {
  if (!s) return '';
  if (s.length <= max) return s;
  // Cut at the last word boundary before the limit so we don't mid-word slice
  // (Google shows "..." when it truncates).
  const slice = s.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > max - 20 ? slice.slice(0, lastSpace) : slice) + '…';
}

// SERP preview — a stripped-down imitation of how the page will look in
// Google's blue-link search results. The real visual is more complex
// (favicon row, breadcrumb URL, sitelinks) but this captures the three
// fields that matter for click-through rate: URL, title, description.
const SerpPreview: React.FC<{ seo: SEOMetadata }> = ({ seo }) => {
  const title = seo.title || 'Your Page Title';
  const description = seo.description || 'Your meta description appears here. Aim for 140-160 characters that summarise the page and include a call to action.';
  // Show canonical URL if set, otherwise a placeholder. Google strips the
  // protocol and shows breadcrumb-style.
  const rawUrl = seo.canonicalUrl || 'yourdomain.com/page';
  const displayUrl = rawUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div className="p-3 bg-white rounded border border-white/10">
      <div className="font-sans text-[13px] leading-snug">
        {/* URL line — small, dark grey in real Google */}
        <div className="text-[#202124] text-[12px] truncate">{displayUrl}</div>
        {/* Title — Google blue/purple, ~20px */}
        <div className="text-[#1a0dab] text-[18px] leading-tight font-normal mt-1 truncate">
          {truncateForSerp(title, TITLE_MAX)}
        </div>
        {/* Description — dark grey, ~14px, 2-line clamp */}
        <div className="text-[#4d5156] text-[13px] mt-1 leading-snug" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {truncateForSerp(description, DESC_MAX)}
        </div>
      </div>
    </div>
  );
};

export const SeoPanel: React.FC<SeoPanelProps> = ({ seo, onSeoChange, onUpload, onRegenerate }) => {
  const titleLen = (seo.title || '').length;
  const descLen = (seo.description || '').length;
  const [regenerating, setRegenerating] = React.useState(false);

  const handleRegenerate = async () => {
    if (!onRegenerate || regenerating) return;
    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {onRegenerate && (
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="w-full px-3 py-2 rounded bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-200 text-[11px] font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <i className={`fa-solid ${regenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`} aria-hidden="true"></i>
          {regenerating ? 'Regenerating with AI…' : 'Regenerate Title & Description with AI'}
        </button>
      )}

      <AccordionGroup title="Google Search Preview" defaultOpen={true}>
        <SerpPreview seo={seo} />
        <p className="text-[10px] text-white/40 leading-relaxed mt-2">
          How this page will appear in Google search results. Edit Title and Description below to update.
        </p>
      </AccordionGroup>

      <AccordionGroup title="Page Basics" defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <TextInput
              label="Page Title"
              value={seo.title || ''}
              onChange={(v) => onSeoChange({ title: v })}
              placeholder="e.g. Affordable Plumbing Services in Austin, TX"
            />
            <div className={`text-[9px] mt-1 ml-1 ${titleLen > TITLE_MAX ? 'text-red-400' : 'text-white/40'}`}>
              {titleLen} / {TITLE_MAX} chars {titleLen > TITLE_MAX && '— may be truncated by search engines'}
            </div>
          </div>

          <div>
            <TextAreaInput
              label="Meta Description"
              value={seo.description || ''}
              onChange={(v) => onSeoChange({ description: v })}
              placeholder="A short summary shown under the title in search results (max ~160 chars)."
              rows={3}
            />
            <div className={`text-[9px] mt-1 ml-1 ${descLen > DESC_MAX ? 'text-red-400' : 'text-white/40'}`}>
              {descLen} / {DESC_MAX} chars {descLen > DESC_MAX && '— may be truncated'}
            </div>
          </div>

          <TextInput
            label="Keywords (optional, comma-separated)"
            value={seo.keywords || ''}
            onChange={(v) => onSeoChange({ keywords: v })}
            placeholder="plumber, drain cleaning, water heater"
          />

          <TextInput
            label="Canonical URL"
            value={seo.canonicalUrl || ''}
            onChange={(v) => onSeoChange({ canonicalUrl: v })}
            placeholder="https://yourdomain.com/this-page"
          />

          <SelectInput
            label="Page Language"
            value={seo.language || 'en'}
            options={[
              { label: 'English', value: 'en' },
              { label: 'Spanish (Español)', value: 'es' },
              { label: 'French (Français)', value: 'fr' },
              { label: 'German (Deutsch)', value: 'de' },
              { label: 'Italian (Italiano)', value: 'it' },
              { label: 'Portuguese (Português)', value: 'pt' },
              { label: 'Hindi (हिन्दी)', value: 'hi' },
              { label: 'Arabic (العربية)', value: 'ar' },
              { label: 'Chinese (中文)', value: 'zh' },
              { label: 'Japanese (日本語)', value: 'ja' },
            ]}
            onChange={(v) => onSeoChange({ language: v })}
          />
        </div>
      </AccordionGroup>

      <AccordionGroup title="Social Sharing (OpenGraph / Twitter)" defaultOpen={false}>
        <div className="space-y-4">
          <TextInput
            label="OG Title (falls back to Page Title)"
            value={seo.ogTitle || ''}
            onChange={(v) => onSeoChange({ ogTitle: v })}
            placeholder="Shown when page is shared on Facebook, LinkedIn, etc."
          />

          <TextAreaInput
            label="OG Description (falls back to Meta Description)"
            value={seo.ogDescription || ''}
            onChange={(v) => onSeoChange({ ogDescription: v })}
            rows={2}
          />

          <div>
            <label className="text-[10px] font-bold text-white/40 capitalize ml-1 mb-1 block">
              Social Share Image (1200×630 recommended)
            </label>
            <ImageControl
              label=""
              value={seo.ogImage || ''}
              onChange={(v) => onSeoChange({ ogImage: v })}
              onUpload={() => onUpload?.('ogImage')}
            />
          </div>

          <SelectInput
            label="Twitter Card Type"
            value={seo.twitterCard || 'summary_large_image'}
            options={[
              { label: 'Large Image (recommended)', value: 'summary_large_image' },
              { label: 'Summary', value: 'summary' },
            ]}
            onChange={(v) => onSeoChange({ twitterCard: v as 'summary' | 'summary_large_image' })}
          />
        </div>
      </AccordionGroup>

      <AccordionGroup title="Crawling & Indexing" defaultOpen={false}>
        <div className="space-y-4">
          <SelectInput
            label="Robots Directive"
            value={seo.robots || 'index,follow'}
            options={[
              { label: 'Index, Follow (default — public page)', value: 'index,follow' },
              { label: 'Index, No-Follow', value: 'index,nofollow' },
              { label: 'No-Index, Follow', value: 'noindex,follow' },
              { label: 'No-Index, No-Follow (hidden page)', value: 'noindex,nofollow' },
            ]}
            onChange={(v) => onSeoChange({ robots: v as SEOMetadata['robots'] })}
          />
          <p className="text-[10px] text-white/40 leading-relaxed">
            Use "No-Index" for staging pages, thank-you pages, or duplicates you don't want in Google.
          </p>
        </div>
      </AccordionGroup>

      <AccordionGroup title="Advanced" defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-white/40 capitalize ml-1 mb-1 block">
              Favicon URL
            </label>
            <ImageControl
              label=""
              value={seo.favicon || ''}
              onChange={(v) => onSeoChange({ favicon: v })}
              onUpload={() => onUpload?.('favicon')}
            />
          </div>

          <TextAreaInput
            label="Custom JSON-LD Structured Data"
            value={seo.structuredData || ''}
            onChange={(v) => onSeoChange({ structuredData: v })}
            placeholder='{"@context":"https://schema.org","@type":"LocalBusiness","name":"..."}'
            rows={6}
          />
          <p className="text-[10px] text-white/40 leading-relaxed">
            Paste a raw JSON-LD block to enable rich results (business info, reviews, FAQ). Validate at{' '}
            <a href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer" className="text-blue-400 underline">
              Google Rich Results Test
            </a>.
          </p>
        </div>
      </AccordionGroup>

      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-300">
        <div className="flex items-start gap-2">
          <i className="fa-solid fa-circle-info mt-0.5" aria-hidden="true"></i>
          <div>
            These SEO settings are saved with your page and will be rendered into the public site's{' '}
            <code className="bg-white/10 px-1 rounded">&lt;head&gt;</code> at publish time.
          </div>
        </div>
      </div>
    </div>
  );
};
