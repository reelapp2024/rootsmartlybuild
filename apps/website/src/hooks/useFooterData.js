
import { useState, useEffect } from 'react';
import { httpFile } from '../config.js';

export const useFooterData = () => {
  const [footerData, setFooterData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        setIsLoading(true);
        const projectId = import.meta.env.VITE_PROJECT_ID;
        
        const { data } = await httpFile.post("/webapp/v1/getfooter", {
          projectId: projectId
        });

        if (data) {
          setFooterData(data);
        }
      } catch (err) {
        console.error("Error fetching footer data:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFooterData();
  }, []);

  return { footerData, isLoading, error };
};
