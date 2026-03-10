import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://apis.smartlybuild.dev/admin/v1';

export const http = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export interface WebsiteDesignData {
  data: {
    pages: Array<{
      pageId: {
        _id: string;
        name: string;
        displayName?: string;
      };
      componentIds: Array<{
        componentId: {
          _id: string;
          name: string;
          uniqueId: string;
          displayName?: string;
        };
        variant?: string;
        style?: any;
        elementIds?: Array<{
          elementId: string;
          style?: any;
          data?: any;
        }>;
      }>;
      style?: any;
    }>;
  };
}

export async function getWebsiteDesignData(projectId: string): Promise<WebsiteDesignData> {
  // No authentication required - API endpoint is now public
  const response = await http.get(`/getWebsiteDesignData/${projectId}`);
  return response.data;
}
