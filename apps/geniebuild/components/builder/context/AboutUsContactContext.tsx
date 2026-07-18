import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AboutUsContact } from '../../../lib/contactResolver';
import { clearProjectAboutUsCache, fetchProjectAboutUs, getProjectIdFromUrl } from '../../../lib/aboutUsApi';

type Ctx = {
  aboutUs: AboutUsContact | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AboutUsContactContext = createContext<Ctx>({
  aboutUs: null,
  loading: false,
  refresh: async () => {},
});

export const AboutUsContactProvider: React.FC<{
  children: React.ReactNode;
  /** Live site / explicit project (falls back to ?projectId= URL). */
  projectId?: string | null;
}> = ({ children, projectId: projectIdProp }) => {
  const [aboutUs, setAboutUs] = useState<AboutUsContact | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const projectId = String(projectIdProp || getProjectIdFromUrl() || '').trim();
    if (!projectId) {
      setAboutUs(null);
      return;
    }
    setLoading(true);
    try {
      setAboutUs(await fetchProjectAboutUs(projectId));
    } finally {
      setLoading(false);
    }
  }, [projectIdProp]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ aboutUs, loading, refresh }), [aboutUs, loading, refresh]);

  return (
    <AboutUsContactContext.Provider value={value}>{children}</AboutUsContactContext.Provider>
  );
};

export function useAboutUsContact() {
  return useContext(AboutUsContactContext);
}

export function invalidateAboutUsContactCache() {
  clearProjectAboutUsCache();
}
