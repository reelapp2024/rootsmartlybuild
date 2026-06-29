import { createContext, useContext } from 'react';
import { DEFAULT_SITE_SIZES } from '@schema/core';

export type DefaultSizesMap = Record<string, string>;

export const DefaultSizesContext = createContext<DefaultSizesMap>({
  ...DEFAULT_SITE_SIZES,
});

export function useDefaultSizes(): DefaultSizesMap {
  return useContext(DefaultSizesContext);
}
