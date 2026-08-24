import { httpFile } from '@/config';

export type DomainStatus =
  | 'pending'
  | 'verified'
  | 'connected_to_our_server'
  | 'verification_failed'
  | 'inactive'
  | string;

export type DomainVerificationOptions = {
  nameservers: string[];
  a_records: { type: 'A' | 'CNAME'; host: string; value: string; ttl: number }[];
  dns_txt: {
    recommended_host: string;
    fallback_host: string;
    type: 'TXT';
    value: string;
    ttl: number;
  };
};

export type DomainRow = {
  ok?: boolean;
  id?: string;
  domain: string;
  status: DomainStatus;
  statusLabel?: string;
  method?: string | null;
  lastVerifiedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  projectId?: string | null;
  dnsToken?: string | null;
  message?: string | null;
  usedBy?: {
    projectId: string;
    projectName: string;
    source?: string;
  } | null;
  verification_options?: DomainVerificationOptions;
  instructions?: {
    type: string;
    recommended_host?: string;
    fallback_host?: string;
    value?: string;
    ttl?: number;
  };
  verificationDetails?: Record<string, unknown>;
};

export function normalizeDomainInput(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^(https?:\/\/|ftp:\/\/)/i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
    .replace(/^www\./, '');
}

export function domainStatusBadge(status?: string): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'verified':
      return { label: 'Verified', className: 'bg-emerald-600 hover:bg-emerald-600 text-white' };
    case 'connected_to_our_server':
      return { label: 'Connected', className: 'bg-blue-600 hover:bg-blue-600 text-white' };
    case 'verification_failed':
      return { label: 'Failed', className: 'bg-red-100 text-red-700' };
    case 'inactive':
      return { label: 'Inactive', className: 'bg-gray-100 text-gray-700' };
    default:
      return { label: 'Pending', className: 'bg-amber-100 text-amber-800' };
  }
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export async function listDomains(opts?: {
  page?: number;
  limit?: number;
}): Promise<{
  domains: string[];
  results: DomainRow[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 10;
  const { data } = await httpFile.get('/domains/list', {
    headers: authHeaders(),
    params: { page, limit, full: 1 },
  });
  return {
    domains: Array.isArray(data?.domains) ? data.domains : [],
    results: Array.isArray(data?.results) ? data.results : [],
    page: Number(data?.page || page),
    limit: Number(data?.limit || limit),
    total: Number(data?.total || 0),
    pages: Number(data?.pages || 1),
  };
}

export async function addDomain(domainName: string): Promise<{
  message?: string;
  verification_options?: DomainVerificationOptions;
  result?: DomainRow;
}> {
  const fd = new FormData();
  fd.append('domainName', normalizeDomainInput(domainName));
  const { data } = await httpFile.post('/domains', fd, { headers: authHeaders() });
  if (data?.ok === false) {
    throw new Error(data?.error || 'Failed to add domain');
  }
  return data;
}

export async function verifyDomain(domainName: string, force = false): Promise<DomainRow> {
  const fd = new FormData();
  fd.append('domainName', normalizeDomainInput(domainName));
  if (force) fd.append('force', '1');
  const { data } = await httpFile.post('/domains/verify', fd, { headers: authHeaders() });
  if (!data?.ok && !data?.results?.[0]) {
    throw new Error(data?.error || 'Failed to verify domain');
  }
  const row = data.results?.[0] as DomainRow | undefined;
  if (!row) throw new Error('No verification result returned');
  return row;
}

export async function deleteDomain(domainName: string): Promise<void> {
  const { data } = await httpFile.post(
    `/deleteDomain?domainName=${encodeURIComponent(normalizeDomainInput(domainName))}`,
    {},
    { headers: authHeaders() }
  );
  if (data?.ok === false) {
    throw new Error(data?.error || 'Failed to remove domain');
  }
}

export type DomainConflict = {
  domain: string;
  existingProject: { projectId: string; projectName: string };
  options?: {
    unlink?: { requiredParams?: { projectId?: string; domainName?: string } };
  };
};

/** Returns availability for a domain on a project. Throws axios-like 409 conflict object. */
export async function checkDomainForProject(
  domainName: string,
  projectId: string
): Promise<{ isAvailable: true; domain: string }> {
  const clean = normalizeDomainInput(domainName);
  try {
    const { data } = await httpFile.post(
      '/checkDomain',
      { domainName: clean, projectId },
      { headers: authHeaders() }
    );
    return { isAvailable: true, domain: data?.domain || clean };
  } catch (error: any) {
    if (error.response?.status === 409 && error.response?.data) {
      const err = new Error(error.response.data.error || 'Domain in use') as Error & {
        conflict: DomainConflict;
        response: typeof error.response;
      };
      err.conflict = {
        domain: error.response.data.domain || clean,
        existingProject: error.response.data.existingProject,
        options: error.response.data.options,
      };
      err.response = error.response;
      throw err;
    }
    throw new Error(
      error.response?.data?.error || error.message || 'Failed to check domain'
    );
  }
}
