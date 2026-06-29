import React from 'react';
import type { Section } from '../../../types';
import { AccordionGroup, TextInput, TextAreaInput, SelectInput } from '../inputs';
import { SectionContactPanel } from '../content-forms/SectionContactPanel';
import { ItemListEditor } from './ItemListEditor';

/**
 * Shape of items edited inline by this component across different section types.
 * Every field optional — different section types surface different fields.
 */
interface SectionItem {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  iconClass?: string;
  imageUrl?: string;
  author?: string;
  role?: string;
  avatar?: string;
  rating?: number;
  [key: string]: unknown;
}

/** Section content shape this editor actually reads/writes. */
interface EditorSectionContent {
  hideIcons?: boolean;
  badge?: string;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  phoneNumber?: string;
  items?: SectionItem[];
}

interface Props {
  selectedSection: Section;
  onUpdateSection: (id: string, updates: Partial<Section>) => void;
}

const FEATURE_DEFAULTS = [
  { icon: 'fa-clock', title: '24/7 Emergency Service', description: 'Burst pipes, floods, blocked drains — we respond day or night, 365 days a year.' },
  { icon: 'fa-certificate', title: 'Licensed & Insured', description: 'Fully certified plumbers with comprehensive insurance for your complete peace of mind.' },
  { icon: 'fa-bolt', title: 'Same-Day Repairs', description: "Fast response time means we're at your door quickly and fix the problem on the first visit." },
  { icon: 'fa-file-invoice-dollar', title: 'Free Estimates', description: 'Transparent upfront pricing with no hidden fees. Know the cost before we start.' },
  { icon: 'fa-shield-alt', title: '10-Year Guarantee', description: 'All our work is backed by a full 10-year workmanship guarantee. We stand by quality.' },
  { icon: 'fa-leaf', title: 'Eco-Friendly Solutions', description: 'Water-saving fixtures and sustainable techniques that cut your utility bills long-term.' },
];

