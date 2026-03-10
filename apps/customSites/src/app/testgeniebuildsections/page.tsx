'use client';

import React from 'react';
import SectionRenderer from '@geniebuild/components/SectionRenderer';
import { Section } from '@geniebuild/types';

// Static test data — same structure GenieBuild would save to DB
const TEST_DATA = {
  projectId: "proj-123",
  pages: [
    {
      id: "page-home",
      name: "Home",
      slug: "/",
      layout: {
        renderer: "geniebuild",
        sections: [
          {
            id: "sec-navbar-1",
            type: "navbar" as const,
            content: {
              logo: "Brand",
              links: [{ label: "Home", href: "#" }, { label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Contact", href: "#contact" }],
              ctaText: "Login"
            },
            styles: {
              backgroundColor: "#0E1214",
              textColor: "#ffffff",
              accentColor: "#F59E0B",
              buttonBackgroundColor: "#FFFFFF",
            
              textAlign: "left",
              titleSize: "24px",
              variant: "NavbarMinimal"
            }
          },
          {
            id: "sec-hero-1",
            type: "hero" as const,
            content: {
              title: "Build the Future.",
              subtitle: "Experience the next generation of web design with our AI-powered builder.",
              ctaText: "Get Started",
              imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2000"
            },
            styles: {
              backgroundColor: "#0E1214",
              backgroundImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2000",
              overlayColor: "#000000",
              overlayOpacityValue: "0.6",
              textColor: "#FFFFFF",
              accentColor: "#F59E0B",
              buttonBackgroundColor: "#E11D48",
              buttonTextColor: "#FFFFFF",
              paddingTop: "pt-32",
              paddingBottom: "pb-32",
              paddingX: "px-6",
              textAlign: "center",
              titleSize: "text-6xl",
              variant: "HeroCenter"
            }
          },
          {
            id: "sec-features-1",
            type: "features" as const,
            content: {
              title: "Our Features",
              items: [
                { id: "new-f1", title: "Feature One", description: "Description for feature one.", icon: "★" },
                { id: "new-f2", title: "Feature Two", description: "Description for feature two.", icon: "★" },
                { id: "new-f3", title: "Feature Three", description: "Description for feature three.", icon: "★" }
              ]
            },
            styles: {
              backgroundColor: "#0E1214",
              textColor: "#C7CDD6",
              accentColor: "#F59E0B",
              buttonBackgroundColor: "#E11D48",
              buttonTextColor: "#FFFFFF",
              paddingTop: "pt-12 md:pt-24",
              paddingBottom: "pb-12 md:pb-24",
              paddingX: "px-6",
              textAlign: "center",
              titleSize: "text-3xl md:text-5xl",
              titleColor: "#F8FAFC",
              variant: "FeaturesGrid"
            }
          },
          {
            id: "sec-testimonials-1",
            type: "testimonials" as const,
            content: {
              title: "What they say",
              items: [
                { id: "t1", title: "Life Changing", author: "Alice Smith", role: "CEO", description: "This product changed my life entirely.", avatar: "https://i.pravatar.cc/150?u=a" },
                { id: "t2", title: "Incredible Detail", author: "Bob Jones", role: "Designer", description: "Incredible attention to detail and performance.", avatar: "https://i.pravatar.cc/150?u=b" }
              ]
            },
            styles: {
              backgroundColor: "#0E1214",
              textColor: "#C7CDD6",
              accentColor: "#F59E0B",
              buttonBackgroundColor: "#E11D48",
              buttonTextColor: "#FFFFFF",
              paddingTop: "pt-12 md:pt-24",
              paddingBottom: "pb-12 md:pb-24",
              paddingX: "px-6",
              textAlign: "center",
              titleSize: "text-3xl md:text-5xl",
              variant: "FeaturesGrid"
            }
          },
          {
            id: "sec-cta-1",
            type: "cta" as const,
            content: {
              title: "Ready to dive in?",
              subtitle: "Join thousands of users building the future today.",
              ctaText: "Get Started Now"
            },
            styles: {
              backgroundColor: "#0E1214",
              textColor: "#C7CDD6",
              accentColor: "#F59E0B",
              buttonBackgroundColor: "#E11D48",
              buttonTextColor: "#FFFFFF",
              paddingTop: "pt-16 md:pt-32",
              paddingBottom: "pb-16 md:pb-32",
              paddingX: "px-6",
              textAlign: "center",
              titleSize: "text-4xl md:text-6xl",
              variant: "HeroCenter"
            }
          },
          {
            id: "sec-footer-1",
            type: "footer" as const,
            content: {
              title: "Brand",
              description: "Building the future one pixel at a time.",
              links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }]
            },
            styles: {
              backgroundColor: "#0E1214",
              textColor: "#C7CDD6",
              accentColor: "#F59E0B",
              buttonBackgroundColor: "#FFFFFF",
              buttonTextColor: "#000000",
              paddingTop: "pt-8 md:pt-16",
              paddingBottom: "pb-8 md:pb-16",
              paddingX: "px-6",
              textAlign: "left",
              titleSize: "24px",
              variant: "FooterColumns"
            }
          }
        ] as Section[]
      }
    }
  ]
};

// No-op functions for readOnly mode
const noop = () => {};
const noopWithId = (_id: string) => {};
const noopUpdate = (_id: string, _updates: any) => {};

export default function TestGenieBuildSections() {
  const page = TEST_DATA.pages[0];
  const sections = page.layout.sections;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          GenieBuild Section Test — readOnly Mode
        </p>
      </div>

      {/* Render sections */}
      <div className="full-width" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>
        {sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            onUpdate={noopUpdate}
            isSelected={false}
            readOnly={true}
            onClick={noop}
            onDelete={noopWithId}
            onMoveUp={noopWithId}
            onMoveDown={noopWithId}
          />
        ))}
      </div>
    </div>
  );
}
