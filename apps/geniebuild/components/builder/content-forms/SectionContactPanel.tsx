import React from 'react';
import type { Section } from '../../../types';
import { AccordionGroup } from '../inputs';
import { ContactSourceFields, type ContactFieldKeys } from './ContactSourceFields';
import { inferKindFromLink } from '../../../lib/contactResolver';

const HERO_SECONDARY_KEYS: ContactFieldKeys = {
  source: 'secondaryPhoneSource',
  pick: 'secondaryPhonePickIndex',
  text: 'secondaryCtaText',
  link: 'secondaryCtaHref',
};

const FAQ_CTA_KEYS: ContactFieldKeys = {
  source: 'ctaButtonContactSource',
  pick: 'ctaButtonContactPickIndex',
  text: 'ctaButtonText',
  link: 'ctaButtonLink',
};

interface Props {
  section: Section;
  onContentUpdate: (updates: Partial<Section['content']>) => void;
}

/** Section-level phone/email controls for header, footer, hero, FAQ, etc. */
export const SectionContactPanel: React.FC<Props> = ({ section, onContentUpdate }) => {
  const content = (section.content || {}) as Record<string, unknown>;
  const type = String(section.type || '').toLowerCase();

  const panels: React.ReactNode[] = [];

  if (type === 'header' || type === 'navbar' || type === 'footer' || type === 'cta' || type === 'areas') {
    panels.push(
      <ContactSourceFields
        key="phone"
        kind="phone"
        mode="section"
        content={content}
        onContentUpdate={(u) => onContentUpdate(u as Partial<Section['content']>)}
      />
    );
  }

  if (type === 'footer') {
    panels.push(
      <ContactSourceFields
        key="email"
        kind="email"
        mode="section"
        content={content}
        onContentUpdate={(u) => onContentUpdate(u as Partial<Section['content']>)}
      />
    );
  }

  if (type === 'hero') {
    panels.push(
      <ContactSourceFields
        key="hero-call"
        kind="phone"
        mode="section"
        fieldKeys={HERO_SECONDARY_KEYS}
        content={content}
        onContentUpdate={(u) => onContentUpdate(u as Partial<Section['content']>)}
      />
    );
  }

  if (type === 'faq') {
    panels.push(
      <ContactSourceFields
        key="faq-call"
        kind="phone"
        mode="section"
        fieldKeys={FAQ_CTA_KEYS}
        content={content}
        onContentUpdate={(u) => onContentUpdate(u as Partial<Section['content']>)}
      />
    );
  }

  const ctaLinkKind = inferKindFromLink(String(content.ctaHref || ''));
  if (ctaLinkKind && type !== 'cta') {
    panels.push(
      <ContactSourceFields
        key="cta-link"
        kind={ctaLinkKind}
        mode="section"
        fieldKeys={{
          source: 'ctaLinkContactSource',
          pick: 'ctaLinkContactPickIndex',
          text: 'ctaText',
          link: 'ctaHref',
        }}
        content={content}
        onContentUpdate={(u) => onContentUpdate(u as Partial<Section['content']>)}
      />
    );
  }

  if (!panels.length) return null;

  return (
    <AccordionGroup title="Phone & email (About Us)" defaultOpen={type === 'header' || type === 'navbar' || type === 'footer'}>
      <div className="space-y-2">{panels}</div>
    </AccordionGroup>
  );
};
