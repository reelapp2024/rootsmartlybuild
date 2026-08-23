import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { ElementsSection } from '../ElementsSection';
import { PALETTE_ELEMENTS, createCanvasElement } from './canvasElementFactory';
import { resolveSectionWrapperStyle, resolveSectionOverlay, sectionBgHasImage } from '../homepage/utils/sectionBackground';
import { SectionEffectsLayer } from '../homepage/utils/SectionEffectsLayer';
import { resolveBgPatternLayers } from '../homepage/utils/sectionBgPatterns';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
  /** Selected section flag — controls whether the add/delete/reorder chrome shows. */
  isSelected?: boolean;
  /** Full-section patch writer — used to rewrite section.elements[] (add/remove/reorder). */
  onSectionUpdate?: (sectionId: string, updates: any) => void;
}

/**
 * CanvasFreeform — an Elementor-style "blank canvas" section.
 *
 * The user adds ANY element (heading, text, image, button, card, …) from the
 * palette, edits each one via the normal sidebar (click to select → content +
 * style forms), and can delete / move each element up or down. Elements live in
 * `section.elements[]` and render in array order through the shared
 * ElementsSection renderer, so every element type + its editing is reused as-is.
 *
 * Nothing is hardcoded/fixed here: the layout IS whatever elements the user adds.
 */
