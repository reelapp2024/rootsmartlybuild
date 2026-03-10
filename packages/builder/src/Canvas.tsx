import React, { memo } from "react";
import { useStudio } from "./store";
import BuilderCanvas from "./components/canvas/BuilderCanvas";

type ViewMode = 'desktop' | 'tablet' | 'mobile';

function Canvas({ viewMode = 'desktop' }: { viewMode?: ViewMode }) {
  const {
    sections,
    setSections,
    selectedElement,
    setSelectedElement,
    activeBreakpoint,
    builderMode,
    moveSection,
    duplicateSection,
    duplicateRow,
    duplicateColumn,
    moveRow,
    moveColumn,
    moveElement,
    removeRow,
    removeColumn,
    removeElement,
    addElement,
    updateElement,
    getBreakpointStyles,
    addCustomElement,
    removeCustomElement,
    moveCustomElement,
    duplicateCustomElement,
    getCustomElements,
    updateCustomElementStyle,
    updateCustomElementProps,
    getCustomElementStyle,
    getCustomElementProps,
  } = useStudio();

  // Map viewMode to activeBreakpoint
  const breakpoint = viewMode === 'mobile' ? 'mobile' : viewMode === 'tablet' ? 'tablet' : 'desktop';

  return (
    <BuilderCanvas
      sections={sections}
      setSections={setSections}
      selectedElement={selectedElement}
      setSelectedElement={setSelectedElement}
      builderMode={builderMode}
      activeBreakpoint={breakpoint}
      moveSection={moveSection}
      duplicateSection={duplicateSection}
      duplicateRow={duplicateRow}
      duplicateColumn={duplicateColumn}
      moveRow={moveRow}
      moveColumn={moveColumn}
      moveElement={moveElement}
      deleteRow={removeRow}
      deleteColumn={removeColumn}
      deleteElement={removeElement}
      addElement={addElement}
      updateElement={updateElement}
      getBreakpointStyles={getBreakpointStyles}
      addCustomElement={addCustomElement}
      removeCustomElement={removeCustomElement}
      moveCustomElement={moveCustomElement}
      duplicateCustomElement={duplicateCustomElement}
      getCustomElements={getCustomElements}
      updateCustomElementStyle={updateCustomElementStyle}
      updateCustomElementProps={updateCustomElementProps}
      getCustomElementStyle={getCustomElementStyle}
      getCustomElementProps={getCustomElementProps}
    />
  );
}

export default memo(Canvas);
