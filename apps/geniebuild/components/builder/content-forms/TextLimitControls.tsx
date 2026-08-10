import React from 'react';
import { SelectInput } from '../inputs';

type TextLimitMode = 'none' | 'lines' | 'words';

type Props = {
  content: Record<string, any> | null | undefined;
  onContentUpdate: (updates: Record<string, any>) => void;
  /** Optional label override (default: Show Text). */
  label?: string;
};

/**
 * Shared Show Text / Max Lines / Word Limit controls for text + feature-box
 * (and any element that stores limits on content).
 */
export const TextLimitControls: React.FC<Props> = ({
  content,
  onContentUpdate,
  label = 'Show Text',
}) => {
  const c = content || {};
  const mode: TextLimitMode = (c.textLimitMode as TextLimitMode) || (
    Number(c.maxLines) > 0 ? 'lines' : Number(c.wordLimit) > 0 ? 'words' : 'none'
  );
  const maxLines = Math.min(12, Math.max(1, Number(c.maxLines) || 3));
  const wordLimit = Math.min(100, Math.max(20, Number(c.wordLimit) || 40));

  return (
    <div className="space-y-3">
      <SelectInput
        label={label}
        value={mode}
        options={[
          { label: 'Full text', value: 'none' },
          { label: 'Limit by lines', value: 'lines' },
          { label: 'Limit by words (to sentence)', value: 'words' },
        ]}
        onChange={(v) => {
          if (v === 'none') {
            onContentUpdate({ textLimitMode: 'none', maxLines: 0, wordLimit: 0 });
            return;
          }
          if (v === 'lines') {
            onContentUpdate({
              textLimitMode: 'lines',
              maxLines: Number(c.maxLines) > 0 ? Number(c.maxLines) : 3,
              wordLimit: 0,
            });
            return;
          }
          onContentUpdate({
            textLimitMode: 'words',
            wordLimit: Number(c.wordLimit) >= 20 ? Number(c.wordLimit) : 40,
            maxLines: 0,
          });
        }}
      />
      {mode === 'lines' && (
        <SelectInput
          key={`max-lines-${maxLines}`}
          label="Max Lines"
          value={String(maxLines)}
          options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
            label: `${n} line${n === 1 ? '' : 's'}`,
            value: String(n),
          }))}
          onChange={(v) =>
            onContentUpdate({
              textLimitMode: 'lines',
              maxLines: parseInt(v, 10) || 3,
              wordLimit: 0,
            })
          }
        />
      )}
      {mode === 'words' && (
        <>
          <SelectInput
            key={`word-limit-${wordLimit}`}
            label="Word Limit"
            value={String(wordLimit)}
            options={[20, 30, 40, 50, 60, 70, 80, 90, 100].map((n) => ({
              label: `${n} words (extend to “.”)`,
              value: String(n),
            }))}
            onChange={(v) =>
              onContentUpdate({
                textLimitMode: 'words',
                wordLimit: parseInt(v, 10) || 40,
                maxLines: 0,
              })
            }
          />
          <p className="text-[9px] text-white/35 leading-relaxed px-1">
            Shows at least this many words, then continues to the nearest full stop so cards don’t cut mid-sentence.
          </p>
        </>
      )}
    </div>
  );
};
