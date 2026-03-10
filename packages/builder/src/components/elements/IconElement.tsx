'use client';

import React from 'react';
import { Element } from '../../types/builder';
import { resolveColor } from '../../utils/colorResolution';

interface IconElementProps {
  element: Element;
  currentElementStyles: any;
}

function IconElement({ element, currentElementStyles }: IconElementProps) {
  return (
    <div style={{ textAlign: currentElementStyles.textAlign || 'center' }}>
      <span
        style={{
          fontSize: currentElementStyles.iconSize || '48px',
          color: (() => {
            if (currentElementStyles.iconColor) return currentElementStyles.iconColor;
            const textColorResolved = resolveColor(
              currentElementStyles.textColor,
              currentElementStyles.textColorSource,
              '',
              '#000000',
              'text',
              'icon'
            );
            return textColorResolved.displayValue;
          })(),
          display: 'inline-block',
        }}
      >
        {element.content.iconName || '⭐'}
      </span>
    </div>
  );
}

export default React.memo(IconElement);


