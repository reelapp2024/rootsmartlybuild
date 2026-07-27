import React from 'react';
import {
  ImageContentForm, ImageBoxContentForm, VideoContentForm, IconContentForm,
  BadgeContentForm, StarRatingContentForm, AccordionContentForm, LogoCloudContentForm,
  FeatureBoxContentForm, PricingItemContentForm, StatCardContentForm, IconBoxContentForm,
  ProgressBarContentForm, CountdownTimerContentForm,
  TestimonialCardContentForm,
  AlertBoxContentForm, FlipBoxContentForm,
  UserAvatarsContentForm, TestimonialContentForm, TrustStripContentForm, TabsContentForm, PricingTableContentForm, ReviewCarouselContentForm, ListContentForm, NavMenuContentForm, HeadingContentForm, TextContentForm,
  DividerContentForm, SpacerContentForm, LinkNewTabToggle, ContactSourceFields,
} from '../content-forms';
import { inferElementContactKind, inferKindFromLink } from '../../../lib/contactResolver';
import { IconPicker, SelectInput, TextAreaInput, TextInput } from '../inputs';
import type { Section, WebsiteElement, WebsiteData } from '../../../types';
import type { DefaultSizes } from '../state/themeSettingsHelpers';

/**
 * Inline content controls for the <button> element. Fields:
 *   icon + position (existing), loading + loadingText (existing)
 *   size           — sm / md / lg / xl preset (sets padding + fontSize together)
 *   width          — auto / full / fixed
 *   hoverEffect    — none / lift / scale / arrow / glow
 *   openInNewTab   — toggle (only visible when link is set)
 *   animation      — reveal-on-scroll preset
 *   animationDelay — seconds
 */