export const CanvasFreeform: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
  isSelected = false, onSectionUpdate,
}) => {
  const s = (section.styles || {}) as any;
  const elements = section.elements || [];

  const accent = tc?.accentColor || tc?.light?.accentColor || '#E11D48';
  const textMuted = tc?.textColorMuted || tc?.muted || tc?.light?.muted || '#6B7280';
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#111827';
  const cardBorder = tc?.cardBorderColor || tc?.light?.cardBorderColor || 'rgba(0,0,0,0.1)';

  // Section wrapper honours ALL section Design/Advanced controls the same way as
  // every other variant: background (color / gradient / image), image-only
  // overlay, margin (top/bottom) and border — via the shared resolver. Dividers
  // are drawn by the shared SectionEffectsLayer below.
  const defaultSurface = tc?.backgroundColor || tc?.light?.surface || 'transparent';
  const baseWrapperStyle = resolveSectionWrapperStyle(s, { defaultSurface });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);

  // Design-tab "Background Pattern" (grid / glow / dots) — a theme-driven
  // decorative layer applied on top of the resolved base colour. Reusable on ANY
  // Canvas section; skipped when the section already uses its own bg image so the
  // two don't fight for the backgroundImage slot.
  const patternLayers = !hasBgImage
    ? resolveBgPatternLayers((s as any).bgPattern, {
        accent: tc?.accentColor || tc?.light?.accentColor,
        line: tc?.dividerColor || tc?.cardBorderColor || cardBorder,
      })
    : {};
  const wrapperStyle: React.CSSProperties = {
    ...baseWrapperStyle,
    ...(patternLayers.backgroundImage
      ? {
          backgroundColor: (baseWrapperStyle as any).backgroundColor || defaultSurface,
          backgroundImage: patternLayers.backgroundImage,
          backgroundSize: patternLayers.backgroundSize,
          backgroundRepeat: patternLayers.backgroundRepeat,
        }
      : {}),
  };

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop  ?? 'pt-14 lg:pt-20';
  const padB = s.paddingBottom ?? 'pb-14 lg:pb-20';
  const padX = s.paddingX      ?? 'px-6';
  // Width honours the section width preset (maxWidth) when set, else a sensible default.
  const maxW = typeof s.maxWidth === 'string' && s.maxWidth.trim() ? s.maxWidth : '1180px';
  const innerClass = `mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  // Content vertical position when the section is taller than its content
  // (pairs with Minimum Height). 'flex-start' | 'center' | 'flex-end'.
  const contentAlign = String(s.contentAlign || 'flex-start');
  const hasMinHeight = typeof s.minHeight === 'string' && s.minHeight.trim() && s.minHeight !== '0';
  const innerStyle: React.CSSProperties = {
    maxWidth: maxW,
    width: '100%',
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
    // When a min-height is set, make the inner a full-height flex column so the
    // Content Position (top/center/bottom) actually moves the content.
    ...(hasMinHeight ? { minHeight: 'inherit', display: 'flex', flexDirection: 'column', justifyContent: contentAlign as any } : {}),
  };

  // Authoring controls, split:
  //   • ADD_ENABLED   — the "Add element" palette. ON: a true Elementor-style
  //     freeform canvas — the user (or AI) can drop any of the elements onto a
  //     section, not just edit a pre-designed set.
  //   • ITEM_TOOLS_ENABLED — per-element DELETE + REORDER (move up/down). ON so
  //     the user can remove elements they don't want and change their order.
  const ADD_ENABLED = true;
  const ITEM_TOOLS_ENABLED = true;
  const canAuthor = isSelected && !readOnly && !!onSectionUpdate;
  const showAddPalette = ADD_ENABLED && canAuthor;
  const showItemTools = ITEM_TOOLS_ENABLED && canAuthor;
  // Kept for the empty-state prompt (only meaningful when adding is possible).
  const showChrome = showAddPalette;

  const [paletteOpen, setPaletteOpen] = React.useState(false);

  const writeElements = (next: WebsiteElement[]) => {
    if (readOnly || !onSectionUpdate) return;
    onSectionUpdate(section.id, { elements: next });
  };

  const addElement = (type: WebsiteElement['type']) => {
    const el = createCanvasElement(section.id, type);
    writeElements([...elements, el]);
    setPaletteOpen(false);
    onElementSelect?.(el.id, el);
  };

  const removeElement = (id: string) => {
    writeElements(elements.filter((e) => e.id !== id));
  };

  const moveElement = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= elements.length) return;
    const next = [...elements];
    const [moved] = next.splice(index, 1);
    next.splice(j, 0, moved);
    writeElements(next);
  };

  // --- Native drag-to-reorder (Elementor-style) for top-level elements ---
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);
  const reorderTo = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= elements.length) return;
    const next = [...elements];
    const [moved] = next.splice(from, 1);
    next.splice(to > from ? to - 1 : to, 0, moved);
    writeElements(next);
  };

  // Duplicate an element (deep copy with fresh ids), inserted right after it.
  const duplicateElement = (index: number) => {
    const el = elements[index];
    if (!el) return;
    const suffix = `-copy-${Math.floor(performance.now() % 100000)}`;
    const clone: WebsiteElement = JSON.parse(JSON.stringify(el));
    clone.id = `${el.id}${suffix}`;
    // Give any row children new ids too, so nothing collides.
    const kids = (clone.content as any)?.children;
    if (Array.isArray(kids)) {
      (clone.content as any).children = kids.map((c: any, k: number) => ({ ...c, id: `${c.id || 'child'}${suffix}-${k}` }));
    }
    const next = [...elements];
    next.splice(index + 1, 0, clone);
    writeElements(next);
    onElementSelect?.(clone.id, clone);
  };

  // Hide / show an element (kept in the list but not rendered on the live site).
  const toggleHidden = (id: string) => {
    writeElements(elements.map((e) => (e.id === id ? { ...e, settings: { ...(e.settings || {}), hidden: !(e.settings as any)?.hidden } } : e)));
  };

  // Quick width control: full row, half, or auto (content width).
  const setWidth = (id: string, w: 'full' | 'half' | 'auto') => {
    const widthValue = w === 'full' ? '100%' : w === 'half' ? '50%' : 'max-content';
    writeElements(elements.map((e) => (e.id === id ? { ...e, style: { ...(e.style || {}), width: widthValue } } : e)));
  };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors: tc,
  } as const;

  // Persist a change to a row element's children back into section.elements.
  const writeRowChildren = (rowId: string, children: WebsiteElement[]) => {
    if (readOnly || !onSectionUpdate) return;
    const next = elements.map((e) => (e.id === rowId ? { ...e, content: { ...(e.content || {}), children } } : e));
    onSectionUpdate(section.id, { elements: next });
  };

  // Render a single canvas element. A `row` element lays its children[] out in N
  // columns (side-by-side). Each child column can be EITHER a single element OR a
  // `column` group (its own `content.children[]` stacked vertically) — this lets a
  // column hold several elements (e.g. badge + heading + buttons on one side, an
  // image on the other). All are real, individually-editable elements.
  const renderOne = (el: WebsiteElement): React.ReactNode => {
    if (el.type === 'row') {
      const cc = (el.content || {}) as any;
      const cols = Math.min(Math.max(parseInt(String(cc.columnCount), 10) || 2, 1), 4);
      const children: WebsiteElement[] = Array.isArray(cc.children) ? cc.children : [];
      const gap = cc.gap || '1.5rem';
      const align = cc.verticalAlign || 'stretch';

      // Update a (possibly nested) child inside this row and persist.
      const updateNested = (targetId: string, updates: any) => {
        const patch = (list: WebsiteElement[]): WebsiteElement[] =>
          list.map((c) => {
            if (c.id === targetId) {
              return { ...c, ...updates, content: { ...(c.content || {}), ...(updates.content || {}) }, style: { ...(c.style || {}), ...(updates.style || {}) } };
            }
            const gk = (c.content as any)?.children;
            if (Array.isArray(gk)) return { ...c, content: { ...(c.content || {}), children: patch(gk) } };
            return c;
          });
        writeRowChildren(el.id, patch(children));
      };

      const renderColItem = (child: WebsiteElement): React.ReactNode => {
        // A `column` group stacks its own children vertically.
        if (child.type === 'column') {
          const kids: WebsiteElement[] = Array.isArray((child.content as any)?.children) ? (child.content as any).children : [];
          const colGap = (child.content as any)?.gap || '1rem';
          const colAlign = (child.style as any)?.alignItems || 'flex-start';
          return (
            <div className="flex flex-col min-w-0" style={{ ...(child.style as any), gap: colGap, alignItems: colAlign }}>
              {kids.map((k) => <div key={k.id} className="min-w-0">{renderColItem(k)}</div>)}
            </div>
          );
        }
        return (
          <ElementsSection
            section={{ ...section, elements: [child] }}
            {...pass}
            onElementUpdate={(cid: string, updates: any) => updateNested(cid, updates)}
          />
        );
      };

      return (
        <div className="cv-row grid" style={{ ...(el.style as any), gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap, alignItems: align }}>
          {children.map((child) => (
            <div key={child.id} className="cv-row-col min-w-0">
              {renderColItem(child)}
            </div>
          ))}
        </div>
      );
    }
    return <ElementsSection section={{ ...section, elements: [el] }} {...pass} />;
  };

  const uid = `cv-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div className={`w-full relative ${uid}`} style={{ ...wrapperStyle, ...(hasMinHeight ? { minHeight: s.minHeight, display: 'flex', flexDirection: 'column' } : {}) }}>
      <style>{`
        .${uid} .cv-el { position:relative; }
        .${uid} .cv-el > .cv-tools { opacity:0; transition:opacity .15s; }
        .${uid} .cv-el:hover > .cv-tools, .${uid} .cv-el.cv-active > .cv-tools { opacity:1; }
      `}</style>

      {/* Image-only background overlay */}
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none z-[1]" style={bgOverlay} />}
      {/* Top/bottom shape dividers + background shapes (shared) */}
      <SectionEffectsLayer styles={s} theme={tc} />

      <div className={`relative z-10 ${innerClass}`} style={innerStyle}>
        {elements.length === 0 && showChrome && (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: `${accent}44`, color: textMuted }}>
            <i className="fa-solid fa-shapes text-3xl mb-3" style={{ color: accent }} />
            <p className="text-sm font-medium">Empty canvas — add your first element</p>
          </div>
        )}

        {elements.length === 0 && !showChrome && (
          <div className="text-center py-10 text-sm" style={{ color: textMuted }}>Blank section</div>
        )}

        {/* Element stack — each element in array order, with hover tools */}
        <div className="flex flex-col gap-6">
          {elements.map((el, i) => {
            const active = selectedElementId === el.id;
            const isHidden = !!(el.settings as any)?.hidden;
            // On the live site (readOnly) a hidden element is not rendered at all.
            if (isHidden && readOnly) return null;
            const curWidth = String((el.style as any)?.width || '');
            const widthKey = curWidth === '100%' ? 'full' : curWidth === '50%' ? 'half' : curWidth === 'max-content' ? 'auto' : '';
            const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
            return (
              <div
                key={el.id}
                className={`cv-el ${active ? 'cv-active' : ''}`}
                onDragOver={showItemTools ? (e) => { e.preventDefault(); if (overIndex !== i) setOverIndex(i); } : undefined}
                onDrop={showItemTools ? (e) => { e.preventDefault(); if (dragIndex !== null) reorderTo(dragIndex, i); setDragIndex(null); setOverIndex(null); } : undefined}
                style={{
                  ...(active ? { outline: `2px solid ${accent}`, outlineOffset: '4px', borderRadius: '6px' } : {}),
                  ...(isHidden ? { opacity: 0.4 } : {}),
                  ...(dragIndex === i ? { opacity: 0.4 } : {}),
                  ...(isOver ? { boxShadow: `0 -3px 0 0 ${accent}` } : {}),
                }}
              >
                {showItemTools && (
                  <div className="cv-tools absolute -top-3 right-0 z-20 flex items-center gap-1">
                    {/* Drag handle — reorder by dragging (Elementor-style) */}
                    <button type="button" title="Drag to reorder" aria-label="Drag to reorder"
                      draggable
                      onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs shadow cursor-grab active:cursor-grabbing"
                      style={{ backgroundColor: accent }}>
                      <i className="fa-solid fa-up-down-left-right" />
                    </button>
                    {/* Width quick-control (full / half / auto) */}
                    <div className="flex items-center rounded-md overflow-hidden shadow" style={{ backgroundColor: '#1e293b' }}>
                      {(['full', 'half', 'auto'] as const).map((w) => (
                        <button key={w} type="button" title={`Width: ${w}`} aria-label={`Width ${w}`}
                          onClick={(e) => { e.stopPropagation(); setWidth(el.id, w); }}
                          className={`w-6 h-7 flex items-center justify-center text-[10px] font-bold ${widthKey === w ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                          style={widthKey === w ? { backgroundColor: accent } : undefined}>
                          {w === 'full' ? <i className="fa-solid fa-arrows-left-right" /> : w === 'half' ? '½' : <i className="fa-solid fa-compress" />}
                        </button>
                      ))}
                    </div>
                    <button type="button" title="Move up" aria-label="Move up"
                      onClick={(e) => { e.stopPropagation(); moveElement(i, -1); }}
                      disabled={i === 0}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs shadow disabled:opacity-30"
                      style={{ backgroundColor: '#334155' }}>
                      <i className="fa-solid fa-arrow-up" />
                    </button>
                    <button type="button" title="Move down" aria-label="Move down"
                      onClick={(e) => { e.stopPropagation(); moveElement(i, 1); }}
                      disabled={i === elements.length - 1}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs shadow disabled:opacity-30"
                      style={{ backgroundColor: '#334155' }}>
                      <i className="fa-solid fa-arrow-down" />
                    </button>
                    <button type="button" title={isHidden ? 'Show element' : 'Hide element'} aria-label="Toggle visibility"
                      onClick={(e) => { e.stopPropagation(); toggleHidden(el.id); }}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs shadow"
                      style={{ backgroundColor: '#334155' }}>
                      <i className={`fa-solid ${isHidden ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                    <button type="button" title="Duplicate element" aria-label="Duplicate element"
                      onClick={(e) => { e.stopPropagation(); duplicateElement(i); }}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs shadow"
                      style={{ backgroundColor: '#334155' }}>
                      <i className="fa-solid fa-clone" />
                    </button>
                    <button type="button" title="Delete element" aria-label="Delete element"
                      onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs shadow bg-red-500 hover:bg-red-600">
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                )}
                {renderOne(el)}
              </div>
            );
          })}
        </div>

        {/* Add-element palette (builder only) */}
        {showChrome && (
          <div className="mt-8 relative">
            <button type="button" onClick={() => setPaletteOpen((o) => !o)}
              className="mx-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border-2 border-dashed transition-colors"
              style={{ borderColor: `${accent}66`, color: accent, backgroundColor: `${accent}0A` }}>
              <i className={`fa-solid ${paletteOpen ? 'fa-xmark' : 'fa-plus'}`} />
              {paletteOpen ? 'Close' : 'Add element'}
            </button>

            {paletteOpen && (
              <div className="mt-4 rounded-2xl border p-4 shadow-lg" style={{ borderColor: cardBorder, backgroundColor: '#FFFFFF' }}>
                {(['Basic', 'Media', 'Content', 'Interactive'] as const).map((group) => (
                  <div key={group} className="mb-4 last:mb-0">
                    <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: textMuted }}>{group}</div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {PALETTE_ELEMENTS.filter((p) => p.group === group).map((p) => (
                        <button key={p.type} type="button" onClick={() => addElement(p.type)}
                          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-colors hover:border-current"
                          style={{ borderColor: cardBorder, color: titleColor }}>
                          <i className={`fa-solid ${p.icon} text-base`} style={{ color: accent }} />
                          <span className="text-[11px] leading-tight">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasFreeform;
