
import { useEffect } from 'react';

export const useSchemaMarkup = (schemaData: any, id: string) => {
  useEffect(() => {
    if (!schemaData) return;

    // Create script element
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = `schema-${id}`;
    script.textContent = JSON.stringify(schemaData);

    // Add to head
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const existingScript = document.getElementById(`schema-${id}`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [schemaData, id]);
};








