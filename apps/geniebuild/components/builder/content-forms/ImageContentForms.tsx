import React from 'react';
import { IconPicker, ImageControl, RangeInput, SelectInput, TextInput, TextAreaInput } from '../inputs';
import type { ContentFormWithUploadProps } from './types';

type ImageFormProps = ContentFormWithUploadProps;

/**
 * Image content form. Fields:
 *   imageUrl, imageAlt, link  (existing)
 *   caption        — small line shown below the image
 *   openInNewTab   — toggle (only if link is set)
 *   lightbox       — click-to-fullscreen toggle
 *   lazy           — native lazy-loading toggle (default ON)
 *   animation      — reveal-on-scroll preset
 *   animationDelay — seconds
 */
export const ImageContentForm: React.FC<ImageFormProps> = ({ content, onContentUpdate, onUpload }) => {
  const c = content as any;
  const hasLink = !!(c?.link && String(c.link).trim());
  // Defaults to ON. User can flip via the toggle.
  const openInNewTab = c?.openInNewTab === undefined ? true : !!c.openInNewTab;
  const lightbox = !!c?.lightbox;
  const lazy = c?.lazy !== false; // default ON
  const animation: string = c?.animation || 'none';

  return (
    <div className="space-y-4">
      <ImageControl
        label="Image URL"
        value={c.imageUrl || ''}
        onChange={(v) => onContentUpdate({ imageUrl: v })}
        onUpload={onUpload}
      />
      <TextInput
        label="Alt Text"
        value={c.imageAlt || c.alt || ''}
        onChange={(v) => onContentUpdate({ imageAlt: v, alt: v })}
        placeholder="Describe the image for accessibility"
      />
      <TextAreaInput
        label="Caption (optional)"
        value={(c.caption as string) || ''}
        onChange={(v) => onContentUpdate({ caption: v })}
        placeholder="Small text shown below the image"
      />
      <TextInput
        label="Link (optional URL)"
        value={c?.link || ''}
        onChange={(v) => onContentUpdate({ link: v })}
        placeholder="https://..."
      />

      {/* ───────── BEHAVIOR TOGGLES ───────── */}
      <div className="pt-3 mt-1 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Behavior</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onContentUpdate({ lightbox: !lightbox } as any)}
            className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex items-center justify-center gap-1.5 ${
              lightbox
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
            }`}
            title="Open the image fullscreen on click"
          >
            <i className="fa-solid fa-expand" />
            Lightbox
          </button>
          <button
            type="button"
            onClick={() => onContentUpdate({ lazy: !lazy } as any)}
            className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex items-center justify-center gap-1.5 ${
              lazy
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
            }`}
            title="Defer loading until the image scrolls into view"
          >
            <i className="fa-solid fa-bolt" />
            Lazy Load
          </button>
        </div>
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
      </div>

      {/* ───────── REVEAL ANIMATION ───────── */}
      <div className="pt-3 mt-1 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reveal Animation</h4>
        <SelectInput
          label="Preset"
          value={animation}
          options={[
            { label: 'None',          value: 'none' },
            { label: 'Fade Up',       value: 'fade-up' },
            { label: 'Slide Left',    value: 'slide-left' },
            { label: 'Slide Right',   value: 'slide-right' },
            { label: 'Blur In',       value: 'blur-in' },
            { label: 'Scale In',      value: 'scale-in' },
            { label: 'Zoom',          value: 'zoom' },
          ]}
          onChange={(v) => onContentUpdate({ animation: v } as any)}
        />
        {animation !== 'none' && (
          <RangeInput
            label="Delay (seconds)"
            value={Number(c?.animationDelay) || 0}
            min={0} max={2} step={0.1}
            unit="s"
            onChange={(v) => onContentUpdate({ animationDelay: v } as any)}
          />
        )}
      </div>
    </div>
  );
};

export const ImageBoxContentForm: React.FC<ImageFormProps> = ({ content, onContentUpdate, onUpload }) => {
  return (
    <div className="space-y-4">
      <ImageControl
        label="Image"
        value={content.imageUrl || content.src || ''}
        onChange={(v) => onContentUpdate({ imageUrl: v, src: v })}
        onUpload={onUpload}
      />
      <TextInput
        label="Title"
        value={content.title || content.text || ''}
        onChange={(v) => onContentUpdate({ title: v, text: v })}
        placeholder="Card title"
      />
      <TextAreaInput
        label="Description"
        value={content.description || content.subText || ''}
        onChange={(v) => onContentUpdate({ description: v, subText: v })}
        placeholder="Card description"
      />
    </div>
  );
};
