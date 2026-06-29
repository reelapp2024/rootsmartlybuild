/** Map SectionContent `items` to trust-strip rows (icon + label). */
export function mapCtaTrustItems(content: Record<string, unknown> | undefined | null): {
  icon: string;
  label: string;
}[] {
  const raw = Array.isArray(content?.items) ? content.items : [];
  return raw
    .slice(0, 3)
    .map((it: any) => {
      const iconRaw = String(it?.icon || it?.iconClass || 'fa-check-circle').trim();
      const icon = iconRaw.startsWith('fa-')
        ? iconRaw
        : iconRaw.replace(/^fas\s+fa-/, 'fa-').replace(/^fa\s+/, 'fa-') || 'fa-check-circle';
      const label = String(it?.label || it?.title || it?.line || it?.description || '').trim();
      return { icon, label };
    })
    .filter((row) => row.label.length > 0);
}

export function getCtaPhoneSubText(content: Record<string, unknown> | undefined | null, fallback = ''): string {
  const v = String(content?.phoneSubText || content?.phoneSub || '').trim();
  return v || fallback;
}
