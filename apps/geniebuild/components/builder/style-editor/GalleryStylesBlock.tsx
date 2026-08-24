import React from 'react';
import { AccordionGroup, NumericUnitInput, SelectInput } from '../inputs';

interface GalleryStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/** Design panel for the `gallery` element — grid / masonry / carousel of images. */
export const GalleryStylesBlock: React.FC<GalleryStylesBlockProps> = ({ styles, onUpdate, onBatchUpdate }) => {
  const layout = styles.galleryLayout || 'grid';
  const cols = Math.min(Math.max(parseInt(String(styles.columns), 10) || 3, 1), 6);

  const reset = () => {
    const patch: Record<string, any> = {
      galleryLayout: '', columns: '', imageGap: '', imageRadius: '',
      imageAspectRatio: '', imageObjectFit: '', carouselPerView: '',
    };
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  return (
    <>
      <div className="mb-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); reset(); }}
          className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-rotate-left"></i> Reset
        </button>
      </div>

      <AccordionGroup title="Gallery Layout" defaultOpen={true}>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-white/50 uppercase tracking-widest mb-1.5">Layout</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'grid', label: 'Grid', icon: 'fa-table-cells' },
                { value: 'masonry', label: 'Masonry', icon: 'fa-table-cells-large' },
                { value: 'carousel', label: 'Carousel', icon: 'fa-images' },
              ].map(opt => {
                const active = layout === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => onUpdate('galleryLayout', opt.value)}
                    className={`py-2 text-[9px] font-bold uppercase tracking-wide rounded border transition-all flex flex-col items-center gap-1 ${active ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'}`}>
                    <i className={`fa-solid ${opt.icon} text-sm`} />{opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-white/50 uppercase tracking-widest mb-1.5">
              {layout === 'carousel' ? 'Visible at once' : 'Columns'}
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((n) => {
                const key = layout === 'carousel' ? 'carouselPerView' : 'columns';
                const cur = layout === 'carousel'
                  ? (parseInt(String(styles.carouselPerView), 10) || cols)
                  : cols;
                return (
                  <button key={n} type="button" onClick={() => onUpdate(key, n)}
                    className={`py-2 text-xs font-bold rounded border transition-all ${cur === n ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'}`}>{n}</button>
                );
              })}
            </div>
          </div>
          <NumericUnitInput label="Gap" value={styles.imageGap || ''} onChange={(v) => onUpdate('imageGap', v)} placeholder="0.75rem" units={['rem', 'px', 'em']} step={0.125} min={0} max={4} />
        </div>
      </AccordionGroup>

      <AccordionGroup title="Image Style" defaultOpen={false}>
        <div className="space-y-3">
          {layout !== 'masonry' && (
            <SelectInput
              label="Aspect Ratio"
              value={styles.imageAspectRatio || '1/1'}
              options={[
                { label: '1:1 (square)', value: '1/1' },
                { label: '4:3', value: '4/3' },
                { label: '3:2', value: '3/2' },
                { label: '16:9 (wide)', value: '16/9' },
                { label: '3:4 (portrait)', value: '3/4' },
              ]}
              onChange={(v) => onUpdate('imageAspectRatio', v)}
            />
          )}
          <SelectInput
            label="Object Fit"
            value={styles.imageObjectFit || 'cover'}
            options={[{ label: 'Cover', value: 'cover' }, { label: 'Contain', value: 'contain' }, { label: 'Fill', value: 'fill' }]}
            onChange={(v) => onUpdate('imageObjectFit', v)}
          />
          <NumericUnitInput label="Corner Radius" value={styles.imageRadius || ''} onChange={(v) => onUpdate('imageRadius', v)} placeholder="0.75rem" units={['rem', 'px', '%']} step={1} min={0} max={80} />
        </div>
      </AccordionGroup>
    </>
  );
};
