
import { WebsiteData, Section, WebsiteElement } from './types';

// Global Element Defaults - Universal baseline styles for all elements
export const ELEMENT_DEFAULTS: Record<string, any> = {
  button: { backgroundColor: '#E11D48', color: '#FFFFFF', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' },
  heading: { color: '#F8FAFC', fontWeight: 'bold' ,textAlign: 'center'},
  text: { color: '#D1D5DB', opacity: 1 ,textAlign: 'center'},
  icon: { fontSize: '24px', color: '#3b82f6' },
  image: { 
    objectFit: 'cover', 
    width: '100%',
    aspectRatio: 'auto',
    borderRadius: '0%',
    borderWidth: '0px',
    borderStyle: 'none',
    borderColor: 'transparent',
    boxShadow: 'none',
    filter: 'none'
  },
  'star-rating': { color: '#F59E0B' }
};

export const PRESET_FONTS = [
  // Sans-serif fonts
  { name: 'Inter', value: '"Inter", sans-serif' },
  { name: 'Poppins', value: '"Poppins", sans-serif' },
  { name: 'Montserrat', value: '"Montserrat", sans-serif' },
  { name: 'Roboto', value: '"Roboto", sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif' },
  { name: 'Lato', value: '"Lato", sans-serif' },
  { name: 'Nunito', value: '"Nunito", sans-serif' },
  { name: 'Raleway', value: '"Raleway", sans-serif' },
  { name: 'Ubuntu', value: '"Ubuntu", sans-serif' },
  { name: 'Work Sans', value: '"Work Sans", sans-serif' },
  { name: 'Source Sans Pro', value: '"Source Sans Pro", sans-serif' },
  { name: 'DM Sans', value: '"DM Sans", sans-serif' },
  
  // Serif fonts
  { name: 'Playfair Display', value: '"Playfair Display", serif' },
  { name: 'Merriweather', value: '"Merriweather", serif' },
  { name: 'Lora', value: '"Lora", serif' },
  { name: 'Crimson Text', value: '"Crimson Text", serif' },
  
  // Script/Display fonts
  { name: 'Dancing Script', value: '"Dancing Script", cursive' },
  { name: 'Pacifico', value: '"Pacifico", cursive' },
  { name: 'Great Vibes', value: '"Great Vibes", cursive' },
  { name: 'Satisfy', value: '"Satisfy", cursive' },
];

export const PRESET_THEMES = [
  {
    "name": "Crimson Jet",
    "elements": {
      "heading": "#F8FAFC",
      "description": "#C7CDD6",
      "surface": "#0E1214",
      "overlay": { "color": "rgba(14,16,20,0.55)", "blend": "multiply" },
      "primaryButton": { "bg": "#E11D48", "text": "#FFFFFF", "hover": "#BE123C" },
      "secondaryButton": { "bg": "transparent", "text": "#F8FAFC", "border": "#F43F5E", "hover": "rgba(244,63,94,0.10)" },
      "accent": "#F59E0B",
      "gradient": { "from": "#0E1214", "to": "#1F2937" },
      "ring": "#F43F5E",
      "shadow": "rgba(0,0,0,0.35)"
    }
  },
  {
    "name": "Indigo Sand",
    "elements": {
      "heading": "#F8FAFC",
      "description": "#BCC6DD",
      "surface": "#0F1222",
      "overlay": { "color": "rgba(12,14,28,0.57)", "blend": "multiply" },
      "primaryButton": { "bg": "#4F46E5", "text": "#FFFFFF", "hover": "#4338CA" },
      "secondaryButton": { "bg": "transparent", "text": "#E5E7EB", "border": "#818CF8", "hover": "rgba(129,140,248,0.12)" },
      "accent": "#EAB308",
      "gradient": { "from": "#0F1222", "to": "#111827" },
      "ring": "#818CF8",
      "shadow": "rgba(0,0,0,0.34)"
    }
  },
  {
    "name": "Saffron Charcoal",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#E5E7EB",
      "surface": "#121212",
      "overlay": { "color": "rgba(12,12,12,0.46)", "blend": "multiply" },
      "primaryButton": { "bg": "#FDB022", "text": "#1A1306", "hover": "#DC8D05" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#FACC15", "hover": "rgba(250,204,21,0.14)" },
      "accent": "#84CC16",
      "gradient": { "from": "#0B0B0B", "to": "#1A1A1A" },
      "ring": "#FACC15",
      "shadow": "rgba(0,0,0,0.45)"
    }
  },
  {
    "name": "Mint Slate",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#D3DEDA",
      "surface": "#0B1412",
      "overlay": { "color": "rgba(8,12,12,0.52)", "blend": "multiply" },
      "primaryButton": { "bg": "#22C55E", "text": "#FFFFFF", "hover": "#179B4A" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#34D399", "hover": "rgba(52,211,153,0.16)" },
      "accent": "#60A5FA",
      "gradient": { "from": "#0B1412", "to": "#0F1A18" },
      "ring": "#34D399",
      "shadow": "rgba(0,0,0,0.40)"
    }
  },
  {
    "name": "Marine Teal",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#BDD0DB",
      "surface": "#0B1720",
      "overlay": { "color": "rgba(7,16,18,0.62)", "blend": "multiply" },
      "primaryButton": { "bg": "#0EA5A4", "text": "#FFFFFF", "hover": "#0C7E7D" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#22D3EE", "hover": "rgba(34,211,238,0.16)" },
      "accent": "#A7F3D0",
      "gradient": { "from": "#0B1720", "to": "#0F2430" },
      "ring": "#22D3EE",
      "shadow": "rgba(0,0,0,0.38)"
    }
  },
  {
    "name": "Royal Plum Noir",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#D8CCE6",
      "surface": "#120C18",
      "overlay": { "color": "rgba(12, 6, 18, 0.56)", "blend": "multiply" },
      "primaryButton": { "bg": "#A855F7", "text": "#FFFFFF", "hover": "#7E22CE" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#C084FC", "hover": "rgba(192,132,252,0.14)" },
      "accent": "#F59E0B",
      "gradient": { "from": "#0F0A16", "to": "#1A1230" },
      "ring": "#C084FC",
      "shadow": "rgba(0,0,0,0.42)"
    }
  },
  {
    "name": "Electric Cobalt",
    "elements": {
      "heading": "#F8FAFC",
      "description": "#B8C7D9",
      "surface": "#0A1220",
      "overlay": { "color": "rgba(6, 10, 22, 0.60)", "blend": "multiply" },
      "primaryButton": { "bg": "#2563EB", "text": "#FFFFFF", "hover": "#1E40AF" },
      "secondaryButton": { "bg": "transparent", "text": "#F8FAFC", "border": "#38BDF8", "hover": "rgba(56,189,248,0.14)" },
      "accent": "#22D3EE",
      "gradient": { "from": "#0A1220", "to": "#0F172A" },
      "ring": "#38BDF8",
      "shadow": "rgba(0,0,0,0.40)"
    }
  },
  {
    "name": "Copper Forest",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#C9D6CF",
      "surface": "#0D1512",
      "overlay": { "color": "rgba(8, 18, 14, 0.58)", "blend": "multiply" },
      "primaryButton": { "bg": "#D97706", "text": "#0E0A04", "hover": "#B45309" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#F59E0B", "hover": "rgba(245,158,11,0.14)" },
      "accent": "#34D399",
      "gradient": { "from": "#0D1512", "to": "#12201B" },
      "ring": "#F59E0B",
      "shadow": "rgba(0,0,0,0.44)"
    }
  },
  {
    "name": "Ruby Night",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#E2C9CF",
      "surface": "#140A0D",
      "overlay": { "color": "rgba(18, 6, 8, 0.60)", "blend": "multiply" },
      "primaryButton": { "bg": "#DC2626", "text": "#FFFFFF", "hover": "#991B1B" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#F87171", "hover": "rgba(248,113,113,0.14)" },
      "accent": "#FB923C",
      "gradient": { "from": "#140A0D", "to": "#1F0E13" },
      "ring": "#F87171",
      "shadow": "rgba(0,0,0,0.46)"
    }
  },
  {
    "name": "Citrus Navy",
    "elements": {
      "heading": "#FFFFFF",
      "description": "#C9D3E6",
      "surface": "#0A1224",
      "overlay": { "color": "rgba(8, 12, 28, 0.62)", "blend": "multiply" },
      "primaryButton": { "bg": "#F59E0B", "text": "#1A1306", "hover": "#D97706" },
      "secondaryButton": { "bg": "transparent", "text": "#FFFFFF", "border": "#FBBF24", "hover": "rgba(251,191,36,0.16)" },
      "accent": "#10B981",
      "gradient": { "from": "#0A1224", "to": "#0C1A33" },
      "ring": "#FBBF24",
      "shadow": "rgba(0,0,0,0.43)"
    }
  }
];

// --- BASIC CONTENT ELEMENTS LIST ---
const BASIC_ELEMENTS_LIST: WebsiteElement[] = [
    {
        id: 'basic-head',
        type: 'heading',
        content: { text: 'Basic Building Blocks', htmlTag: 'h1' },
        style: { fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#ffffff' }
    },
    {
        id: 'basic-txt',
        type: 'text',
        content: { text: 'This section demonstrates standard HTML elements styled for your website.' },
        style: { fontSize: '1rem', lineHeight: '1.6', color: '#cbd5e1', margin: '0 0 2rem 0' }
    },
    {
        id: 'basic-btn',
        type: 'button',
        content: { text: 'Click Me' },
        style: { margin: '0 0 2rem 0' }
    },
    {
        id: 'basic-icon-box',
        type: 'icon-box',
        content: { icon: 'fa-rocket', text: 'Fast Performance', subText: 'Optimized for speed and efficiency.' },
        style: { accentColor: '#3b82f6', margin: '0 0 1rem 0' }
    },
    {
        id: 'basic-image-box',
        type: 'image-box',
        content: { src: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400', text: 'Visual Card', subText: 'Images enhance user engagement.' },
        style: { margin: '0 0 2rem 0' }
    },
    {
        id: 'basic-list',
        type: 'list',
        content: { items: [{title: 'Responsive Design'}, {title: 'SEO Friendly'}, {title: 'Cross-browser'}] },
        style: { margin: '0 0 2rem 0' }
    },
    {
        id: 'basic-badge',
        type: 'badge',
        content: { text: 'New Feature' },
        style: { accentColor: '#ec4899', margin: '0 0 2rem 0' }
    },
    {
        id: 'basic-quote',
        type: 'blockquote',
        content: { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
        style: { accentColor: '#f59e0b', margin: '0 0 2rem 0' }
    }
];

// --- ADVANCED CONTENT ELEMENTS LIST ---
const ADVANCED_ELEMENTS_LIST: WebsiteElement[] = [
     {
        id: 'adv-head',
        type: 'heading',
        content: { text: 'Advanced Components', htmlTag: 'h2' },
        style: { fontSize: '2rem', fontWeight: 'bold', margin: '0 0 2rem 0', color: '#ffffff' }
    },
    {
        id: 'adv-1',
        type: 'accordion',
        content: { 
            items: [
                { title: 'How does it work?', content: 'Just click and edit. It is that simple.' },
                { title: 'Is it responsive?', content: 'Yes, all elements are mobile-friendly by default.' }
            ] 
        },
        style: { margin: '0 0 2rem 0' }
    },
    {
        id: 'adv-3',
        type: 'progress-bar',
        content: { text: 'Project Completion', percentage: 75 },
        style: { accentColor: '#10b981', margin: '0 0 2rem 0' }
    },
    {
        id: 'adv-4',
        type: 'counter',
        content: { targetNumber: 5000, text: 'Happy Users' },
        style: { accentColor: '#f59e0b', margin: '0 0 2rem 0' }
    },
    {
        id: 'adv-6',
        type: 'alert-box',
        content: { text: 'Important Notice', subText: 'Please review your settings before publishing.', icon: 'fa-circle-exclamation' },
        style: { backgroundColor: 'rgba(239, 68, 68, 0.1)', accentColor: '#ef4444', margin: '0 0 2rem 0' }
    },
    {
        id: 'adv-7',
        type: 'flip-box',
        content: { 
            frontTitle: 'Hover Me', 
            frontDesc: 'Discover what is behind', 
            backTitle: 'Surprise!', 
            backDesc: 'Flip boxes are great for revealing details.',
            icon: 'fa-gift'
        },
        style: { accentColor: '#8b5cf6', margin: '0 0 2rem 0' }
    },
    {
        id: 'adv-9',
        type: 'countdown-timer',
        content: { text: 'Launch In', targetDate: new Date(Date.now() + 100000000).toISOString() },
        style: { accentColor: '#ffffff', margin: '0 0 2rem 0', textAlign: 'left' }
    }
];

const DEFAULT_TYPOGRAPHY = {
    h1: { fontFamily: '"Poppins", sans-serif', fontWeight: '700', fontSize: '3.75rem', lineHeight: '1.1' },
    h2: { fontFamily: '"Poppins", sans-serif', fontWeight: '600', fontSize: '2.25rem', lineHeight: '1.2' },
    h3: { fontFamily: '"Poppins", sans-serif', fontWeight: '600', fontSize: '1.5rem', lineHeight: '1.3' },
    p: { fontFamily: '"Inter", sans-serif', fontWeight: '400', fontSize: '1rem', lineHeight: '1.6' },
    button: { fontFamily: '"Inter", sans-serif', fontWeight: '600', fontSize: '0.875rem', textTransform: 'none' as const },
    link: { fontFamily: '"Inter", sans-serif', fontWeight: '500', fontSize: '1rem', textTransform: 'none' as const }
};

export const INITIAL_TEMPLATE: WebsiteData = {
  name: "GenieBuild Template",
  globalStyles: {
    primaryFont: '"Poppins", sans-serif',
    themeMode: 'dark',
    borderRadius: 'rounded-xl',
    colors: {
        backgroundColor: '#0E1214',
        textColor: '#C7CDD6',
        titleColor: '#F8FAFC',
        subtitleColor: '#C7CDD6',
        accentColor: '#F59E0B',
        buttonBackgroundColor: '#E11D48',
        buttonTextColor: '#FFFFFF',
        linkColor: '#F43F5E',
        borderColor: '#F43F5E'
    },
    typography: DEFAULT_TYPOGRAPHY
  },
  sections: [
    // 0. HERO 1 (NEW TOP SECTION)
    {
        id: 'hero-1',
        type: 'hero',
        content: {
            title: 'Build the Future.',
            subtitle: 'Experience the next generation of web design with our AI-powered builder.',
            ctaText: 'Get Started',
            imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2000' // Background image
        },
        styles: {
            backgroundColor: '#0E1214',
            backgroundImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2000',
            overlayColor: '#000000',
            overlayOpacityValue: '0.6', // 60% opacity
            textColor: '#FFFFFF',
            accentColor: '#F59E0B',
            buttonBackgroundColor: '#E11D48',
            buttonTextColor: '#FFFFFF',
            paddingTop: 'pt-32',
            paddingBottom: 'pb-32',
            paddingX: 'px-6',
            textAlign: 'center',
            titleSize: 'text-6xl',
            variant: 'HeroCenter'
        }
    },
    // 1. BASIC ELEMENTS SECTION
    {
      id: 'section-basic',
      type: 'elements',
      content: { 
          title: 'Basic Elements', 
      },
      elements: BASIC_ELEMENTS_LIST,
      styles: { 
          backgroundColor: '#0E1214', 
          textColor: '#C7CDD6', 
          accentColor: '#F59E0B', 
          buttonBackgroundColor: '#E11D48', 
          buttonTextColor: '#FFFFFF', 
          paddingTop: 'pt-16', 
          paddingBottom: 'pb-16', 
          paddingX: 'px-6', 
          textAlign: 'left', 
          titleSize: 'text-4xl', 
          variant: 'default' 
      }
    },
    // 2. ADVANCED ELEMENTS SECTION
    {
      id: 'section-advanced',
      type: 'elements',
      content: { 
          title: 'Advanced Elements', 
      },
      elements: ADVANCED_ELEMENTS_LIST,
      styles: { 
          backgroundColor: '#161b22', 
          textColor: '#e5e7eb', 
          accentColor: '#3b82f6', 
          buttonBackgroundColor: '#2563eb', 
          buttonTextColor: '#FFFFFF', 
          paddingTop: 'pt-16', 
          paddingBottom: 'pb-16', 
          paddingX: 'px-6', 
          textAlign: 'left', 
          titleSize: 'text-4xl', 
          variant: 'default' 
      }
    }
  ]
};

export const SECTION_TEMPLATES: Record<string, Partial<Section>> = {
  allelementsTest: {
    type: 'allelementsTest',
    content: {
      title: 'All Elements Test Section',
      subtitle: 'This section contains all 25 elements for testing and debugging purposes.'
    },
    elements: [
      // Basic Elements (13)
      { id: 'test-heading', type: 'heading', content: { text: 'Sample Heading', htmlTag: 'h2' }, style: { color: '#F8FAFC' } },
      { id: 'test-text', type: 'text', content: { text: 'This is a sample text element for testing.', textSize: 'base' }, style: { color: '#D1D5DB' } },
      { id: 'test-button', type: 'button', content: { text: 'Click Me', link: '' }, style: { backgroundColor: '#E11D48', color: '#FFFFFF' } },
      { id: 'test-image', type: 'image', content: { imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400', imageAlt: 'Sample Image' }, style: { width: '200px', height: '150px' } },
      { id: 'test-video', type: 'video', content: { videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoTitle: 'Sample Video' }, style: { width: '100%', maxWidth: '560px' } },
      { id: 'test-icon', type: 'icon', content: { icon: 'fa-star', iconSize: '24px' }, style: { color: '#F59E0B' } },
      { id: 'test-icon-box', type: 'icon-box', content: { icon: 'fa-check-circle', title: 'Icon Box', description: 'Sample icon box element' }, style: { backgroundColor: 'transparent' } },
      { id: 'test-image-box', type: 'image-box', content: { imageUrl: 'http://localhost:1111/files/placeholder.jpg', title: 'Image Box', description: 'Sample image box element' }, style: {} },
      { id: 'test-list', type: 'list', content: { items: [{ title: 'Item 1' }, { title: 'Item 2' }, { title: 'Item 3' }], listType: 'ul' }, style: { color: '#D1D5DB' } },
      { id: 'test-star-rating', type: 'star-rating', content: { rating: 4.5, maxRating: 5 }, style: { color: '#F59E0B' } },
      { id: 'test-badge', type: 'badge', content: { text: 'New', variant: 'primary' }, style: { backgroundColor: '#F59E0B', color: '#FFFFFF' } },
      { id: 'test-highlight-text', type: 'highlight-text', content: { text: 'This is highlighted text', highlightColor: '#F59E0B' }, style: { color: '#D1D5DB' } },
      { id: 'test-blockquote', type: 'blockquote', content: { text: 'This is a sample blockquote for testing purposes.', author: 'Test Author' }, style: { borderColor: '#F59E0B', color: '#D1D5DB' } },
      // Advanced Elements (12)
      { id: 'test-accordion', type: 'accordion', content: { items: [{ title: 'Item 1', content: 'Content 1' }, { title: 'Item 2', content: 'Content 2' }] }, style: {} },
      { id: 'test-toggle', type: 'toggle', content: { label: 'Toggle Switch', checked: false }, style: {} },
      { id: 'test-tabs', type: 'tabs', content: { tabs: [{ label: 'Tab 1', content: 'Content 1' }, { label: 'Tab 2', content: 'Content 2' }] }, style: {} },
      { id: 'test-progress-bar', type: 'progress-bar', content: { value: 75, max: 100, label: 'Progress' }, style: { backgroundColor: '#F59E0B' } },
      { id: 'test-counter', type: 'counter', content: { value: 100, label: 'Count', prefix: '', suffix: '+' }, style: { color: '#F8FAFC' } },
      { id: 'test-testimonial', type: 'testimonial', content: { quote: 'Great service!', author: 'John Doe', role: 'CEO', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' }, style: {} },
      { id: 'test-review-carousel', type: 'review-carousel', content: { reviews: [{ rating: 5, text: 'Excellent!', author: 'Jane' }] }, style: {} },
      { id: 'test-alert-box', type: 'alert-box', content: { message: 'This is an alert message', type: 'info' }, style: { backgroundColor: '#3B82F6', color: '#FFFFFF' } },
      { id: 'test-pricing-table', type: 'pricing-table', content: { plans: [{ name: 'Basic', price: '$9', features: ['Feature 1', 'Feature 2'] }] }, style: {} },
      { id: 'test-flip-box', type: 'flip-box', content: { frontTitle: 'Front', backTitle: 'Back', frontContent: 'Front content', backContent: 'Back content' }, style: {} },
      { id: 'test-call-to-action', type: 'call-to-action', content: { text: 'Get Started', subText: 'Start your free trial today' }, style: { backgroundColor: '#E11D48', color: '#FFFFFF' } },
      { id: 'test-countdown-timer', type: 'countdown-timer', content: { targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), text: 'Offer Ends In' }, style: { accentColor: '#F59E0B' } },
    ],
    styles: {
      backgroundColor: '#0E1214',
      background: { type: 'color', color: '#0E1214' },
      textColor: '#D1D5DB',
      titleColor: '#F8FAFC',
      accentColor: '#F59E0B',
      buttonBackgroundColor: '#E11D48',
      buttonTextColor: '#FFFFFF',
      paddingTop: 'py-24',
      paddingBottom: 'py-24',
      paddingX: 'px-6',
      textAlign: 'center',
      titleSize: 'text-4xl',
      variant: 'AllElementsTest'
    }
  },
  elements: {
      type: 'elements',
      content: { title: 'New Elements Section' },
      elements: [...BASIC_ELEMENTS_LIST.slice(0,3)], 
      styles: {
          backgroundColor: '#0E1214',
          background: { type: 'color', color: '#0E1214' },
          textColor: '#C7CDD6',
          accentColor: '#F59E0B',
          buttonBackgroundColor: '#E11D48',
          buttonTextColor: '#FFFFFF',
          paddingTop: 'pt-16',
          paddingBottom: 'pb-16',
          paddingX: 'px-6',
          textAlign: 'left',
          titleSize: 'text-4xl',
          variant: 'default'
      }
  },
  hero: {
    type: 'hero',
    content: {
        title: 'Hero Title',
        subtitle: 'This is a subtitle for your hero section.',
        ctaText: 'Action',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800'
    },
    styles: {
        backgroundColor: '#0E1214',
        background: { type: 'color', color: '#0E1214' },
        textColor: '#C7CDD6',
        accentColor: '#F59E0B',
        buttonBackgroundColor: '#E11D48',
        buttonTextColor: '#FFFFFF',
        paddingTop: 'pt-16 md:pt-32',
        paddingBottom: 'pb-16 md:pb-32',
        paddingX: 'px-6',
        textAlign: 'center',
        titleSize: 'text-5xl md:text-7xl',
        titleColor: '#F8FAFC',
        variant: 'center'
    },
    variantOverrides: {
      'center': { textAlign: 'center', background: { type: 'color', color: '#0E1214' } },
      'split-left': { textAlign: 'left', background: { type: 'color', color: '#111111' } },
      'split-right': { textAlign: 'left', background: { type: 'color', color: '#111111' } },
      'gradient': { 
          textAlign: 'center', 
          background: { 
              type: 'gradient', 
              gradient: { 
                  type: 'linear', 
                  direction: 90, 
                  stops: [
                      { color: '#1e3a8a', position: 0 }, 
                      { color: '#000000', position: 100 }
                  ] 
              },
              overlay: { enabled: false, color: '#000000', opacity: 0.5, blendMode: 'normal' }
          },
          backgroundImage: 'linear-gradient(90deg, #1e3a8a 0%, #000000 100%)',
          backgroundColor: 'transparent'
      }
    }
  },
  features: {
      type: 'features',
      content: {
          title: 'Our Features',
          items: [
              { id: 'new-f1', title: 'Feature One', description: 'Description for feature one.', icon: '★' },
              { id: 'new-f2', title: 'Feature Two', description: 'Description for feature two.', icon: '★' },
              { id: 'new-f3', title: 'Feature Three', description: 'Description for feature three.', icon: '★' }
          ]
      },
      styles: {
          backgroundColor: '#0E1214',
          background: { type: 'color', color: '#0E1214' },
          textColor: '#C7CDD6',
          accentColor: '#F59E0B',
          buttonBackgroundColor: '#E11D48',
          buttonTextColor: '#FFFFFF',
          paddingTop: 'pt-12 md:pt-24',
          paddingBottom: 'pb-12 md:pb-24',
          paddingX: 'px-6',
          textAlign: 'center',
          titleSize: 'text-3xl md:text-5xl',
          titleColor: '#F8FAFC',
          variant: 'FeaturesGrid'
      }
  },
  pricing: {
    type: 'pricing',
    content: {
        title: 'Simple Pricing',
        subtitle: 'Choose the plan that fits your needs.',
        items: [
            { id: 'p1', title: 'Starter', price: '$0', description: 'Perfect for side projects.', features: ['1 Project', 'Community Support'] },
            { id: 'p2', title: 'Pro', price: '$29', description: 'For growing businesses.', features: ['Unlimited Projects', 'Priority Support', 'Analytics'] }
        ]
    },
    styles: {
        backgroundColor: '#0E1214',
        background: { type: 'color', color: '#0E1214' },
        textColor: '#C7CDD6',
        accentColor: '#F59E0B',
        buttonBackgroundColor: '#E11D48',
        buttonTextColor: '#FFFFFF',
        paddingTop: 'pt-12 md:pt-24',
        paddingBottom: 'pb-12 md:pb-24',
        paddingX: 'px-6',
        textAlign: 'center',
        titleSize: 'text-3xl md:text-5xl',
        variant: 'cards'
    }
  },
  testimonials: {
    type: 'testimonials',
    content: {
        title: 'What Our Clients Say',
        subtitle: 'Real feedback from people who use our product.',
        items: [
            { id: '1', title: '', author: 'John Doe', role: 'CEO', description: 'Great product!', avatar: 'https://i.pravatar.cc/150?img=1' },
            { id: '2', title: '', author: 'Jane Smith', role: 'Designer', description: 'Amazing service!', avatar: 'https://i.pravatar.cc/150?img=2' },
            { id: '3', title: '', author: 'Bob Johnson', role: 'Developer', description: 'Highly recommended!', avatar: 'https://i.pravatar.cc/150?img=3' }
        ]
    },
    styles: {
        backgroundColor: '#0E1214',
        background: { type: 'color', color: '#0E1214' },
        textColor: '#D1D5DB',
        titleColor: '#F8FAFC',
        accentColor: '#F59E0B',
        buttonBackgroundColor: '#E11D48',
        buttonTextColor: '#FFFFFF',
        paddingTop: 'py-20',
        paddingBottom: 'py-20',
        textAlign: 'center',
        variant: 'TestimonialsGrid'
    },
    elements: [],
    variantOverrides: {
      'TestimonialsGrid': { textAlign: 'center', background: { type: 'color', color: '#0E1214' } },
      'TestimonialsCentered': { textAlign: 'center', background: { type: 'color', color: '#0E1214' }, maxWidth: 'max-w-4xl' },
      'TestimonialsColumns': { textAlign: 'left', background: { type: 'color', color: '#0E1214' } }
    }
  },
  faq: {
    type: 'faq',
    content: {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about our product and billing.',
    },
    styles: {
      backgroundColor: '#0E1214',
      background: { type: 'color', color: '#0E1214' },
      textColor: '#D1D5DB',
      titleColor: '#F8FAFC',
      accentColor: '#3b82f6',
      variant: 'FAQCentered',
      paddingTop: 'pt-24',
      paddingBottom: 'pb-24',
      textAlign: 'center'
    },
    elements: [],
    variantOverrides: {
      'FAQCentered': { textAlign: 'center', background: { type: 'color', color: '#0E1214' }, maxWidth: 'max-w-4xl' },
      'FAQSplit': { textAlign: 'left', background: { type: 'color', color: '#0E1214' } }
    }
  },
  cta: {
      type: 'cta',
      content: {
          title: 'Ready to dive in?',
          subtitle: 'Join thousands of users building the future today.',
          ctaText: 'Get Started Now'
      },
      styles: {
          backgroundColor: '#0E1214',
          background: { type: 'color', color: '#0E1214' },
          textColor: '#C7CDD6',
          accentColor: '#F59E0B',
          buttonBackgroundColor: '#E11D48',
          buttonTextColor: '#FFFFFF',
          paddingTop: 'pt-16 md:pt-32',
          paddingBottom: 'pb-16 md:pb-32',
          paddingX: 'px-6',
          textAlign: 'center',
          titleSize: 'text-4xl md:text-6xl',
          variant: 'center'
      },
      variantOverrides: {
        'center': { textAlign: 'center', background: { type: 'color', color: '#0E1214' } },
        'split': { textAlign: 'left', background: { type: 'color', color: '#111111' } }
      }
  },
  navbar: {
    type: 'navbar',
    content: {
        logo: 'Brand',
        links: [{label: 'Home', href:'#'}, {label: 'About', href:'#'}],
        ctaText: 'Login'
    },
    styles: {
        backgroundColor: '#0E1214',
        background: { type: 'color', color: '#0E1214' },
        textColor: '#C7CDD6',
        accentColor: '#F59E0B',
        buttonBackgroundColor: '#FFFFFF',
        buttonTextColor: '#000000',
        paddingTop: 'py-4 md:py-6',
        paddingBottom: 'py-4 md:py-6',
        paddingX: 'px-6',
        textAlign: 'left',
        titleSize: '24px',
        variant: 'NavbarSimple'
    }
  },
  footer: {
    type: 'footer',
    content: {
        title: 'Brand',
        description: 'Building the future one pixel at a time.',
        links: [{label: 'Privacy', href:'#'}, {label: 'Terms', href:'#'}]
    },
    styles: {
        backgroundColor: '#0E1214',
        background: { type: 'color', color: '#0E1214' },
        textColor: '#C7CDD6',
        accentColor: '#F59E0B',
        buttonBackgroundColor: '#FFFFFF',
        buttonTextColor: '#000000',
        paddingTop: 'pt-8 md:pt-16',
        paddingBottom: 'pb-8 md:pb-16',
        paddingX: 'px-6',
        textAlign: 'left',
        titleSize: '24px',
        variant: 'columns'
    }
  },
  'image-banner': {
      type: 'image-banner',
      content: {
          title: 'Visual Impact',
          subtitle: 'Use high quality images to tell your story.',
          ctaText: 'Learn More'
      },
      styles: {
          backgroundColor: '#0E1214',
          background: { 
            type: 'image', 
            image: { 
              url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600', 
              position: 'center', 
              size: 'cover', 
              repeat: 'no-repeat', 
              attachment: 'scroll', 
              overlay: { 
                enabled: true, 
                color: '#000000', 
                opacity: 0.6, 
                blendMode: 'normal' 
              }
            } 
          },
          textColor: '#C7CDD6',
          accentColor: '#F59E0B',
          buttonBackgroundColor: '#E11D48',
          buttonTextColor: '#FFFFFF',
          paddingTop: 'pt-24 md:pt-40',
          paddingBottom: 'pb-24 md:pb-40',
          paddingX: 'px-6',
          textAlign: 'center',
          titleSize: 'text-5xl md:text-7xl',
          backgroundImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600',
          overlayOpacity: 'bg-black/60',
          variant: 'center'
      }
  },
  
  // Inside export const SECTION_TEMPLATES: Record<SectionType, Partial<Section>> = {
};
