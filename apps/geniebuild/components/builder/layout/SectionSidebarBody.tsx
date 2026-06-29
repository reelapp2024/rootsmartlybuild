import React from 'react';
import type { Section, WebsiteElement, WebsiteData } from '../../../types';
import type { DefaultSizes } from '../state/themeSettingsHelpers';
import { ElementContentFormSelector } from './ElementContentFormSelector';
import { SectionTypeContentEditor } from './SectionTypeContentEditor';
import { DirectEditingCard, VariantInfoCard, AdvancedActionsAccordion } from './SectionSidebarInfoCards';

type EditTab = 'content' | 'design' | 'advanced';

interface Props {
  selectedSection: Section;
  selectedElement: WebsiteElement | null;
  selectedElementId: string | null;
  editTab: EditTab;
  resolvedSectionStyles: any;
  resolvedElementStyle: any;
  themeData: any;
  sectionContentSource: Record<string, 'api' | 'default' | 'loading'>;
  defaultSizes: DefaultSizes;
  siteData: WebsiteData;
  // Callbacks
  onUpdateSection: (id: string, updates: Partial<Section>) => void;
  onUpdateSectionStyle: (id: string, key: string, value: any) => void;
  onUpdateElement: (sectionId: string, elementId: string, updates: Partial<WebsiteElement>) => void;
  /** Breakpoint-aware element style patch writer (accepts DELTA only). */
  onPatchElementStyle: (sectionId: string, elementId: string, patch: Partial<WebsiteElement['style']>) => void;
  /** Current edit breakpoint (desktop/tablet/mobile). When !== 'desktop', style
   *  writes from the Design tab go to the per-breakpoint override field. */
  editBreakpoint: 'desktop' | 'tablet' | 'mobile';
  onResetElementToDefault: () => void;
  onCleanElementStyle: () => void;
  onRefreshVariant: () => void;
  onRestoreSectionElements: (sectionId: string) => void;
  onResetSectionStyles: (sectionId: string) => void;
  onTriggerUpload: (sectionId: string, field: string, elementId?: string) => void;
  getActiveGlobalTheme: () => any;
  /** Render function for the style editor (kept in App for now due to deep dep graph). */
  renderStyleEditor: (
    styles: any,
    onUpdate: (key: string, val: any) => void,
    context: 'section' | 'element',
    elementType?: string,
    sectionId?: string,
    themeColors?: any,
    onBatchUpdate?: (updates: Record<string, any>) => void,
    sectionEditorTab?: 'design' | 'advanced',
    elementEditorTab?: 'design' | 'advanced'
  ) => React.ReactNode;
}

/**
 * Sidebar body when a section is selected: dispatches between
 * element-level editing (style/content) and section-level editing
 * (content tabs + design + advanced), plus tail cards.
 */
