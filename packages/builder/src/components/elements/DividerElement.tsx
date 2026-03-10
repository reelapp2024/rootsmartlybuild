'use client';

import React from 'react';
import { Element } from '../../types/builder';

interface DividerElementProps {
  element: Element;
  builderMode: boolean;
  currentElementStyles: any;
}

function DividerElement({
  element,
  builderMode,
  currentElementStyles,
}: DividerElementProps) {
  const dividerStyle: React.CSSProperties = {
    ...currentElementStyles,
    border: 'none',
    borderTop: currentElementStyles.borderTop || '1px solid #e5e7eb',
    margin: currentElementStyles.margin || '16px 0',
  };

  return (
    <hr style={dividerStyle} />
  );
}

export default React.memo(DividerElement);
