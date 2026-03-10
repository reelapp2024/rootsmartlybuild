'use client';

import React from 'react';
import { Element } from '../../types/builder';

interface VideoElementProps {
  element: Element;
  builderMode?: boolean;
}

function VideoElement({ element, builderMode = false }: VideoElementProps) {
  const getEmbedUrl = (url: string, autoplay?: boolean, loop?: boolean, muted?: boolean) => {
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      if (!videoId) return url;
      
      const params = new URLSearchParams();
      if (autoplay) params.append('autoplay', '1');
      if (muted) params.append('mute', '1');
      if (loop) {
        params.append('loop', '1');
        params.append('playlist', videoId); // Required for loop to work
      }
      
      const queryString = params.toString();
      return `https://www.youtube.com/embed/${videoId}${queryString ? '?' + queryString : ''}`;
    } else if (url.includes('vimeo.com/')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      if (!videoId) return url;
      
      const params = new URLSearchParams();
      if (autoplay) params.append('autoplay', '1');
      if (loop) params.append('loop', '1');
      if (muted) params.append('muted', '1');
      
      const queryString = params.toString();
      return `https://player.vimeo.com/video/${videoId}${queryString ? '?' + queryString : ''}`;
    }
    return url;
  };

  const getAspectRatioClass = (ratio?: string) => {
    switch (ratio) {
      case '16:9': return 'aspect-video';
      case '4:3': return 'aspect-[4/3]';
      case '1:1': return 'aspect-square';
      case '21:9': return 'aspect-[21/9]';
      case '9:16': return 'aspect-[9/16]';
      default: return 'aspect-video';
    }
  };

  const videoSourceType = element.content.videoSourceType || 'youtube';
  const videoUrl = element.content.videoUrl || '';
  const styles = element.styles || {};
  
  const aspectRatio = styles.videoAspectRatio || '16:9';
  const customWidth = styles.videoWidth;
  const customHeight = styles.videoHeight;
  const autoplay = styles.videoAutoplay || false;
  const loop = styles.videoLoop || false;
  const muted = styles.videoMuted || false;
  const controls = styles.videoControls !== false; // Default to true
  const preload = styles.videoPreload || 'metadata';
  const poster = styles.videoPoster;
  const lazyLoad = styles.videoLazyLoad || false;
  const overlayText = styles.videoOverlayText;
  const overlayColor = styles.videoOverlayColor || 'transparent';
  const overlayOpacity = styles.videoOverlayOpacity || '0.5';
  const alignment = styles.videoAlignment || 'center';

  if (!videoUrl) {
    const containerStyle: React.CSSProperties = {
      width: customWidth || '100%',
      height: customHeight || undefined,
      aspectRatio: aspectRatio === 'custom' ? undefined : aspectRatio.replace(':', '/'),
    };
    
    return (
      <div 
        className={`relative rounded-lg overflow-hidden bg-black flex items-center justify-center ${aspectRatio !== 'custom' ? getAspectRatioClass(aspectRatio) : ''}`}
        style={containerStyle}
      >
        <p className="text-center text-white">Enter video URL in settings</p>
      </div>
    );
  }

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'left': return 'mx-0 mr-auto';
      case 'right': return 'mx-0 ml-auto';
      case 'center': return 'mx-auto';
      case 'full': return 'w-full';
      default: return 'mx-auto';
    }
  };

  const containerStyle: React.CSSProperties = {
    width: (alignment as string) === 'full' ? '100%' : (customWidth || 'auto'),
    height: customHeight || undefined,
    aspectRatio: aspectRatio === 'custom' ? undefined : aspectRatio.replace(':', '/'),
    maxWidth: (alignment as string) === 'full' ? '100%' : undefined,
  };

  const overlayStyle: React.CSSProperties = {
    backgroundColor: overlayColor !== 'transparent' ? overlayColor : undefined,
    opacity: overlayColor !== 'transparent' && overlayText ? parseFloat(overlayOpacity) : undefined,
  };

  // Custom embed code
  if (videoSourceType === 'custom') {
    return (
      <div 
        className={`relative rounded-lg overflow-hidden bg-black ${aspectRatio !== 'custom' ? getAspectRatioClass(aspectRatio) : ''} ${getAlignmentClass()}`}
        style={containerStyle}
      >
        <div 
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: videoUrl }}
        />
        {overlayText && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            style={overlayStyle}
          >
            <p className="text-white text-lg font-semibold">{overlayText}</p>
          </div>
        )}
      </div>
    );
  }

  // Direct video URL (HTML5 video)
  if (videoSourceType === 'direct') {
    return (
      <div 
        className={`relative rounded-lg overflow-hidden bg-black ${aspectRatio !== 'custom' ? getAspectRatioClass(aspectRatio) : ''} ${getAlignmentClass()}`}
        style={containerStyle}
      >
        <video
          src={videoUrl}
          className={`w-full h-full object-contain ${builderMode ? 'pointer-events-none' : ''}`}
          controls={!builderMode && controls}
          autoPlay={autoplay}
          loop={loop}
          muted={muted}
          preload={preload}
          poster={poster}
        >
          Your browser does not support the video tag.
        </video>
        {overlayText && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            style={overlayStyle}
          >
            <p className="text-white text-lg font-semibold">{overlayText}</p>
          </div>
        )}
      </div>
    );
  }

  // YouTube or Vimeo (iframe embed)
  const embedUrl = getEmbedUrl(videoUrl, autoplay, loop, muted);

  return (
    <div 
      className={`relative rounded-lg overflow-hidden bg-black ${aspectRatio !== 'custom' ? getAspectRatioClass(aspectRatio) : ''} ${getAlignmentClass()}`}
      style={containerStyle}
    >
      <iframe
        src={embedUrl}
        className={`w-full h-full ${builderMode ? 'pointer-events-none' : ''}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={!builderMode}
        title="Video player"
        loading={lazyLoad ? 'lazy' : undefined}
      />
      {overlayText && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          style={overlayStyle}
        >
          <p className="text-white text-lg font-semibold">{overlayText}</p>
        </div>
      )}
    </div>
  );
}

export default React.memo(VideoElement);


