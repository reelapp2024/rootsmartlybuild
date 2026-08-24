import type { WebsiteElement } from '../../../types';
import { getElementDna } from '../../../elements';

/**
 * Canvas element factory — the palette + default builder for the freeform
 * "Canvas" section (an Elementor-style section where the user can drop ANY
 * element and edit it fully).
 *
 * PALETTE_ELEMENTS drives the "Add element" palette UI. `createCanvasElement`
 * builds a fresh WebsiteElement with a unique id + sensible default content /
 * style for the picked type, ready to append to `section.elements[]`.
 *
 * Colours reference theme tokens at render time (ElementsSection resolves them);
 * DNA style has no theme color keys (element SSOT).
 */

export interface PaletteItem {
  type: WebsiteElement['type'];
  label: string;
  icon: string; // font-awesome icon for the palette button
  group: 'Basic' | 'Media' | 'Content' | 'Interactive';
}

/** Elements offered in the "Add element" palette, grouped for the UI. */
export const PALETTE_ELEMENTS: PaletteItem[] = [
  // Basic
  { type: 'heading',       label: 'Heading',      icon: 'fa-heading',        group: 'Basic' },
  { type: 'text',          label: 'Text',         icon: 'fa-align-left',     group: 'Basic' },
  { type: 'button',        label: 'Button',       icon: 'fa-square',         group: 'Basic' },
  { type: 'badge',         label: 'Badge',        icon: 'fa-tag',            group: 'Basic' },
  { type: 'highlight-text',label: 'Highlight',    icon: 'fa-highlighter',    group: 'Basic' },
  { type: 'blockquote',    label: 'Quote',        icon: 'fa-quote-right',    group: 'Basic' },
  { type: 'divider',       label: 'Divider',      icon: 'fa-grip-lines',     group: 'Basic' },
  { type: 'spacer',        label: 'Spacer',       icon: 'fa-arrows-up-down', group: 'Basic' },
  { type: 'icon',          label: 'Icon',         icon: 'fa-star',           group: 'Basic' },
  // Media
  { type: 'image',         label: 'Image',        icon: 'fa-image',          group: 'Media' },
  { type: 'video',         label: 'Video',        icon: 'fa-video',          group: 'Media' },
  { type: 'image-box',     label: 'Image Box',    icon: 'fa-panorama',       group: 'Media' },
  { type: 'logo-cloud',    label: 'Logo Cloud',   icon: 'fa-icons',          group: 'Media' },
  // Layout
  { type: 'row' as any,    label: 'Row (2 cols)', icon: 'fa-table-columns',  group: 'Content' },
  { type: 'column' as any, label: 'Column',       icon: 'fa-grip-lines-vertical', group: 'Content' },
  // Content
  { type: 'icon-box',      label: 'Icon Box',     icon: 'fa-square-check',   group: 'Content' },
  { type: 'feature-box',   label: 'Feature Box',  icon: 'fa-list-check',     group: 'Content' },
  { type: 'list',          label: 'List',         icon: 'fa-list-ul',        group: 'Content' },
  { type: 'card',          label: 'Card',         icon: 'fa-window-maximize',group: 'Content' },
  { type: 'stat-card',     label: 'Stat Card',    icon: 'fa-chart-simple',   group: 'Content' },
  { type: 'counter',       label: 'Counter',      icon: 'fa-stopwatch',      group: 'Content' },
  { type: 'star-rating',   label: 'Star Rating',  icon: 'fa-star-half-stroke', group: 'Content' },
  { type: 'trust-strip',   label: 'Trust Strip',  icon: 'fa-shield-halved',  group: 'Content' },
  { type: 'testimonial-card', label: 'Testimonial', icon: 'fa-comment',      group: 'Content' },
  // Interactive
  { type: 'form',          label: 'Form',         icon: 'fa-list-check',     group: 'Interactive' },
  { type: 'call-to-action',label: 'CTA Block',    icon: 'fa-rectangle-ad',   group: 'Interactive' },
  { type: 'accordion',     label: 'Accordion',    icon: 'fa-bars-staggered', group: 'Interactive' },
  { type: 'tabs',          label: 'Tabs',         icon: 'fa-window-restore',  group: 'Interactive' },
  { type: 'toggle',        label: 'Toggle',       icon: 'fa-toggle-on',      group: 'Interactive' },
  { type: 'progress-bar',  label: 'Progress',     icon: 'fa-bars-progress',  group: 'Interactive' },
  { type: 'pricing-table', label: 'Pricing',      icon: 'fa-table-list',     group: 'Interactive' },
  { type: 'flip-box',      label: 'Flip Box',     icon: 'fa-clone',          group: 'Interactive' },
  { type: 'countdown-timer', label: 'Countdown',  icon: 'fa-hourglass-half', group: 'Interactive' },
  { type: 'alert-box',     label: 'Alert',        icon: 'fa-circle-info',    group: 'Interactive' },
];

