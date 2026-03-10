
import { useState, useEffect } from 'react';
import { httpFile } from '../config.js';

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
        const projectId = import.meta.env.VITE_PROJECT_ID;
        
        const formData = new FormData();
        formData.append('projectId', projectId);
        formData.append('pageUrl', pageUrl);
        formData.append('reqfrom', "useSEO");

        const response = await httpFile.post('/webapp/v1/seo', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
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
