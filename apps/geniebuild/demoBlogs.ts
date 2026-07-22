/**
 * Shared dummy blogs for GenieBuild / SiteNextJS DEMOMODE.
 * Used by `/blogs` listing and `/blog/:slug` detail pages.
 */

export type DemoBlogComment = {
  name: string;
  avatar: string;
  date: string;
  text: string;
};

export type DemoBlogAuthor = {
  name: string;
  jobTitle: string;
  bio: string;
  image: string;
  links: Array<{ label: string; icon: string; url: string }>;
};

export type DemoBlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  coverImage: string;
  /** Plain text with blank-line paragraph breaks (first para = lead). */
  body: string;
  author: DemoBlogAuthor;
  comments: DemoBlogComment[];
};

export const DEMO_BLOG_CATEGORIES = [
  'All',
  'Tips & Guides',
  'Industry News',
  'How-To',
  'Community',
] as const;

export const DEMO_BLOGS: DemoBlogPost[] = [
  {
    slug: 'choose-the-right-service-provider',
    title: 'How to Choose the Right Service Provider',
    excerpt:
      'Not all providers are equal. Learn the questions that separate the best from the rest.',
    category: 'Tips & Guides',
    date: 'June 12, 2025',
    readTime: '6 min read',
    coverImage:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
    body: `Choosing the right professional can feel overwhelming, but a few simple checks make all the difference. Start by verifying licenses and insurance — this protects you and signals a serious, accountable business.

Next, ask for references and read recent reviews. Look for consistent themes: punctuality, clear communication, and clean workmanship. A great provider will happily explain the scope of work and pricing before starting, so you never face surprise costs.

Compare at least three written estimates. Focus on what’s included (materials, labour, cleanup, warranties) rather than the lowest number alone. Vague quotes are often a red flag.

Finally, trust your instincts. The best providers make you feel informed and respected, not pressured. Take your time, compare a few options, and choose the team that treats your home like their own.`,
    author: {
      name: 'Jane Doe',
      jobTitle: 'Senior Content Writer',
      bio: 'Jane has over 10 years of hands-on industry experience and loves sharing practical tips that help homeowners make confident decisions.',
      image: 'https://i.pravatar.cc/160?img=47',
      links: [
        { label: 'Twitter', icon: 'fa-x-twitter', url: '#' },
        { label: 'LinkedIn', icon: 'fa-linkedin-in', url: '#' },
      ],
    },
    comments: [
      {
        name: 'Michael R.',
        avatar: 'https://i.pravatar.cc/80?img=12',
        date: '2 days ago',
        text: 'Really helpful — verifying insurance saved me from a bad decision. Thank you!',
      },
      {
        name: 'Sarah L.',
        avatar: 'https://i.pravatar.cc/80?img=5',
        date: '5 days ago',
        text: 'Great read. I always forget to ask for references. Bookmarking this.',
      },
      {
        name: 'Omar K.',
        avatar: 'https://i.pravatar.cc/80?img=33',
        date: '1 week ago',
        text: 'The tip about comparing what’s included in quotes is gold. Wish I’d read this sooner.',
      },
    ],
  },
  {
    slug: '10-signs-you-need-a-professional',
    title: '10 Signs You Need a Professional Right Away',
    excerpt:
      'Spot the early warning signs before a small issue becomes an expensive emergency.',
    category: 'Tips & Guides',
    date: 'June 8, 2025',
    readTime: '5 min read',
    coverImage:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80',
    body: `Most emergencies start as small, easy-to-ignore clues. Catching them early can save you thousands — and a lot of stress.

Watch for unusual smells, recurring noises, slow drains, damp spots, or sudden spikes in utility bills. These often mean something is failing behind the scenes.

If a DIY fix doesn’t hold for more than a day or two, stop repeating it. Temporary patches can hide damage and make the eventual repair more invasive.

When safety is involved — gas, electricity, structural movement, or standing water near electrics — call a licensed professional immediately. Waiting rarely makes the problem cheaper.`,
    author: {
      name: 'Chris Nguyen',
      jobTitle: 'Field Operations Lead',
      bio: 'Chris has spent 15 years on the tools and now helps homeowners spot problems before they turn into emergencies.',
      image: 'https://i.pravatar.cc/160?img=15',
      links: [
        { label: 'Twitter', icon: 'fa-x-twitter', url: '#' },
        { label: 'LinkedIn', icon: 'fa-linkedin-in', url: '#' },
      ],
    },
    comments: [
      {
        name: 'Priya S.',
        avatar: 'https://i.pravatar.cc/80?img=9',
        date: '1 day ago',
        text: 'The utility-bill tip was spot on — we found a hidden leak the same week.',
      },
      {
        name: 'Dan W.',
        avatar: 'https://i.pravatar.cc/80?img=14',
        date: '3 days ago',
        text: 'Clear checklist. Shared this with my neighbours group.',
      },
      {
        name: 'Elena M.',
        avatar: 'https://i.pravatar.cc/80?img=20',
        date: '4 days ago',
        text: 'Wish I’d called sooner on the damp spot. Great article.',
      },
    ],
  },
  {
    slug: 'seasonal-maintenance-checklist',
    title: 'A Simple Maintenance Checklist for Every Season',
    excerpt:
      'Keep everything running smoothly year-round with these easy, proven steps.',
    category: 'How-To',
    date: 'May 30, 2025',
    readTime: '7 min read',
    coverImage:
      'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=80',
    body: `A short seasonal checklist beats a long weekend of panic repairs. Fifteen focused minutes each season keeps systems reliable and warranties intact.

In spring, clear debris, test shut-offs, and schedule inspections before summer demand peaks. Summer is for airflow, outdoor connections, and catching heat-related wear early.

Autumn is your prep season: winterise outdoor lines, replace filters, and book any deferred repairs before cold weather. Winter is about monitoring — unusual sounds, slow performance, or ice where it shouldn’t be.

Keep a simple log of dates and photos. When you do need a pro, that history makes diagnosis faster and quotes more accurate.`,
    author: {
      name: 'Amelia Brooks',
      jobTitle: 'Home Care Educator',
      bio: 'Amelia writes practical how-to guides for busy homeowners who want reliable systems without the jargon.',
      image: 'https://i.pravatar.cc/160?img=32',
      links: [
        { label: 'Twitter', icon: 'fa-x-twitter', url: '#' },
        { label: 'LinkedIn', icon: 'fa-linkedin-in', url: '#' },
      ],
    },
    comments: [
      {
        name: 'Tom H.',
        avatar: 'https://i.pravatar.cc/80?img=8',
        date: '2 days ago',
        text: 'Printed this and stuck it on the fridge. Exactly what I needed.',
      },
      {
        name: 'Nadia F.',
        avatar: 'https://i.pravatar.cc/80?img=24',
        date: '6 days ago',
        text: 'The photo-log idea is brilliant for warranty claims.',
      },
    ],
  },
  {
    slug: 'what-latest-standards-mean',
    title: 'What the Latest Standards Mean for Your Home',
    excerpt:
      'New regulations are changing the game — here is what you should know today.',
    category: 'Industry News',
    date: 'May 22, 2025',
    readTime: '4 min read',
    coverImage:
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&q=80',
    body: `Updated industry standards aren’t just paperwork — they affect safety, energy use, and how work is signed off on your property.

The biggest changes this year focus on documentation, material specs, and clearer customer disclosure before work begins. Licensed teams should explain what applies to your job in plain language.

If a quote skips compliance, warranties, or disposal requirements, ask why. Cutting those corners can leave you exposed if something fails later.

When in doubt, ask for the relevant certificate numbers and keep copies with your project folder. A reputable provider will expect that request.`,
    author: {
      name: 'Marcus Hale',
      jobTitle: 'Compliance Specialist',
      bio: 'Marcus tracks regulation changes and translates them into clear guidance for homeowners and trade teams.',
      image: 'https://i.pravatar.cc/160?img=11',
      links: [
        { label: 'Twitter', icon: 'fa-x-twitter', url: '#' },
        { label: 'LinkedIn', icon: 'fa-linkedin-in', url: '#' },
      ],
    },
    comments: [
      {
        name: 'Rachel P.',
        avatar: 'https://i.pravatar.cc/80?img=16',
        date: '1 day ago',
        text: 'Finally an explanation that doesn’t read like a legal brief. Thanks!',
      },
      {
        name: 'Jon A.',
        avatar: 'https://i.pravatar.cc/80?img=18',
        date: '3 days ago',
        text: 'Asked our contractor for certificate numbers after reading this — they were happy to provide them.',
      },
      {
        name: 'Kim V.',
        avatar: 'https://i.pravatar.cc/80?img=25',
        date: '1 week ago',
        text: 'Useful context before our kitchen remodel. Appreciate the clarity.',
      },
    ],
  },
  {
    slug: 'behind-the-scenes-with-our-team',
    title: 'Behind the Scenes: A Day With Our Team',
    excerpt:
      'Meet the people who make it happen and see how we deliver on our promise.',
    category: 'Community',
    date: 'May 15, 2025',
    readTime: '3 min read',
    coverImage:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    body: `Every smooth job you see is backed by a morning briefing, a stocked van, and a team that communicates before, during, and after the visit.

We start with safety checks and a walkthrough so homeowners know exactly what to expect. Midday is focused work — clean staging, tidy progress, and updates if the plan changes.

Afternoons wrap with a final walkthrough, photos for your records, and a clear summary of next steps if follow-up is needed.

That’s the culture we protect: respectful of your home, honest about timelines, and proud of work we’re happy to put our name on.`,
    author: {
      name: 'Sofia Alvarez',
      jobTitle: 'Customer Experience Manager',
      bio: 'Sofia champions the homeowner experience — from first call to final walkthrough — and shares stories from the field.',
      image: 'https://i.pravatar.cc/160?img=44',
      links: [
        { label: 'Twitter', icon: 'fa-x-twitter', url: '#' },
        { label: 'LinkedIn', icon: 'fa-linkedin-in', url: '#' },
      ],
    },
    comments: [
      {
        name: 'Greg T.',
        avatar: 'https://i.pravatar.cc/80?img=7',
        date: '2 days ago',
        text: 'Loved seeing the process. Explains why your crew always seems so organised.',
      },
      {
        name: 'Hannah B.',
        avatar: 'https://i.pravatar.cc/80?img=29',
        date: '5 days ago',
        text: 'The walkthrough photos are such a nice touch. Great culture piece.',
      },
    ],
  },
];

