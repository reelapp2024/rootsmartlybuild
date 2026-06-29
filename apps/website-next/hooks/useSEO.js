
import { useState, useEffect } from 'react';
import { httpFile } from '../config';
import { getProjectId } from './getProjectId';

export const useSEO = (pageUrl) => {
  const [seoData, setSeoData] = useState({
    meta_title: '',
    meta_description: '',
    meta_keywords: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeoData = async () => {
      try {
        setLoading(true);
        const projectId = getProjectId();
        if (!projectId) {
          setLoading(false);
          return;
        }
        
        const response = await httpFile.post('/webapp/v1/seo', {
          projectId,
          pageUrl,
          reqfrom: "useSEO"
        });

        if (response.data && response.data.data) {
          // console.log(response.data.data,"<<<<<<<<<<<<<<<<<<this is seo data ")
          setSeoData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching SEO data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (pageUrl) {
      fetchSeoData();
    }
  }, [pageUrl]);

  return { seoData, loading };
};
