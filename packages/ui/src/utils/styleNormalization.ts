/**
 * CENTRALIZED STYLE NORMALIZATION
 * 
 * Converts builder-friendly keys to real CSS keys.
 * This function MUST be applied before styles reach React elements.
 * 
 * Supported conversions:
 * - gridColumns: "3" → gridTemplateColumns: "repeat(3, minmax(0, 1fr))"
 * - gridRows: "auto" → gridAutoRows: "auto"
 * - overlayOpacity: 0.6 → rgba overlay color
 * - maxWidth: "1200" → maxWidth: "1200px"
 * - width: "full" → width: "100%"
 */

export interface NormalizedStyles extends React.CSSProperties {
  [key: string]: any;
}

/**
 * Normalize builder-friendly style keys to CSS keys
 */
export function normalizeStyles(rawStyles: Record<string, any>): NormalizedStyles {
  const normalized: NormalizedStyles = { ...rawStyles };

  // Convert gridColumns to gridTemplateColumns
  if (normalized.gridColumns !== undefined && !normalized.gridTemplateColumns) {
    const gridColumnsValue = normalized.gridColumns;
    if (gridColumnsValue !== 'auto' && gridColumnsValue !== undefined && gridColumnsValue !== null && gridColumnsValue !== '') {
      const numColumns = parseInt(String(gridColumnsValue), 10);
      if (!isNaN(numColumns) && numColumns > 0) {
        normalized.gridTemplateColumns = `repeat(${numColumns}, minmax(0, 1fr))`;
      }
    }
    // Remove the builder key
    delete normalized.gridColumns;
  }

  // Convert gridRows to gridAutoRows or gridTemplateRows
  if (normalized.gridRows !== undefined) {
    const gridRowsValue = normalized.gridRows;
    if (gridRowsValue === 'auto') {
      normalized.gridAutoRows = 'auto';
    } else if (gridRowsValue !== undefined && gridRowsValue !== null && gridRowsValue !== '') {
      const numRows = parseInt(String(gridRowsValue), 10);
      if (!isNaN(numRows) && numRows > 0) {
        normalized.gridTemplateRows = `repeat(${numRows}, auto)`;
      }
    }
    // Remove the builder key
    delete normalized.gridRows;
  }

  // Convert width: "full" to width: "100%"
  if (normalized.width === 'full') {
    normalized.width = '100%';
  }

  // Convert maxWidth numeric string to pixel value
  if (normalized.maxWidth && typeof normalized.maxWidth === 'string') {
    const maxWidthValue = normalized.maxWidth.trim();
    // If it's a number without unit, add 'px'
    if (/^\d+$/.test(maxWidthValue)) {
      normalized.maxWidth = `${maxWidthValue}px`;
    }
  }

  // Convert minWidth numeric string to pixel value
  if (normalized.minWidth && typeof normalized.minWidth === 'string') {
    const minWidthValue = normalized.minWidth.trim();
    if (/^\d+$/.test(minWidthValue)) {
      normalized.minWidth = `${minWidthValue}px`;
    }
  }

  // Convert minHeight numeric string to pixel value
  if (normalized.minHeight && typeof normalized.minHeight === 'string') {
    const minHeightValue = normalized.minHeight.trim();
    if (/^\d+$/.test(minHeightValue)) {
      normalized.minHeight = `${minHeightValue}px`;
    }
  }

  // Convert maxHeight numeric string to pixel value
  if (normalized.maxHeight && typeof normalized.maxHeight === 'string') {
    const maxHeightValue = normalized.maxHeight.trim();
    if (/^\d+$/.test(maxHeightValue)) {
      normalized.maxHeight = `${maxHeightValue}px`;
    }
  }

  // Handle overlayOpacity - convert to rgba overlay color
  // This is handled separately in sectionStyles.ts for overlay layers
  // But we can remove the builder key here
  if (normalized.overlayOpacity !== undefined) {
    // Keep overlayOpacity for sectionStyles to use, but don't convert here
    // The conversion happens when creating overlay layers
  }

  return normalized;
}

