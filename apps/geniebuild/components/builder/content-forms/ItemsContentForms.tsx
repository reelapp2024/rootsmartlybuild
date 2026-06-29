import React from 'react';
import { IconPicker, ImageControl, SelectInput, TextInput, TextAreaInput } from '../inputs';
import { LinkNewTabToggle } from './LinkNewTabToggle';

/** Shape of items edited by the content-form editors. Every field optional
 *  because different element types use different subsets. */
interface ItemData {
  title?: string;
  content?: string;
  question?: string;
  answer?: string;
  src?: string;
  alt?: string;
  avatar?: string;
  author?: string;
  role?: string;
  [key: string]: unknown;
}

interface ItemContent {
  items?: ItemData[];
  targetNumber?: number;
  [key: string]: unknown;
}

type ContentUpdater = (updates: Partial<ItemContent>) => void;

interface BaseProps {
  content: ItemContent;
  onContentUpdate: ContentUpdater;
}

interface ItemsWithUploadProps extends BaseProps {
  /** Called when user clicks the upload button on an item's image field.
   *  `field` is the dotted path within the item (e.g. 'src' or 'avatar'). */
  onItemUpload: (idx: number, field: string) => void;
}

/** Accordion items editor */
export const AccordionContentForm: React.FC<BaseProps> = ({ content, onContentUpdate }) => {
  const items: ItemData[] = content.items || [];
  const exclusive = !!(content as any).exclusive;

  const addItem = () => {
    const newItems = [...items, { title: 'New Question', content: 'New answer goes here.' }];
    onContentUpdate({ items: newItems });
  };
  const removeItem = (idx: number) => {
    onContentUpdate({ items: items.filter((_, i) => i !== idx) });
  };
  const updateItem = (idx: number, patch: Partial<ItemData>) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], ...patch };
    onContentUpdate({ items: newItems });
  };
  const moveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onContentUpdate({ items: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white">One-open-at-a-time</div>
          <div className="text-[10px] text-white/40 mt-0.5">Classic FAQ behavior — opening one question closes others.</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={exclusive}
          onClick={() => onContentUpdate({ exclusive: !exclusive } as any)}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${exclusive ? 'bg-blue-500' : 'bg-[#333]'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${exclusive ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-white/40 uppercase">Accordion Items ({items.length})</label>
        <button
          onClick={addItem}
          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px]"
        >
          <i className="fa-solid fa-plus mr-1"></i>Add Item
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-[10px] text-white/40 text-center py-6 border border-dashed border-white/10 rounded">
          No items yet. Click <b>Add Item</b> to get started.
        </div>
      )}

      {items.map((item: ItemData, idx: number) => {
        const previewText = String(item.title || item.question || '')
          .replace(/<[^>]+>/g, '')
          .trim();
        const previewShort = previewText.length > 38 ? previewText.slice(0, 38) + '…' : (previewText || 'Empty question');
        const openByDefault = !!(item as any).openByDefault;
        return (
          <details key={idx} className="bg-[#151515] border border-[#333] rounded group/item open:bg-[#181818]" open={idx === 0}>
            <summary className="flex items-center justify-between px-3 py-2.5 cursor-pointer list-none select-none rounded">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <i className="fa-solid fa-chevron-right text-[9px] text-white/40 transition-transform group-open/item:rotate-90" />
                <span className="text-[10px] font-bold text-white/40 shrink-0">{idx + 1}.</span>
                <span className="text-[11px] text-white/70 truncate">{previewShort}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); moveItem(idx, -1); }}
                  disabled={idx === 0}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white/60 text-[10px] flex items-center justify-center transition-colors"
                  title="Move up"
                >
                  <i className="fa-solid fa-arrow-up" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); moveItem(idx, 1); }}
                  disabled={idx === items.length - 1}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white/60 text-[10px] flex items-center justify-center transition-colors"
                  title="Move down"
                >
                  <i className="fa-solid fa-arrow-down" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); removeItem(idx); }}
                  className="w-6 h-6 rounded bg-red-500/15 hover:bg-red-500/30 text-red-400 text-[10px] flex items-center justify-center transition-colors"
                  title="Remove item"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-white/5">
              <TextInput
                label="Question"
                value={item.title || item.question || ''}
                onChange={(v) => updateItem(idx, { title: v })}
              />
              <TextAreaInput
                label="Answer"
                value={item.content || item.answer || ''}
                onChange={(v) => updateItem(idx, { content: v })}
              />
              <div className="flex items-center justify-between gap-3 p-2.5 bg-[#0E0E0E] border border-[#222] rounded">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-white/80">Open by default</div>
                  <div className="text-[9px] text-white/40 mt-0.5">Item starts expanded when the page loads.</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={openByDefault}
                  onClick={() => updateItem(idx, { openByDefault: !openByDefault } as any)}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${openByDefault ? 'bg-blue-500' : 'bg-[#333]'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${openByDefault ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
};

/** Pricing Table content form — plan info + features list + CTA + popular toggle */
export const PricingTableContentForm: React.FC<BaseProps> = ({ content, onContentUpdate }) => {
  const items: ItemData[] = content.items || [];
  const popular = !!(content as any).popular;

  const addItem = () => {
    const newItems = [...items, { title: 'New feature' }];
    onContentUpdate({ items: newItems });
  };
  const removeItem = (idx: number) => {
    onContentUpdate({ items: items.filter((_, i) => i !== idx) });
  };
  const updateItem = (idx: number, patch: Partial<ItemData>) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], ...patch };
    onContentUpdate({ items: newItems });
  };

  return (
    <div className="space-y-4">
      {/* Plan core */}
      <TextInput
        label="Plan Name"
        value={(content.text as string) || ''}
        onChange={(v) => onContentUpdate({ text: v })}
        placeholder="Pro Plan"
      />
      <TextInput
        label="Price"
        value={(content as any).price || ''}
        onChange={(v) => onContentUpdate({ price: v } as any)}
        placeholder="$99"
      />
      <TextInput
        label="Period (e.g. per month)"
        value={(content as any).period || ''}
        onChange={(v) => onContentUpdate({ period: v } as any)}
        placeholder="per month"
      />

      {/* Popular toggle */}
      <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white">Mark as "Most Popular"</div>
          <div className="text-[10px] text-white/40 mt-0.5">Adds a badge + accent border so this plan stands out.</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={popular}
          onClick={() => onContentUpdate({ popular: !popular } as any)}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${popular ? 'bg-blue-500' : 'bg-[#333]'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${popular ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
      {popular && (
        <TextInput
          label="Badge Text"
          value={(content as any).popularBadgeText || ''}
          onChange={(v) => onContentUpdate({ popularBadgeText: v } as any)}
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
      {items.map((item: ItemData, idx: number) => (
        <div key={idx} className="p-3 bg-[#151515] border border-[#333] rounded space-y-3 relative group">
          <button
            onClick={() => removeItem(idx)}
            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] transition-opacity"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <TextInput
            label={`Feature ${idx + 1}`}
            value={(item.title as string) || ''}
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
          placeholder="Choose Plan"
        />
        <TextInput
          label="Button Link"
          value={(content as any).ctaLink || ''}
          onChange={(v) => onContentUpdate({ ctaLink: v } as any)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
};

/** Review Carousel content form — reviews list + rating + marquee toggle */
export const ReviewCarouselContentForm: React.FC<BaseProps> = ({ content, onContentUpdate }) => {
  const items: any[] = Array.isArray(content.items) ? content.items : [];
  const marquee = !!(content as any).marquee;

  const addItem = () => {
    onContentUpdate({ items: [...items, { author: 'New User', content: 'Great service!', rating: 5 }] });
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
      {/* Marquee toggle */}
      <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white">Auto-scroll Marquee</div>
          <div className="text-[10px] text-white/40 mt-0.5">Reviews scroll continuously horizontally.</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={marquee}
          onClick={() => onContentUpdate({ marquee: !marquee } as any)}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${marquee ? 'bg-blue-500' : 'bg-[#333]'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${marquee ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
      {marquee && (
        <TextInput
          label="Marquee Speed"
          value={String((content as any).marqueeSpeed || '40s')}
          onChange={(v) => onContentUpdate({ marqueeSpeed: v } as any)}
          placeholder="40s (higher = slower)"
        />
      )}

      {/* Reviews list */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-white/40 uppercase">Reviews</label>
        <button
          onClick={addItem}
          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px]"
        >
          <i className="fa-solid fa-plus mr-1"></i>Add Review
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
            label={`Author ${idx + 1}`}
            value={item.author || ''}
            onChange={(v) => updateItem(idx, { author: v })}
            placeholder="Sarah K."
          />
          <TextAreaInput
            label="Review"
            value={item.content || ''}
            onChange={(v) => updateItem(idx, { content: v })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-white/40 capitalize ml-1">Rating ({item.rating ?? 5}/5)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const r = typeof item.rating === 'number' ? item.rating : 5;
                const active = r >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => updateItem(idx, { rating: star })}
                    className="p-1 transition-opacity hover:opacity-80"
                    aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                  >
                    <i
                      className="fa-solid fa-star text-base"
                      style={{ color: active ? '#F59E0B' : 'rgba(255,255,255,0.2)' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/** Tabs items editor — title + content per tab + Show Panel toggle */
export const TabsContentForm: React.FC<BaseProps> = ({ content, onContentUpdate }) => {
  const items: ItemData[] = content.items || [];
  const showPanel = (content as any).showPanel !== false;

  const addItem = () => {
    const newItems = [...items, { title: `Tab ${items.length + 1}`, content: 'Tab content...' }];
    onContentUpdate({ items: newItems });
  };
  const removeItem = (idx: number) => {
    onContentUpdate({ items: items.filter((_, i) => i !== idx) });
  };
  const updateItem = (idx: number, patch: Partial<ItemData>) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], ...patch };
    onContentUpdate({ items: newItems });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white">Show Content Panel</div>
          <div className="text-[10px] text-white/40 mt-0.5">Wrap each tab's content in a bordered card. Off = bare content.</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showPanel}
          onClick={() => onContentUpdate({ showPanel: !showPanel } as any)}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${showPanel ? 'bg-blue-500' : 'bg-[#333]'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showPanel ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-white/40 uppercase">Tabs</label>
        <button
          onClick={addItem}
          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px]"
        >
          <i className="fa-solid fa-plus mr-1"></i>Add Tab
        </button>
      </div>
      {items.map((item: ItemData, idx: number) => (
        <div key={idx} className="p-3 bg-[#151515] border border-[#333] rounded space-y-3 relative group">
          <button
            onClick={() => removeItem(idx)}
            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] transition-opacity"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <TextInput
            label={`Tab ${idx + 1} Label`}
            value={(item.title as string) || ''}
            onChange={(v) => updateItem(idx, { title: v })}
          />
          <TextAreaInput
            label={`Tab ${idx + 1} Content`}
            value={(item.content as string) || ''}
            onChange={(v) => updateItem(idx, { content: v })}
          />
        </div>
      ))}
    </div>
  );
};

/** Logo Cloud items editor */
export const LogoCloudContentForm: React.FC<ItemsWithUploadProps> = ({ content, onContentUpdate, onItemUpload }) => {
  const items: ItemData[] = content.items || [];

  const addItem = () => {
    const newItems = [...items, { src: 'https://cdn.worldvectorlogo.com/logos/google-2015.svg', alt: 'New Logo' }];
    onContentUpdate({ items: newItems });
  };
  const removeItem = (idx: number) => {
    onContentUpdate({ items: items.filter((_, i) => i !== idx) });
  };
  const updateItem = (idx: number, patch: Partial<ItemData>) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], ...patch };
    onContentUpdate({ items: newItems });
  };

  const grayscale = (content as any).grayscale !== false;
  const marquee = !!(content as any).marquee;

  return (
    <div className="space-y-4">
      {/* Display options */}
      <div className="p-3 bg-[#151515] border border-[#333] rounded space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white">Grayscale (pop on hover)</div>
            <div className="text-[10px] text-white/40 mt-0.5">Logos fade to grey until hovered — classic trust-bar look.</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={grayscale}
            onClick={() => onContentUpdate({ grayscale: !grayscale } as any)}
            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${grayscale ? 'bg-blue-500' : 'bg-[#333]'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${grayscale ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white">Auto-scroll marquee</div>
            <div className="text-[10px] text-white/40 mt-0.5">Infinite horizontal scroll — good for long logo lists.</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={marquee}
            onClick={() => onContentUpdate({ marquee: !marquee } as any)}
            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${marquee ? 'bg-blue-500' : 'bg-[#333]'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${marquee ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {marquee && (
          <TextInput
            label="Marquee Speed"
            value={String((content as any).marqueeSpeed || '30s')}
            onChange={(v) => onContentUpdate({ marqueeSpeed: v } as any)}
            placeholder="30s (higher = slower)"
          />
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-white/40 uppercase">Logos</label>
        <button
          onClick={addItem}
          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px]"
        >
          <i className="fa-solid fa-plus mr-1"></i>Add Logo
        </button>
      </div>
      {items.map((item: ItemData, idx: number) => (
        <div key={idx} className="p-3 bg-[#151515] border border-[#333] rounded space-y-3 relative group">
          <button
            onClick={() => removeItem(idx)}
            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] transition-opacity"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <ImageControl
            label={`Logo ${idx + 1} URL`}
            value={item.src || ''}
            onChange={(v) => updateItem(idx, { src: v })}
            onUpload={() => onItemUpload(idx, 'src')}
          />
          <TextInput
            label="Alt Text"
            value={item.alt || ''}
            onChange={(v) => updateItem(idx, { alt: v })}
          />
          <TextInput
            label="Link URL (optional)"
            value={String(item.link || '')}
            onChange={(v) => updateItem(idx, { link: v } as any)}
            placeholder="https://company.com"
          />
          <LinkNewTabToggle
            visible={!!item.link && !!String(item.link).trim()}
            value={(item as any).linkNewTab as boolean | undefined}
            onChange={(v: boolean) => updateItem(idx, { linkNewTab: v } as any)}
          />
        </div>
      ))}
    </div>
  );
};

/** User Avatars items editor (with targetNumber for "+N" extra count) */
export const UserAvatarsContentForm: React.FC<ItemsWithUploadProps> = ({ content, onContentUpdate, onItemUpload }) => {
  const items: ItemData[] = content.items || [];

  const addItem = () => {
    const newItems = [...items, { src: `https://picsum.photos/seed/${Math.random()}/32/32` }];
    onContentUpdate({ items: newItems });
  };
  const removeItem = (idx: number) => {
    onContentUpdate({ items: items.filter((_, i) => i !== idx) });
  };
  const updateItem = (idx: number, patch: Partial<ItemData>) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], ...patch };
    onContentUpdate({ items: newItems });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-white/40 uppercase">Avatars</label>
        <button
          onClick={addItem}
          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px]"
        >
          <i className="fa-solid fa-plus mr-1"></i>Add Avatar
        </button>
      </div>
      {items.map((item: ItemData, idx: number) => (
        <div key={idx} className="p-3 bg-[#151515] border border-[#333] rounded space-y-3 relative group">
          <button
            onClick={() => removeItem(idx)}
            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] transition-opacity"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <ImageControl
            label={`Avatar ${idx + 1} URL`}
            value={item.src || ''}
            onChange={(v) => updateItem(idx, { src: v })}
            onUpload={() => onItemUpload(idx, 'src')}
          />
        </div>
      ))}

      {/* Label / count controls */}
      <div className="pt-3 mt-3 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Label</h4>
        <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white">Show Count Label</div>
            <div className="text-[10px] text-white/40 mt-0.5">"Join 5,000+ others" text after the avatars.</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={(content as any).showCount !== false}
            onClick={() => onContentUpdate({ showCount: (content as any).showCount === false } as any)}
            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${(content as any).showCount !== false ? 'bg-blue-500' : 'bg-[#333]'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${(content as any).showCount !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {(content as any).showCount !== false && (
          <>
            <TextInput
              label="Count Number (e.g. 5,000+)"
              value={content.targetNumber !== undefined ? String(content.targetNumber) : ''}
              onChange={(v) => onContentUpdate({ targetNumber: v as any })}
              placeholder="5,000+"
            />
            <TextInput
              label="Word Before"
              value={(content as any).labelBefore || ''}
              onChange={(v) => onContentUpdate({ labelBefore: v } as any)}
              placeholder="Join"
            />
            <TextInput
              label="Word After"
              value={(content as any).labelAfter || ''}
              onChange={(v) => onContentUpdate({ labelAfter: v } as any)}
              placeholder="others"
            />
          </>
        )}
      </div>
    </div>
  );
};

/** Testimonial items editor */
export const TestimonialContentForm: React.FC<ItemsWithUploadProps> = ({ content, onContentUpdate, onItemUpload }) => {
  const items: ItemData[] = content.items || [];

  const addItem = () => {
    const newItems = [...items, { author: 'New User', role: 'Customer', content: 'Great service!', avatar: 'https://via.placeholder.com/50' }];
    onContentUpdate({ items: newItems });
  };
  const removeItem = (idx: number) => {
    onContentUpdate({ items: items.filter((_, i) => i !== idx) });
  };
  const updateItem = (idx: number, patch: Partial<ItemData>) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], ...patch };
    onContentUpdate({ items: newItems });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-white/40 uppercase">Testimonials</label>
        <button
          onClick={addItem}
          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px]"
        >
          <i className="fa-solid fa-plus mr-1"></i>Add Testimonial
        </button>
      </div>
      {items.map((item: ItemData, idx: number) => (
        <div key={idx} className="p-3 bg-[#151515] border border-[#333] rounded space-y-3 relative group">
          <button
            onClick={() => removeItem(idx)}
            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] transition-opacity"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <TextInput
            label="Author Name"
            value={item.author || ''}
            onChange={(v) => updateItem(idx, { author: v })}
          />
          <TextInput
            label="Role"
            value={item.role || ''}
            onChange={(v) => updateItem(idx, { role: v })}
          />
          <ImageControl
            label="Avatar URL"
            value={item.avatar || ''}
            onChange={(v) => updateItem(idx, { avatar: v })}
            onUpload={() => onItemUpload(idx, 'avatar')}
          />
          <TextAreaInput
            label="Content"
            value={item.content || ''}
            onChange={(v) => updateItem(idx, { content: v })}
          />
        </div>
      ))}
    </div>
  );
};

/** Trust Strip items editor — each item: { icon, label } */
/**
 * NavMenuContentForm — manage the items array for the `nav-menu` element.
 *
 * Each top-level nav item supports:
 *   • label       — display text
 *   • link        — URL
 *   • linkNewTab  — open in new tab toggle (defaults to ON)
 *   • dropdown    — optional array of sub-items, each with label + link + linkNewTab
 *
 * Items are collapsible accordions (first open by default) with reorder + remove.
 * Dropdown sub-items live inside each item's expanded body.
 */
export const NavMenuContentForm: React.FC<BaseProps> = ({ content, onContentUpdate }) => {
  const items: ItemData[] = (content.items as ItemData[]) || [];

  const addItem = () => {
    onContentUpdate({ items: [...items, { label: 'New Link', link: '#' }] });
  };
  const removeItem = (idx: number) => {
    onContentUpdate({ items: items.filter((_, i) => i !== idx) });
  };
  const updateItem = (idx: number, patch: Partial<ItemData>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onContentUpdate({ items: next });
  };
  const moveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onContentUpdate({ items: next });
  };

  const addSub = (parentIdx: number) => {
    const parent = items[parentIdx] as any;
    const subs = Array.isArray(parent.dropdown) ? parent.dropdown : [];
    updateItem(parentIdx, { dropdown: [...subs, { label: 'Sub link', link: '#' }] } as any);
  };
  const removeSub = (parentIdx: number, subIdx: number) => {
    const parent = items[parentIdx] as any;
    const subs: any[] = Array.isArray(parent.dropdown) ? parent.dropdown : [];
    updateItem(parentIdx, { dropdown: subs.filter((_, i) => i !== subIdx) } as any);
  };
  const updateSub = (parentIdx: number, subIdx: number, patch: any) => {
    const parent = items[parentIdx] as any;
    const subs: any[] = Array.isArray(parent.dropdown) ? parent.dropdown : [];
    const next = [...subs];
    next[subIdx] = { ...next[subIdx], ...patch };
    updateItem(parentIdx, { dropdown: next } as any);
  };

  // Helper: when toggling `active` on an item, clear it on every other item
  // so only one nav item is active at a time (classic nav UX).
  const setActive = (idx: number, on: boolean) => {
    const next = items.map((it, i) => ({
      ...(it as any),
      active: i === idx ? on : false,
    }));
    onContentUpdate({ items: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <label className="text-[10px] font-bold text-white/40 uppercase">Nav Items ({items.length})</label>
        <button
          type="button"
          onClick={addItem}
          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px]"
        >
          <i className="fa-solid fa-plus mr-1" />Add Link
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-[10px] text-white/40 text-center py-6 border border-dashed border-white/10 rounded">
          No nav links yet. Click <b>Add Link</b> to start.
        </div>
      )}

      {items.map((item: ItemData, idx: number) => {
        const subs: any[] = Array.isArray((item as any).dropdown) ? (item as any).dropdown : [];
        const itemAny = item as any;
        const sourceVal: string = itemAny.selectSource || '';
        const isActive = !!itemAny.active;
        const previewLabel = String(itemAny.label || 'Empty link').trim();
        const previewShort = previewLabel.length > 30 ? previewLabel.slice(0, 30) + '…' : previewLabel;
        return (
          <details key={idx} className="bg-[#151515] border border-[#333] rounded group/item open:bg-[#181818]" open={idx === 0}>
            <summary className="flex items-center justify-between px-3 py-2.5 cursor-pointer list-none select-none rounded">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <i className="fa-solid fa-chevron-right text-[9px] text-white/40 transition-transform group-open/item:rotate-90" />
                <span className="text-[10px] font-bold text-white/40 shrink-0">{idx + 1}.</span>
                <span className="text-[11px] text-white/70 truncate">{previewShort}</span>
                {isActive && (
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-1.5 py-0.5 shrink-0">
                    active
                  </span>
                )}
                {sourceVal && (
                  <span className="text-[9px] text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded px-1.5 py-0.5 shrink-0">
                    {sourceVal}
                  </span>
                )}
                {!sourceVal && subs.length > 0 && (
                  <span className="text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded px-1.5 py-0.5 shrink-0">
                    {subs.length} sub
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); moveItem(idx, -1); }}
                  disabled={idx === 0}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white/60 text-[10px] flex items-center justify-center transition-colors"
                  title="Move up"
                >
                  <i className="fa-solid fa-arrow-up" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); moveItem(idx, 1); }}
                  disabled={idx === items.length - 1}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white/60 text-[10px] flex items-center justify-center transition-colors"
                  title="Move down"
                >
                  <i className="fa-solid fa-arrow-down" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); removeItem(idx); }}
                  className="w-6 h-6 rounded bg-red-500/15 hover:bg-red-500/30 text-red-400 text-[10px] flex items-center justify-center transition-colors"
                  title="Remove"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-white/5">
              <TextInput
                label="Label"
                value={itemAny.label || ''}
                onChange={(v) => updateItem(idx, { label: v } as any)}
                placeholder="Home"
              />

              <IconPicker
                label="Icon (optional)"
                value={itemAny.icon || ''}
                onChange={(v) => updateItem(idx, { icon: v } as any)}
              />

              <TextInput
                label="Link (URL)"
                value={itemAny.link || ''}
                onChange={(v) => updateItem(idx, { link: v } as any)}
                placeholder="https://... or /path or #section"
              />
              <LinkNewTabToggle
                visible={!!itemAny.link && !!String(itemAny.link).trim()}
                value={itemAny.linkNewTab as boolean | undefined}
                onChange={(v: boolean) => updateItem(idx, { linkNewTab: v } as any)}
              />

              {/* Active state toggle — only one item can be active at a time */}
              <div className="flex items-center justify-between gap-3 p-2.5 bg-[#0E0E0E] border border-[#222] rounded">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-white/80">Mark as Active</div>
                  <div className="text-[9px] text-white/40 mt-0.5">Highlights this link as the current page. Only one item can be active.</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setActive(idx, !isActive)}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-[#333]'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Dropdown source — auto-populated from a backend (mock for now) */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <SelectInput
                  label="Dropdown Source (auto-populated)"
                  value={sourceVal}
                  options={[
                    { label: 'No auto-source (use manual sub-items)', value: '' },
                    { label: 'Services',   value: 'services' },
                    { label: 'Locations / Areas',  value: 'locations' },
                    { label: 'Categories', value: 'categories' },
                  ]}
                  onChange={(v) => updateItem(idx, { selectSource: v } as any)}
                />
                {!!sourceVal && (
                  <p className="text-[10px] text-white/40 italic">
                    Sub-items are pulled from the <b>{sourceVal}</b> data source. Static today, backend-driven later.
                  </p>
                )}
              </div>

              {/* "View All" footer link inside the dropdown */}
              {(!!sourceVal || subs.length > 0) && (
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase">View All Footer (optional)</label>
                  <TextInput
                    label="Label"
                    value={itemAny.viewAllLabel || ''}
                    onChange={(v) => updateItem(idx, { viewAllLabel: v } as any)}
                    placeholder="View All Services"
                  />
                  <TextInput
                    label="Link"
                    value={itemAny.viewAllLink || ''}
                    onChange={(v) => updateItem(idx, { viewAllLink: v } as any)}
                    placeholder="/services"
                  />
                </div>
              )}

              {/* Manual dropdown sub-items — only when no auto-source is set */}
              {!sourceVal && (
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-white/40 uppercase">Manual Sub-items ({subs.length})</label>
                    <button
                      type="button"
                      onClick={() => addSub(idx)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/60 rounded border border-white/10 text-[9px]"
                    >
                      <i className="fa-solid fa-plus mr-1" />Add Sub
                    </button>
                  </div>
                  {subs.length === 0 && (
                    <p className="text-[10px] text-white/30 italic">
                      Add sub-items to turn this into a dropdown menu, or pick a Dropdown Source above.
                    </p>
                  )}
                  {subs.map((sub, j) => (
                    <div key={j} className="p-2.5 bg-[#0E0E0E] border border-[#222] rounded space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => removeSub(idx, j)}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded bg-red-500/15 hover:bg-red-500/30 text-red-400 text-[9px] flex items-center justify-center transition-colors"
                        title="Remove sub-item"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                      <TextInput
                        label={`Sub ${j + 1} — Label`}
                        value={sub.label || ''}
                        onChange={(v) => updateSub(idx, j, { label: v })}
                      />
                      <IconPicker
                        label="Icon (optional)"
                        value={sub.icon || ''}
                        onChange={(v) => updateSub(idx, j, { icon: v })}
                      />
                      <TextInput
                        label="Link (URL)"
                        value={sub.link || ''}
                        onChange={(v) => updateSub(idx, j, { link: v })}
                        placeholder="https://..."
                      />
                      <LinkNewTabToggle
                        visible={!!sub.link && !!String(sub.link).trim()}
                        value={sub.linkNewTab as boolean | undefined}
                        onChange={(v: boolean) => updateSub(idx, j, { linkNewTab: v })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
};

/**
 * ListContentForm — manage the items array for the `list` element.
 *
 * Each item supports:
 *   • title  — the editable text (required)
 *   • link   — optional URL (whole-item clickable when set)
 *   • icon   — optional per-item icon override (only useful when listType=custom;
 *              ignored otherwise but harmless to store).
 *
 * Add / remove / reorder (move up / move down). Quick-actions for common
 * patterns (load defaults, clear all).
 */
export const ListContentForm: React.FC<BaseProps> = ({ content, onContentUpdate }) => {
  const items: ItemData[] = (content.items as ItemData[]) || [];

  const addItem = () => {
    onContentUpdate({ items: [...items, { title: 'New item' }] });
  };
  const removeItem = (idx: number) => {
    onContentUpdate({ items: items.filter((_, i) => i !== idx) });
  };
  const updateItem = (idx: number, patch: Partial<ItemData>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onContentUpdate({ items: next });
  };
  const moveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onContentUpdate({ items: next });
  };
  const clearAll = () => {
    if (!items.length) return;
    onContentUpdate({ items: [] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <label className="text-[10px] font-bold text-white/40 uppercase">List Items ({items.length})</label>
        <div className="flex items-center gap-1.5">
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/50 rounded border border-white/10 text-[9px]"
              title="Remove all items"
            >
              <i className="fa-solid fa-trash mr-1" />Clear
            </button>
          )}
          <button
            type="button"
            onClick={addItem}
            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px]"
          >
            <i className="fa-solid fa-plus mr-1" />Add Item
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <div className="text-[10px] text-white/40 text-center py-6 border border-dashed border-white/10 rounded">
          No items yet. Click <b>Add Item</b> to get started.
        </div>
      )}

      {items.map((item: ItemData, idx: number) => {
        // Strip HTML tags for the summary preview line.
        const previewText = String((item.title as string) || '')
          .replace(/<[^>]+>/g, '')
          .trim();
        const previewShort = previewText.length > 38 ? previewText.slice(0, 38) + '…' : (previewText || 'Empty item');
        return (
          <details key={idx} className="bg-[#151515] border border-[#333] rounded group/item open:bg-[#181818]" open={idx === 0}>
            <summary className="flex items-center justify-between px-3 py-2.5 cursor-pointer list-none select-none rounded">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <i className="fa-solid fa-chevron-right text-[9px] text-white/40 transition-transform group-open/item:rotate-90" />
                <span className="text-[10px] font-bold text-white/40 shrink-0">{idx + 1}.</span>
                <span className="text-[11px] text-white/70 truncate">{previewShort}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); moveItem(idx, -1); }}
                  disabled={idx === 0}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white/60 text-[10px] flex items-center justify-center transition-colors"
                  title="Move up"
                >
                  <i className="fa-solid fa-arrow-up" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); moveItem(idx, 1); }}
                  disabled={idx === items.length - 1}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white/60 text-[10px] flex items-center justify-center transition-colors"
                  title="Move down"
                >
                  <i className="fa-solid fa-arrow-down" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); removeItem(idx); }}
                  className="w-6 h-6 rounded bg-red-500/15 hover:bg-red-500/30 text-red-400 text-[10px] flex items-center justify-center transition-colors"
                  title="Remove item"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-white/5">
              <TextAreaInput
                label="Text"
                value={(item.title as string) || ''}
                onChange={(v) => updateItem(idx, { title: v })}
                placeholder="List item text"
              />
              <TextInput
                label="Link (optional URL)"
                value={(item.link as string) || ''}
                onChange={(v) => updateItem(idx, { link: v })}
                placeholder="https://... or /page"
              />
              <LinkNewTabToggle
                visible={!!(item.link as string) && !!String(item.link).trim()}
                value={(item as any).linkNewTab as boolean | undefined}
                onChange={(v: boolean) => updateItem(idx, { linkNewTab: v } as any)}
              />
              <IconPicker
                label="Icon override (used when list type = Custom)"
                value={(item.icon as string) || ''}
                onChange={(v) => updateItem(idx, { icon: v })}
              />
            </div>
          </details>
        );
      })}
    </div>
  );
};