export const SectionSidebarBody: React.FC<Props> = ({
  selectedSection,
  selectedElement,
  selectedElementId,
  editTab,
  resolvedSectionStyles,
  resolvedElementStyle,
  themeData,
  sectionContentSource,
  defaultSizes,
  siteData,
  onUpdateSection,
  onUpdateSectionStyle,
  onUpdateElement,
  onPatchElementStyle,
  editBreakpoint,
  onResetElementToDefault,
  onCleanElementStyle,
  onRefreshVariant,
  onRestoreSectionElements,
  onResetSectionStyles,
  onTriggerUpload,
  getActiveGlobalTheme,
  renderStyleEditor,
}) => {
  // Merge the current breakpoint override on top of resolvedElementStyle so
  // Design-tab inputs reflect the effective style at the active device view.
  const breakpointOverride: Partial<WebsiteElement['style']> = selectedElement
    ? (editBreakpoint === 'mobile'
        ? (selectedElement.mobileStyle || {})
        : editBreakpoint === 'tablet'
          ? (selectedElement.tabletStyle || {})
          : {})
    : {};
  const effectiveElementStyle = { ...(resolvedElementStyle || {}), ...breakpointOverride };

  // Style editor for an element, scoped to either 'design' or 'advanced' tab.
  // Kept as a function so we don't duplicate the large button/badge style hydration.
  const renderElementStyleEditor = (tab: 'design' | 'advanced') => {
    if (!selectedSection || !selectedElement) return null;
    const hydratedStyle = selectedElement.type === 'button' ? {
      ...effectiveElementStyle,
      fontWeight: effectiveElementStyle?.fontWeight || resolvedSectionStyles?.buttonFontWeight || resolvedSectionStyles?.fontWeight || 'bold',
      fontSize: effectiveElementStyle?.fontSize || resolvedSectionStyles?.buttonSize || resolvedSectionStyles?.buttonFontSize || resolvedSectionStyles?.fontSize || '1rem',
      textAlign: effectiveElementStyle?.textAlign || resolvedSectionStyles?.buttonAlign || resolvedSectionStyles?.textAlign || 'center',
      fontFamily: effectiveElementStyle?.fontFamily || resolvedSectionStyles?.buttonFontFamily || resolvedSectionStyles?.fontFamily || undefined,
    } : selectedElement.type === 'badge' ? {
      ...effectiveElementStyle,
      backgroundColor: (effectiveElementStyle?.backgroundColor && effectiveElementStyle.backgroundColor !== '' && effectiveElementStyle.backgroundColor !== 'transparent')
        ? effectiveElementStyle.backgroundColor
        : (themeData?.badge?.background || 'rgba(225,29,72,0.15)'),
      color: (effectiveElementStyle?.color && effectiveElementStyle.color !== '' && effectiveElementStyle.color !== 'transparent')
        ? effectiveElementStyle.color
        : (themeData?.badge?.text || '#F8FAFC'),
      fontSize: effectiveElementStyle?.fontSize || '0.75rem',
      padding: effectiveElementStyle?.padding || '4px 12px',
      borderRadius: effectiveElementStyle?.borderRadius || '9999px',
    } : effectiveElementStyle;

    return renderStyleEditor(
      hydratedStyle,
      (k, v) => onPatchElementStyle(selectedSection.id, selectedElement.id, { [k]: v }),
      'element',
      selectedElement.type,
      selectedSection.id,
      resolvedSectionStyles,
      (updates) => onPatchElementStyle(selectedSection.id, selectedElement.id, updates),
      'design',   // sectionEditorTab — unused in element context
      tab,        // elementEditorTab — this drives which blocks show
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-20">
      {selectedElementId && selectedElement && selectedSection ? (
        editTab === 'design' ? (
          <>
            {renderElementStyleEditor('design')}
            {editBreakpoint !== 'desktop' && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-300 flex items-center gap-2">
                <i className="fa-solid fa-mobile-screen"></i>
                <span>Editing <strong className="uppercase">{editBreakpoint}</strong> overrides — changes apply only at this breakpoint.</span>
              </div>
            )}
            <button
              onClick={onCleanElementStyle}
              className="w-full mt-6 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
              title="Wipe all inline styles and fall back to theme + section defaults"
            >
              <i className="fa-solid fa-broom"></i>
              Clean Element Style
            </button>
          </>
        ) : editTab === 'advanced' ? (
          <>
            {renderElementStyleEditor('advanced')}
            {editBreakpoint !== 'desktop' && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-300 flex items-center gap-2">
                <i className="fa-solid fa-mobile-screen"></i>
                <span>Editing <strong className="uppercase">{editBreakpoint}</strong> overrides — changes apply only at this breakpoint.</span>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <ElementContentFormSelector
              selectedSection={selectedSection}
              selectedElement={selectedElement}
              defaultSizes={defaultSizes}
              siteData={siteData}
              onUpdateElement={onUpdateElement}
              onUpdateSectionStyle={onUpdateSectionStyle}
              onTriggerUpload={onTriggerUpload}
            />
            {selectedElement.type !== 'card' && (
              <button
                onClick={onResetElementToDefault}
                className="w-full mt-4 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/40 text-orange-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                title="Reset to original AI-generated content"
              >
                <i className="fa-solid fa-rotate-left"></i>
                Reset to Default
              </button>
            )}
          </div>
        )
      ) : (
        editTab === 'design' ? (
          <>
            {editBreakpoint !== 'desktop' && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-300 flex items-center gap-2">
                <i className="fa-solid fa-mobile-screen"></i>
                <span>Editing <strong className="uppercase">{editBreakpoint}</strong> section overrides — changes apply only at this breakpoint.</span>
              </div>
            )}
            {renderStyleEditor(
              resolvedSectionStyles,
              (k, v) => onUpdateSectionStyle(selectedSection.id, k, v),
              'section',
              undefined,
              selectedSection.id,
              getActiveGlobalTheme(),
              undefined,
              'design'
            )}
          </>
        ) : editTab === 'advanced' ? (
          <>
            {editBreakpoint !== 'desktop' && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-300 flex items-center gap-2">
                <i className="fa-solid fa-mobile-screen"></i>
                <span>Editing <strong className="uppercase">{editBreakpoint}</strong> section overrides — changes apply only at this breakpoint.</span>
              </div>
            )}
            {renderStyleEditor(
              resolvedSectionStyles,
              (k, v) => onUpdateSectionStyle(selectedSection.id, k, v),
              'section',
              undefined,
              selectedSection.id,
              getActiveGlobalTheme(),
              undefined,
              'advanced'
            )}
          </>
        ) : (
          <div className="space-y-6">
            <SectionTypeContentEditor
              selectedSection={selectedSection}
              onUpdateSection={onUpdateSection}
            />
            <DirectEditingCard
              selectedSection={selectedSection}
              sectionContentSource={sectionContentSource}
            />
            <VariantInfoCard
              selectedSection={selectedSection}
              onRefreshVariant={onRefreshVariant}
            />
            <AdvancedActionsAccordion
              onRestoreElements={() => onRestoreSectionElements(selectedSection.id)}
              onResetStyles={() => onResetSectionStyles(selectedSection.id)}
            />
          </div>
        )
      )}
    </div>
  );
};
