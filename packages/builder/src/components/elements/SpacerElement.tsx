'use client';

import React from 'react';
import { Element } from '../../types/builder';

interface SpacerElementProps {
  element: Element;
  builderMode: boolean;
  currentElementStyles: any;
}

function SpacerElement({
  element,
  builderMode,
  currentElementStyles,
}: SpacerElementProps) {
  const spacerStyle: React.CSSProperties = {
    ...currentElementStyles,
    minHeight: currentElementStyles.minHeight || '32px',
    backgroundColor: builderMode ? 'rgba(0, 0, 0, 0.05)' : undefined,
    border: builderMode ? '1px dashed #d1d5db' : undefined,
  };

  return <div style={spacerStyle} />;
}

export default React.memo(SpacerElement);
