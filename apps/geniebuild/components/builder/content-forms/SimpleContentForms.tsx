import React from 'react';
import { IconPicker, RangeInput, TextInput, TextAreaInput } from '../inputs';
import { LinkNewTabToggle } from './LinkNewTabToggle';
import type { ContentFormProps } from './types';

type FormProps = ContentFormProps;

/** Star Rating element content form */
export const StarRatingContentForm: React.FC<FormProps> = ({ content, onContentUpdate }) => {
  const rating = content.rating !== undefined ? parseFloat(String(content.rating)) : 5;
  const maxRating = content.maxRating !== undefined ? parseInt(String(content.maxRating)) : 5;

  return (
    <div className="space-y-4">
      <RangeInput
        label="Rating Value (e.g., 4.5)"
        value={rating}
        min={0}
        max={maxRating}
        step={0.5}
        onChange={(v) => onContentUpdate({ rating: v })}
      />
      <RangeInput
        label="Total Stars (Max)"
        value={maxRating}
        min={1}
        max={10}
        step={1}
        onChange={(v) => {
          const newRating = rating > v ? v : rating;
          onContentUpdate({ maxRating: v, rating: newRating });
        }}
      />
    </div>
  );
};

/** Pricing Item content form */
export const PricingItemContentForm: React.FC<FormProps> = ({ content, onContentUpdate }) => {
  const items: any[] = Array.isArray(content.items) ? content.items : [];
  const featured = content.featured === true || content.featured === 'true';

  const addItem = () => {
    onContentUpdate({ items: [...items, { title: 'New feature' }] });
  };
  const removeItem = (idx: number) => {
    onContentUpdate({ items: items.filter((_, i) => i !== idx) });
  };
  const updateItem = (idx: number, patch: any) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onContentUpdate({ items: next });
  };

  return (
    <div className="space-y-4">
      <TextInput
        label="Plan Name"
        value={content.text || ''}
        onChange={(v) => onContentUpdate({ text: v })}
        placeholder="Starter"
      />
      <TextInput
        label="Price"
        value={content.price || ''}
        onChange={(v) => onContentUpdate({ price: v })}
        placeholder="$29"
      />
      <TextInput
        label="Period (e.g. /month)"
        value={(content as any).period || ''}
        onChange={(v) => onContentUpdate({ period: v } as any)}
        placeholder="/month"
      />
      <TextAreaInput
        label="Description"
        value={content.subText || ''}
        onChange={(v) => onContentUpdate({ subText: v })}
      />

      {/* Featured toggle */}
      <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white">Mark as Featured</div>
          <div className="text-[10px] text-white/40 mt-0.5">Highlights this plan with badge + accent border + lift.</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={featured}
          onClick={() => onContentUpdate({ featured: !featured } as any)}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${featured ? 'bg-blue-500' : 'bg-[#333]'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${featured ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
      {featured && (
        <TextInput
          label="Featured Badge Text"
          value={(content as any).badge || ''}
          onChange={(v) => onContentUpdate({ badge: v } as any)}
          placeholder="Most Popular"
        />
      )}

      {/* Features list */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-white/40 uppercase">Features</label>
        <button
          onClick={addItem}
          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px]"
        >
          <i className="fa-solid fa-plus mr-1"></i>Add Feature
        </button>
      </div>
      {items.map((item: any, idx: number) => (
        <div key={idx} className="p-3 bg-[#151515] border border-[#333] rounded space-y-3 relative group">
          <button
            onClick={() => removeItem(idx)}
            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] transition-opacity"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <TextInput
            label={`Feature ${idx + 1}`}
            value={item.title || ''}
            onChange={(v) => updateItem(idx, { title: v })}
          />
        </div>
      ))}

      {/* CTA */}
      <div className="pt-3 mt-3 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CTA Button</h4>
        <TextInput
          label="Button Text"
          value={(content as any).ctaText || ''}
          onChange={(v) => onContentUpdate({ ctaText: v } as any)}
          placeholder="Get Started"
        />
        <TextInput
          label="Button Link"
          value={(content as any).ctaLink || content?.link || ''}
          onChange={(v) => onContentUpdate({ ctaLink: v } as any)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
};

/** Stat Card content form */
export const StatCardContentForm: React.FC<FormProps> = ({ content, onContentUpdate }) => {
  const statValue = content.value !== undefined
    ? String(content.value)
    : (content.targetNumber !== undefined ? String(content.targetNumber) : '');

  return (
    <div className="space-y-4">
      <TextInput
        label="Stat Value"
        value={statValue}
        onChange={(v) => {
          const num = parseFloat(v) || 0;
          onContentUpdate({ value: num, targetNumber: num });
        }}
        placeholder="e.g. 99% or 500k+"
      />
      <TextInput
        label="Label"
        value={content.text || ''}
        onChange={(v) => onContentUpdate({ text: v })}
        placeholder="e.g. Satisfaction Rate"
      />
      <TextAreaInput
        label="Description"
        value={content.subText || ''}
        onChange={(v) => onContentUpdate({ subText: v })}
      />
      <IconPicker
        label="Icon"
        value={content.icon || ''}
        onChange={(v) => {
          const iconValue = v.startsWith('fa-') ? v.replace('fa-', '') : v;
          onContentUpdate({ icon: iconValue });
        }}
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

/** Countdown Timer element content form */
export const CountdownTimerContentForm: React.FC<FormProps> = ({ content, onContentUpdate }) => {
  const targetDate = (content.targetDate as string) || new Date(Date.now() + 86400000).toISOString();
  const dateValue = new Date(targetDate).toISOString().slice(0, 16); // for datetime-local
  const showHeading = (content as any).showHeading !== false;
  const showDays    = (content as any).showDays !== false;
  const showSeconds = (content as any).showSeconds !== false;
  const padZero     = (content as any).padZero !== false;

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white">{label}</div>
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
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-white/40 uppercase ml-1">Target Date &amp; Time</label>
        <input
          type="datetime-local"
          className="w-full bg-[#151515] border border-[#333] rounded p-2 text-white text-xs focus:border-blue-500 focus:outline-none transition-colors"
          value={dateValue}
          onChange={(e) => {
            const iso = new Date(e.target.value).toISOString();
            onContentUpdate({ targetDate: iso });
          }}
        />
      </div>
      <TextInput
        label="Heading Text"
        value={(content.text as string) || ''}
        onChange={(v) => onContentUpdate({ text: v })}
        placeholder="Offer Ends In"
      />
      <TextInput
        label="Expired Message"
        value={(content as any).expiredText || ''}
        onChange={(v) => onContentUpdate({ expiredText: v } as any)}
        placeholder="Time's up!"
      />
      <Toggle label="Show Heading"      value={showHeading} onChange={() => onContentUpdate({ showHeading: !showHeading } as any)} />
      <Toggle label="Show Days"         value={showDays}    onChange={() => onContentUpdate({ showDays: !showDays } as any)} />
      <Toggle label="Show Seconds"      value={showSeconds} onChange={() => onContentUpdate({ showSeconds: !showSeconds } as any)} />
      <Toggle label="Pad Zero (07 not 7)" value={padZero}     onChange={() => onContentUpdate({ padZero: !padZero } as any)} />
      <details className="group">
        <summary className="text-[10px] font-bold text-white/40 uppercase cursor-pointer ml-1 mb-1">Custom Labels</summary>
        <div className="space-y-2 pt-2">
          <TextInput label="Days Label"    value={(content as any).labelDays    || ''} onChange={(v) => onContentUpdate({ labelDays: v }    as any)} placeholder="Days" />
          <TextInput label="Hours Label"   value={(content as any).labelHours   || ''} onChange={(v) => onContentUpdate({ labelHours: v }   as any)} placeholder="Hrs" />
          <TextInput label="Minutes Label" value={(content as any).labelMinutes || ''} onChange={(v) => onContentUpdate({ labelMinutes: v } as any)} placeholder="Min" />
          <TextInput label="Seconds Label" value={(content as any).labelSeconds || ''} onChange={(v) => onContentUpdate({ labelSeconds: v } as any)} placeholder="Sec" />
        </div>
      </details>
    </div>
  );
};

/** Progress Bar element content form */
export const ProgressBarContentForm: React.FC<FormProps> = ({ content, onContentUpdate }) => {
  const pct = content.percentage !== undefined ? parseFloat(String(content.percentage)) : 0;
  const showLabel = content.showLabel !== false;
  const showPercent = content.showPercent !== false;

  return (
    <div className="space-y-4">
      <RangeInput
        label="Percentage"
        value={Math.max(0, Math.min(100, pct))}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onContentUpdate({ percentage: v })}
      />
      <TextInput
        label="Label Text"
        value={(content.text as string) || ''}
        onChange={(v) => onContentUpdate({ text: v })}
        placeholder="Progress"
      />
      <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white">Show Label</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showLabel}
          onClick={() => onContentUpdate({ showLabel: !showLabel })}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${showLabel ? 'bg-blue-500' : 'bg-[#333]'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showLabel ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white">Show Percentage</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showPercent}
          onClick={() => onContentUpdate({ showPercent: !showPercent })}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${showPercent ? 'bg-blue-500' : 'bg-[#333]'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showPercent ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  );
};
