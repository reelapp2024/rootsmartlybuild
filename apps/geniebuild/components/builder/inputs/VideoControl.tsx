import React from 'react';
import { toAbsoluteMediaUrl } from '../../../config';

interface VideoControlProps {
  label: string;
  value: string | undefined;
  onChange: (val: string) => void;
  onUpload: () => void;
}

export const VideoControl: React.FC<VideoControlProps> = ({ label, value, onChange, onUpload }) => {
  const isYouTubeUrl = (url: string): boolean => {
    return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/.test(url);
  };

  const convertToEmbedUrl = (url: string): string => {
    if (url.includes('youtube.com/embed/') || url.includes('youtu.be/')) return url;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
    return url;
  };

  const getVideoUrl = (url: string | undefined): string => {
    if (!url || url.trim().length < 5) return '';
    if (url.startsWith('http')) {
      if (isYouTubeUrl(url)) return convertToEmbedUrl(url);
      return url;
    }
    return toAbsoluteMediaUrl(url);
  };

  const previewUrl = getVideoUrl(value);
  const isYouTube = value ? isYouTubeUrl(value) : false;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>

      {/* Video Preview */}
      {previewUrl ? (
        <div className="relative w-full aspect-video bg-[#151515] rounded border border-[#333] overflow-hidden group">
          {isYouTube || previewUrl.includes('youtube.com/embed/') ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={previewUrl}
              className="w-full h-full object-contain"
              controls
            />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUpload();
              }}
              className="px-3 py-1 bg-white text-black text-xs font-bold rounded hover:scale-105 transition-transform shadow-lg"
            >
              Change Video
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full aspect-video bg-[#151515] rounded border border-[#333] flex items-center justify-center">
          <span className="text-white/30 text-xs">No Video Selected</span>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          className="w-full bg-[#151515] border border-[#333] rounded p-2 text-white text-xs focus:border-blue-500 focus:outline-none transition-colors"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste YouTube URL, video URL, or click upload"
        />
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpload(); }}
          className="px-3 bg-[#222] border border-[#333] rounded hover:bg-[#333] text-white shrink-0"
          title="Upload Video"
        >
          <i className="fa-solid fa-upload text-xs"></i>
        </button>
      </div>
    </div>
  );
};
