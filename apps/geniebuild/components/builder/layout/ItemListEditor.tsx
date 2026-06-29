import React from 'react';
import type { Section } from '../../../types';
import { AccordionGroup } from '../inputs';

interface SectionItem {
  id?: string;
  title?: string;
  author?: string;
  [key: string]: unknown;
}

export type HideIconsFilter =
  | { kind: 'all-feature-box' }
  | { kind: 'feature-box-with-id-substring'; substring: string };

export type RemoveElementStrategy =
  | { kind: 'exact-id'; idFor: (idx: number, sectionId: string) => string }
  | { kind: 'prefix'; prefixFor: (idx: number, sectionId: string) => string }
  | { kind: 'none' };

interface ItemListEditorProps<TItem extends SectionItem = SectionItem> {
  /** AccordionGroup title (e.g., "Features Section"). */
  accordionTitle: string;
  /** The section being edited. */
  section: Section;
  /** Called when section.content or section.elements changes. */
  onUpdateSection: (updates: Partial<Section>) => void;

  /** Label shown in the count line (e.g., "Feature Cards"). */
  listLabel: string;
  /** Singular item name for the "Add X" button (e.g., "Feature", "Review"). */
  itemNoun: string;
  /** Fallback count when `items.length === 0` — usually `defaults.length` or a
   *  fixed number for sections whose canvas shows defaults even with no data. */
  fallbackCountWhenEmpty?: number;
  /** Optional subtitle shown under the count line. */
  helperText?: string;

  /** Which content field holds the list (default: `items`). */
  itemsKey?: string;
  /** Default items used as a seed when user clicks Add on an empty list, and
   *  optionally rendered in the row list when `renderDefaultsWhenEmpty` is true. */
  defaults?: TItem[];
  /** If true, render default items in the row list when no user items exist. */
  renderDefaultsWhenEmpty?: boolean;

  /** Function to produce the label text for a single row (e.g., idx + title). */
  rowLabel?: (item: TItem, idx: number) => string;

  /** Optional "Hide all icons" toggle config — omit to hide the toggle. */
  hideIconsToggle?: {
    label?: string;
    hint?: string;
    filter: HideIconsFilter;
  };

  /** How to clean up section.elements when a row is removed. */
  removeStrategy?: RemoveElementStrategy;
}

/** Matches an element against a HideIconsFilter rule. */
const matchesHideIconsFilter = (el: { type?: string; id?: string }, filter: HideIconsFilter): boolean => {
  if (filter.kind === 'all-feature-box') return el.type === 'feature-box';
  if (filter.kind === 'feature-box-with-id-substring') {
    return el.type === 'feature-box' && !!el.id && el.id.includes(filter.substring);
  }
  return false;
};

/**
 * Reusable list editor for sections with an array of content items
 * (Features, Services, Why-Choose, Testimonials, Guarantee, Areas, etc.).
 *
 * Encapsulates the add/remove row UI, the optional "Hide all icons" toggle,
 * and the per-section id-cleanup logic when an item is removed.
 */
export function ItemListEditor<TItem extends SectionItem = SectionItem>({
  accordionTitle,
  section,
  onUpdateSection,
  listLabel,
  itemNoun,
  fallbackCountWhenEmpty,
  helperText,
  itemsKey = 'items',
  defaults = [],
  renderDefaultsWhenEmpty = false,
  rowLabel = (item, idx) => `${idx + 1}. ${item.title || item.author || `${itemNoun} ${idx + 1}`}`,
  hideIconsToggle,
  removeStrategy = { kind: 'none' },
}: ItemListEditorProps<TItem>) {
  const content = (section.content || {}) as Record<string, unknown>;
  const items = Array.isArray(content[itemsKey]) ? (content[itemsKey] as TItem[]) : [];

  const shownList = items.length > 0 ? items : (renderDefaultsWhenEmpty ? defaults : []);
  const displayCount = items.length || (fallbackCountWhenEmpty ?? defaults.length);

  const updateContent = (patch: Record<string, unknown>) => {
    onUpdateSection({ content: { ...content, ...patch } as Section['content'] });
  };

  const onAdd = () => {
    const seed = items.length > 0 ? items : defaults.map(d => ({ ...d }));
    if (defaults.length === 0) {
      // No defaults — add an empty object
      updateContent({ [itemsKey]: [...seed, {} as TItem] });
      return;
    }
    const nextIdx = seed.length % defaults.length;
    updateContent({ [itemsKey]: [...seed, { ...defaults[nextIdx] }] });
  };

  const onRemove = (idx: number) => {
    const base = items.length > 0 ? items : defaults.map(d => ({ ...d }));
    const newItems = base.filter((_, i) => i !== idx);

    let newElements = section.elements;
    if (removeStrategy.kind === 'exact-id') {
      const removedId = removeStrategy.idFor(idx, section.id);
      newElements = (section.elements || []).filter(el => el.id !== removedId);
    } else if (removeStrategy.kind === 'prefix') {
      const prefix = removeStrategy.prefixFor(idx, section.id);
      newElements = (section.elements || []).filter(el => !el.id.startsWith(prefix));
    }

    onUpdateSection({
      content: { ...content, [itemsKey]: newItems } as Section['content'],
      ...(newElements !== section.elements ? { elements: newElements } : {}),
    });
  };

  const onToggleHideIcons = (next: boolean) => {
    if (!hideIconsToggle) return;
    const patchedElements = (section.elements || []).map(el => {
      if (!matchesHideIconsFilter(el, hideIconsToggle.filter)) return el;
      const nc: Record<string, unknown> = { ...(el.content || {}) };
      if (next) nc.icon = 'none';
      else if (nc.icon === 'none') delete nc.icon;
      return { ...el, content: nc };
    });
    onUpdateSection({
      content: { ...content, hideIcons: next } as Section['content'],
      elements: patchedElements,
    });
  };

  return (
    <AccordionGroup title={accordionTitle} defaultOpen={true}>
      <div className="space-y-4">
        {hideIconsToggle && (
          <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
            <div className="flex-1">
              <div className="text-xs font-bold text-white">{hideIconsToggle.label || 'Hide All Icons'}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{hideIconsToggle.hint || 'Remove icons from every card at once'}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!content.hideIcons}
              aria-label={hideIconsToggle.label || 'Hide all icons'}
              onClick={() => onToggleHideIcons(!content.hideIcons)}
              className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151515] ${content.hideIcons ? 'bg-blue-500' : 'bg-[#333]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${content.hideIcons ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
        )}
        <div className={hideIconsToggle ? 'pt-2 border-t border-white/10' : ''}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-white/40 uppercase">
              {listLabel} ({displayCount})
            </label>
            <button
              type="button"
              onClick={onAdd}
              aria-label={`Add ${itemNoun.toLowerCase()}`}
              className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-[9px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <i className="fa-solid fa-plus mr-1" aria-hidden="true"></i>Add {itemNoun}
            </button>
          </div>
          {helperText && <p className="text-[10px] text-white/40 mb-3">{helperText}</p>}
          {shownList.map((item, idx) => {
            const rowText = rowLabel(item, idx);
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2 bg-[#151515] border border-[#2a2a2a] rounded text-[11px] mb-2"
              >
                <span className="truncate text-white/80">{rowText}</span>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  title="Remove"
                  aria-label={`Remove ${rowText}`}
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AccordionGroup>
  );
}
