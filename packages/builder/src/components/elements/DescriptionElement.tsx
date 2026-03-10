'use client';

import React from 'react';
import { Element } from '../../types/builder';
import { buildBoxShadow, buildBorderStyle } from '../../utils/helpers';
import { useApiData } from '../../hooks/useApiData';

interface DescriptionElementProps {
  element: Element;
  builderMode: boolean;
  currentElementStyles: any;
  sectionId: string;
  rowId: string;
  colId: string;
  setSelectedElement: (element: {
    type: 'element';
    id: string;
    sectionId: string;
    rowId: string;
    columnId: string;
  }) => void;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: Partial<Element>) => void;
}

function DescriptionElement({
  element,
  builderMode,
  currentElementStyles,
  sectionId,
  rowId,
  colId,
  setSelectedElement,
  updateElement,
}: DescriptionElementProps) {
  // Fetch API data if enabled
  const { data: apiData, loading: apiLoading } = useApiData<string | { description?: string; descriptionHtml?: string; content?: string; html?: string }>(
    {
      enabled: element.api?.enabled || false,
      url: element.api?.url,
      method: element.api?.method || 'GET',
      refreshInterval: element.api?.refreshInterval || 0,
      dataPath: element.api?.dataPath,
      fallbackToContent: element.api?.fallbackToContent !== false,
    },
    element.content.description || element.content.descriptionHtml
  );

  // Resolve description content: API data → element.content (API wins)
  // Handle both string (when dataPath is used) and object (when full response) cases
  const resolvedDescription = typeof apiData === 'string'
    ? apiData
    : (apiData?.descriptionHtml || apiData?.html || apiData?.description || apiData?.content || element.content.descriptionHtml || element.content.description || 'Description text');
  const resolvedDescriptionHtml = typeof apiData === 'string'
    ? undefined
    : (apiData?.descriptionHtml || apiData?.html || element.content.descriptionHtml);
  const hasHtml = resolvedDescriptionHtml && resolvedDescriptionHtml !== (typeof apiData === 'object' ? (apiData?.description || element.content.description) : undefined);
  const descriptionContent = resolvedDescription;

  // Background image and overlay styles
  const hasBackgroundImage = currentElementStyles.backgroundImage;
  const overlayColor = currentElementStyles.descriptionOverlayColor && currentElementStyles.descriptionOverlayColor !== 'transparent' 
    ? currentElementStyles.descriptionOverlayColor 
    : (currentElementStyles.backgroundColor && currentElementStyles.backgroundColor !== 'transparent' 
      ? currentElementStyles.backgroundColor 
      : null);
  const overlayOpacity = currentElementStyles.descriptionOverlayOpacity || '0.5';

  // Description style
  const descriptionStyle: React.CSSProperties = {
    fontFamily: currentElementStyles.descriptionFontFamily,
    fontSize: currentElementStyles.descriptionFontSize || '1.125rem',
    fontWeight: currentElementStyles.descriptionFontWeight || '400',
    lineHeight: currentElementStyles.descriptionLineHeight || '1.5',
    textAlign: currentElementStyles.descriptionTextAlign || 'left',
    letterSpacing: currentElementStyles.descriptionLetterSpacing,
    textTransform: currentElementStyles.descriptionTextTransform || 'none',
    textDecoration: currentElementStyles.descriptionTextDecoration || 'none',
    color: currentElementStyles.textColor || '#000000',
    backgroundColor: hasBackgroundImage ? 'transparent' : currentElementStyles.backgroundColor,
    backgroundImage: hasBackgroundImage ? `url(${currentElementStyles.backgroundImage})` : undefined,
    backgroundSize: hasBackgroundImage ? (currentElementStyles.backgroundSize || 'cover') : undefined,
    backgroundPosition: hasBackgroundImage ? (currentElementStyles.backgroundPosition || 'center') : undefined,
    backgroundRepeat: hasBackgroundImage ? (currentElementStyles.backgroundRepeat || 'no-repeat') : undefined,
    padding: currentElementStyles.padding,
    paddingTop: currentElementStyles.paddingTop,
    paddingRight: currentElementStyles.paddingRight,
    paddingBottom: currentElementStyles.paddingBottom,
    paddingLeft: currentElementStyles.paddingLeft,
    margin: currentElementStyles.margin,
    marginTop: currentElementStyles.marginTop,
    marginRight: currentElementStyles.marginRight,
    marginBottom: currentElementStyles.marginBottom,
    marginLeft: currentElementStyles.marginLeft,
    ...buildBorderStyle(currentElementStyles),
    borderRadius: currentElementStyles.borderRadius || 
      (currentElementStyles.borderTopLeftRadius || currentElementStyles.borderTopRightRadius || currentElementStyles.borderBottomRightRadius || currentElementStyles.borderBottomLeftRadius
        ? `${currentElementStyles.borderTopLeftRadius || '0px'} ${currentElementStyles.borderTopRightRadius || '0px'} ${currentElementStyles.borderBottomRightRadius || '0px'} ${currentElementStyles.borderBottomLeftRadius || '0px'}`
        : undefined),
    boxShadow: currentElementStyles.boxShadow || buildBoxShadow(currentElementStyles),
    display: 'block',
    width: '100%',
    position: 'relative',
  };

  // If HTML content exists, render it with dangerouslySetInnerHTML
  if (hasHtml && !builderMode) {
    return (
      <div
        id={element.customId}
        className={element.customClasses}
        style={descriptionStyle}
        onClick={(e) => {
          if (builderMode) {
            e.stopPropagation();
            setSelectedElement({
              type: 'element',
              id: element.id,
              sectionId,
              rowId,
              columnId: colId,
            });
          }
        }}
      >
        {hasBackgroundImage && overlayColor && (
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              backgroundColor: overlayColor,
              opacity: parseFloat(overlayOpacity),
              borderRadius: descriptionStyle.borderRadius,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}
        <div style={{ position: 'relative', zIndex: 1 }} dangerouslySetInnerHTML={{ __html: descriptionContent }} />
      </div>
    );
  }

  // For builder mode or plain text, use contentEditable
  return (
    <div
      id={element.customId}
      className={`outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 ${element.customClasses || ''}`}
      style={descriptionStyle}
      onClick={(e) => {
        if (builderMode) {
          e.stopPropagation();
          setSelectedElement({
            type: 'element',
            id: element.id,
            sectionId,
            rowId,
            columnId: colId,
          });
        }
      }}
    >
      {hasBackgroundImage && overlayColor && (
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            backgroundColor: overlayColor,
            opacity: parseFloat(overlayOpacity),
            borderRadius: descriptionStyle.borderRadius,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <p
        contentEditable={builderMode}
        suppressContentEditableWarning
        style={{ position: 'relative', zIndex: 1, margin: 0 }}
        onBlur={(e) => {
          if (!builderMode) return;
          const newText = e.currentTarget.textContent || '';
          const newHtml = e.currentTarget.innerHTML || '';
          updateElement(sectionId, rowId, colId, element.id, { 
            content: { ...element.content, text: newText, description: newText, descriptionHtml: newHtml } 
          });
        }}
      >
        {hasHtml ? (
          <span dangerouslySetInnerHTML={{ __html: descriptionContent }} />
        ) : (
          descriptionContent
        )}
      </p>
    </div>
  );
}

export default React.memo(DescriptionElement);