const ButtonIconAndStateControls: React.FC<{
  content: WebsiteElement['content'];
  onContentUpdate: (updates: Partial<WebsiteElement['content']>) => void;
}> = ({ content, onContentUpdate }) => {
  const c = content as any;
  const hasIcon = c?.icon && c.icon !== 'none';
  const loading = !!c?.loading;
  const hasLink = !!(c?.link && c.link.toString().trim());
  const size: 'sm' | 'md' | 'lg' | 'xl' = (['sm','md','lg','xl'] as const).includes(c?.size) ? c.size : 'md';
  const width: 'auto' | 'full' | 'fixed' = (['auto','full','fixed'] as const).includes(c?.width) ? c.width : 'auto';
  const hoverEffect: string = c?.hoverEffect || 'lift';
  // Defaults to ON. User can flip to same-tab via the toggle below.
  const openInNewTab = c?.openInNewTab === undefined ? true : !!c.openInNewTab;

  return (
    <>
      {/* ───────── SIZE ───────── */}
      <div>
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Size</label>
        <div className="grid grid-cols-4 gap-2">
          {([
            { value: 'sm', label: 'SM' },
            { value: 'md', label: 'MD' },
            { value: 'lg', label: 'LG' },
            { value: 'xl', label: 'XL' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => onContentUpdate({ size: opt.value } as any)}
              className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
                size === opt.value
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ───────── WIDTH ───────── */}
      <div>
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Width</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'auto',  label: 'Auto',  icon: 'fa-arrows-left-right-to-line' },
            { value: 'full',  label: 'Full',  icon: 'fa-grip-lines' },
            { value: 'fixed', label: 'Fixed', icon: 'fa-square' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => onContentUpdate({ width: opt.value } as any)}
              className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                width === opt.value
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
              }`}
            >
              <i className={`fa-solid ${opt.icon} text-sm`} />
              {opt.label}
            </button>
          ))}
        </div>
        {width === 'fixed' && (
          <div className="mt-2">
            <TextInput
              label="Fixed Width"
              value={String(c?.fixedWidth || '')}
              onChange={(v) => onContentUpdate({ fixedWidth: v } as any)}
              placeholder="200px · 12rem"
            />
          </div>
        )}
      </div>

      {/* ───────── ICON ───────── */}
      <div className="pt-3 mt-1 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Icon</h4>
        <IconPicker
          label="Icon (optional)"
          value={c?.icon || ''}
          onChange={(v) => {
            const iconValue = v === 'none' ? 'none' : (v.startsWith('fa-') ? v : `fa-${v}`);
            onContentUpdate({ icon: iconValue } as any);
          }}
        />
        {hasIcon && (
          <>
            <SelectInput
              label="Icon Position"
              value={c?.iconPosition || 'left'}
              options={[
                { label: 'Left of text', value: 'left' },
                { label: 'Right of text', value: 'right' },
              ]}
              onChange={(v) => onContentUpdate({ iconPosition: v } as any)}
            />
            <button
              type="button"
              onClick={() => onContentUpdate({ icon: 'none' } as any)}
              className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              <i className="fa-solid fa-eye-slash mr-2" />Remove Icon
            </button>
          </>
        )}
      </div>

      {/* ───────── HOVER EFFECT ───────── */}
      <SelectInput
        label="Hover Effect"
        value={hoverEffect}
        options={[
          { label: 'None',           value: 'none' },
          { label: 'Lift (default)', value: 'lift' },
          { label: 'Scale',          value: 'scale' },
          { label: 'Slide Arrow',    value: 'arrow' },
          { label: 'Glow',           value: 'glow' },
        ]}
        onChange={(v) => onContentUpdate({ hoverEffect: v } as any)}
      />

      {/* ───────── OPEN IN NEW TAB ───────── */}
      {hasLink && (
        <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white">Open in new tab</div>
            <div className="text-[10px] text-white/40 mt-0.5">Adds <code>target="_blank"</code> + secure rel attrs.</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={openInNewTab}
            onClick={() => onContentUpdate({ openInNewTab: !openInNewTab } as any)}
            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${openInNewTab ? 'bg-blue-500' : 'bg-[#333]'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${openInNewTab ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
      )}

      {/* ───────── LOADING STATE ───────── */}
      <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white">Loading State Preview</div>
          <div className="text-[10px] text-white/40 mt-0.5">Shows a spinner + "Loading…" label.</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={loading}
          onClick={() => onContentUpdate({ loading: !loading } as any)}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${loading ? 'bg-blue-500' : 'bg-[#333]'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${loading ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
      {loading && (
        <TextInput
          label="Loading Text"
          value={String(c?.loadingText || '')}
          onChange={(v) => onContentUpdate({ loadingText: v } as any)}
          placeholder="Loading…"
        />
      )}

      {/* ───────── REVEAL ANIMATION ───────── */}
      <div className="pt-3 mt-1 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reveal Animation</h4>
        <SelectInput
          label="Preset"
          value={(c?.animation as string) || 'none'}
          options={[
            { label: 'None',          value: 'none' },
            { label: 'Fade Up',       value: 'fade-up' },
            { label: 'Slide Left',    value: 'slide-left' },
            { label: 'Slide Right',   value: 'slide-right' },
            { label: 'Scale In',      value: 'scale-in' },
            { label: 'Pulse',         value: 'pulse' },
          ]}
          onChange={(v) => onContentUpdate({ animation: v } as any)}
        />
      </div>
    </>
  );
};

interface Props {
  selectedSection: Section;
  selectedElement: WebsiteElement;
  defaultSizes: DefaultSizes;
  siteData: WebsiteData;
  onUpdateElement: (sectionId: string, elementId: string, updates: Partial<WebsiteElement>) => void;
  onUpdateSectionStyle: (sectionId: string, key: string, value: any) => void;
  onTriggerUpload: (sectionId: string, field: string, elementId?: string) => void;
}

/**
 * Routes each element.type to its dedicated content form. Renders the
 * right sidebar "Content" tab body for the currently-selected element.
 */
export const ElementContentFormSelector: React.FC<Props> = ({
  selectedSection,
  selectedElement,
  defaultSizes,
  siteData,
  onUpdateElement,
  onUpdateSectionStyle,
  onTriggerUpload,
}) => {
  const updateContent = (updates: any) =>
    onUpdateElement(selectedSection.id, selectedElement.id, { content: { ...(selectedElement.content || {}), ...updates } });
  const linkVal = String(selectedElement.content?.link || '');
  const linkContactKind = inferKindFromLink(linkVal);
  const contactKind = inferElementContactKind(selectedElement) || linkContactKind;
  const contactSource = String(
    (selectedElement.content as any)?.contactSource ||
      (linkContactKind ? 'about_primary' : 'about_primary')
  );
  const showContactTextFields = !contactKind || contactSource === 'manual';

  const handleLinkChange = (v: string) => {
    const kind = inferKindFromLink(v);
    const updates: Record<string, unknown> = { link: v };
    if (kind) {
      updates.contactKind = kind;
      if (!(selectedElement.content as any)?.contactSource) {
        updates.contactSource = 'about_primary';
      }
    }
    updateContent(updates);
  };
  const updateStyle = (updates: any) =>
    onUpdateElement(selectedSection.id, selectedElement.id, { style: { ...(selectedElement.style as any || {}), ...updates } });
  const triggerItemUpload = (idx: number, field: string) =>
    onTriggerUpload(selectedSection.id, `items.${idx}.${field}`, selectedElement.id);

  return (
    <div className="space-y-4">
      {selectedElement.type === 'image' ? (
        <ImageContentForm
          content={selectedElement.content}
          onContentUpdate={updateContent}
          onUpload={() => onTriggerUpload(selectedSection.id, 'imageUrl', selectedElement.id)}
        />
      ) : selectedElement.type === 'image-box' ? (
        <ImageBoxContentForm
          content={selectedElement.content}
          onContentUpdate={updateContent}
          onUpload={() => onTriggerUpload(selectedSection.id, 'imageUrl', selectedElement.id)}
        />
      ) : selectedElement.type === 'video' ? (
        <VideoContentForm
          content={selectedElement.content}
          onContentUpdate={updateContent}
          onUpload={() => onTriggerUpload(selectedSection.id, 'videoUrl', selectedElement.id)}
        />
      ) : selectedElement.type === 'icon' ? (
        <IconContentForm
          content={selectedElement.content}
          style={selectedElement.style}
          onElementUpdate={(updates) => onUpdateElement(selectedSection.id, selectedElement.id, updates)}
        />
      ) : selectedElement.type === 'badge' ? (
        <BadgeContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'star-rating' ? (
        <StarRatingContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'accordion' ? (
        <AccordionContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'logo-cloud' ? (
        <LogoCloudContentForm
          content={selectedElement.content}
          onContentUpdate={updateContent}
          onItemUpload={triggerItemUpload}
        />
      ) : selectedElement.type === 'trust-strip' ? (
        <TrustStripContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'list' ? (
        <ListContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'nav-menu' ? (
        <NavMenuContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'alert-box' ? (
        <AlertBoxContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'progress-bar' ? (
        <ProgressBarContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'countdown-timer' ? (
        <CountdownTimerContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'tabs' ? (
        <TabsContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'pricing-table' ? (
        <PricingTableContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'flip-box' ? (
        <FlipBoxContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'review-carousel' ? (
        <ReviewCarouselContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'feature-box' ? (
        <>
          <FeatureBoxContentForm content={selectedElement.content} onContentUpdate={updateContent} />
          {contactKind && (
            <ContactSourceFields
              kind={contactKind}
              content={(selectedElement.content || {}) as Record<string, unknown>}
              onContentUpdate={updateContent}
            />
          )}
        </>
      ) : selectedElement.type === 'pricing-item' ? (
        <PricingItemContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'stat-card' ? (
        <StatCardContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'icon-box' ? (
        <IconBoxContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'user-avatars' ? (
        <UserAvatarsContentForm
          content={selectedElement.content}
          onContentUpdate={updateContent}
          onItemUpload={triggerItemUpload}
        />
      ) : selectedElement.type === 'testimonial' ? (
        <TestimonialContentForm
          content={selectedElement.content}
          onContentUpdate={updateContent}
          onItemUpload={triggerItemUpload}
        />
      ) : selectedElement.type === 'testimonial-card' ? (
        <TestimonialCardContentForm
          content={selectedElement.content}
          onContentUpdate={updateContent}
          onUpload={() => onTriggerUpload(selectedSection.id, 'avatar', selectedElement.id)}
        />
      ) : selectedElement.type === 'card' ? (
        <p className="text-white/50 text-xs">Card appearance is edited in the Design tab.</p>
      ) : selectedElement.type === 'divider' ? (
        <DividerContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : selectedElement.type === 'spacer' ? (
        <SpacerContentForm content={selectedElement.content} onContentUpdate={updateContent} />
      ) : (
        <>
          {selectedElement.type === 'heading' ? (
            <HeadingContentForm
              element={selectedElement}
              section={selectedSection}
              defaultSizes={defaultSizes as unknown as Record<string, string>}
              onContentUpdate={updateContent}
              onStyleUpdate={updateStyle}
              onSectionStyleUpdate={(k, v) => onUpdateSectionStyle(selectedSection.id, k, v)}
            />
          ) : (
            <>
              {contactKind && (
                <ContactSourceFields
                  kind={contactKind}
                  content={(selectedElement.content || {}) as Record<string, unknown>}
                  onContentUpdate={updateContent}
                />
              )}
              {showContactTextFields && (
                <TextAreaInput
                  label={(selectedElement.type === 'button' || selectedElement.type === 'call-to-action' || selectedElement.type === 'cta-button') ? 'Button Text' : 'Text'}
                  value={selectedElement.content?.text || ''}
                  onChange={(v) => updateContent({ text: v })}
                />
              )}
              {/* Generic link input — skipped for button-like types so the dedicated
                  "Button Link (URL)" below (with hero-title fallback) is the only one. */}
              {showContactTextFields && selectedElement.type !== 'button' && selectedElement.type !== 'call-to-action' && selectedElement.type !== 'cta-button' && (
                <>
                  <TextInput
                    label="Link (optional URL)"
                    value={selectedElement.content?.link || ''}
                    onChange={handleLinkChange}
                    placeholder="https://... or # or tel:... or mailto:..."
                  />
                  <LinkNewTabToggle
                    visible={!!selectedElement.content?.link && !!String(selectedElement.content.link).trim()}
                    value={(selectedElement.content as any)?.linkNewTab}
                    onChange={(v: boolean) => updateContent({ linkNewTab: v } as any)}
                  />
                </>
              )}
            </>
          )}
          {selectedElement.type === 'text' && (() => {
            const currentSection = siteData.sections.find((s) => s.id === selectedSection.id);
            const currentElement = currentSection?.elements?.find((e) => e.id === selectedElement.id);
            return (
              <TextContentForm
                element={selectedElement}
                currentSection={currentSection}
                currentElement={currentElement}
                onContentUpdate={updateContent}
                onStyleUpdate={updateStyle}
              />
            );
          })()}
          {(selectedElement.type === 'button' || selectedElement.type === 'call-to-action' || selectedElement.type === 'cta-button') && (
            <>
              {showContactTextFields && (
                <TextInput
                  label="Button Link (URL)"
                  value={
                    selectedElement.id.includes('-hero-button')
                      ? ((selectedSection.content as any)?.ctaHref || '')
                      : (selectedElement.content?.link || '')
                  }
                  onChange={handleLinkChange}
                  placeholder="https://example.com, tel:..., or mailto:..."
                />
              )}
              <ButtonIconAndStateControls content={selectedElement.content} onContentUpdate={updateContent} />
            </>
          )}
        </>
      )}
    </div>
  );
};
