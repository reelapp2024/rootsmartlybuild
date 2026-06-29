import React from 'react';
import { ImageControl, TextInput, VideoControl } from '../inputs';
import type { ContentFormWithUploadProps } from './types';

type VideoContentFormProps = ContentFormWithUploadProps;

const isYouTubeUrl = (url: string): boolean =>
  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/.test(url);

const toYouTubeEmbed = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
  return url;
};

export const VideoContentForm: React.FC<VideoContentFormProps> = ({ content, onContentUpdate, onUpload }) => {
  const isYT = !!content.src && isYouTubeUrl(content.src as string);
  const autoplay = !!(content as any).autoplay;
  const loop     = !!(content as any).loop;
  const muted    = (content as any).muted !== false; // default on
  const controls = (content as any).controls !== false; // default on

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
      <VideoControl
        label="Video URL"
        value={(content.src as string) || ''}
        onChange={(v) => {
          let finalUrl = v;
          if (isYouTubeUrl(v) && !v.includes('youtube.com/embed/')) {
            finalUrl = toYouTubeEmbed(v);
          }
          onContentUpdate({ src: finalUrl });
        }}
        onUpload={onUpload}
      />

      {/* Poster — only meaningful for self-hosted */}
      {!isYT && (
        <ImageControl
          label="Poster Image (preview before play)"
          value={(content as any).poster || ''}
          onChange={(v) => onContentUpdate({ poster: v } as any)}
          onUpload={() => {/* upload handled at section-level for video element only */}}
        />
      )}

      {/* Playback options */}
      {!isYT && (
        <div className="pt-3 mt-3 border-t border-white/5 space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Playback</h4>
          <Toggle
            label="Show Controls"
            hint="Native play/pause/volume bar (preview mode)."
            value={controls}
            onChange={() => onContentUpdate({ controls: !controls } as any)}
          />
          <Toggle
            label="Autoplay"
            hint="Browsers require Muted=on for autoplay to start."
            value={autoplay}
            onChange={() => onContentUpdate({ autoplay: !autoplay } as any)}
          />
          <Toggle
            label="Muted"
            hint="Required by browsers when autoplay is on."
            value={muted}
            onChange={() => onContentUpdate({ muted: !muted } as any)}
          />
          <Toggle
            label="Loop"
            value={loop}
            onChange={() => onContentUpdate({ loop: !loop } as any)}
          />
        </div>
      )}

      {isYT && (
        <p className="text-[10px] text-white/40 italic ml-1 leading-relaxed">
          For YouTube embeds, controls / autoplay / loop must be set on the URL itself
          (e.g. <code>?autoplay=1&amp;mute=1&amp;loop=1&amp;playlist=VIDEO_ID</code>).
        </p>
      )}

      {/* Optional title (used by some sections; harmless leftover) */}
      {((content as any).videoTitle !== undefined) && (
        <TextInput
          label="Title (a11y)"
          value={(content as any).videoTitle || ''}
          onChange={(v) => onContentUpdate({ videoTitle: v } as any)}
        />
      )}
    </div>
  );
};
