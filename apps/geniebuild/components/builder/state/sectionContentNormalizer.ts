/**
 * Pure normalizer: converts SectionContent API payloads (various legacy shapes)
 * into the GenieBuild content model. Returns the input unchanged for unknown
 * section types.
 */
export function normalizeSectionContent(sectionType: string, raw: any): any {
  if (!raw) return raw;
  const type = String(sectionType || '').toLowerCase();
  const legacyItems = Array.isArray(raw)
    ? raw
    : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.content?.data) ? raw.content.data : null));

  if (type === 'process' && Array.isArray(legacyItems) && !Array.isArray(raw.items)) {
    const mappedItems = legacyItems.map((item: any, index: number) => ({
      id: item?.id || `process-${index + 1}`,
      title: item?.title || '',
      description: item?.description || '',
      icon: item?.icon || item?.iconClass || '',
      iconClass: item?.iconClass || item?.icon || '',
    }));

    if (Array.isArray(raw)) {
      return { items: mappedItems };
    }

    return {
      ...raw,
      subtitle: raw?.subtitle || raw?.description || '',
      items: mappedItems,
    };
  }

  if (type === 'services') {
    const rawObj = Array.isArray(raw) ? { data: raw } : raw;
    const serviceItems = Array.isArray(rawObj?.items)
      ? rawObj.items
      : (Array.isArray(rawObj?.data) ? rawObj.data : null);

    if (Array.isArray(serviceItems)) {
      return {
        ...rawObj,
        subtitle: rawObj?.subtitle || rawObj?.description || rawObj?.sectionSubtitle || '',
        title: rawObj?.title || rawObj?.sectionTitle || 'Our Services',
        description: rawObj?.description || rawObj?.sectionSubtitle || '',
        items: serviceItems.map((item: any, index: number) => ({
          id: item?.id || `service-${index + 1}`,
          title: item?.title || '',
          description: item?.description || '',
          icon: item?.icon || item?.iconClass || '',
          iconClass: item?.iconClass || item?.icon || '',
        })),
      };
    }
  }

  if (type === 'about') {
    const rawObj = Array.isArray(raw) ? {} : (raw || {});
    return {
      ...rawObj,
      subtitle: rawObj?.subtitle || rawObj?.descriptionText || rawObj?.description || rawObj?.longDescription || rawObj?.about_service || rawObj?.sectionSubtitle || '',
      title: rawObj?.title || rawObj?.heading || rawObj?.sectionTitle || '',
      description: rawObj?.description || rawObj?.descriptionText || rawObj?.longDescription || rawObj?.about_service || rawObj?.sectionSubtitle || '',
      ctaText: rawObj?.ctaText || rawObj?.buttonText || rawObj?.cta_label || '',
      imageUrl: rawObj?.imageUrl || rawObj?.image || rawObj?.image_url || rawObj?.heroImage || undefined,
    };
  }

  if (type === 'guarantee') {
    const rawObj = Array.isArray(raw) ? {} : (raw || {});
    const guaranteeList = Array.isArray(rawObj.guaranteeList) ? rawObj.guaranteeList : [];
    const legacyArr = Array.isArray(rawObj.items) ? rawObj.items : [];
    const statCard = (rawObj.statCard && typeof rawObj.statCard === 'object') ? rawObj.statCard : {};
    const legacyText = typeof rawObj.text === 'string' ? rawObj.text.trim() : '';
    const desc =
      (typeof rawObj.description === 'string' ? rawObj.description.trim() : '') ||
      (typeof rawObj.descriptionText === 'string' ? rawObj.descriptionText.trim() : '') ||
      legacyText ||
      '';
    const iconRaw =
      (typeof rawObj.icon === 'string' && rawObj.icon.trim()) ||
      (typeof rawObj.iconClass === 'string' && rawObj.iconClass.trim()) ||
      (legacyArr[0]
        ? String(legacyArr[0].iconClass || legacyArr[0].icon || '').trim()
        : '');
    const titleRaw =
      (typeof rawObj.title === 'string' ? rawObj.title.trim() : '') ||
      (legacyArr[0] && typeof legacyArr[0].title === 'string' ? legacyArr[0].title.trim() : '');
    const next: Record<string, unknown> = {
      ...rawObj,
      subtitle:
        (typeof rawObj.subtitle === 'string' ? rawObj.subtitle.trim() : '') ||
        (typeof rawObj.descriptionText === 'string' ? rawObj.descriptionText.trim() : '') ||
        desc,
      description: desc,
      title:
        (typeof rawObj.title === 'string' ? rawObj.title.trim() : '') ||
        (typeof rawObj.heading === 'string' ? rawObj.heading.trim() : '') ||
        titleRaw ||
        '',
      items: guaranteeList.length > 0
        ? guaranteeList.map((it: any, idx: number) => ({
            id: it?.id || `guarantee-${idx + 1}`,
            title: (typeof it?.line === 'string' ? it.line : '') || (typeof it?.title === 'string' ? it.title : ''),
            icon: (typeof it?.icon === 'string' ? it.icon : '') || 'fas fa-check-circle',
          }))
        : legacyArr,
    };
    delete (next as any).text;
    if (iconRaw) next.icon = iconRaw;
    if (titleRaw && !next.title) next.title = titleRaw;
    const badgeRaw =
      (typeof rawObj.badgeText === 'string' ? rawObj.badgeText.trim() : '') ||
      (typeof rawObj.badge === 'string' ? rawObj.badge.trim() : '');
    if (badgeRaw) next.badgeText = badgeRaw;
    const ctaRaw =
      (typeof rawObj.ctaText === 'string' ? rawObj.ctaText.trim() : '') ||
      (typeof rawObj.buttonText === 'string' ? rawObj.buttonText.trim() : '') ||
      (typeof rawObj.cta_label === 'string' ? rawObj.cta_label.trim() : '');
    if (ctaRaw) next.ctaText = ctaRaw;
    const hrefRaw =
      (typeof rawObj.ctaHref === 'string' ? rawObj.ctaHref.trim() : '') ||
      (typeof rawObj.ctaLink === 'string' ? rawObj.ctaLink.trim() : '');
    if (hrefRaw) next.ctaHref = hrefRaw;
    const statValueRaw =
      (typeof rawObj.statValue === 'string' ? rawObj.statValue.trim() : '') ||
      (typeof statCard.value === 'string' ? statCard.value.trim() : '');
    if (statValueRaw) next.statValue = statValueRaw;
    const statLabelRaw =
      (typeof rawObj.statLabel === 'string' ? rawObj.statLabel.trim() : '') ||
      (typeof statCard.label === 'string' ? statCard.label.trim() : '');
    if (statLabelRaw) next.statLabel = statLabelRaw;
    const statDescriptionRaw =
      (typeof rawObj.statDescription === 'string' ? rawObj.statDescription.trim() : '') ||
      (typeof statCard.description === 'string' ? statCard.description.trim() : '');
    if (statDescriptionRaw) next.statDescription = statDescriptionRaw;
    const statIconRaw =
      (typeof rawObj.statIcon === 'string' ? rawObj.statIcon.trim() : '') ||
      (typeof statCard.icon === 'string' ? statCard.icon.trim() : '');
    if (statIconRaw) next.statIcon = statIconRaw;
    return next;
  }

  if (type === 'faq') {
    const rawObj = Array.isArray(raw) ? {} : (raw || {});
    const faqItems = Array.isArray(legacyItems)
      ? legacyItems
      : Array.isArray(rawObj.items)
        ? rawObj.items
        : Array.isArray(rawObj.faqs)
          ? rawObj.faqs
          : Array.isArray(rawObj.questions)
            ? rawObj.questions
            : [];
    const faqCtaTitle =
      (typeof rawObj.faqCtaTitle === 'string' ? rawObj.faqCtaTitle.trim() : '') ||
      (typeof rawObj.ctaTitle === 'string' ? rawObj.ctaTitle.trim() : '') ||
      '';
    const faqCtaDescription =
      (typeof rawObj.faqCtaDescription === 'string' ? rawObj.faqCtaDescription.trim() : '') ||
      (typeof rawObj.ctaSubtitle === 'string' ? rawObj.ctaSubtitle.trim() : '') ||
      '';

    return {
      ...rawObj,
      title:
        (typeof rawObj.title === 'string' ? rawObj.title.trim() : '') ||
        (typeof rawObj.heading === 'string' ? rawObj.heading.trim() : '') ||
        '',
      subtitle:
        (typeof rawObj.subtitle === 'string' ? rawObj.subtitle.trim() : '') ||
        (typeof rawObj.description === 'string' ? rawObj.description.trim() : '') ||
        (typeof rawObj.descriptionText === 'string' ? rawObj.descriptionText.trim() : '') ||
        '',
      ...(faqCtaTitle ? { faqCtaTitle, ctaTitle: faqCtaTitle } : {}),
      ...(faqCtaDescription ? { faqCtaDescription, ctaSubtitle: faqCtaDescription } : {}),
      items: faqItems.map((item: any, idx: number) => ({
        id: item?.id || `faq-${idx + 1}`,
        question: String(item?.question || item?.title || '').trim(),
        answer: String(item?.answer || item?.description || item?.content || '').trim(),
      })).filter((item: any) => item.question && item.answer),
    };
  }

  return raw;
}
