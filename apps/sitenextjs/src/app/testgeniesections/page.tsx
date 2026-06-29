'use client';

import GenieBuildPageRenderer from '../components/GenieBuildPageRenderer';
import { Section } from '@geniebuild/types';

// Hardcoded test data matching the database entry exactly
const TEST_SECTIONS: Section[] = [
  {
    id: "sec-navbar-0",
    type: "navbar",
    content: {
      logo: "Our Business",
      ctaText: "Sign Up",
      links: [
        { label: "Home", href: "#" },
        { label: "About", href: "#about" },
        { label: "Services", href: "#services" },
        { label: "Contact", href: "#contact" }
      ]
    },
    styles: {
      variant: "simple",
      backgroundColor: "#0E1214",
      textColor: "#FFFFFF",
      titleColor: "#F8FAFC",
      buttonBackgroundColor: "#E11D48",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "pill",
      paddingTop: "py-4 md:py-6",
      paddingBottom: "py-4 md:py-6",
      paddingX: "px-6"
    }
  },
  {
    id: "sec-hero-1",
    type: "hero",
    content: {
      title: "Welcome to Our Business",
      subtitle: "Discover the best services at Our Business. We deliver excellence.",
      ctaText: "Get Started",
      imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
    },
    styles: {
      variant: "split-left",
      backgroundColor: "#0E1214",
      textColor: "#D1D5DB",
      titleColor: "#F8FAFC",
      buttonBackgroundColor: "#E11D48",
      buttonTextColor: "#FFFFFF",
      subtitleColor: "#D1D5DB",
      descriptionColor: "#D1D5DB",
      buttonStyle: "filled",
      maxWidth: "max-w-7xl",
      paddingTop: "py-24",
      paddingBottom: "py-24"
    }
  },
  {
    id: "sec-features-2",
    type: "features",
    content: {
      title: "Features",
      items: [
        {
          id: "feat-1",
          icon: "⚡️",
          title: "Fast & Reliable",
          description: "Experience top-notch speed and reliability."
        },
        {
          id: "feat-2",
          icon: "🎨",
          title: "Beautiful Design",
          description: "Professionally crafted templates."
        },
        {
          id: "feat-3",
          icon: "🔒",
          title: "Secure",
          description: "Your data is safe with us."
        },
        {
          id: "feat-4",
          icon: "📱",
          title: "Mobile Responsive",
          description: "Looks great on any device."
        }
      ]
    },
    styles: {
      variant: "grid",
      backgroundColor: "#0E1214",
      textColor: "#D1D5DB",
      titleColor: "#F8FAFC",
      buttonBackgroundColor: "#E11D48",
      buttonTextColor: "#FFFFFF",
      subtitleColor: "#D1D5DB",
      descriptionColor: "#D1D5DB",
      buttonStyle: "filled",
      maxWidth: "max-w-7xl",
      paddingTop: "py-24",
      paddingBottom: "py-24"
    }
  },
  {
    id: "sec-cta-3",
    type: "cta",
    content: {
      title: "Ready to Get Started?",
      subtitle: "Join Our Business today and transform your business.",
      ctaText: "Contact Us"
    },
    styles: {
      variant: "center",
      backgroundColor: "#0E1214",
      textColor: "#D1D5DB",
      titleColor: "#F8FAFC",
      buttonBackgroundColor: "#E11D48",
      buttonTextColor: "#FFFFFF",
      subtitleColor: "#D1D5DB",
      descriptionColor: "#D1D5DB",
      buttonStyle: "filled",
      maxWidth: "max-w-7xl",
      paddingTop: "py-24",
      paddingBottom: "py-24"
    }
  },
  {
    id: "sec-faq-5",
    type: "faq",
    content: {
      title: "Frequently Asked Questions",
      items: [
        {
          question: "What services does Our Business offer?",
          answer: "We offer a wide range of professional services tailored to your needs."
        },
        {
          question: "How can I get started?",
          answer: "Simply contact us through our website or give us a call."
        },
        {
          question: "What are your business hours?",
          answer: "We are available Monday through Friday, 9 AM to 6 PM."
        }
      ]
    },
    styles: {
      variant: "default",
      backgroundColor: "#0E1214",
      textColor: "#D1D5DB",
      titleColor: "#F8FAFC",
      buttonBackgroundColor: "#E11D48",
      buttonTextColor: "#FFFFFF",
      subtitleColor: "#D1D5DB",
      descriptionColor: "#D1D5DB",
      buttonStyle: "filled",
      maxWidth: "max-w-7xl",
      paddingTop: "py-24",
      paddingBottom: "py-24"
    }
  },
  {
    id: "sec-footer-4",
    type: "footer",
    content: {
      brand: "Our Business",
      description: "Building the future of web design, one site at a time.",
      links: [
        {
          title: "Company",
          items: [
            { label: "About", href: "#" },
            { label: "Careers", href: "#" }
          ]
        },
        {
          title: "Legal",
          items: [
            { label: "Privacy Policy", href: "#" },
            { label: "Terms of Service", href: "#" }
          ]
        }
      ],
      newsletterTitle: "Subscribe to our newsletter",
      newsletterPlaceholder: "Enter your email",
      newsletterButtonText: "Subscribe"
    },
    styles: {
      variant: "columns",
      backgroundColor: "#0E1214",
      textColor: "#D1D5DB",
      titleColor: "#F8FAFC",
      buttonBackgroundColor: "#E11D48",
      buttonTextColor: "#FFFFFF",
      brandColor: "#FFFFFF",
      descriptionColor: "#D1D5DB",
      linkTitleColor: "#FFFFFF",
      linkColor: "#D1D5DB",
      newsletterTextColor: "#FFFFFF",
      newsletterButtonBackgroundColor: "#E11D48",
      newsletterButtonTextColor: "#FFFFFF",
      paddingTop: "pt-8 md:pt-16",
      paddingBottom: "pb-8 md:pb-16",
      paddingX: "px-6"
    }
  }
];

export default function TestGenieSectionsPage() {
  const globalColors = {
    backgroundColor: '#0E1214',
    textColor: '#D1D5DB',
    titleColor: '#F8FAFC',
    accentColor: '#F8FAFC',
    buttonBackgroundColor: '#E11D48',
    buttonTextColor: '#FFFFFF'
  };

  return (
    <GenieBuildPageRenderer 
      sections={TEST_SECTIONS} 
      globalColors={globalColors}
      globalElementStyles={undefined}
    />
  );
}
