import React from 'react';
import { IconPicker, ImageControl, RangeInput, SelectInput, TextInput, TextAreaInput } from '../inputs';
import { LinkNewTabToggle } from './LinkNewTabToggle';
import type { ContentFormProps, ContentFormWithUploadProps } from './types';

type FormProps = ContentFormProps;

/**
 * Feature Box content form — layout variant + icon + badge + CTA link + stat line.
 * Every field is optional — shown on canvas only when populated.
 *
 * Fields:
 *   title, description, icon, iconPosition, link        (core)
 *   cardLayout     — classic | inline | minimal | numbered | stat | split
 *   number         — override auto-numbering for 'numbered' variant
 *   badgeText      — optional pill above the title ("New", "Popular")
 *   stat           — big number shown in 'stat' variant ("99%", "5-min")
 *   ctaText        — "Learn more" style link at the bottom (wrapped in card link if set)
 */
export const FeatureBoxContentForm: React.FC<FormProps> = ({ content, onContentUpdate }) => {
  const c = content as any;
  const hasIcon = c.icon && c.icon !== 'none';
  const iconPosition = c.iconPosition || 'top';

  const ALLOWED_FB_LAYOUTS = ['classic', 'inline', 'minimal', 'numbered', 'stat', 'split'] as const;
  type FbLayout = typeof ALLOWED_FB_LAYOUTS[number];
  const layout: FbLayout = (ALLOWED_FB_LAYOUTS as readonly string[]).includes(c.cardLayout) ? c.cardLayout : 'classic';

  const isNumbered = layout === 'numbered';
  const isStat     = layout === 'stat';

  return (
    <div className="space-y-5">
      {/* ───────── CORE ───────── */}
      <div className="space-y-3">
        <TextInput
          label="Title"
          value={(c.text as string) || ''}
          onChange={(v) => onContentUpdate({ text: v })}
          placeholder="Enter feature title"
        />
        <TextAreaInput
          label="Description"
          value={(c.subText as string) || ''}
          onChange={(v) => onContentUpdate({ subText: v })}
        />
      </div>

      {/* ───────── ICON ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Icon</h4>
        <IconPicker
          label="Icon"
          value={(c.icon as string) || 'fa-star'}
          onChange={(v) => {
            const iconValue = v === 'none' ? 'none' : (v.startsWith('fa-') ? v : `fa-${v}`);
            onContentUpdate({ icon: iconValue });
          }}
        />
        {hasIcon && (
          <button
            onClick={() => onContentUpdate({ icon: 'none' })}
            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            <i className="fa-solid fa-eye-slash mr-2"></i>Hide Icon
          </button>
        )}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-white/40 capitalize ml-1">Icon Position</label>
          <div className="grid grid-cols-3 gap-2">
            {(['left', 'top', 'right'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => onContentUpdate({ iconPosition: pos })}
                className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
                  iconPosition === pos
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-white/30 italic ml-1">Ignored when a layout variant overrides it (Stat/Numbered/Split).</p>
        </div>
      </div>

      {/* ───────── BADGE ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Badge (optional)</h4>
        <TextInput
          label="Badge Text"
          value={(c.badgeText as string) || ''}
          onChange={(v) => onContentUpdate({ badgeText: v })}
          placeholder="New · Popular · Pro"
        />
      </div>

      {/* ───────── STAT (only meaningful in 'stat' variant but always editable) ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Stat {isStat ? '' : <span className="text-white/30 normal-case font-medium">(used by Stat layout)</span>}
        </h4>
        <TextInput
          label="Stat Value"
          value={(c.stat as string) || ''}
          onChange={(v) => onContentUpdate({ stat: v })}
          placeholder="99% · 5-min · 24/7"
        />
      </div>

      {/* ───────── NUMBER (only meaningful in 'numbered' variant) ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Number Override {isNumbered ? '' : <span className="text-white/30 normal-case font-medium">(used by Numbered layout)</span>}
        </h4>
        <TextInput
          label="Custom Number"
          value={(c.number as string) || ''}
          onChange={(v) => onContentUpdate({ number: v })}
          placeholder="Leave empty for auto (01, 02, 03…)"
        />
      </div>

      {/* ───────── CTA LINK ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link & CTA</h4>
        <TextInput
          label="Link URL"
          value={(c.link as string) || ''}
          onChange={(v) => onContentUpdate({ link: v })}
          placeholder="https://... · #section · /path"
        />
        <LinkNewTabToggle
          visible={!!c.link && !!String(c.link).trim()}
          value={(c as any).linkNewTab}
          onChange={(v: boolean) => onContentUpdate({ linkNewTab: v } as any)}
        />
        <TextInput
          label="CTA Text (optional)"
          value={(c.ctaText as string) || ''}
          onChange={(v) => onContentUpdate({ ctaText: v })}
          placeholder="Learn more"
        />
        <p className="text-[9px] text-white/30 italic ml-1">
          When a URL is set, the whole card becomes clickable. CTA text adds a visible "Learn more →" link at the bottom.
        </p>
      </div>

      {/* ───────── LAYOUT ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layout</h4>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'classic',  label: 'Classic',  icon: 'fa-grip-lines' },
            { value: 'inline',   label: 'Inline',   icon: 'fa-align-left' },
            { value: 'minimal',  label: 'Minimal',  icon: 'fa-minus' },
            { value: 'numbered', label: 'Numbered', icon: 'fa-list-ol' },
            { value: 'stat',     label: 'Stat',     icon: 'fa-chart-simple' },
            { value: 'split',    label: 'Split',    icon: 'fa-table-columns' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => onContentUpdate({ cardLayout: opt.value })}
              className={`py-2.5 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                layout === opt.value
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
              }`}
            >
              <i className={`fa-solid ${opt.icon} text-sm`} />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Text alignment within the card */}
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
            Text Alignment
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'left',   icon: 'fa-align-left' },
              { value: 'center', icon: 'fa-align-center' },
              { value: 'right',  icon: 'fa-align-right' },
            ] as const).map(opt => {
              const current = c.cardTextAlign || 'left';
              const active = current === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onContentUpdate({ cardTextAlign: opt.value })}
                  className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex items-center justify-center gap-1.5 ${
                    active
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                >
                  <i className={`fa-solid ${opt.icon}`} />
                  {opt.value}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Testimonial Card content form — extended composite.
 * Fields: quote, author, role, service tag, avatar, rating,
 *         date, source platform, verified customer pill, helpful count,
 *         multi-criteria ratings, business reply, layout variant, accent stripe.
 * All fields optional — shown on canvas only when populated / enabled.
 */
export const TestimonialCardContentForm: React.FC<ContentFormWithUploadProps> = ({ content, onContentUpdate, onUpload }) => {
  const c = content as any;
  const rating = Number(c.rating ?? 5);
  const showStars = c.showStars !== false;
  const showAvatar = c.showAvatar !== false;
  const showVerified = c.showVerified !== false;
  const showVerifiedCustomer = !!c.showVerifiedCustomer;
  const accentStripe = !!c.accentStripe;
  const showReply = !!c.showReply;
  const ALLOWED_LAYOUTS = ['classic', 'compact', 'hero', 'minimal', 'quote-first', 'split'] as const;
  type CardLayout = typeof ALLOWED_LAYOUTS[number];
  const layout: CardLayout = (ALLOWED_LAYOUTS as readonly string[]).includes(c.cardLayout) ? c.cardLayout : 'classic';
  const source: string = c.source || 'none';

  // Multi-criteria ratings — array of { label, rating }
  const criteria: Array<{ label: string; rating: number }> = Array.isArray(c.criteria) ? c.criteria : [];

  const updateCriterion = (idx: number, patch: Partial<{ label: string; rating: number }>) => {
    const next = criteria.map((cr, i) => (i === idx ? { ...cr, ...patch } : cr));
    onContentUpdate({ criteria: next });
  };
  const addCriterion = () => {
    if (criteria.length >= 3) return;
    const next = [...criteria, { label: 'Quality', rating: 5 }];
    onContentUpdate({ criteria: next });
  };
  const removeCriterion = (idx: number) => {
    const next = criteria.filter((_, i) => i !== idx);
    onContentUpdate({ criteria: next });
  };

  return (
    <div className="space-y-5">
      {/* ───────── CORE ───────── */}
      <div className="space-y-3">
        <TextAreaInput
          label="Quote"
          value={(c.quote as string) || ''}
          onChange={(v) => onContentUpdate({ quote: v })}
          placeholder="What the customer said..."
        />
        <TextInput
          label="Author Name"
          value={(c.author as string) || ''}
          onChange={(v) => onContentUpdate({ author: v })}
          placeholder="Jane Doe"
        />
        <TextInput
          label="Role / Location"
          value={(c.role as string) || ''}
          onChange={(v) => onContentUpdate({ role: v })}
          placeholder="Austin, TX"
        />
        <ImageControl
          label="Avatar"
          value={(c.avatar as string) || ''}
          onChange={(v) => onContentUpdate({ avatar: v })}
          onUpload={onUpload}
        />
      </div>

      {/* ───────── RATING ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating</h4>
        <RangeInput
          label={`Overall Rating (${rating.toFixed(1)} / 5)`}
          value={rating}
          min={0} max={5} step={0.5}
          onChange={(v) => onContentUpdate({ rating: v })}
        />

        {/* Multi-criteria ratings — max 3 */}
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
            Criteria Breakdown (optional, max 3)
          </label>
          <div className="space-y-2">
            {criteria.map((cr, idx) => (
              <div key={idx} className="bg-[#151515] border border-[#333] rounded p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cr.label}
                    onChange={(e) => updateCriterion(idx, { label: e.target.value })}
                    placeholder="Quality / Value / Speed"
                    className="flex-1 bg-[#0E0E0E] border border-[#333] rounded p-1.5 text-white text-[11px] focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeCriterion(idx)}
                    className="w-7 h-7 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px]"
                    title="Remove criterion"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
                <RangeInput
                  label={`${cr.rating.toFixed(1)} / 5`}
                  value={cr.rating}
                  min={0} max={5} step={0.5}
                  onChange={(v) => updateCriterion(idx, { rating: v })}
                />
              </div>
            ))}
            {criteria.length < 3 && (
              <button
                type="button"
                onClick={addCriterion}
                className="w-full py-2 text-[10px] font-bold uppercase tracking-widest rounded border border-dashed border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 transition-colors"
              >
                <i className="fa-solid fa-plus mr-2" />Add Criterion
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ───────── TRUST SIGNALS ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trust Signals</h4>
        <TextInput
          label="Date (optional)"
          value={(c.date as string) || ''}
          onChange={(v) => onContentUpdate({ date: v })}
          placeholder="3 weeks ago — or — Oct 12, 2025"
        />
        <TextInput
          label="Service Tag (optional)"
          value={(c.service as string) || ''}
          onChange={(v) => onContentUpdate({ service: v })}
          placeholder="Drain Cleaning"
        />
        <SelectInput
          label="Source Platform"
          value={source}
          options={[
            { label: 'None', value: 'none' },
            { label: 'Google', value: 'google' },
            { label: 'Yelp', value: 'yelp' },
            { label: 'Trustpilot', value: 'trustpilot' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Custom…', value: 'custom' },
          ]}
          onChange={(v: string) => onContentUpdate({ source: v })}
        />
        {source === 'custom' && (
          <TextInput
            label="Custom Source Label"
            value={(c.sourceLabel as string) || ''}
            onChange={(v) => onContentUpdate({ sourceLabel: v })}
            placeholder="e.g. G2, Capterra"
          />
        )}
        <TextInput
          label="Verified Customer Label"
          value={(c.verifiedCustomerLabel as string) || ''}
          onChange={(v) => onContentUpdate({ verifiedCustomerLabel: v })}
          placeholder="Verified Customer"
        />
        <TextInput
          label="Helpful Count (optional)"
          value={c.helpfulCount !== undefined && c.helpfulCount !== null ? String(c.helpfulCount) : ''}
          onChange={(v) => {
            const num = v.trim() === '' ? undefined : Math.max(0, parseInt(v.replace(/[^0-9]/g, ''), 10) || 0);
            onContentUpdate({ helpfulCount: num });
          }}
          placeholder="47"
        />
      </div>

      {/* ───────── BUSINESS REPLY ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Reply</h4>
        <button
          type="button"
          onClick={() => onContentUpdate({ showReply: !showReply })}
          className={`w-full py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
            showReply
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
          }`}
        >
          <i className={`fa-solid ${showReply ? 'fa-eye' : 'fa-eye-slash'} mr-2`} />
          {showReply ? 'Reply Shown' : 'Reply Hidden'}
        </button>
        {showReply && (
          <>
            <TextInput
              label="Reply Author"
              value={(c.replyAuthor as string) || ''}
              onChange={(v) => onContentUpdate({ replyAuthor: v })}
              placeholder="Response from the business"
            />
            <TextAreaInput
              label="Reply Message"
              value={(c.reply as string) || ''}
              onChange={(v) => onContentUpdate({ reply: v })}
              placeholder="Thanks for the great review..."
            />
          </>
        )}
      </div>

      {/* ───────── LAYOUT ───────── */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layout</h4>
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
            Variant
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'classic',     label: 'Classic',  icon: 'fa-grip-lines' },
              { value: 'compact',     label: 'Compact',  icon: 'fa-align-left' },
              { value: 'hero',        label: 'Hero',     icon: 'fa-quote-left' },
              { value: 'minimal',     label: 'Minimal',  icon: 'fa-minus' },
              { value: 'quote-first', label: 'Editorial',icon: 'fa-newspaper' },
              { value: 'split',       label: 'Split',    icon: 'fa-table-columns' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => onContentUpdate({ cardLayout: opt.value })}
                className={`py-2.5 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                  layout === opt.value
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                }`}
              >
                <i className={`fa-solid ${opt.icon} text-sm`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text alignment within the card */}
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
            Text Alignment
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'left',   icon: 'fa-align-left' },
              { value: 'center', icon: 'fa-align-center' },
              { value: 'right',  icon: 'fa-align-right' },
            ] as const).map(opt => {
              const current = c.cardTextAlign || 'left';
              const active = current === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onContentUpdate({ cardTextAlign: opt.value })}
                  className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex items-center justify-center gap-1.5 ${
                    active
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                >
                  <i className={`fa-solid ${opt.icon}`} />
                  {opt.value}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onContentUpdate({ accentStripe: !accentStripe })}
          className={`w-full py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
            accentStripe
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
          }`}
        >
          <i className={`fa-solid ${accentStripe ? 'fa-check' : 'fa-xmark'} mr-2`} />
          Accent Stripe (left edge)
        </button>
      </div>

      {/* ───────── SHOW / HIDE ───────── */}
      <div className="pt-4 border-t border-white/5">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
          Show / Hide Parts
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onContentUpdate({ showStars: !showStars })}
            className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
              showStars ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
            }`}
          >
            <i className={`fa-solid ${showStars ? 'fa-eye' : 'fa-eye-slash'} mr-1`} />Stars
          </button>
          <button
            onClick={() => onContentUpdate({ showAvatar: !showAvatar })}
            className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
              showAvatar ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
            }`}
          >
            <i className={`fa-solid ${showAvatar ? 'fa-eye' : 'fa-eye-slash'} mr-1`} />Avatar
          </button>
          <button
            onClick={() => onContentUpdate({ showVerified: !showVerified })}
            className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
              showVerified ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
            }`}
          >
            <i className={`fa-solid ${showVerified ? 'fa-eye' : 'fa-eye-slash'} mr-1`} />Name Tick
          </button>
          <button
            onClick={() => onContentUpdate({ showVerifiedCustomer: !showVerifiedCustomer })}
            className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
              showVerifiedCustomer ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
            }`}
          >
            <i className={`fa-solid ${showVerifiedCustomer ? 'fa-eye' : 'fa-eye-slash'} mr-1`} />Verified Pill
          </button>
        </div>
      </div>
    </div>
  );
};

