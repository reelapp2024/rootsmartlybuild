import { API_BASE_URL } from '../config';
import { getProjectIdFromUrl } from './aboutUsApi';

export type DynamicFormField = {
  _id?: string;
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: unknown;
};

export type DynamicFormRecord = {
  _id: string;
  projectId?: string;
  name?: string;
  isEnabled?: boolean;
  fields?: DynamicFormField[];
};

function unwrapFormsPayload(body: any): DynamicFormRecord[] {
  const data = body?.data ?? body;
  if (Array.isArray(data)) return data as DynamicFormRecord[];
  if (Array.isArray(data?.forms)) return data.forms as DynamicFormRecord[];
  if (data && typeof data === 'object' && data._id) return [data as DynamicFormRecord];
  return [];
}

/** Public: latest/enabled DynamicForm for a project (website + GenieBuild). */
export async function fetchProjectDynamicForm(
  projectId?: string | null
): Promise<DynamicFormRecord | null> {
  const pid = String(projectId || getProjectIdFromUrl() || '').trim();
  if (!pid) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/fetch_dynamic_forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: pid }),
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    const forms = unwrapFormsPayload(body);
    return forms[0] || null;
  } catch {
    return null;
  }
}

/**
 * Submit to DynamicFormController.submit_form_data
 * Body keys must match field.name; include formId.
 */
export async function submitDynamicFormData(
  formId: string,
  values: Record<string, unknown>
): Promise<{ ok: boolean; message: string }> {
  const id = String(formId || '').trim();
  if (!id) return { ok: false, message: 'Form is not configured.' };

  try {
    const res = await fetch(`${API_BASE_URL}/submit_form_data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId: id, ...values }),
    });
    const body = await res.json().catch(() => ({}));
    const message =
      String(body?.message || body?.error || '').trim() ||
      (res.ok ? 'Form submitted successfully.' : 'Failed to submit form.');
    return { ok: res.ok, message };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Failed to submit form.' };
  }
}

export function mapDynamicFormToSectionFields(form: DynamicFormRecord | null) {
  const fields = Array.isArray(form?.fields) ? form!.fields! : [];
  return fields
    .filter((f) => f && String(f.label || '').trim())
    .map((f) => ({
      name: String(f.name || '').trim() || String(f.label || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, ''),
      label: String(f.label || 'Field').trim(),
      type: String(f.type || 'text').trim(),
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? f.options.map(String) : [],
      placeholder: String(f.placeholder || f.label || '').trim(),
    }));
}
