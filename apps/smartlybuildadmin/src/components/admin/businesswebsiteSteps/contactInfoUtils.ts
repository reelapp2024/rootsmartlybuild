export const SOCIAL_PRESET_PLATFORMS = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle" },
  { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/..." },
  { key: "threads", label: "Threads", placeholder: "https://threads.net/..." },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/15551234567" },
] as const;

export type SocialPresetKey = (typeof SOCIAL_PRESET_PLATFORMS)[number]["key"];

export interface ContactValue {
  value: string;
  is_primary: boolean;
}

export interface CustomSocialLinkRow {
  id: string;
  label: string;
  url: string;
}

export function emptyPresetSocialUrls(): Record<SocialPresetKey, string> {
  return Object.fromEntries(SOCIAL_PRESET_PLATFORMS.map((p) => [p.key, ""])) as Record<
    SocialPresetKey,
    string
  >;
}

export function ensureUrlProtocol(input: string): string {
  const t = input.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function isValidHttpUrl(input: string): boolean {
  const withProto = ensureUrlProtocol(input);
  try {
    const u = new URL(withProto);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function stableSocialLinksPayload(
  links: { platform: string; customLabel?: string; url: string }[]
) {
  return JSON.stringify(
    [...links].sort((a, b) =>
      `${a.platform}|${a.url}|${a.customLabel || ""}`.localeCompare(
        `${b.platform}|${b.url}|${b.customLabel || ""}`
      )
    )
  );
}

export function buildSocialLinksFromForm(
  presetUrls: Record<string, string>,
  customRows: CustomSocialLinkRow[]
): { platform: string; customLabel?: string; url: string }[] {
  const links: { platform: string; customLabel?: string; url: string }[] = [];
  for (const p of SOCIAL_PRESET_PLATFORMS) {
    const raw = (presetUrls[p.key] || "").trim();
    if (!raw) continue;
    links.push({ platform: p.key, url: ensureUrlProtocol(raw) });
  }
  for (const row of customRows) {
    const raw = row.url.trim();
    if (!raw) continue;
    const label = row.label.trim();
    links.push({
      platform: "custom",
      ...(label ? { customLabel: label } : {}),
      url: ensureUrlProtocol(raw),
    });
  }
  return links;
}

export function parseSocialLinksFromAboutUs(socialLinks: unknown): {
  presetUrls: Record<SocialPresetKey, string>;
  customRows: CustomSocialLinkRow[];
} {
  const presetKeys = new Set<string>(SOCIAL_PRESET_PLATFORMS.map((p) => p.key));
  const presetUrls = emptyPresetSocialUrls();
  const customRows: CustomSocialLinkRow[] = [];
  if (!Array.isArray(socialLinks)) {
    return { presetUrls, customRows };
  }
  for (const item of socialLinks) {
    if (!item || typeof item !== "object") continue;
    const row = item as { platform?: string; url?: string; customLabel?: string };
    const platform = String(row.platform || "").toLowerCase();
    const url = String(row.url || "").trim();
    if (!url) continue;
    if (platform === "custom" || !presetKeys.has(platform)) {
      customRows.push({
        id: crypto.randomUUID(),
        label: platform === "custom" ? String(row.customLabel || "").trim() : platform,
        url,
      });
    } else {
      presetUrls[platform as SocialPresetKey] = url;
    }
  }
  return { presetUrls, customRows };
}

export function applyAboutUsToContactState(aboutUsData: any): {
  emails: ContactValue[];
  phones: ContactValue[];
  presetSocialUrls: Record<SocialPresetKey, string>;
  customSocialLinks: CustomSocialLinkRow[];
  mainLocation: string;
} {
  const normalizedEmails =
    Array.isArray(aboutUsData?.emails) && aboutUsData.emails.length > 0
      ? aboutUsData.emails.map((item: any, index: number) => ({
          value: item?.value || "",
          is_primary: item?.is_primary === true || index === 0,
        }))
      : [{ value: aboutUsData?.email || "", is_primary: true }];

  const normalizedPhones =
    Array.isArray(aboutUsData?.phones) && aboutUsData.phones.length > 0
      ? aboutUsData.phones.map((item: any, index: number) => ({
          value: item?.value || "",
          is_primary: item?.is_primary === true || index === 0,
        }))
      : [{ value: aboutUsData?.phone || "", is_primary: true }];

  const { presetUrls, customRows } = parseSocialLinksFromAboutUs(aboutUsData?.socialLinks);

  return {
    emails: normalizedEmails,
    phones: normalizedPhones,
    presetSocialUrls: presetUrls,
    customSocialLinks: customRows,
    mainLocation: String(aboutUsData?.mainLocation || aboutUsData?.address || "").trim(),
  };
}

export function validateContactForm(input: {
  emails: ContactValue[];
  phones: ContactValue[];
  presetSocialUrls: Record<string, string>;
  customSocialLinks: CustomSocialLinkRow[];
}): string | null {
  const validEmails = input.emails.filter((item) => item.value.trim());
  const validPhones = input.phones.filter((item) => item.value.trim());

  if (validEmails.length === 0) return "At least one email is required";
  if (validEmails.some((item) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.value.trim()))) {
    return "Please enter valid email addresses";
  }
  if (validPhones.length === 0) return "At least one phone number is required";
  if (!validEmails.some((item) => item.is_primary)) return "Please select one primary email";
  if (!validPhones.some((item) => item.is_primary)) return "Please select one primary phone";

  for (const p of SOCIAL_PRESET_PLATFORMS) {
    const v = (input.presetSocialUrls[p.key] || "").trim();
    if (v && !isValidHttpUrl(v)) return `Please enter a valid URL for ${p.label}`;
  }

  for (let i = 0; i < input.customSocialLinks.length; i++) {
    const row = input.customSocialLinks[i];
    const url = row.url.trim();
    const label = row.label.trim();
    if (!url && !label) continue;
    if (url && !isValidHttpUrl(url)) return `Please enter a valid URL for custom link #${i + 1}`;
    if (label && !url) return `Add a URL for the custom platform "${label}", or clear the name`;
  }

  return null;
}
