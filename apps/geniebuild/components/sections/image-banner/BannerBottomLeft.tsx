
import React from 'react';
import { Section } from '../../../types';
import { getHeadingSizeClass } from '../../../utils/headingSizeUtils';

interface BannerProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  titleClass: string;
  titleStyle?: React.CSSProperties;
}

export const BannerBottomLeft: React.FC<BannerProps> = ({ section, onTextEdit, buttonClass, titleClass, titleStyle }) => {
  const { content } = section;
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 text-left flex flex-col justify-end min-h-[400px]">
        {(() => {
          const headingTag = (styles.titleHeadingTag || 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
          return React.createElement(
            headingTag,
            {
              key: `banner-title-${headingTag}-${section.id}`,
              className: `${titleClass.replace(/text-\w+(\s+md:text-\w+)?/g, getHeadingSizeClass(headingTag, styles.titleSize || 'text-3xl md:text-5xl'))} outline-none focus:ring-2 ring-white rounded px-2`,
              style: titleStyle,
              contentEditable: true,
              suppressContentEditableWarning: true,
              onBlur: (e: any) => onTextEdit('title', e.currentTarget.textContent || '')
            },
            content.title
          );
        })()}
        <p className="text-xl mb-10 opacity-90 outline-none focus:ring-2 ring-white rounded px-2 max-w-xl" contentEditable suppressContentEditableWarning onBlur={(e) => onTextEdit('subtitle', e.currentTarget.textContent || '')}>{content.subtitle}</p>
        <div>
            <button className={buttonClass + ' px-12 py-4 text-xl font-bold shadow-2xl'} contentEditable suppressContentEditableWarning onBlur={(e) => onTextEdit('ctaText', e.currentTarget.textContent || '')}>{content.ctaText}</button>
        </div>
    </div>
  );
};