export function getDemoBlogBySlug(slug: string | null | undefined): DemoBlogPost {
  const key = String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '');
  return DEMO_BLOGS.find((b) => b.slug === key) || DEMO_BLOGS[0];
}

export function extractDemoBlogSlugFromPath(pathname: string): string | null {
  const normalized = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const match = normalized.match(/(?:^|\/)blog\/([^/]+)$/i);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Card shape for blogslist / blogrelated. */
export function demoBlogToListItem(post: DemoBlogPost) {
  return {
    id: post.slug,
    slug: post.slug,
    link: `/blog/${post.slug}`,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    date: post.date,
    read: post.readTime,
    img: post.coverImage,
    image: post.coverImage,
    imageUrl: post.coverImage,
  };
}

export function getDemoBlogListItems() {
  return DEMO_BLOGS.map(demoBlogToListItem);
}

export function getRelatedDemoBlogs(slug: string, limit = 3) {
  const others = DEMO_BLOGS.filter((b) => b.slug !== slug);
  const sameCategory = others.filter(
    (b) => b.category === getDemoBlogBySlug(slug).category
  );
  const ordered = [
    ...sameCategory,
    ...others.filter((b) => !sameCategory.includes(b)),
  ];
  return ordered.slice(0, limit).map(demoBlogToListItem);
}