/** Per-type default content/style for a freshly-added element. */
function defaultForType(type: WebsiteElement['type']): { content: any; style: any } {
  const fromRegistry = getElementDna(type);
  if (fromRegistry) {
    return {
      content: { ...fromRegistry.content },
      style: { ...fromRegistry.style },
    };
  }

  switch (type) {
    case 'highlight-text': return { content: { textBefore: 'This is ', highlightedText: 'highlighted', textAfter: ' text.' }, style: { fontSize: '1.5rem', fontWeight: '700' } };
    case 'blockquote':     return { content: { text: 'A memorable quote goes right here.', author: 'Author name' }, style: { fontStyle: 'italic', borderLeftWidth: '4px', borderLeftStyle: 'solid', padding: '16px 20px' } };
    case 'divider':        return { content: { dividerStyle: 'solid', thickness: '1px' }, style: { marginTop: '24px', marginBottom: '24px' } };
    case 'spacer':         return { content: { height: '40px' }, style: {} };
    case 'table':
      return {
        content: {
          headers: ['Season', 'Healing', 'Best for'],
          rows: [
            ['Fall', 'Very easy', 'Almost everyone'],
            ['Winter', 'Very easy', 'Large pieces'],
            ['Summer', 'Moderate', 'Strict aftercare'],
          ],
          caption: '',
        },
        style: { width: '100%', borderCollapse: 'collapse' },
      };
    case 'icon':           return { content: { icon: 'fa-star', iconSize: '32px' }, style: {} };
    case 'image':          return { content: { imageUrl: '', imageAlt: 'Image' }, style: { width: '100%', borderRadius: '12px' } };
    case 'video':          return { content: { videoUrl: '', videoTitle: 'Video' }, style: { width: '100%', maxWidth: '640px', borderRadius: '12px' } };
    case 'image-box':      return { content: { imageUrl: '', title: 'Image box title', description: 'Short description under the image.' }, style: { borderRadius: '12px' } };
    case 'logo-cloud':     return { content: { logos: [{ src: '' }, { src: '' }, { src: '' }, { src: '' }] }, style: {} };
    case 'icon-box':       return { content: { icon: 'fa-check-circle', text: 'Icon box title', subText: 'Describe this point briefly.', iconPosition: 'top' }, style: { textAlign: 'center' } };
    case 'feature-box':    return { content: { icon: 'fa-star', text: 'Feature title', subText: 'Explain this feature in one line.', iconPosition: 'left' }, style: { padding: '1.1rem', borderWidth: '1px', borderStyle: 'solid', borderRadius: '1rem' } };
    case 'list':           return { content: { items: [{ title: 'First item' }, { title: 'Second item' }, { title: 'Third item' }], listType: 'check' }, style: { itemGap: '0.75rem' } };
    case 'card':           return { content: { title: 'Card title', description: 'Card body text goes here.', badge: '' }, style: { padding: '1.5rem', borderRadius: '16px', borderWidth: '1px', borderStyle: 'solid' } };
    case 'stat-card':      return { content: { value: '100+', text: 'Happy customers', icon: 'fa-users' }, style: { padding: '1.25rem', borderRadius: '1rem', textAlign: 'center' } };
    case 'counter':        return { content: { value: 100, text: 'Projects', prefix: '', suffix: '+' }, style: { textAlign: 'center' } };
    case 'star-rating':    return { content: { rating: 5, maxRating: 5 }, style: {} };
    case 'trust-strip':    return { content: { items: [{ icon: 'fa-clock', label: 'Fast response' }, { icon: 'fa-medal', label: 'Licensed & insured' }, { icon: 'fa-star', label: 'Top rated' }] }, style: { gap: '20px' } };
    case 'testimonial-card': return { content: { quote: 'They did a fantastic job — highly recommended.', author: 'Customer name', role: 'Local resident', rating: 5, avatar: '', showStars: true, showAvatar: true }, style: {} };
    case 'call-to-action': return { content: { text: 'Ready to get started?', subText: 'Book your free quote today.', buttonText: 'Contact us', link: '#' }, style: { padding: '24px 32px', borderRadius: '16px', textAlign: 'center' } };
    case 'accordion':      return { content: { items: [{ title: 'Question one?', content: 'Answer to the first question.' }, { title: 'Question two?', content: 'Answer to the second question.' }], exclusive: true }, style: { itemGap: '0.75rem', iconType: 'plus', iconPosition: 'right' } };
    case 'tabs':           return { content: { tabs: [{ label: 'Tab one', content: 'Content for tab one.' }, { label: 'Tab two', content: 'Content for tab two.' }] }, style: {} };
    case 'toggle':         return { content: { label: 'Toggle option', checked: false }, style: {} };
    case 'progress-bar':   return { content: { value: 75, max: 100, label: 'Progress' }, style: {} };
    case 'pricing-table':  return { content: { plans: [{ name: 'Basic', price: '$9', features: ['Feature one', 'Feature two'] }, { name: 'Pro', price: '$29', features: ['Everything in Basic', 'Priority support'], popular: true }] }, style: {} };
    case 'flip-box':       return { content: { frontTitle: 'Hover me', frontDesc: 'Front side', backTitle: 'Back side', backDesc: 'More detail on the back.', backBtnLabel: 'Learn more' }, style: {} };
    case 'countdown-timer':return { content: { text: 'Offer ends in', targetOffsetDays: 7 }, style: {} };
    case 'alert-box':      return { content: { message: 'This is an informational alert.', type: 'info' }, style: { borderRadius: '10px', padding: '14px 18px' } };
    case 'form' as any:    return {
      content: {
        heading: 'Get in touch',
        subheading: 'Fill the form and we’ll get back to you.',
        fields: [
          { name: 'name',    label: 'Name',    type: 'text',     required: true },
          { name: 'email',   label: 'Email',   type: 'email',    required: true },
          { name: 'phone',   label: 'Phone',   type: 'tel',      required: false },
          { name: 'message', label: 'Message', type: 'textarea', required: false },
        ],
        buttonText: 'Send message',
        successMessage: 'Thanks! We’ll be in touch soon.',
      },
      style: { padding: '1.5rem', borderRadius: '1rem', borderWidth: '1px', borderStyle: 'solid' },
    };
    case 'row' as any:     return {
      content: {
        columnCount: 2,
        gap: '1.5rem',
        verticalAlign: 'stretch',
        children: [
          { id: `row-c1-${Math.floor(performance.now() % 100000)}`, type: 'text', content: { text: 'Left column. Click to edit.', textSize: 'base' }, style: { textAlign: 'left' }, settings: {} },
          { id: `row-c2-${Math.floor(performance.now() % 100000) + 1}`, type: 'text', content: { text: 'Right column. Click to edit.', textSize: 'base' }, style: { textAlign: 'left' }, settings: {} },
        ],
      },
      style: {},
    };
    case 'column' as any:  return {
      content: {
        gap: '1rem',
        children: [
          { id: `col-c1-${Math.floor(performance.now() % 100000)}`, type: 'text', content: { text: 'Column item. Click to edit.', textSize: 'base' }, style: { textAlign: 'left' }, settings: {} },
        ],
      },
      style: { alignItems: 'flex-start' },
    };
    default:               return { content: { text: 'New element' }, style: {} };
  }
}

let seq = 0;
/** Unique id for a user-added canvas element (stable within a session). */
export function nextCanvasElementId(sectionId: string, type: string): string {
  seq += 1;
  const rand = Math.floor(performance.now() % 100000);
  return `canvas-${sectionId}-${type}-${rand}-${seq}`;
}

/** Build a fresh, editable WebsiteElement of the given type ready for the canvas. */
export function createCanvasElement(sectionId: string, type: WebsiteElement['type']): WebsiteElement {
  const def = defaultForType(type);
  return {
    id: nextCanvasElementId(sectionId, type),
    type,
    content: def.content,
    style: def.style,
    settings: {},
  };
}