export const TrustStripContentForm: React.FC<BaseProps> = ({ content, onContentUpdate }) => {
  const items: ItemData[] = content.items || [];

  const addItem = () => {
    const newItems = [...items, { icon: 'fa-check', label: 'New trust point' }];
    onContentUpdate({ items: newItems });
  };
  const removeItem = (idx: number) => {
    onContentUpdate({ items: items.filter((_, i) => i !== idx) });
  };
  const updateItem = (idx: number, patch: Partial<ItemData>) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], ...patch };
    onContentUpdate({ items: newItems });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-white/40 uppercase">Trust Points</label>
        <button
          onClick={addItem}
          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px]"
        >
          <i className="fa-solid fa-plus mr-1"></i>Add Item
        </button>
      </div>
      {items.map((item: ItemData, idx: number) => (
        <div key={idx} className="p-3 bg-[#151515] border border-[#333] rounded space-y-3 relative group">
          <button
            onClick={() => removeItem(idx)}
            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] transition-opacity"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <IconPicker
            label={`Icon ${idx + 1}`}
            value={(item.icon as string) || 'fa-check'}
            onChange={(v) => updateItem(idx, { icon: v })}
          />
          <TextInput
            label="Label"
            value={(item.label as string) || ''}
            onChange={(v) => updateItem(idx, { label: v })}
          />
        </div>
      ))}
    </div>
  );
};
