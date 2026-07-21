import React, { createContext, useContext } from 'react';

export type OpenInternalLinkFn = (href: string) => void;

const OpenInternalLinkContext = createContext<OpenInternalLinkFn | null>(null);

export const OpenInternalLinkProvider = OpenInternalLinkContext.Provider;

export function useOpenInternalLink(): OpenInternalLinkFn | null {
  return useContext(OpenInternalLinkContext);
}
