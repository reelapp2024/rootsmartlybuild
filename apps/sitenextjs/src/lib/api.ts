import axios from 'axios';
import { resolveSiteNextJsApiUrl } from './resolveSiteNextApiUrl';

const siteNextJsApiUrl = resolveSiteNextJsApiUrl();

export const sitenextjsHttp = axios.create({
  baseURL: siteNextJsApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export interface WebsitePagePayload {
  projectId: string;
  pageId?: string;
  locationId?: string;
  slug?: string;
  pageType?: string;
}

export interface SlugToPageDetailsPayload {
  projectId: string;
  slug?: string;
  pageId?: string;
}

export interface SlugToPageDetailsResponse {
  redirect?: {
    from: string;
    to: string;
    statusCode?: number;
  };
  data?: {
    projectId: string;
    pageId: string;
    locationId?: string | null;
    pageType?: string;
    slug?: string;
    name?: string;
    displayName?: string;
    serviceId?: string | null;
  };
}

export interface WebsitePageResponse {
  redirect?: {
    from: string;
    to: string;
    statusCode?: number;
  };
  data?: {
    projectId: string;
    pageId: string;
    locationId?: string | null;
    sections?: any[];
    colors?: {
      colorPrimary?: string | null;
      colorSecondary?: string | null;
      colorAccent?: string | null;
    };
    themeSettings?: any;
    seo?: Record<string, string>;
    seoSettings?: Array<Record<string, string>>;
  };
}

function pickAxiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || 'Request failed';
}

export async function getWebsitePageData(payload: WebsitePagePayload): Promise<WebsitePageResponse> {
  try {
    const response = await sitenextjsHttp.post('/website_page', payload);
    const body = response.data || {};
    return {
      redirect: body.redirect,
      data: body.data,
    };
  } catch (err) {
    throw new Error(pickAxiosMessage(err));
  }
}

export async function getSlugToPageDetails(
  payload: SlugToPageDetailsPayload
): Promise<SlugToPageDetailsResponse> {
  try {
    const response = await sitenextjsHttp.post('/slug_to_page_details', payload);
    const body = response.data || {};
    return {
      redirect: body.redirect,
      data: body.data,
    };
  } catch (err) {
    throw new Error(pickAxiosMessage(err));
  }
}