/** Icon Box content form (icon + title + desc + link) */
export const IconBoxContentForm: React.FC<FormProps> = ({ content, onContentUpdate }) => {
  const hasIcon = content.icon && content.icon !== 'none';

  return (
    <div className="space-y-4">
      <IconPicker
        label="Icon"
        value={content.icon || ''}
        onChange={(v) => {
          const iconValue = v === 'none' ? 'none' : (v.startsWith('fa-') ? v : `fa-${v}`);
          onContentUpdate({ icon: iconValue });
        }}
      />
      {hasIcon && (
        <button
          onClick={() => onContentUpdate({ icon: 'none' })}
          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 text-[10px] font-bold uppercase tracking-widest transition-colors"
        >
          <i className="fa-solid fa-eye-slash mr-2"></i>Hide Icon
        </button>
      )}
      <TextInput
        label="Title"
        value={content.text || ''}
        onChange={(v) => onContentUpdate({ text: v })}
        placeholder="Enter title"
      />
      <TextAreaInput
        label="Description"
        value={content.subText || ''}
        onChange={(v) => onContentUpdate({ subText: v })}
        placeholder="Enter description"
      />
      <TextInput
        label="Link (optional URL)"
        value={content?.link || ''}
        onChange={(v) => onContentUpdate({ link: v })}
        placeholder="https://..."
      />
      <LinkNewTabToggle
        visible={!!content?.link && !!String(content.link).trim()}
        value={(content as any)?.linkNewTab}
        onChange={(v: boolean) => onContentUpdate({ linkNewTab: v } as any)}
      />
    </div>
  );
};

