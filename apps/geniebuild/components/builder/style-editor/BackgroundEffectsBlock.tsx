import React from 'react';
import { ColorInput, RangeInput, SelectInput } from '../inputs';

interface BackgroundEffectsBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
}

export const BackgroundEffectsBlock: React.FC<BackgroundEffectsBlockProps> = ({ styles, onUpdate }) => {
  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Background Shapes</h4>
      <p className="text-[10px] text-white/40 leading-relaxed">
        Animated decorative shapes (circles / blobs / geometric) layered behind the section content. Helps add visual depth to plain backgrounds.
      </p>

      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Enable Shapes</label>
        <button
          onClick={() => onUpdate('enableBackgroundShapes', !styles.enableBackgroundShapes)}
          className={`w-8 h-4 rounded-full transition-colors relative ${styles.enableBackgroundShapes ? 'bg-blue-500' : 'bg-white/10'}`}
        >
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${styles.enableBackgroundShapes ? 'left-4.5' : 'left-0.5'}`} />
        </button>
      </div>

      {styles.enableBackgroundShapes && (
        <>
          <SelectInput
            label="Shape Type"
            value={styles.backgroundShapeType || 'circles'}
            options={[
              { label: 'Circles', value: 'circles' },
              { label: 'Blobs', value: 'blobs' },
              { label: 'Geometric', value: 'geometric' },
            ]}
            onChange={(v: any) => onUpdate('backgroundShapeType', v)}
          />

          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Enable Animation</label>
            <button
              onClick={() => onUpdate('enableBackgroundAnimation', !styles.enableBackgroundAnimation)}
              className={`w-8 h-4 rounded-full transition-colors relative ${styles.enableBackgroundAnimation ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${styles.enableBackgroundAnimation ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>

          {styles.enableBackgroundAnimation && (
            <SelectInput
              label="Animation Speed"
              value={styles.backgroundAnimationSpeed || 'normal'}
              options={[
                { label: 'Slow', value: 'slow' },
                { label: 'Normal', value: 'normal' },
                { label: 'Fast', value: 'fast' },
              ]}
              onChange={(v: any) => onUpdate('backgroundAnimationSpeed', v)}
            />
          )}
        </>
      )}
    </div>
  );
};

export const SectionDividersBlock: React.FC<BackgroundEffectsBlockProps> = ({ styles, onUpdate }) => {
  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section Dividers</h4>

      <div className="space-y-4">
        <h5 className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Top Divider</h5>
        <SelectInput
          label="Shape"
          value={styles.topDividerShape || 'none'}
          options={[
            { label: 'None', value: 'none' },
            { label: 'Slant', value: 'slant' },
            { label: 'Curve', value: 'curve' },
            { label: 'Wave', value: 'wave' },
            { label: 'Triangle', value: 'triangle' },
          ]}
          onChange={(v: any) => onUpdate('topDividerShape', v)}
        />
        {styles.topDividerShape && styles.topDividerShape !== 'none' && (
          <>
            <RangeInput
              label="Height"
              value={styles.topDividerHeight || 100}
              min={20} max={300} step={1} unit="px"
              onChange={(v) => onUpdate('topDividerHeight', v)}
            />
            <ColorInput
              label="Color"
              value={styles.topDividerColor || '#0E1214'}
              onChange={(v) => onUpdate('topDividerColor', v)}
            />
          </>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-white/5">
        <h5 className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Bottom Divider</h5>
        <SelectInput
          label="Shape"
          value={styles.bottomDividerShape || 'none'}
          options={[
            { label: 'None', value: 'none' },
            { label: 'Slant', value: 'slant' },
            { label: 'Curve', value: 'curve' },
            { label: 'Wave', value: 'wave' },
            { label: 'Triangle', value: 'triangle' },
          ]}
          onChange={(v: any) => onUpdate('bottomDividerShape', v)}
        />
        {styles.bottomDividerShape && styles.bottomDividerShape !== 'none' && (
          <>
            <RangeInput
              label="Height"
              value={styles.bottomDividerHeight || 100}
              min={20} max={300} step={1} unit="px"
              onChange={(v) => onUpdate('bottomDividerHeight', v)}
            />
            <ColorInput
              label="Color"
              value={styles.bottomDividerColor || '#0E1214'}
              onChange={(v) => onUpdate('bottomDividerColor', v)}
            />
          </>
        )}
      </div>
    </div>
  );
};
