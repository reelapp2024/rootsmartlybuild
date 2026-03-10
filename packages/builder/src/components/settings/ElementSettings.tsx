'use client';

import React from 'react';
import { Element } from '../../types/builder';
import HeadingElementSettings from './elements/HeadingElementSettings';
import TextElementSettings from './elements/TextElementSettings';
import DescriptionElementSettings from './elements/DescriptionElementSettings';
import ButtonElementSettings from './elements/ButtonElementSettings';
import ImageElementSettings from './elements/ImageElementSettings';
import VideoElementSettings from './elements/VideoElementSettings';
import HtmlElementSettings from './elements/HtmlElementSettings';
import IconElementSettings from './elements/IconElementSettings';
import BadgeElementSettings from './elements/BadgeElementSettings';
import DividerElementSettings from './elements/DividerElementSettings';
import LinkElementSettings from './elements/LinkElementSettings';
import ListElementSettings from './elements/ListElementSettings';
import SpacerElementSettings from './elements/SpacerElementSettings';
import InputElementSettings from './elements/InputElementSettings';
import TextareaElementSettings from './elements/TextareaElementSettings';
import SelectElementSettings from './elements/SelectElementSettings';
import LabelElementSettings from './elements/LabelElementSettings';
import { handleNumberKeyDown as HandleNumberKeyDownType, handleInputKeyDown as HandleInputKeyDownType } from '../../utils/helpers';

interface ElementSettingsProps {
  element: Element;
  sectionId: string;
  rowId: string;
  columnId: string;
  activeTab: 'content' | 'style' | 'advanced';
  activeBreakpoint: 'desktop' | 'tablet' | 'mobile';
  updateElement: (sectionId: string, rowId: string, columnId: string, elementId: string, updates: Partial<Element>) => void;
  getBreakpointStyles: (styles: any) => any;
  handleInputKeyDown: typeof HandleInputKeyDownType;
  handleNumberKeyDown: typeof HandleNumberKeyDownType;
}

export default function ElementSettings({
  element,
  sectionId,
  rowId,
  columnId,
  activeTab,
  activeBreakpoint,
  updateElement,
  getBreakpointStyles,
  handleInputKeyDown,
  handleNumberKeyDown,
}: ElementSettingsProps) {
  // Render element-specific settings based on element type
  if (element.type === 'heading') {
    return (
      <HeadingElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        activeBreakpoint={activeBreakpoint}
        updateElement={updateElement}
        getBreakpointStyles={getBreakpointStyles}
        handleInputKeyDown={handleInputKeyDown}
        handleNumberKeyDown={handleNumberKeyDown}
      />
    );
  }

  if (element.type === 'text') {
    return (
      <TextElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        activeBreakpoint={activeBreakpoint}
        updateElement={updateElement}
        getBreakpointStyles={getBreakpointStyles}
        handleInputKeyDown={handleInputKeyDown}
        handleNumberKeyDown={handleNumberKeyDown}
      />
    );
  }

  if (element.type === 'text' && element.id === 'description') {
    return (
      <DescriptionElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        activeBreakpoint={activeBreakpoint}
        updateElement={updateElement}
        getBreakpointStyles={getBreakpointStyles}
        handleInputKeyDown={handleInputKeyDown}
        handleNumberKeyDown={handleNumberKeyDown}
      />
    );
  }

  if (element.type === 'button') {
    return (
      <ButtonElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'image') {
    return (
      <ImageElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'video') {
    return (
      <VideoElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'html') {
    return (
      <HtmlElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'icon') {
    return (
      <IconElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'badge') {
    return (
      <BadgeElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'divider') {
    return (
      <DividerElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'link') {
    return (
      <LinkElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'list') {
    return (
      <ListElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'spacer') {
    return (
      <SpacerElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'input') {
    return (
      <InputElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'textarea') {
    return (
      <TextareaElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'select') {
    return (
      <SelectElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  if (element.type === 'label') {
    return (
      <LabelElementSettings
        element={element}
        sectionId={sectionId}
        rowId={rowId}
        columnId={columnId}
        activeTab={activeTab}
        updateElement={updateElement}
      />
    );
  }

  // Fallback for unknown element types
  return (
    <div className="p-4 text-center text-gray-500">
      <p>Settings for element type "{element.type}" are not available.</p>
    </div>
  );
}