const SERVICE_DEFAULTS = [
  { icon: 'fa-faucet', imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80', title: 'Drain Cleaning', description: 'Professional drain cleaning using the latest hydro-jetting technology.' },
  { icon: 'fa-fire-burner', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', title: 'Water Heater Services', description: 'Installation, repair and replacement of all water heater brands.' },
  { icon: 'fa-wrench', imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80', title: 'Pipe Repair & Replacement', description: 'From minor leaks to full repiping, our licensed plumbers handle every pipe issue.' },
  { icon: 'fa-bath', imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80', title: 'Bathroom Plumbing', description: 'Complete bathroom plumbing installations and renovations.' },
];

const WC_DEFAULTS = [
  { icon: 'fa-medal', title: '20+ Years of Experience', description: 'Two decades of solving every plumbing problem.' },
  { icon: 'fa-id-badge', title: 'Licensed & Certified', description: 'Every technician is fully licensed and certified.' },
  { icon: 'fa-bolt', title: 'Fast Emergency Response', description: "On-site within 60 minutes — guaranteed." },
  { icon: 'fa-hand-holding-dollar', title: 'Honest & Transparent Pricing', description: "Know the price before we start. No surprises." },
  { icon: 'fa-broom', title: 'Clean & Respectful Work', description: 'Every work area left spotless after the job.' },
  { icon: 'fa-shield-halved', title: 'Guaranteed Workmanship', description: 'Full 10-year workmanship guarantee.' },
];

const REV_DEFAULTS = [
  { author: 'James Harrington', role: 'Austin, TX', title: 'Emergency Pipe Repair', rating: 5, avatar: 'https://i.pravatar.cc/80?img=11', description: 'Main pipe burst at 2am and they arrived in 45 minutes. Fixed cleanly.' },
  { author: 'Maria Gonzalez', role: 'Houston, TX', title: 'Drain Cleaning', rating: 5, avatar: 'https://i.pravatar.cc/80?img=5', description: 'Found the root cause and cleared it permanently. Outstanding service.' },
  { author: 'David Chen', role: 'Dallas, TX', title: 'Water Heater Install', rating: 5, avatar: 'https://i.pravatar.cc/80?img=33', description: 'Installed our new tankless water heater quickly and professionally.' },
];

const GP_DEFAULTS = [
  { icon: 'fa-rotate-left', title: 'Free callback if any issue returns within 10 years' },
  { icon: 'fa-money-bill-wave', title: "Full refund if you're not 100% satisfied" },
  { icon: 'fa-calendar-check', title: 'On-time arrival guarantee or discount on your bill' },
  { icon: 'fa-star', title: 'Premium materials with manufacturer warranty' },
];

const AR_DEFAULTS = [
  { title: 'Austin', subtitle: 'TX', description: '78701' },
  { title: 'Houston', subtitle: 'TX', description: '77001' },
  { title: 'Dallas', subtitle: 'TX', description: '75201' },
  { title: 'San Antonio', subtitle: 'TX', description: '78201' },
];

/** HideIcons toggle row reused across multiple section editors. */
const HideIconsToggle: React.FC<{
  sectionContent: EditorSectionContent;
  label?: string;
  hint?: string;
  onToggle: (next: boolean) => void;
}> = ({ sectionContent, label = 'Hide All Icons', hint = 'Remove icons from every feature card at once', onToggle }) => (
  <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
    <div className="flex-1">
      <div className="text-xs font-bold text-white">{label}</div>
      <div className="text-[10px] text-white/40 mt-0.5">{hint}</div>
    </div>
    <button
      onClick={() => onToggle(!sectionContent?.hideIcons)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${sectionContent?.hideIcons ? 'bg-blue-500' : 'bg-[#333]'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${sectionContent?.hideIcons ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

export const SectionTypeContentEditor: React.FC<Props> = ({ selectedSection, onUpdateSection }) => {
  const content = (selectedSection.content || {}) as EditorSectionContent;
  const update = (updates: Partial<Section>) => onUpdateSection(selectedSection.id, updates);
  const updateContent = (patch: Partial<EditorSectionContent>) =>
    update({ content: { ...content, ...patch } as Section['content'] });

  if (selectedSection.type === 'process') {
    const processItems = Array.isArray(content.items) ? content.items : [];
    return (
      <AccordionGroup title="Process Content" defaultOpen={true}>
        <div className="space-y-4">
          <TextInput label="Badge Text" value={content.badge || ''} onChange={(v) => updateContent({ badge: v })} placeholder="e.g. Workflow" />
          <TextInput label="Section Title" value={content.title || ''} onChange={(v) => updateContent({ title: v })} placeholder="e.g. Our Process" />
          <TextAreaInput label="Section Description" value={content.subtitle || ''} onChange={(v) => updateContent({ subtitle: v, description: v })} placeholder="Short intro for the process section" />
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-white/40 uppercase">Process Steps</label>
              <button
                onClick={() => {
                  const newItems = [...processItems, { id: `process-${Date.now()}`, title: 'New Step', description: 'Describe this step', iconClass: 'fas fa-check-circle' }];
                  updateContent({ items: newItems });
                }}
                className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px]"
              >
                <i className="fa-solid fa-plus mr-1"></i>Add Step
              </button>
            </div>
            {processItems.map((item: SectionItem, idx: number) => (
              <div key={item?.id || idx} className="p-3 bg-[#151515] border border-[#333] rounded space-y-3 relative group">
                <button
                  onClick={() => updateContent({ items: processItems.filter((_: SectionItem, i: number) => i !== idx) })}
                  className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] transition-opacity"
                ><i className="fa-solid fa-xmark"></i></button>
                <TextInput label="Title" value={item?.title || ''} onChange={(v) => {
                  const newItems = [...processItems]; newItems[idx] = { ...newItems[idx], title: v };
                  updateContent({ items: newItems });
                }} />
                <TextAreaInput label="Description" value={item?.description || ''} onChange={(v) => {
                  const newItems = [...processItems]; newItems[idx] = { ...newItems[idx], description: v };
                  updateContent({ items: newItems });
                }} />
                <TextInput label="iconClass" value={item?.iconClass || item?.icon || ''} onChange={(v) => {
                  const newItems = [...processItems]; newItems[idx] = { ...newItems[idx], iconClass: v, icon: v };
                  updateContent({ items: newItems });
                }} placeholder="fas fa-file-invoice-dollar" />
              </div>
            ))}
          </div>
        </div>
      </AccordionGroup>
    );
  }

  if (selectedSection.type === 'features') {
    return (
      <ItemListEditor
        accordionTitle="Features Section"
        section={selectedSection}
        onUpdateSection={update}
        listLabel="Feature Cards"
        itemNoun="Feature"
        defaults={FEATURE_DEFAULTS}
        renderDefaultsWhenEmpty={true}
        helperText="Each feature shows as a card. Edit individual text/icon by clicking the card on the canvas."
        hideIconsToggle={{ filter: { kind: 'all-feature-box' } }}
        removeStrategy={{ kind: 'exact-id', idFor: (idx, sid) => `${sid}-fp-box${idx}` }}
      />
    );
  }

  if (selectedSection.type === 'about') {
    return (
      <AccordionGroup title="About Section" defaultOpen={true}>
        <div className="space-y-4">
          <HideIconsToggle
            sectionContent={content}
            onToggle={(next) => {
              const patchedElements = (selectedSection.elements || []).map(el => {
                if (el.type !== 'feature-box') return el;
                const nc: Record<string, unknown> = { ...(el.content || {}) };
                if (next) nc.icon = 'none';
                else if (nc.icon === 'none') delete nc.icon;
                return { ...el, content: nc };
              });
              update({ content: { ...content, hideIcons: next }, elements: patchedElements });
            }}
          />
        </div>
      </AccordionGroup>
    );
  }

  if (selectedSection.type === 'services') {
    const serviceNavMode = (content as any).serviceNavMode || 'button';
    const learnMoreText = (content as any).learnMoreText || '';
    return (
      <>
        <ItemListEditor
          accordionTitle="Services Section"
          section={selectedSection}
          onUpdateSection={update}
          listLabel="Services"
          itemNoun="Service"
          defaults={SERVICE_DEFAULTS}
          renderDefaultsWhenEmpty={true}
          helperText="Each service shows as an image + content row. Edit individual cards by clicking them on the canvas."
          hideIconsToggle={{
            hint: 'Remove the icon from every service card',
            filter: { kind: 'feature-box-with-id-substring', substring: '-svc' },
          }}
          removeStrategy={{ kind: 'prefix', prefixFor: (idx, sid) => `${sid}-svc${idx}-` }}
        />
        <AccordionGroup title="Service Page Settings" defaultOpen={false}>
          <div className="space-y-4">
            <SelectInput
              label="Open service page on"
              value={serviceNavMode}
              options={[
                { label: 'Learn More button click', value: 'button' },
                { label: 'Entire card click', value: 'card' },
              ]}
              onChange={(v) => updateContent({ serviceNavMode: v } as any)}
            />
            <TextInput
              label="Learn More button text"
              value={learnMoreText}
              onChange={(v) => updateContent({ learnMoreText: v } as any)}
              placeholder="Learn More"
            />
            <p className="text-[10px] text-white/40">
              {serviceNavMode === 'card'
                ? 'Clicking anywhere on the card navigates to the service page.'
                : 'The popup shows service details with a link to the full service page.'}
            </p>
          </div>
        </AccordionGroup>
      </>
    );
  }

  if (selectedSection.type === 'why-choose-us') {
    return (
      <ItemListEditor
        accordionTitle="Why Choose Section"
        section={selectedSection}
        onUpdateSection={update}
        listLabel="Reason Cards"
        itemNoun="Reason"
        defaults={WC_DEFAULTS}
        renderDefaultsWhenEmpty={true}
        hideIconsToggle={{
          hint: 'Remove icons from every card',
          filter: { kind: 'feature-box-with-id-substring', substring: '-wc-' },
        }}
        removeStrategy={{ kind: 'exact-id', idFor: (idx, sid) => `${sid}-wc-card${idx}` }}
      />
    );
  }

  if (selectedSection.type === 'testimonials') {
    return (
      <ItemListEditor
        accordionTitle="Testimonials Section"
        section={selectedSection}
        onUpdateSection={update}
        listLabel="Reviews"
        itemNoun="Review"
        defaults={REV_DEFAULTS}
        fallbackCountWhenEmpty={6}
        rowLabel={(item, idx) => `${idx + 1}. ${item.author || `Review ${idx + 1}`}`}
        removeStrategy={{ kind: 'prefix', prefixFor: (idx, sid) => `${sid}-tp-rev${idx}-` }}
      />
    );
  }

  if (selectedSection.type === 'guarantee') {
    return (
      <ItemListEditor
        accordionTitle="Guarantee Section"
        section={selectedSection}
        onUpdateSection={update}
        listLabel="Guarantee Points"
        itemNoun="Point"
        defaults={GP_DEFAULTS}
        renderDefaultsWhenEmpty={true}
        removeStrategy={{ kind: 'prefix', prefixFor: (idx, sid) => `${sid}-gp-pt${idx}` }}
      />
    );
  }

  if (selectedSection.type === 'areas') {
    return (
      <>
        <SectionContactPanel section={selectedSection} onContentUpdate={updateContent} />
        <ItemListEditor
          accordionTitle="Service Areas"
          section={selectedSection}
          onUpdateSection={update}
          listLabel="Areas"
          itemNoun="Area"
          defaults={AR_DEFAULTS}
          fallbackCountWhenEmpty={12}
        />
      </>
    );
  }

  if (selectedSection.type === 'cta') {
    const trustItems = Array.isArray(content.items) ? content.items : [];
    return (
      <AccordionGroup title="CTA Section" defaultOpen={true}>
        <div className="space-y-4">
          <TextInput label="Badge Text" value={content.badgeText || ''} onChange={(v) => updateContent({ badgeText: v })} placeholder="e.g. Get In Touch" />
          <TextInput label="Title" value={content.title || ''} onChange={(v) => updateContent({ title: v })} placeholder="Main CTA heading" />
          <TextAreaInput label="Description" value={content.subtitle || ''} onChange={(v) => updateContent({ subtitle: v })} />
          <TextInput label="Phone subtext" value={String((content as any).phoneSubText || '')} onChange={(v) => updateContent({ phoneSubText: v } as Section['content'])} placeholder="Line under phone number" />
          <TextInput label="Primary CTA Text" value={content.ctaText || ''} onChange={(v) => updateContent({ ctaText: v })} />
          <TextInput label="Primary CTA Link" value={content.ctaHref || ''} onChange={(v) => updateContent({ ctaHref: v })} placeholder="# or tel:..." />
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <TextInput
                label={`Trust badge ${i + 1}`}
                value={String(trustItems[i]?.label || trustItems[i]?.title || '')}
                onChange={(v) => {
                  const next = [...trustItems];
                  while (next.length <= i) next.push({ label: '', icon: 'fa-check-circle' });
                  next[i] = { ...next[i], label: v, title: v };
                  updateContent({ items: next } as Section['content']);
                }}
              />
              <TextInput
                label={`Icon ${i + 1}`}
                value={String(trustItems[i]?.icon || '')}
                onChange={(v) => {
                  const next = [...trustItems];
                  while (next.length <= i) next.push({ label: '', icon: 'fa-check-circle' });
                  next[i] = { ...next[i], icon: v };
                  updateContent({ items: next } as Section['content']);
                }}
                placeholder="fa-star"
              />
            </div>
          ))}
          <SectionContactPanel section={selectedSection} onContentUpdate={updateContent} />
        </div>
      </AccordionGroup>
    );
  }

  if (selectedSection.type === 'aboutservice') {
    const c = content as Record<string, unknown>;
    return (
      <AccordionGroup title="About this service (shared bundle)" defaultOpen={true}>
        <div className="space-y-4">
          <p className="text-[10px] text-white/50 leading-relaxed">
            Same data as the homepage / location services card for this service and location. Edits here or on the
            homepage grid stay in sync after save.
          </p>
          <TextInput
            label="Display title"
            value={String(c.service_name || c.title || '')}
            onChange={(v) => updateContent({ service_name: v, title: v } as Section['content'])}
            placeholder="Service name shown on this block"
          />
          <TextAreaInput
            label="About body"
            value={String(c.about_service || c.description || '')}
            onChange={(v) => updateContent({ about_service: v, description: v } as Section['content'])}
            placeholder="Long-form about copy"
          />
          <TextInput
            label="Image URL"
            value={String(c.imageUrl || '')}
            onChange={(v) => updateContent({ imageUrl: v } as Section['content'])}
            placeholder="https://..."
          />
        </div>
      </AccordionGroup>
    );
  }

  if (selectedSection.type === 'servicehero') {
    const c = content as Record<string, unknown>;
    return (
      <AccordionGroup title="Service hero (bundle)" defaultOpen={true}>
        <div className="space-y-4">
          <TextInput
            label="Badge"
            value={String(c.serviceHeroBadge || '')}
            onChange={(v) => updateContent({ serviceHeroBadge: v } as Section['content'])}
          />
          <TextInput
            label="Title"
            value={String(c.serviceHeroTitle || '')}
            onChange={(v) => updateContent({ serviceHeroTitle: v } as Section['content'])}
          />
          <TextAreaInput
            label="Subtitle"
            value={String(c.serviceHeroSubtitle || '')}
            onChange={(v) => updateContent({ serviceHeroSubtitle: v } as Section['content'])}
          />
          <TextInput
            label="Hero image URL"
            value={String(c.imageUrl || '')}
            onChange={(v) => updateContent({ imageUrl: v } as Section['content'])}
            placeholder="https://..."
          />
        </div>
      </AccordionGroup>
    );
  }

  if (selectedSection.type === 'faq') {
    const fc = content as Record<string, unknown>;
    const patchFaqCta = (title: string, description: string) =>
      updateContent({
        faqCtaTitle: title,
        ctaTitle: title,
        faqCtaDescription: description,
        ctaSubtitle: description,
      } as Partial<EditorSectionContent>);
    return (
      <>
        <AccordionGroup title="FAQ content" defaultOpen>
          <div className="space-y-2">
            <TextInput
              label="Badge"
              value={String(fc.badgeText || '')}
              onChange={(v) => updateContent({ badgeText: v } as Partial<EditorSectionContent>)}
            />
            <TextInput
              label="Title"
              value={String(fc.title || '')}
              onChange={(v) => updateContent({ title: v } as Partial<EditorSectionContent>)}
            />
            <TextAreaInput
              label="Subtitle"
              value={String(fc.subtitle || '')}
              onChange={(v) => updateContent({ subtitle: v } as Partial<EditorSectionContent>)}
            />
            <TextInput
              label="CTA heading"
              value={String(fc.faqCtaTitle || fc.ctaTitle || '')}
              onChange={(v) => patchFaqCta(v, String(fc.faqCtaDescription || fc.ctaSubtitle || ''))}
            />
            <TextAreaInput
              label="CTA description"
              value={String(fc.faqCtaDescription || fc.ctaSubtitle || '')}
              onChange={(v) => patchFaqCta(String(fc.faqCtaTitle || fc.ctaTitle || ''), v)}
            />
          </div>
        </AccordionGroup>
        <SectionContactPanel section={selectedSection} onContentUpdate={updateContent} />
      </>
    );
  }

  if (['header', 'navbar', 'footer', 'hero'].includes(selectedSection.type)) {
    return (
      <SectionContactPanel section={selectedSection} onContentUpdate={updateContent} />
    );
  }

  return null;
};
