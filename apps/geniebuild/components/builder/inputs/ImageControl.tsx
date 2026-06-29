import React, { useId } from 'react';
import { toAbsoluteMediaUrl } from '../../../config';

interface ImageControlProps {
  label: string;
  value: string | undefined;
  onChange: (val: string) => void;
  onUpload: () => void;
  uploading?: boolean;
  uploadProgress?: number;
}

export const ImageControl: React.FC<ImageControlProps> = ({ label, value, onChange, onUpload, uploading = false, uploadProgress = 0 }) => {
  const getImageUrl = (url: string | undefined): string => {
    if (!url || url.trim().length < 5) return '';
    return toAbsoluteMediaUrl(url);
  };

  const previewUrl = getImageUrl(value);
  const inputId = useId();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>

      {/* Image Preview */}
      {previewUrl ? (
        <div className="relative w-full aspect-video bg-[#151515] rounded border border-[#333] overflow-hidden group">
          {uploading && (
            <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
              <span className="text-white text-xs font-medium">Uploading...</span>
              {uploadProgress > 0 && (
                <div className="w-32 h-1 bg-[#333] rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
          <img
            src={previewUrl}
            className="w-full h-full object-cover"
            alt="Preview"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400';
            }}
          />
          {!uploading && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpload();
                }}
                className="px-3 py-1 bg-white text-black text-xs font-bold rounded hover:scale-105 transition-transform shadow-lg"
              >
                Change Image
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full aspect-video bg-[#151515] rounded border border-[#333] flex items-center justify-center">
          {uploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
              <span className="text-white text-xs font-medium">Uploading...</span>
              {uploadProgress > 0 && (
                <div className="w-32 h-1 bg-[#333] rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-white/40 text-xs">
              <i className="fa-solid fa-image text-2xl mb-2 block"></i>
              <span>No image preview</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          className="w-full bg-[#151515] border border-[#333] rounded p-2 text-white text-xs focus:border-blue-500 focus:outline-none transition-colors"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste image URL or click upload"
          aria-label={`${label} URL`}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!uploading) onUpload();
          }}
          disabled={uploading}
          className={`px-3 bg-[#222] border border-[#333] rounded hover:bg-[#333] text-white shrink-0 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Upload Image"
          aria-label={uploading ? 'Upload in progress' : `Upload ${label.toLowerCase()}`}
        >
          {uploading ? (
            <>
              <div role="status" aria-hidden="true" className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              <span className="text-[10px]">Uploading...</span>
            </>
          ) : (
            <i className="fa-solid fa-upload text-xs" aria-hidden="true"></i>
          )}
        </button>
      </div>
    </div>
  );
};
