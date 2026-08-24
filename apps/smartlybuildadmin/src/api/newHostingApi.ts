import { httpFile } from '@/config';

export type HostingConnectionType = 'ftp' | 'cpanel' | 'ssh' | 'vps';

export interface HostingConnection {
  _id: string;
  userId: string;
  label?: string;
  connectionType: HostingConnectionType;
  connectionConfig: string;
  status: 'success' | 'failed';
  lastError?: string;
  lastVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isOur?: boolean;
}

export interface GetHostingsResponse {
  message: string;
  data: HostingConnection[];
}

export interface AddHostingRequest {
  connectionType: HostingConnectionType;
  connectionConfig: string;
  label?: string;
}

export interface UpdateHostingRequest {
  connectionType?: HostingConnectionType;
  connectionConfig: string;
  label?: string;
}

/** Standard (shared) vs Advanced (server) product grouping. */
export function hostingCategory(type: HostingConnectionType | string): 'standard' | 'advanced' {
  const t = String(type).toLowerCase();
  return t === 'ssh' || t === 'vps' ? 'advanced' : 'standard';
}

export function hostingCategoryLabel(type: HostingConnectionType | string): string {
  return hostingCategory(type) === 'advanced' ? 'Advanced' : 'Standard';
}

/** Human-readable label for connection type. */
export function hostingTypeLabel(type: HostingConnectionType | string): string {
  switch (String(type).toLowerCase()) {
    case 'ftp':
      return 'FTP (Shared)';
    case 'cpanel':
      return 'cPanel API';
    case 'ssh':
      return 'SSH / SFTP';
    case 'vps':
      return 'VPS (SSH)';
    default:
      return String(type).toUpperCase();
  }
}

export function hostingDisplayName(hosting: HostingConnection): string {
  const label = String(hosting.label || '').trim();
  if (label) return label;
  return formatHostingSummary(hosting.connectionConfig, hosting.connectionType);
}

/** Safe one-line summary for UI lists (no secrets). */
export function formatHostingSummary(
  connectionConfig: string,
  connectionType: HostingConnectionType | string
): string {
  try {
    const parsed = JSON.parse(connectionConfig || '{}') as Record<string, unknown>;
    const type = String(connectionType).toLowerCase();
    const username = String(parsed.username || '').trim();
    const host = String(parsed.host || parsed.cpanelDomain || parsed.domain || '').trim();
    const port = parsed.port != null ? String(parsed.port) : '';

    if (type === 'cpanel') {
      const urlHost =
        host ||
        (() => {
          try {
            return parsed.testUrl ? new URL(String(parsed.testUrl)).hostname : '';
          } catch {
            return '';
          }
        })();
      return username ? `${username} · ${urlHost || 'cpanel'}` : urlHost || 'cPanel';
    }

    if (host && username) {
      const hostPart = port ? `${host}:${port}` : host;
      return username.includes('@') ? `${username} · ${hostPart}` : `${username}@${hostPart}`;
    }
    if (host) return host;
    if (username) return username;
    return 'Configured';
  } catch {
    return 'Invalid config';
  }
}

export function parseHostingConfig(connectionConfig: string): Record<string, unknown> | null {
  try {
    return JSON.parse(connectionConfig || '{}') as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function canBrowseHosting(type: HostingConnectionType | string): boolean {
  const t = String(type).toLowerCase();
  return t === 'ftp' || t === 'ssh' || t === 'vps';
}

export function defaultRootPathForHosting(type: HostingConnectionType | string): string {
  const t = String(type).toLowerCase();
  if (t === 'cpanel' || t === 'ftp') return '/public_html';
  return '/var/www/html';
}

export const getMyHostings = async (opts?: { verifiedOnly?: boolean }): Promise<HostingConnection[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await httpFile.get<GetHostingsResponse>('getMyHostings', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = Array.isArray(response.data?.data) ? response.data.data : [];
    if (opts?.verifiedOnly) {
      return list.filter((h) => h.status === 'success');
    }
    return list;
  } catch (error: any) {
    console.error('Failed to fetch hostings:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch hosting connections');
  }
};

export const addHosting = async (request: AddHostingRequest): Promise<HostingConnection | void> => {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('connectionType', request.connectionType);
    formData.append('connectionConfig', request.connectionConfig);
    if (request.label) formData.append('label', request.label);

    const response = await httpFile.post('addHosting', formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to add hosting:', error);
    throw new Error(error.response?.data?.message || 'Failed to add hosting connection');
  }
};

export const updateHosting = async (
  id: string,
  request: UpdateHostingRequest
): Promise<HostingConnection> => {
  try {
    const token = localStorage.getItem('token');
    const response = await httpFile.put(
      `updateHosting/${id}`,
      {
        connectionType: request.connectionType,
        connectionConfig: request.connectionConfig,
        label: request.label ?? '',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to update hosting:', error);
    throw new Error(error.response?.data?.message || 'Failed to update hosting connection');
  }
};

export const deleteHosting = async (id: string): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    await httpFile.delete(`deleteHosting/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error: any) {
    console.error('Failed to delete hosting:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete hosting connection');
  }
};

export const verifyHosting = async (id: string): Promise<HostingConnection> => {
  try {
    const token = localStorage.getItem('token');
    const response = await httpFile.post(
      `verifyHosting/${id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to verify hosting:', error);
    throw new Error(error.response?.data?.message || 'Hosting verification failed');
  }
};

export interface BrowseDirectoryResponse {
  message: string;
  data: {
    name: string;
    fullPath: string;
  }[];
}

export interface LinkProjectRequest {
  hostingId: string;
  projectId: string;
  domainName: string;
  rootPath: string;
}

export const browseHostingDirectories = async (
  hostingId: string,
  path = ''
): Promise<BrowseDirectoryResponse['data']> => {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('hostingId', hostingId);
    formData.append('path', path);

    const response = await httpFile.post<BrowseDirectoryResponse>('browseHostingDirectories', formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to browse directories:', error);
    throw new Error(error.response?.data?.message || 'Failed to browse directories');
  }
};

export const linkProjectToHosting = async (request: LinkProjectRequest): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('hostingId', request.hostingId);
    formData.append('projectId', request.projectId);
    formData.append('domainName', request.domainName);
    formData.append('rootPath', request.rootPath);

    const response = await httpFile.post('linkProjectToHosting', formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to link project to hosting');
  }
};

export const setCurrentHostingForProject = async (request: {
  projectId: string;
  hostingId: string;
}): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('projectId', request.projectId);
    formData.append('hostingId', request.hostingId);

    await httpFile.post('setCurrentHostingForProject', formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error: any) {
    console.error('Failed to set current hosting for project:', error);
    throw new Error(error.response?.data?.message || 'Failed to set current hosting for project');
  }
};