/**
 * Flip Box content form — direction + front (icon, title, desc) + back (title, desc, btn).
 *
 * Fields:
 *   flipDirection — left | right | top | bottom
 *   icon, showFrontIcon — front face icon + visibility
 *   frontTitle, frontDesc — front content
 *   backTitle, backDesc — back content
 *   showBackBtn, backBtnText, backBtnLink — back face CTA
 */
export const FlipBoxContentForm: React.FC<FormProps> = ({ content, onContentUpdate }) => {
  const dir = (content as any).flipDirection || 'left';
  const showFrontIcon = (content as any).showFrontIcon !== false;
  const showBackBtn   = (content as any).showBackBtn !== false;

  const Toggle = ({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white">{label}</div>
        {hint && <div className="text-[10px] text-white/40 mt-0.5">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={onChange}
        className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${value ? 'bg-blue-500' : 'bg-[#333]'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <SelectInput
        label="Flip Direction"
        value={dir}
        options={[
          { label: 'Left',   value: 'left' },
          { label: 'Right',  value: 'right' },
          { label: 'Top',    value: 'top' },
          { label: 'Bottom', value: 'bottom' },
        ]}
        onChange={(v) => onContentUpdate({ flipDirection: v } as any)}
      />

      {/* Front face */}
      <div className="pt-3 mt-3 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Front Face</h4>
        <Toggle
          label="Show Front Icon"
          value={showFrontIcon}
          onChange={() => onContentUpdate({ showFrontIcon: !showFrontIcon } as any)}
        />
        {showFrontIcon && (
          <IconPicker
            label="Front Icon"
            value={(content.icon as string) || ''}
            onChange={(v) => {
              const next = v === 'none' ? 'none' : (v.startsWith('fa-') ? v : `fa-${v}`);
              onContentUpdate({ icon: next });
            }}
          />
        )}
        <TextInput
          label="Front Title"
          value={(content as any).frontTitle || ''}
          onChange={(v) => onContentUpdate({ frontTitle: v } as any)}
          placeholder="Front Title"
        />
        <TextAreaInput
          label="Front Description"
          value={(content as any).frontDesc || ''}
          onChange={(v) => onContentUpdate({ frontDesc: v } as any)}
        />
      </div>

      {/* Back face */}
      <div className="pt-3 mt-3 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Back Face</h4>
        <TextInput
          label="Back Title"
          value={(content as any).backTitle || ''}
          onChange={(v) => onContentUpdate({ backTitle: v } as any)}
          placeholder="Back Title"
        />
        <TextAreaInput
          label="Back Description"
          value={(content as any).backDesc || ''}
          onChange={(v) => onContentUpdate({ backDesc: v } as any)}
        />
        <Toggle
          label="Show Action Button"
          hint="CTA on the back face."
          value={showBackBtn}
          onChange={() => onContentUpdate({ showBackBtn: !showBackBtn } as any)}
        />
        {showBackBtn && (
          <>
            <TextInput
              label="Button Text"
              value={(content as any).backBtnText || ''}
              onChange={(v) => onContentUpdate({ backBtnText: v } as any)}
              placeholder="Learn More"
            />
            <TextInput
              label="Button Link"
              value={(content as any).backBtnLink || ''}
              onChange={(v) => onContentUpdate({ backBtnLink: v } as any)}
              placeholder="https://..."
            />
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Alert Box content form — variant + icon + title + description + dismissible.
 *
 * Fields:
 *   alertType    — info | success | warning | error | neutral
 *   icon         — optional FA icon (defaults from variant)
 *   iconPosition — left | right
 *   text         — title (bold)
 *   subText      — description (smaller)
 *   dismissible  — show an "X" close button on the right
 */
export const AlertBoxContentForm: React.FC<FormProps> = ({ content, onContentUpdate }) => {
  const variant = (content.alertType as string) || 'info';
  const iconPosition = (content.iconPosition as string) || 'left';
  const dismissible = !!content.dismissible;
  const hasIcon = content.icon !== 'none';

  return (
    <div className="space-y-4">
      <SelectInput
        label="Variant"
        value={variant}
        options={[
          { label: 'Info',    value: 'info' },
          { label: 'Success', value: 'success' },
          { label: 'Warning', value: 'warning' },
          { label: 'Error',   value: 'error' },
          { label: 'Neutral', value: 'neutral' },
        ]}
        onChange={(v) => onContentUpdate({ alertType: v as any })}
      />
      <TextInput
        label="Title"
        value={(content.text as string) || ''}
        onChange={(v) => onContentUpdate({ text: v })}
        placeholder="Alert Title"
      />
      <TextAreaInput
        label="Description"
        value={(content.subText as string) || ''}
        onChange={(v) => onContentUpdate({ subText: v })}
      />
      <IconPicker
        label="Icon"
        value={(content.icon as string) || ''}
        onChange={(v) => {
          const next = v === 'none' ? 'none' : (v.startsWith('fa-') ? v : `fa-${v}`);
          onContentUpdate({ icon: next });
        }}
      />
      {hasIcon && (
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-white/40 capitalize ml-1">Icon Position</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onContentUpdate({ iconPosition: 'left' })}
              className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
                iconPosition === 'left'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
              }`}
            >Left</button>
            <button
              type="button"
              onClick={() => onContentUpdate({ iconPosition: 'right' })}
              className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${
                iconPosition === 'right'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
              }`}
            >Right</button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white">Dismissible</div>
          <div className="text-[10px] text-white/40 mt-0.5">Show an X close button on the right.</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={dismissible}
          onClick={() => onContentUpdate({ dismissible: !dismissible })}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${dismissible ? 'bg-blue-500' : 'bg-[#333]'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${dismissible ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  );
};
